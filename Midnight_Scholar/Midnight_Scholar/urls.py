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
from django.shortcuts import render
from django.views.generic import TemplateView
from authe.services.security import admin_required
from authe import views as authe_views
from django.conf import settings
from django.conf.urls.static import static
from books import views as book_views


urlpatterns = [
    path('admin/', admin.site.urls),
    path('', TemplateView.as_view(template_name='index.html'), name='home'),
    # path('login/', TemplateView.as_view(template_name='auth/login.html'), name='login'),
    # path('signup/', TemplateView.as_view(template_name='auth/signup.html'), name='signup'),
    path('user/dashboard/', TemplateView.as_view(template_name='user/dashboard.html'), name='user_dashboard'),
    path('user/books/', TemplateView.as_view(template_name='user/bookDetails.html'), name='user_book_details'),
    path('user/borrowed/', TemplateView.as_view(template_name='user/borrowed.html'), name='user_borrowed'),
    path('user/search/', TemplateView.as_view(template_name='user/search.html'), name='user_search'),
    
    # path('libadmin/dashboard/', TemplateView.as_view(template_name='admin/dashboard.html'), name='admin_dashboard'),
    path('libadmin/dashboard/', admin_required(TemplateView.as_view(template_name='admin/dashboard.html')), name='admin_dashboard'),
    path('libadmin/books/add/', admin_required(TemplateView.as_view(template_name='admin/bookAdd.html')), name='admin_book_add'),
    path('libadmin/books/details/', admin_required(TemplateView.as_view(template_name='admin/bookDetails.html')), name='admin_book_details'),
    path('libadmin/books/edit/', admin_required(TemplateView.as_view(template_name='admin/bookEdit.html')), name='admin_book_edit'),
path('libadmin/books/list/', admin_required(book_views.book_list), name='admin_book_list'),
    path('libadmin/search/', admin_required(TemplateView.as_view(template_name='admin/search.html')), name='admin_search'),

    # auth stuff
    path('login/', authe_views.CustomLoginView.as_view(), name='login'),
    path('signup/', authe_views.signupView, name='signup'),

    path('api/books/', include('books.urls')),
    
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)