from django import forms
from authe.models import User

class SignupForm(forms.ModelForm):

    password = forms.CharField(widget=forms.PasswordInput())

    class Meta:
        model = User
        fields = ['name', 'email', 'password'] 


    def save(self, commit=True):
        user = super().save(commit=False)
        user.username = self.cleaned_data['email']
        user.set_password(self.cleaned_data['password'])
        # comment or uncomment this line until someone implements login
        # user.role = 'admin'
        if commit:
            user.save()
        return user