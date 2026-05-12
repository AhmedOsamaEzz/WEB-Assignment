from django.shortcuts import render, redirect
from django.urls import reverse 
from django.contrib.auth.views import LoginView 
from django.contrib.auth import logout
from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_GET
from django.core.paginator import Paginator
from django.db.models import Q
from .forms import UserFilterForm
import json

# Create your views here.

class CustomLoginView(LoginView):
    template_name = 'auth/login.html'
    redirect_authenticated_user = True

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

        return super().form_valid(form)

    def get_success_url(self):
        user = self.request.user 

        if getattr(user, 'role', 'user') == 'admin':
            return reverse('admin_dashboard')
        return reverse('user_dashboard')


from .forms import SignupForm
from .models import User
from authe.services.security import admin_required

def signupView(request):
    if request.method == 'POST':
        form = SignupForm(request.POST)
        if form.is_valid():
            print("success")
            form.save() 
            return redirect('login')
        else:
            print(form.errors) 
    else:
        form = SignupForm()
    
    # If it's a GET request, just show the page
    return render(request, 'auth/signup.html', {'form': form})


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


@require_POST
@admin_required
def approve_user(request):
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')
        
        user = User.objects.get(id=user_id)
        user.status = 'approved'
        user.save()
        
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
@admin_required
def deny_user(request):
    try:
        data = json.loads(request.body)
        user_id = data.get('user_id')
        
        user = User.objects.get(id=user_id)
        user.delete()
        
        return JsonResponse({
            'success': True,
            'message': 'User registration has been denied and deleted.'
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

@require_POST
def logout_view(request):
    if request.method == 'POST':
        logout(request)
        return redirect('home')
    return redirect('home')