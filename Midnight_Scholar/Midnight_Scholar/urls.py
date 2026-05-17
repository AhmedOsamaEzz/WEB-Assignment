"""
URL configuration for Midnight_Scholar project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect, render
from django.views.generic import TemplateView
from authe.services.security import admin_required
from authe import views as authe_views
from django.conf import settings
from django.conf.urls.static import static
from books import views as book_views
from django.contrib.auth.views import LogoutView
from django.contrib.auth.decorators import login_required


def home_view(request):
    if request.user.is_authenticated:
        if getattr(request.user, 'role', 'user') == 'admin':
            return redirect('admin_dashboard')
        return redirect('user_dashboard')
    return render(request, 'index.html')
from logs import views as logs_views


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', home_view, name='home'),
    # path('login/', TemplateView.as_view(template_name='auth/login.html'), name='login'),
    # path('signup/', TemplateView.as_view(template_name='auth/signup.html'), name='signup'),
    path('user/dashboard/', login_required(TemplateView.as_view(template_name='user/dashboard.html'), login_url='login'), name='user_dashboard'),
    path('user/books/',     login_required(book_views.book_details, login_url='login'), name='user_book_details'),
    path('user/borrowed/',  login_required(TemplateView.as_view(template_name='user/borrowed.html'), login_url='login'), name='user_borrowed'),
    path('user/search/',    login_required(TemplateView.as_view(template_name='user/search.html'), login_url='login'), name='user_search'),
    
    # path('libadmin/dashboard/', TemplateView.as_view(template_name='admin/dashboard.html'), name='admin_dashboard'),
    path('libadmin/dashboard/', admin_required(TemplateView.as_view(template_name='admin/dashboard.html')), name='admin_dashboard'),
    path('libadmin/books/add/', admin_required(TemplateView.as_view(template_name='admin/bookAdd.html')), name='admin_book_add'),
    path('libadmin/books/details/', admin_required(TemplateView.as_view(template_name='admin/bookDetails.html')), name='admin_book_details'),
    path('libadmin/books/edit/', admin_required(TemplateView.as_view(template_name='admin/bookEdit.html')), name='admin_book_edit'),
    path('libadmin/books/list/', admin_required(book_views.book_list), name='admin_book_list'),
    path('libadmin/books/borrowed/', admin_required(TemplateView.as_view(template_name='admin/loanList.html')), name='admin_borrowed_list'),
    path('libadmin/search/', admin_required(TemplateView.as_view(template_name='admin/search.html')), name='admin_search'),
    path('libadmin/users/list/', admin_required(authe_views.user_list), name='admin_user_list'),

    path('api/loans/', include('loans.urls')),
    path('api/users/search/', authe_views.search_users, name='api_search_users'),
    path('api/users/approve/', authe_views.approve_user, name='api_approve_user'),
    path('api/users/deny/', authe_views.deny_user, name='api_deny_user'),
    path('api/users/ban/', authe_views.ban_user, name='api_ban_user'),
    path('api/users/unban/', authe_views.unban_user, name='api_unban_user'),

    # auth stuff
    path('login/', authe_views.CustomLoginView.as_view(), name='login'),
    path('signup/', authe_views.signupView, name='signup'),
    path('logout/', authe_views.logout_view, name='logout'),

    # user management API (admin only)
    path('api/users/pending/', authe_views.get_pending_users, name='api_users_pending'),
    path('api/users/approved/', authe_views.get_approved_users, name='api_users_approved'),
    path('api/users/approve/', authe_views.approve_user, name='api_users_approve'),
    path('api/users/deny/', authe_views.deny_user, name='api_users_deny'),
    path('api/users/ban/', authe_views.ban_user, name='api_users_ban'),

    path('api/logs/', logs_views.get_logs, name='api_logs'),
    path('api/stats/', authe_views.get_admin_stats, name='api_stats'),

    path('api/books/', include('books.urls')),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)