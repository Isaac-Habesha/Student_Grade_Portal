"""
Views for Course CRUD, Enrollment, and GradeComponent management.
"""

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from accounts.permissions import IsInstructor, IsStudent
from .models import Course, Enrollment, GradeComponent
from .serializers import (
    CourseListSerializer,
    CourseDetailSerializer,
    CourseCreateUpdateSerializer,
    EnrollmentSerializer,
    BulkEnrollSerializer,
    GradeComponentSerializer,
)


# ─── Course Views ────────────────────────────────────────────────────────────

class CourseListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/courses/         — List courses (filtered by role)
    POST /api/courses/         — Create course (instructor only)
    """

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsInstructor()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CourseCreateUpdateSerializer
        return CourseListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'instructor':
            return Course.objects.filter(instructor=user)
        elif user.role == 'student':
            enrolled_course_ids = Enrollment.objects.filter(
                student=user
            ).values_list('course_id', flat=True)
            return Course.objects.filter(id__in=enrolled_course_ids)
        return Course.objects.none()

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)


class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/courses/{id}/  — Course detail
    PUT    /api/courses/{id}/  — Update course (instructor owner only)
    DELETE /api/courses/{id}/  — Delete course (instructor owner only)
    """

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsInstructor()]
        return [permissions.IsAuthenticated()]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return CourseCreateUpdateSerializer
        return CourseDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'instructor':
            return Course.objects.filter(instructor=user)
        elif user.role == 'student':
            enrolled_course_ids = Enrollment.objects.filter(
                student=user
            ).values_list('course_id', flat=True)
            return Course.objects.filter(id__in=enrolled_course_ids)
        return Course.objects.none()


# ─── Enrollment Views ────────────────────────────────────────────────────────

class EnrollStudentsView(APIView):
    """
    POST /api/courses/{id}/enroll/
    Enroll one or more students in a course. Instructor only.
    """
    permission_classes = [IsInstructor]

    def post(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id, instructor=request.user)
        except Course.DoesNotExist:
            return Response(
                {'detail': 'Course not found or you are not the instructor.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = BulkEnrollSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student_ids = serializer.validated_data['student_ids']
        students = User.objects.filter(id__in=student_ids, role='student')

        if not students.exists():
            return Response(
                {'detail': 'No valid students found with the provided IDs.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        enrolled = []
        already_enrolled = []
        for student in students:
            enrollment, created = Enrollment.objects.get_or_create(
                student=student, course=course
            )
            if created:
                enrolled.append(student.get_full_name())
            else:
                already_enrolled.append(student.get_full_name())

        return Response({
            'enrolled': enrolled,
            'already_enrolled': already_enrolled,
            'total_enrolled': course.enrolled_count,
        })


class CourseStudentsView(generics.ListAPIView):
    """
    GET /api/courses/{course_id}/students/
    List all students enrolled in a course. Instructor only.
    """
    serializer_class = EnrollmentSerializer
    permission_classes = [IsInstructor]

    def get_queryset(self):
        return Enrollment.objects.filter(
            course_id=self.kwargs['course_id'],
            course__instructor=self.request.user,
        ).select_related('student')


class RemoveStudentView(APIView):
    """
    DELETE /api/courses/{course_id}/students/{student_id}/
    Remove a student from a course. Instructor only.
    """
    permission_classes = [IsInstructor]

    def delete(self, request, course_id, student_id):
        try:
            enrollment = Enrollment.objects.get(
                course_id=course_id,
                student_id=student_id,
                course__instructor=request.user,
            )
        except Enrollment.DoesNotExist:
            return Response(
                {'detail': 'Enrollment not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        enrollment.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# ─── GradeComponent Views ────────────────────────────────────────────────────

class GradeComponentListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/courses/{course_id}/components/
    POST /api/courses/{course_id}/components/
    """
    serializer_class = GradeComponentSerializer
    permission_classes = [IsInstructor]

    def get_queryset(self):
        return GradeComponent.objects.filter(
            course_id=self.kwargs['course_id'],
            course__instructor=self.request.user,
        )

    def perform_create(self, serializer):
        try:
            course = Course.objects.get(
                id=self.kwargs['course_id'],
                instructor=self.request.user,
            )
        except Course.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Course not found.')
        serializer.save(course=course)


class GradeComponentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/components/{id}/
    PUT    /api/components/{id}/
    DELETE /api/components/{id}/
    """
    serializer_class = GradeComponentSerializer
    permission_classes = [IsInstructor]

    def get_queryset(self):
        return GradeComponent.objects.filter(
            course__instructor=self.request.user,
        )
