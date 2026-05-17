import json

from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib.auth.views import LoginView
from django.contrib.auth import logout
from django.views.decorators.http import require_POST, require_GET
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from django.db.models import Q

from .forms import SignupForm, UserFilterForm
from .models import User
from authe.services.security import admin_required
from logs.models import Log


class CustomLoginView(LoginView):
    template_name = 'auth/login.html'
    redirect_authenticated_user = True # if already loged in

    def form_valid(self, form):
        user = form.get_user()

        if getattr(user, 'role', 'user') == 'admin':
            return super().form_valid(form)

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
    # if he has tokens just let him in
    if request.user.is_authenticated:
        if getattr(request.user, 'role', 'user') == 'admin':
            return redirect('admin_dashboard')
        return redirect('user_dashboard')

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

@login_required(login_url='login')
@admin_required
def user_list(request):
    users = User.objects.all().exclude(role='admin').order_by('-date_joined')
    paginator = Paginator(users, 10)
    page_no = request.GET.get('page')
    page_to_show = paginator.get_page(page_no)
    filter_form = UserFilterForm()
    return render(request, 'admin/userList.html', {
        'page_to_show': page_to_show,
        'filter_form': filter_form,
    })


@require_GET
@login_required(login_url='login')
@admin_required
def search_users(request):
    try:
        query = request.GET.get('query', '').strip().lower()
        status_filter = request.GET.get('status', '').strip()

        users = User.objects.all().exclude(role='admin')

        if query:
            users = users.filter(
                Q(name__icontains=query) | Q(email__icontains=query)
            )

        if status_filter and status_filter != 'all':
            users = users.filter(status=status_filter)

        users_data = []
        for user in users:
            users_data.append({
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'status': user.status,
                'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M'),
            })

        return JsonResponse({
            'success': True,
            'data': users_data,
            'count': len(users_data)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@login_required(login_url='login')
@admin_required
def get_pending_users(request):
    users = User.objects.filter(status='pending').values('id', 'name', 'email', 'username')
    return JsonResponse({'success': True, 'users': list(users)})


@login_required(login_url='login')
@admin_required
def get_approved_users(request):
    users = User.objects.filter(status='approved', role='user').values('id', 'name', 'email', 'username')
    return JsonResponse({'success': True, 'users': list(users)})


@require_POST
@login_required(login_url='login')
@admin_required
def approve_user(request):
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')

        user = User.objects.get(id=user_id)
        user.status = 'approved'
        user.save()

        Log.objects.create(
            what='registration_approved',
            who=request.user.name,
            info=f'{request.user.name} approved {user.name}',
        )
        return JsonResponse({
            'success': True,
            'message': f'User {user.name} has been approved.'
        })
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'User not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@require_POST
@login_required(login_url='login')
@admin_required
def deny_user(request):
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')

        user = User.objects.get(id=user_id)
        user.status = 'denied'
        user.save()

        Log.objects.create(
            what='registration_denied',
            who=request.user.name,
            info=f'{request.user.name} denied {user.name}',
        )
        return JsonResponse({
            'success': True,
            'message': f'User {user.name} registration has been denied.'
        })
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'User not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@require_POST
@login_required(login_url='login')
@admin_required
def ban_user(request):
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')

        user = User.objects.get(id=user_id)

        if user.status == 'banned':
            return JsonResponse({
                'success': False,
                'message': 'User is already banned'
            }, status=400)

        user.status = 'banned'
        user.save()

        Log.objects.create(
            what='user_banned',
            who=request.user.name,
            info=f'{request.user.name} banned {user.name}',
        )
        return JsonResponse({
            'success': True,
            'message': f'User {user.name} has been banned.'
        })
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'User not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@require_POST
@login_required(login_url='login')
@admin_required
def unban_user(request):
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')

        user = User.objects.get(id=user_id)

        if user.status != 'banned':
            return JsonResponse({
                'success': False,
                'message': 'User is not banned'
            }, status=400)

        user.status = 'approved'
        user.save()

        return JsonResponse({
            'success': True,
            'message': f'User {user.name} has been unbanned.'
        })
    except User.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'User not found'
        }, status=404)
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        }, status=500)


@login_required(login_url='login')
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


@require_POST
def logout_view(request):
    logout(request)
    return redirect('home')