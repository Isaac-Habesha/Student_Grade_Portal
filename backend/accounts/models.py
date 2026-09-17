"""
Custom User model with role-based access and auto-generated student IDs.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class User(AbstractUser):
    """
    Custom user with role (student/instructor) and unique student ID.
    Student IDs are auto-generated in format STU-YYXXXX (e.g., STU-260001).
    """

    ROLE_CHOICES = [
        ('student', 'Student'),
        ('instructor', 'Instructor'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    student_id = models.CharField(
        max_length=20,
        unique=True,
        null=True,
        blank=True,
        help_text="Auto-generated unique student ID (e.g., STU-260001)"
    )
    nickname = models.CharField(
        max_length=50,
        null=True,
        blank=True,
        help_text="Special nickname for student authentication"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        if self.role == 'student' and self.student_id:
            return f"{self.get_full_name()} ({self.student_id})"
        return f"{self.get_full_name()} [{self.role}]"

    def save(self, *args, **kwargs):
        """Auto-generate student_id for student accounts."""
        if self.role == 'student' and not self.student_id:
            self.student_id = self._generate_student_id()
        elif self.role != 'student':
            self.student_id = None
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_student_id():
        """Generate unique student ID in format STU-YYXXXX."""
        year_prefix = timezone.now().strftime('%y')
        prefix = f"STU-{year_prefix}"

        # Find the highest existing ID with this year prefix
        last_student = (
            User.objects
            .filter(student_id__startswith=prefix)
            .order_by('-student_id')
            .first()
        )

        if last_student and last_student.student_id:
            last_number = int(last_student.student_id.split('-')[1][2:])
            new_number = last_number + 1
        else:
            new_number = 1

        return f"{prefix}{new_number:04d}"

    @property
    def is_student(self):
        return self.role == 'student'

    @property
    def is_instructor(self):
        return self.role == 'instructor'
