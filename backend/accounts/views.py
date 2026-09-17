"""
Views for authentication and user management.
"""

from django.db import models

from rest_framework import generics, permissions, status
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import User
from .permissions import IsInstructor
from .serializers import (
    LoginSerializer,
    InstructorLoginSerializer,
    StudentLoginSerializer,
    UserSerializer,
    CreateStudentSerializer,
)


class StudentLoginView(APIView):
    """
    POST /api/auth/student/login/
    Student passwordless login using Student ID + Special Nickname.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = StudentLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        })


class InstructorLoginView(APIView):
    """
    POST /api/auth/instructor/login/
    Instructor/Admin credential login using Username/Email + Password.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = InstructorLoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        })


class LoginView(APIView):
    """
    POST /api/auth/login/
    Unified login supporting both student ID+nickname and instructor username+password.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
        })


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Delete user's auth token.
    """

    def post(self, request):
        if hasattr(request.user, 'auth_token'):
            request.user.auth_token.delete()
        return Response({'detail': 'Successfully logged out.'}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """
    GET /api/auth/me/
    Return the currently authenticated user's data.
    """

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class StudentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/accounts/students/  — List all students (instructor only)
    POST /api/accounts/students/  — Create a new student account (instructor only)
    """
    permission_classes = [IsInstructor]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateStudentSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = User.objects.filter(role='student')
        search = self.request.query_params.get('search', '')
        if search:
            queryset = queryset.filter(
                models.Q(first_name__icontains=search)
                | models.Q(last_name__icontains=search)
                | models.Q(student_id__icontains=search)
                | models.Q(nickname__icontains=search)
                | models.Q(username__icontains=search)
            )
        return queryset
