import re
from django import forms
from authe.models import User

class SignupForm(forms.ModelForm):

    password = forms.CharField(widget=forms.PasswordInput())
    isAdmin = forms.BooleanField(required=False, label="Create as Admin")

    class Meta:
        model = User
        fields = ['name', 'email', 'password'] 

    def clean_password(self):
        password = self.cleaned_data.get('password')

        if len(password) < 8:
            raise forms.ValidationError("Password must be at least 8 characters.")
        if not re.search(r'[A-Z]', password):
            raise forms.ValidationError("Password must contain an uppercase letter.")
        if not re.search(r'[a-z]', password):
            raise forms.ValidationError("Password must contain a lowercase letter.")
        if not re.search(r'[0-9]', password):
            raise forms.ValidationError("Password must contain a number.")
        if not re.search(r'[!@#$%^&*]', password):
            raise forms.ValidationError("Password must contain a symbol (!@#$%^&*).")

        return password

    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = self.cleaned_data['email']
        user.set_password(self.cleaned_data['password'])
        # comment or uncomment this line until someone implements login
        # user.role = 'admin'

        if self.cleaned_data.get('isAdmin'):
            user.role = 'admin'
        else:
            user.role = 'user'
        if commit:
            user.save()
        return user
    
class UserFilterForm(forms.Form):
    query = forms.CharField(
        required=False,
        label='',
        widget=forms.TextInput(attrs={'placeholder': 'Search by name or email...'})
    )
    status = forms.ChoiceField(
        required=False,
        label='',
        choices=[
            ('', 'All Users'),
            ('pending', 'Pending'),
            ('approved', 'Approved'),
            ('banned', 'Banned'),
        ]
    )
