import json

from django.http import JsonResponse
from django.shortcuts import render, redirect
from django.urls import reverse
from django.contrib.auth.views import LoginView
from django.views.decorators.http import require_POST

from .forms import SignupForm
from .models import User
from authe.services.security import admin_required


# ── Login ─────────────────────────────────────────────────────────────────────

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


# ── Signup ────────────────────────────────────────────────────────────────────

def signupView(request):
    if request.method == 'POST':
        form = SignupForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('login')
        else:
            print(form.errors)
    else:
        form = SignupForm()

    return render(request, 'auth/signup.html', {'form': form})


# ── User management API (admin only) ─────────────────────────────────────────

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
        return JsonResponse({'success': True})
    except User.DoesNotExist:
        return JsonResponse({'success': False, 'message': 'User not found or not approved.'}, status=404)
