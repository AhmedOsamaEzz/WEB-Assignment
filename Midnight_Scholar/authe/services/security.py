from functools import wraps
from django.shortcuts import redirect


def is_admin_check(user):
    return user.is_authenticated and getattr(user, 'role', 'user') == 'admin'


# A Decorator like login_required *_*
def admin_required(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        if getattr(request.user, 'role', 'user') != 'admin':
            return redirect('user_dashboard')
        return view_func(request, *args, **kwargs)
    return _wrapped_view