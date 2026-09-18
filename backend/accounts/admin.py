"""
Admin configuration for accounts app.
"""

import secrets
from django import forms
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


class UserAdminAddForm(forms.ModelForm):
    """
    Custom form for creating users in Django Admin.
    Password is optional for students (auto-generated for passwordless login).
    """
    role = forms.ChoiceField(choices=User.ROLE_CHOICES, initial='student', required=True)
    first_name = forms.CharField(required=True)
    last_name = forms.CharField(required=True)
    photo_url = forms.URLField(
        required=False,
        help_text="Student profile image URL (Cloudinary / CDN)."
    )
    username = forms.CharField(
        required=False,
        help_text="Optional — auto-generated from name if left empty."
    )
    password1 = forms.CharField(
        widget=forms.PasswordInput,
        required=False,
        label="Password",
        help_text="Not required for students (auto-generated for passwordless login)."
    )
    password2 = forms.CharField(
        widget=forms.PasswordInput,
        required=False,
        label="Confirm Password",
        help_text="Confirm password if provided."
    )

    class Meta:
        model = User
        fields = ('role', 'first_name', 'last_name', 'photo_url', 'username', 'email')

    def clean(self):
        cleaned_data = super().clean()
        role = cleaned_data.get('role')
        pass1 = cleaned_data.get('password1')
        pass2 = cleaned_data.get('password2')

        if role != 'student' and not pass1:
            self.add_error('password1', 'Password is required for instructors/administrators.')

        if pass1 or pass2:
            if pass1 != pass2:
                self.add_error('password2', 'Passwords do not match.')

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        user.first_name = self.cleaned_data.get('first_name', '').strip()
        user.last_name = self.cleaned_data.get('last_name', '').strip()
        user.role = self.cleaned_data.get('role')
        user.photo_url = self.cleaned_data.get('photo_url', '').strip()

        pass1 = self.cleaned_data.get('password1')
        if pass1:
            user.set_password(pass1)
        else:
            user.set_password(secrets.token_urlsafe(32))

        if not user.username:
            fname = user.first_name.lower().replace(' ', '')
            lname = user.last_name.lower().replace(' ', '')
            base_username = f"{fname}.{lname}" if (fname or lname) else "student"
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            user.username = username

        if commit:
            user.save()
        return user


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    add_form = UserAdminAddForm
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'student_id', 'photo_url', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'student_id']
    ordering = ['last_name', 'first_name']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role & Student Info', {
            'fields': ('role', 'student_id', 'photo_url'),
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('role', 'first_name', 'last_name', 'photo_url', 'username', 'email', 'password1', 'password2'),
        }),
    )
