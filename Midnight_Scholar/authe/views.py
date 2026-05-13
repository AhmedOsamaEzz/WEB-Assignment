import json

from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib.auth.views import LoginView
from django.views.decorators.http import require_POST

from .forms import SignupForm
from .models import User
from authe.services.security import admin_required
from logs.models import Log


class CustomLoginView(LoginView):
    template_name = 'auth/login.html'

    def form_valid(self, form):
        user = form.get_user()

        if getattr(user, 'status', None) == 'pending':
            form.add_error(None, 'Your account is pending approval. Please wait for an admin to activate it. :)')
            return self.form_invalid(form)

        if getattr(user, 'status', None) == 'banned':
            form.add_error(None, 'Your account has been banned. Please contact support.')
            return self.form_invalid(form)

        if getattr(user, 'status', None) == 'denied':
            form.add_error(None, 'Your registration was denied. Please contact support.')
            return self.form_invalid(form)

        return super().form_valid(form)

    def get_success_url(self):
        user = self.request.user

        if getattr(user, 'role', 'user') == 'admin':
            return reverse('admin_dashboard')
        else:
            return reverse('user_dashboard')


def signupView(request):
    if request.method == 'POST':
        form = SignupForm(request.POST)
        if form.is_valid():
            user = form.save()
            Log.objects.create(
                what='registration_made',
                who=user.name,
                info=f'{user.name} registered',
            )
            return redirect('login')
        else:
            print(form.errors)
    else:
        form = SignupForm()

    return render(request, 'auth/signup.html', {'form': form})


@admin_required
def get_pending_users(request):
    users = User.objects.filter(status='pending').values('id', 'name', 'email', 'username')
    return JsonResponse({'success': True, 'users': list(users)})


@admin_required
def get_approved_users(request):
    users = User.objects.filter(status='approved', role='user').values('id', 'name', 'email', 'username')
    return JsonResponse({'success': True, 'users': list(users)})


@admin_required
@require_POST
def approve_user(request):
    data = json.loads(request.body)
    email = data.get('email')
    try:
        user = User.objects.get(email=email, status='pending')
        user.status = 'approved'
        user.save()
        Log.objects.create(
            what='registration_approved',
            who=request.user.name,
            info=f'{request.user.name} approved {user.name}',
        )
        return JsonResponse({'success': True})
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'User not found or not pending.'}, status=404)


@admin_required
@require_POST
def deny_user(request):
    data = json.loads(request.body)
    email = data.get('email')
    try:
        user = User.objects.get(email=email, status='pending')
        user.status = 'denied'
        user.save()
        Log.objects.create(
            what='registration_denied',
            who=request.user.name,
            info=f'{request.user.name} denied {user.name}',
        )
        return JsonResponse({'success': True})
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'User not found or not pending.'}, status=404)


@admin_required
@require_POST
def ban_user(request):
    data = json.loads(request.body)
    email = data.get('email')
    try:
        user = User.objects.get(email=email, status='approved')
        user.status = 'banned'
        user.save()
        Log.objects.create(
            what='user_banned',
            who=request.user.name,
            info=f'{request.user.name} banned {user.name}',
        )
        return JsonResponse({'success': True})
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'User not found or not approved.'}, status=404)


@admin_required
def get_admin_stats(request):
    from books.models import Book
    from loans.models import Loan
    from django.db.models import Sum
    import datetime

    totals          = Book.objects.aggregate(tc=Sum('total_copies'), ac=Sum('available_copies'))
    total_copies    = totals['tc'] or 0
    total_available = totals['ac'] or 0
    total_borrowed  = total_copies - total_available

    total_members   = User.objects.filter(role='user', status='approved').count()
    active_loans    = Loan.objects.filter(status__in=['reserved', 'borrowed']).count()
    overdue_loans   = Loan.objects.filter(status='borrowed', due_date__lt=datetime.date.today()).count()

    per_available = round((total_available / total_copies) * 100) if total_copies else 0
    per_borrowed  = round((total_borrowed  / total_copies) * 100) if total_copies else 0
    per_overdue   = round((overdue_loans   / total_copies) * 100) if total_copies else 0

    return JsonResponse({
        'success': True,
        'totalBooks':     total_copies,
        'totalAvailable': total_available,
        'totalMembers':   total_members,
        'activeLoans':    active_loans,
        'overdueLoans':   overdue_loans,
        'perAvailable':   per_available,
        'perBorrowed':    per_borrowed,
        'perOverdue':     per_overdue,
    })
