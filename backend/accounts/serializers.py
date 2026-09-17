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
        user = None
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
    """Validates student login via Student ID and Special Nickname."""
    student_id = serializers.CharField()
    nickname = serializers.CharField()

    def validate(self, data):
        student_id = data['student_id'].strip().upper()
        nickname = data['nickname'].strip()

        try:
            student = User.objects.get(student_id__iexact=student_id, role='student')
        except User.DoesNotExist:
            raise serializers.ValidationError("Student ID not found. Please verify your ID.")

        if not student.is_active:
            raise serializers.ValidationError("This student account has been deactivated.")

        # Check nickname (case-insensitive match for ease of use)
        if not student.nickname or student.nickname.strip().lower() != nickname.lower():
            raise serializers.ValidationError("Invalid nickname for the provided Student ID.")

        data['user'] = student
        return data


class LoginSerializer(serializers.Serializer):
    """
    Unified Login serializer supporting both:
    1. Student access via (student_id, nickname)
    2. Instructor access via (username, password)
    """
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, allow_blank=True, write_only=True)
    student_id = serializers.CharField(required=False, allow_blank=True)
    nickname = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        student_id = data.get('student_id')
        nickname = data.get('nickname')
        username = data.get('username')
        password = data.get('password')

        if student_id and nickname:
            student_serializer = StudentLoginSerializer(data={'student_id': student_id, 'nickname': nickname})
            student_serializer.is_valid(raise_exception=True)
            data['user'] = student_serializer.validated_data['user']
            return data
        elif username and password:
            instructor_serializer = InstructorLoginSerializer(data={'username': username, 'password': password})
            instructor_serializer.is_valid(raise_exception=True)
            data['user'] = instructor_serializer.validated_data['user']
            return data
        else:
            raise serializers.ValidationError("Please provide either Student ID + Nickname or Username + Password.")


class UserSerializer(serializers.ModelSerializer):
    """Read-only user representation."""

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'student_id', 'nickname', 'created_at',
        ]
        read_only_fields = fields


class CreateStudentSerializer(serializers.ModelSerializer):
    """
    Serializer for instructors to create student accounts without requiring a password.
    Requires first_name, last_name, and nickname.
    """
    nickname = serializers.CharField(required=True, max_length=50)
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'nickname', 'student_id',
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

        if not username:
            base_username = f"{first_name.lower().replace(' ', '')}.{last_name.lower().replace(' ', '')}"
            username = base_username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            validated_data['username'] = username

        user = User(**validated_data, role='student')
        user.set_password(secrets.token_urlsafe(32))
        user.save()
        return user
