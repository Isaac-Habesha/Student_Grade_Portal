"""
URL patterns for accounts app — authentication, student management, and Cloudinary uploads.
"""

from django.urls import path
from . import views

urlpatterns = [
    # Auth Endpoints
    path('student/login/', views.StudentLoginView.as_view(), name='auth-student-login'),
    path('instructor/login/', views.InstructorLoginView.as_view(), name='auth-instructor-login'),
    path('login/', views.LoginView.as_view(), name='auth-login'),
    path('logout/', views.LogoutView.as_view(), name='auth-logout'),
    path('me/', views.CurrentUserView.as_view(), name='auth-me'),
    # Cloudinary Upload
    path('upload-photo/', views.PhotoUploadView.as_view(), name='auth-upload-photo'),
    # Student management
    path('students/', views.StudentListCreateView.as_view(), name='student-list-create'),
]
