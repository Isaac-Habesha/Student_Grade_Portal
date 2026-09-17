"""
Admin configuration for accounts app.
"""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'student_id', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name', 'student_id']
    ordering = ['last_name', 'first_name']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role & Student Info', {
            'fields': ('role', 'student_id'),
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role & Student Info', {
            'fields': ('role', 'first_name', 'last_name', 'email'),
        }),
    )
