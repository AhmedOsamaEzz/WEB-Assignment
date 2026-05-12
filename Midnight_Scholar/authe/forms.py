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