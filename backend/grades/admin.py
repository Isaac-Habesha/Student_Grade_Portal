"""
Admin configuration for grades app.
"""

from django.contrib import admin
from .models import StudentGrade, Result


@admin.register(StudentGrade)
class StudentGradeAdmin(admin.ModelAdmin):
    list_display = ['enrollment', 'component', 'score', 'graded_at']
    list_filter = ['component__course', 'graded_at']
    search_fields = [
        'enrollment__student__first_name',
        'enrollment__student__last_name',
        'enrollment__student__student_id',
    ]


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = [
        'enrollment', 'total_score', 'letter_grade', 'passed',
        'rank', 'is_published', 'published_at',
    ]
    list_filter = ['is_published', 'letter_grade', 'passed']
    search_fields = [
        'enrollment__student__first_name',
        'enrollment__student__last_name',
        'enrollment__student__student_id',
        'enrollment__course__code',
    ]
