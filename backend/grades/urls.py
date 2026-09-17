"""
URL patterns for grades app.
"""

from django.urls import path
from . import views

urlpatterns = [
    # Grade entry (instructor)
    path('courses/<int:course_id>/grades/',
         views.CourseGradesView.as_view(), name='course-grades'),

    # Result calculation & publication (instructor)
    path('courses/<int:course_id>/calculate/',
         views.CalculateResultsView.as_view(), name='course-calculate'),
    path('courses/<int:course_id>/results/',
         views.CourseResultsPreviewView.as_view(), name='course-results'),
    path('courses/<int:course_id>/publish/',
         views.PublishResultsView.as_view(), name='course-publish'),

    # Student result viewing
    path('student/courses/',
         views.StudentCoursesView.as_view(), name='student-courses'),
    path('student/courses/<int:course_id>/result/',
         views.StudentCourseResultView.as_view(), name='student-result'),
]
