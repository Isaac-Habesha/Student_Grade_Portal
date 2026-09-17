"""
Views for grade entry, result calculation, publication, and student result viewing.
"""

from decimal import Decimal
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsInstructor, IsStudent
from courses.models import Course, Enrollment, GradeComponent
from .models import StudentGrade, Result
from .serializers import (
    StudentGradeSerializer,
    BulkGradeEntrySerializer,
    ResultSerializer,
    StudentResultSerializer,
)
from .services import calculate_course_results, publish_course_results


# ─── Grade Entry (Instructor) ────────────────────────────────────────────────

class CourseGradesView(APIView):
    """
    GET  /api/courses/{course_id}/grades/  — Get all grades for a course
    POST /api/courses/{course_id}/grades/  — Enter/update grades (bulk)
    """
    permission_classes = [IsInstructor]

    def get(self, request, course_id):
        """Return all grades for a course, organized by student."""
        try:
            course = Course.objects.get(id=course_id, instructor=request.user)
        except Course.DoesNotExist:
            return Response(
                {'detail': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        enrollments = Enrollment.objects.filter(course=course).select_related('student')
        components = GradeComponent.objects.filter(course=course)

        data = []
        for enrollment in enrollments:
            grades = StudentGrade.objects.filter(
                enrollment=enrollment,
            ).select_related('component')

            grades_dict = {g.component_id: g for g in grades}

            student_data = {
                'enrollment_id': enrollment.id,
                'student_id': enrollment.student.student_id,
                'student_name': enrollment.student.get_full_name(),
                'grades': [],
            }

            for component in components:
                grade = grades_dict.get(component.id)
                student_data['grades'].append({
                    'component_id': component.id,
                    'component_name': component.name,
                    'max_score': str(component.max_score),
                    'score': str(grade.score) if grade else None,
                })

            data.append(student_data)

        return Response({
            'course_id': course.id,
            'course_code': course.code,
            'components': [
                {
                    'id': c.id,
                    'name': c.name,
                    'max_score': str(c.max_score),
                    'weight_percent': str(c.weight_percent),
                }
                for c in components
            ],
            'students': data,
        })

    def post(self, request, course_id):
        """Bulk enter/update grades for a course."""
        try:
            course = Course.objects.get(id=course_id, instructor=request.user)
        except Course.DoesNotExist:
            return Response(
                {'detail': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = BulkGradeEntrySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        grades_data = serializer.validated_data['grades']
        errors = []
        saved_count = 0

        for i, grade_entry in enumerate(grades_data):
            try:
                enrollment = Enrollment.objects.get(
                    id=grade_entry['enrollment_id'],
                    course=course,
                )
                component = GradeComponent.objects.get(
                    id=grade_entry['component_id'],
                    course=course,
                )

                score = Decimal(str(grade_entry['score']))
                if score > component.max_score:
                    errors.append(
                        f"Grade {i}: Score {score} exceeds max score {component.max_score} "
                        f"for {component.name}."
                    )
                    continue

                StudentGrade.objects.update_or_create(
                    enrollment=enrollment,
                    component=component,
                    defaults={'score': score},
                )
                saved_count += 1

            except Enrollment.DoesNotExist:
                errors.append(f"Grade {i}: Invalid enrollment_id {grade_entry['enrollment_id']}.")
            except GradeComponent.DoesNotExist:
                errors.append(f"Grade {i}: Invalid component_id {grade_entry['component_id']}.")
            except Exception as e:
                errors.append(f"Grade {i}: {str(e)}")

        response_data = {'saved': saved_count}
        if errors:
            response_data['errors'] = errors

        return Response(
            response_data,
            status=status.HTTP_200_OK if saved_count > 0 else status.HTTP_400_BAD_REQUEST,
        )


# ─── Result Calculation & Publication (Instructor) ───────────────────────────

class CalculateResultsView(APIView):
    """
    POST /api/courses/{course_id}/calculate/
    Calculate results for all students in a course.
    """
    permission_classes = [IsInstructor]

    def post(self, request, course_id):
        try:
            results = calculate_course_results(course_id, request.user)
            return Response({
                'detail': f'Results calculated for {len(results)} students.',
                'results': ResultSerializer(results, many=True).data,
            })
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


class CourseResultsPreviewView(APIView):
    """
    GET /api/courses/{course_id}/results/
    Preview calculated results (instructor only).
    """
    permission_classes = [IsInstructor]

    def get(self, request, course_id):
        try:
            course = Course.objects.get(id=course_id, instructor=request.user)
        except Course.DoesNotExist:
            return Response(
                {'detail': 'Course not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        results = Result.objects.filter(
            enrollment__course=course,
        ).select_related('enrollment__student', 'enrollment__course')

        return Response({
            'course_code': course.code,
            'course_name': course.name,
            'results': ResultSerializer(results, many=True).data,
        })


class PublishResultsView(APIView):
    """
    POST /api/courses/{course_id}/publish/
    Publish all calculated results for a course.
    """
    permission_classes = [IsInstructor]

    def post(self, request, course_id):
        try:
            count = publish_course_results(course_id, request.user)
            return Response({
                'detail': f'Published results for {count} students.',
            })
        except ValueError as e:
            return Response(
                {'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ─── Student Result Viewing ──────────────────────────────────────────────────

class StudentCoursesView(APIView):
    """
    GET /api/student/courses/
    List courses the student is enrolled in, with result status.
    """
    permission_classes = [IsStudent]

    def get(self, request):
        enrollments = Enrollment.objects.filter(
            student=request.user,
        ).select_related('course', 'course__instructor')

        courses = []
        for enrollment in enrollments:
            result = Result.objects.filter(
                enrollment=enrollment,
                is_published=True,
            ).first()

            courses.append({
                'enrollment_id': enrollment.id,
                'course_id': enrollment.course.id,
                'course_code': enrollment.course.code,
                'course_name': enrollment.course.name,
                'credit_hours': enrollment.course.credit_hours,
                'instructor_name': enrollment.course.instructor.get_full_name(),
                'has_result': result is not None,
                'letter_grade': result.letter_grade if result else None,
                'passed': result.passed if result else None,
            })

        return Response(courses)


class StudentCourseResultView(APIView):
    """
    GET /api/student/courses/{course_id}/result/
    View own published result for a specific course.
    Students can ONLY see their own published results.
    """
    permission_classes = [IsStudent]

    def get(self, request, course_id):
        try:
            enrollment = Enrollment.objects.get(
                student=request.user,
                course_id=course_id,
            )
        except Enrollment.DoesNotExist:
            return Response(
                {'detail': 'You are not enrolled in this course.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            result = Result.objects.get(
                enrollment=enrollment,
                is_published=True,
            )
        except Result.DoesNotExist:
            return Response(
                {'detail': 'Results have not been published yet for this course.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(StudentResultSerializer(result).data)
