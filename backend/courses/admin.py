"""
Admin configuration for courses app.
"""

from django.contrib import admin
from .models import Course, Enrollment, GradeComponent


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['code', 'name', 'instructor', 'credit_hours', 'enrolled_count', 'created_at']
    list_filter = ['credit_hours', 'created_at']
    search_fields = ['code', 'name', 'instructor__first_name', 'instructor__last_name']


@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display = ['student', 'course', 'enrolled_at']
    list_filter = ['course', 'enrolled_at']
    search_fields = ['student__first_name', 'student__last_name', 'student__student_id']


@admin.register(GradeComponent)
class GradeComponentAdmin(admin.ModelAdmin):
    list_display = ['course', 'name', 'max_score', 'weight_percent', 'display_order']
    list_filter = ['course']
    search_fields = ['name', 'course__code']
