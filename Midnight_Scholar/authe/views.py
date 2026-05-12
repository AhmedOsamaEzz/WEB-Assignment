from django.shortcuts import render, redirect
from django.urls import reverse 
from django.contrib.auth.views import LoginView 
# Create your views here.

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

        return super().form_valid(form)

    def get_success_url(self):
        user = self.request.user 

        if getattr(user, 'role', 'user') == 'admin':
            return reverse('admin_dashboard')
        else:
            return reverse('user_dashboard')


from .forms import SignupForm

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