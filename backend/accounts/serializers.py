"""
Serializers for User authentication and management.
"""

import secrets
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import User


class InstructorLoginSerializer(serializers.Serializer):
    """Validates instructor/admin login credentials (username/email + password)."""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username_input = data['username'].strip()
        password = data['password']

        # Allow logging in with either username or email
        if '@' in username_input:
            try:
                user_obj = User.objects.get(email__iexact=username_input)
                username_input = user_obj.username
            except (User.DoesNotExist, User.MultipleObjectsReturned):
                pass

        user = authenticate(username=username_input, password=password)
        if not user:
            raise serializers.ValidationError("Invalid instructor credentials.")
        if not user.is_active:
            raise serializers.ValidationError("This account is disabled.")
        if user.role != 'instructor' and not user.is_staff:
            raise serializers.ValidationError("Access denied. This portal is for instructors and administrators.")

        data['user'] = user
        return data


class StudentLoginSerializer(serializers.Serializer):
    """Validates student login via Student ID and First Name."""
    student_id = serializers.CharField(required=True)
    first_name = serializers.CharField(required=True)

    def validate(self, data):
        student_id = data['student_id'].strip().upper()
        first_name = data['first_name'].strip()

        try:
            student = User.objects.get(student_id__iexact=student_id, role='student')
        except User.DoesNotExist:
            raise serializers.ValidationError("Student ID not found. Please verify your ID.")

        if not student.is_active:
            raise serializers.ValidationError("This student account has been deactivated.")

        # Check first name (case-insensitive match for convenience)
        if not student.first_name or student.first_name.strip().lower() != first_name.lower():
            raise serializers.ValidationError("First name does not match the record for this Student ID.")

        data['user'] = student
        return data


class LoginSerializer(serializers.Serializer):
    """
    Unified Login serializer supporting both:
    1. Student access via (student_id, first_name)
    2. Instructor access via (username, password)
    """
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)
    student_id = serializers.CharField(required=False, allow_blank=True)
    first_name = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        student_id = data.get('student_id')
        first_name = data.get('first_name')
        username = data.get('username')
        password = data.get('password')

        if student_id and first_name:
            student_serializer = StudentLoginSerializer(data={'student_id': student_id, 'first_name': first_name})
            student_serializer.is_valid(raise_exception=True)
            data['user'] = student_serializer.validated_data['user']
            return data
        elif username and password:
            instructor_serializer = InstructorLoginSerializer(data={'username': username, 'password': password})
            instructor_serializer.is_valid(raise_exception=True)
            data['user'] = instructor_serializer.validated_data['user']
            return data
        else:
            raise serializers.ValidationError("Please provide either Student ID + First Name or Username + Password.")


class UserSerializer(serializers.ModelSerializer):
    """Read-only user representation."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'student_id', 'photo_url', 'created_at',
        ]
        read_only_fields = fields


class CreateStudentSerializer(serializers.ModelSerializer):
    """
    Serializer for instructors to create student accounts without requiring a password.
    Requires first_name and last_name; supports optional photo_url.
    """
    first_name = serializers.CharField(required=True, max_length=150)
    last_name = serializers.CharField(required=True, max_length=150)
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    photo_url = serializers.CharField(required=False, allow_blank=True, max_length=500)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'photo_url', 'student_id',
        ]
        read_only_fields = ['id', 'student_id']

    def validate_username(self, value):
        if value and User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        first_name = validated_data.get('first_name', '').strip()
        last_name = validated_data.get('last_name', '').strip()
        username = validated_data.get('username', '').strip()
        photo_url = validated_data.get('photo_url', '').strip()

        if not username:
            base_username = f"{first_name.lower().replace(' ', '')}.{last_name.lower().replace(' ', '')}"
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            validated_data['username'] = username

        # Default avatar if photo_url is empty
        if not photo_url:
            validated_data['photo_url'] = f"https://api.dicebear.com/7.x/avataaars/svg?seed={first_name}{last_name}"

        user = User(**validated_data, role='student')
        user.set_password(secrets.token_urlsafe(32))
        user.save()
        return user
