"""
Serializers for Course, Enrollment, and GradeComponent.
"""

from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import Course, Enrollment, GradeComponent


class GradeComponentSerializer(serializers.ModelSerializer):
    """Serializer for grade components (midterm, final, etc.)."""

    class Meta:
        model = GradeComponent
        fields = ['id', 'name', 'max_score', 'weight_percent', 'display_order', 'course']
        read_only_fields = ['id']

    def validate(self, data):
        """Validate that total weight doesn't exceed 100% for the course."""
        course = data.get('course') or self.instance.course
        weight = data.get('weight_percent', self.instance.weight_percent if self.instance else 0)

        existing_weight = course.components_weight_total
        if self.instance:
            # Subtract current weight when updating
            existing_weight -= self.instance.weight_percent

        if existing_weight + weight > 100:
            remaining = 100 - existing_weight
            raise serializers.ValidationError(
                f"Total component weights cannot exceed 100%. "
                f"Remaining available weight: {remaining}%."
            )
        return data


class CourseListSerializer(serializers.ModelSerializer):
    """Lightweight course serializer for list views."""
    instructor_name = serializers.SerializerMethodField()
    enrolled_count = serializers.IntegerField(read_only=True)
    components_weight_total = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )

    class Meta:
        model = Course
        fields = [
            'id', 'code', 'name', 'description', 'instructor', 'instructor_name',
            'credit_hours', 'enrolled_count', 'components_weight_total', 'created_at',
        ]
        read_only_fields = ['id', 'instructor', 'created_at']

    def get_instructor_name(self, obj):
        return obj.instructor.get_full_name()


class CourseDetailSerializer(serializers.ModelSerializer):
    """Full course detail with nested components and enrollment info."""
    instructor_name = serializers.SerializerMethodField()
    enrolled_count = serializers.IntegerField(read_only=True)
    components_weight_total = serializers.DecimalField(
        max_digits=5, decimal_places=2, read_only=True
    )
    grade_components = GradeComponentSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = [
            'id', 'code', 'name', 'description', 'instructor', 'instructor_name',
            'credit_hours', 'enrolled_count', 'components_weight_total',
            'grade_components', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'instructor', 'created_at', 'updated_at']

    def get_instructor_name(self, obj):
        return obj.instructor.get_full_name()


class CourseCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating courses."""

    class Meta:
        model = Course
        fields = ['id', 'code', 'name', 'description', 'credit_hours']
        read_only_fields = ['id']


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for enrollments, includes student details."""
    student_detail = UserSerializer(source='student', read_only=True)

    class Meta:
        model = Enrollment
        fields = ['id', 'student', 'course', 'student_detail', 'enrolled_at']
        read_only_fields = ['id', 'enrolled_at']


class BulkEnrollSerializer(serializers.Serializer):
    """Serializer for enrolling multiple students at once."""
    student_ids = serializers.ListField(
        child=serializers.IntegerField(),
        min_length=1,
        help_text="List of student user IDs to enroll"
    )
