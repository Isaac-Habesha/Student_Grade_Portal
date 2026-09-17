"""
Custom permissions for role-based access control.
"""

from rest_framework import permissions


class IsInstructor(permissions.BasePermission):
    """Allow access only to instructor users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'instructor'
        )


class IsStudent(permissions.BasePermission):
    """Allow access only to student users."""

    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'student'
        )


class IsInstructorOrReadOnly(permissions.BasePermission):
    """Allow full access to instructors, read-only to others."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'instructor'
        )
