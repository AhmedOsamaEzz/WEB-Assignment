from django.contrib.auth.decorators import user_passes_test

def is_admin_check(user):
    return user.is_authenticated and getattr(user, 'role', 'user') == 'admin'

admin_required = user_passes_test(is_admin_check, login_url='user_dashboard')