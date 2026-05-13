from django.contrib.auth import logout
from django.shortcuts import redirect

class BanCheckMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # Refresh user from DB to get latest status
            request.user.refresh_from_db()
            if getattr(request.user, 'status', None) == 'banned':
                logout(request)
                return redirect('login')

        return self.get_response(request)