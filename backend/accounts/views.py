"""
Views for authentication, user management, and Cloudinary photo uploads.
"""

from django.db import models
from rest_framework import generics, permissions, status, parsers
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
import cloudinary
import cloudinary.uploader

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
    Student passwordless login using Student ID + First Name.
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
    Unified login supporting both student (ID + First Name) and instructor (Username + Password).
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


class PhotoUploadView(APIView):
    """
    POST /api/auth/upload-photo/
    Upload student image to Cloudinary and return secure URL.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser, parsers.JSONParser]

    def post(self, request):
        image_file = request.FILES.get('image') or request.FILES.get('file') or request.data.get('image')
        if not image_file:
            return Response(
                {'detail': 'No image file provided.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                image_file,
                folder='gradeportal/students',
                resource_type='image',
                transformation=[
                    {'width': 400, 'height': 400, 'crop': 'fill', 'gravity': 'face', 'quality': 'auto'}
                ]
            )
            secure_url = upload_result.get('secure_url') or upload_result.get('url')
            return Response({
                'photo_url': secure_url,
                'public_id': upload_result.get('public_id')
            }, status=status.HTTP_200_OK)
        except Exception as e:
            # Fallback if URL string passed
            if isinstance(image_file, str) and image_file.startswith(('http://', 'https://')):
                return Response({'photo_url': image_file}, status=status.HTTP_200_OK)
            return Response(
                {'detail': f'Cloudinary upload failed: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class StudentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/auth/students/ or /api/accounts/students/ — List all students (instructor only)
    POST /api/auth/students/ or /api/accounts/students/ — Create a new student account (instructor only)
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
                | models.Q(username__icontains=search)
            )
        return queryset
