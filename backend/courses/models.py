"""
Models for Course, Enrollment, and GradeComponent.
"""

from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models


class Course(models.Model):
    """A course created and managed by an instructor."""

    code = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique course code, e.g., CS101"
    )
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True, default='')
    instructor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='courses_taught',
        limit_choices_to={'role': 'instructor'},
    )
    credit_hours = models.PositiveIntegerField(
        default=3,
        validators=[MinValueValidator(1), MaxValueValidator(12)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.code} — {self.name}"

    @property
    def enrolled_count(self):
        return self.enrollments.count()

    @property
    def components_weight_total(self):
        """Sum of all grade component weights for this course."""
        total = self.grade_components.aggregate(
            total=models.Sum('weight_percent')
        )['total']
        return total or 0


class Enrollment(models.Model):
    """Links a student to a course."""

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role': 'student'},
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments',
    )
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'course']
        ordering = ['student__last_name', 'student__first_name']

    def __str__(self):
        return f"{self.student.get_full_name()} → {self.course.code}"


class GradeComponent(models.Model):
    """
    A grading component for a course (e.g., Midterm, Final, Assignment 1).
    Weights across all components in a course must sum to 100%.
    """

    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='grade_components',
    )
    name = models.CharField(
        max_length=100,
        help_text="e.g., Midterm Exam, Final Exam, Assignment 1"
    )
    max_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(1)],
        help_text="Maximum possible score for this component"
    )
    weight_percent = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Weight of this component (all components must sum to 100%)"
    )
    display_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['display_order', 'id']
        unique_together = ['course', 'name']

    def __str__(self):
        return f"{self.course.code} — {self.name} ({self.weight_percent}%)"
