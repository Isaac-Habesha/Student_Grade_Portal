"""
Serializers for StudentGrade and Result.
"""

from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import StudentGrade, Result


class StudentGradeSerializer(serializers.ModelSerializer):
    """Serializer for individual student grades on components."""
    component_name = serializers.CharField(source='component.name', read_only=True)
    max_score = serializers.DecimalField(
        source='component.max_score', max_digits=6, decimal_places=2, read_only=True
    )

    class Meta:
        model = StudentGrade
        fields = ['id', 'enrollment', 'component', 'component_name', 'max_score', 'score', 'graded_at']
        read_only_fields = ['id', 'graded_at']


class BulkGradeEntrySerializer(serializers.Serializer):
    """
    Serializer for bulk grade entry.
    Accepts a list of {enrollment_id, component_id, score} objects.
    """
    grades = serializers.ListField(
        child=serializers.DictField(),
        min_length=1,
    )

    def validate_grades(self, value):
        for i, grade in enumerate(value):
            if 'enrollment_id' not in grade:
                raise serializers.ValidationError(f"Grade {i}: 'enrollment_id' is required.")
            if 'component_id' not in grade:
                raise serializers.ValidationError(f"Grade {i}: 'component_id' is required.")
            if 'score' not in grade:
                raise serializers.ValidationError(f"Grade {i}: 'score' is required.")
            try:
                grade['score'] = float(grade['score'])
            except (ValueError, TypeError):
                raise serializers.ValidationError(f"Grade {i}: 'score' must be a number.")
            if grade['score'] < 0:
                raise serializers.ValidationError(f"Grade {i}: score cannot be negative.")
        return value


class ResultSerializer(serializers.ModelSerializer):
    """Serializer for calculated results (instructor preview)."""
    student_name = serializers.SerializerMethodField()
    student_id = serializers.CharField(source='enrollment.student.student_id', read_only=True)
    student_photo_url = serializers.CharField(source='enrollment.student.photo_url', read_only=True)
    course_code = serializers.CharField(source='enrollment.course.code', read_only=True)
    course_name = serializers.CharField(source='enrollment.course.name', read_only=True)

    class Meta:
        model = Result
        fields = [
            'id', 'student_name', 'student_id', 'student_photo_url', 'course_code', 'course_name',
            'total_score', 'letter_grade', 'passed', 'rank',
            'is_published', 'published_at', 'calculated_at',
        ]

    def get_student_name(self, obj):
        return obj.enrollment.student.get_full_name()


class StudentResultSerializer(serializers.ModelSerializer):
    """
    Serializer for a student viewing their own result.
    Includes student identity, photo, rank standing, and component grade breakdown.
    """
    student_name = serializers.SerializerMethodField()
    student_id = serializers.CharField(source='enrollment.student.student_id', read_only=True)
    student_photo_url = serializers.CharField(source='enrollment.student.photo_url', read_only=True)
    course_code = serializers.CharField(source='enrollment.course.code', read_only=True)
    course_name = serializers.CharField(source='enrollment.course.name', read_only=True)
    credit_hours = serializers.IntegerField(source='enrollment.course.credit_hours', read_only=True)
    instructor_name = serializers.SerializerMethodField()
    total_enrolled = serializers.SerializerMethodField()
    grade_breakdown = serializers.SerializerMethodField()

    class Meta:
        model = Result
        fields = [
            'id', 'student_name', 'student_id', 'student_photo_url',
            'course_code', 'course_name', 'credit_hours', 'instructor_name',
            'total_score', 'passed', 'rank', 'total_enrolled',
            'grade_breakdown', 'published_at',
        ]

    def get_student_name(self, obj):
        return obj.enrollment.student.get_full_name()

    def get_instructor_name(self, obj):
        return obj.enrollment.course.instructor.get_full_name()

    def get_total_enrolled(self, obj):
        return Result.objects.filter(enrollment__course=obj.enrollment.course, is_published=True).count()

    def get_grade_breakdown(self, obj):
        """Return per-component scores for the student."""
        grades = StudentGrade.objects.filter(
            enrollment=obj.enrollment,
        ).select_related('component').order_by('component__display_order')

        return [
            {
                'component': g.component.name,
                'score': str(g.score),
                'max_score': str(g.component.max_score),
                'weight': str(g.component.weight_percent),
                'weighted_score': str(
                    (g.score / g.component.max_score * g.component.weight_percent).quantize(
                        __import__('decimal').Decimal('0.01')
                    )
                ),
            }
            for g in grades
        ]
