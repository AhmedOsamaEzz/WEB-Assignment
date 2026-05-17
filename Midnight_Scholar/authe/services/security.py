import functools
from django.shortcuts import redirect


def is_admin_check(user):
    return user.is_authenticated and getattr(user, 'role', 'user') == 'admin'


def admin_required(view_func):
    # Block users from admin's pages
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        if not is_admin_check(request.user):
            return redirect('user_dashboard')
        return view_func(request, *args, **kwargs)
    return wrapper


def user_required(view_func):
    # Block admins from user's pages
    @functools.wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        if is_admin_check(request.user):
            return redirect('admin_dashboard')
        return view_func(request, *args, **kwargs)
    return wrapper