"""
URL patterns for courses app.
"""

from django.urls import path
from . import views

urlpatterns = [
    # Courses
    path('courses/', views.CourseListCreateView.as_view(), name='course-list-create'),
    path('courses/<int:pk>/', views.CourseDetailView.as_view(), name='course-detail'),

    # Enrollment
    path('courses/<int:course_id>/enroll/', views.EnrollStudentsView.as_view(), name='course-enroll'),
    path('courses/<int:course_id>/students/', views.CourseStudentsView.as_view(), name='course-students'),
    path('courses/<int:course_id>/students/<int:student_id>/',
         views.RemoveStudentView.as_view(), name='course-remove-student'),

    # Grade Components
    path('courses/<int:course_id>/components/',
         views.GradeComponentListCreateView.as_view(), name='component-list-create'),
    path('components/<int:pk>/',
         views.GradeComponentDetailView.as_view(), name='component-detail'),
]
