"""
Models for StudentGrade and Result.
"""

from django.db import models
from django.core.validators import MinValueValidator
from courses.models import Enrollment, GradeComponent


class StudentGrade(models.Model):
    """
    Individual score for a student on a specific grade component.
    e.g., John's Midterm score = 85/100.
    """

    enrollment = models.ForeignKey(
        Enrollment,
        on_delete=models.CASCADE,
        related_name='grades',
    )
    component = models.ForeignKey(
        GradeComponent,
        on_delete=models.CASCADE,
        related_name='student_grades',
    )
    score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        validators=[MinValueValidator(0)],
    )
    graded_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['enrollment', 'component']
        ordering = ['component__display_order']

    def __str__(self):
        return (
            f"{self.enrollment.student.get_full_name()} — "
            f"{self.component.name}: {self.score}/{self.component.max_score}"
        )

    def clean(self):
        """Ensure score doesn't exceed max_score for the component."""
        from django.core.exceptions import ValidationError
        if self.score > self.component.max_score:
            raise ValidationError(
                f"Score ({self.score}) cannot exceed max score ({self.component.max_score})."
            )


class Result(models.Model):
    """
    Calculated final result for a student in a course.
    Computed from weighted StudentGrade scores.
    Published by instructor for student visibility.
    """

    enrollment = models.OneToOneField(
        Enrollment,
        on_delete=models.CASCADE,
        related_name='result',
    )
    total_score = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        help_text="Weighted total score out of 100",
    )
    letter_grade = models.CharField(max_length=5)
    passed = models.BooleanField()
    rank = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="Rank within the course (1 = highest score)"
    )
    is_published = models.BooleanField(
        default=False,
        help_text="Whether this result is visible to the student"
    )
    published_at = models.DateTimeField(null=True, blank=True)
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['rank']

    def __str__(self):
        return (
            f"{self.enrollment.student.get_full_name()} — "
            f"{self.enrollment.course.code}: {self.total_score} ({self.letter_grade})"
        )
