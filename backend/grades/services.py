"""
Business logic for result calculation, ranking, and publication.
"""

from decimal import Decimal
from django.utils import timezone

from courses.models import Course, Enrollment, GradeComponent
from .models import StudentGrade, Result


# ─── Grading Scale ────────────────────────────────────────────────────────────

GRADING_SCALE = [
    (Decimal('90'), 'A',  True),
    (Decimal('85'), 'B+', True),
    (Decimal('80'), 'B',  True),
    (Decimal('75'), 'C+', True),
    (Decimal('70'), 'C',  True),
    (Decimal('60'), 'D',  True),
    (Decimal('0'),  'F',  False),
]


def get_letter_grade(total_score):
    """Return (letter_grade, passed) tuple based on total score."""
    for threshold, grade, passed in GRADING_SCALE:
        if total_score >= threshold:
            return grade, passed
    return 'F', False


# ─── Result Calculation ──────────────────────────────────────────────────────

def calculate_course_results(course_id, instructor):
    """
    Calculate results for all enrolled students in a course.
    Returns a list of result dicts for preview.

    Raises ValueError if:
    - Course not found or instructor doesn't own it
    - Grade components don't sum to 100%
    - Not all students have all component scores
    """
    try:
        course = Course.objects.get(id=course_id, instructor=instructor)
    except Course.DoesNotExist:
        raise ValueError("Course not found or you are not the instructor.")

    components = list(course.grade_components.all())
    if not components:
        raise ValueError("No grade components defined for this course.")

    total_weight = sum(c.weight_percent for c in components)
    if total_weight != Decimal('100'):
        raise ValueError(
            f"Grade component weights must sum to 100%. Currently: {total_weight}%."
        )

    enrollments = list(
        Enrollment.objects.filter(course=course).select_related('student')
    )
    if not enrollments:
        raise ValueError("No students enrolled in this course.")

    # Calculate weighted score for each student
    results_data = []
    for enrollment in enrollments:
        grades = StudentGrade.objects.filter(
            enrollment=enrollment,
            component__in=components,
        ).select_related('component')

        grades_by_component = {g.component_id: g for g in grades}

        # Check all components have grades
        missing = [c.name for c in components if c.id not in grades_by_component]
        if missing:
            raise ValueError(
                f"Student {enrollment.student.get_full_name()} is missing grades for: "
                f"{', '.join(missing)}."
            )

        # Calculate weighted total
        total_score = Decimal('0')
        for component in components:
            grade = grades_by_component[component.id]
            # (score / max_score) * weight_percent
            component_score = (grade.score / component.max_score) * component.weight_percent
            total_score += component_score

        total_score = total_score.quantize(Decimal('0.01'))
        letter_grade, passed = get_letter_grade(total_score)

        results_data.append({
            'enrollment': enrollment,
            'total_score': total_score,
            'letter_grade': letter_grade,
            'passed': passed,
        })

    # Sort by total_score descending for ranking
    results_data.sort(key=lambda x: x['total_score'], reverse=True)

    # Assign ranks (handle ties — same score gets same rank)
    current_rank = 1
    for i, result in enumerate(results_data):
        if i > 0 and result['total_score'] < results_data[i - 1]['total_score']:
            current_rank = i + 1
        result['rank'] = current_rank

    # Save/update Result records
    saved_results = []
    for data in results_data:
        result, created = Result.objects.update_or_create(
            enrollment=data['enrollment'],
            defaults={
                'total_score': data['total_score'],
                'letter_grade': data['letter_grade'],
                'passed': data['passed'],
                'rank': data['rank'],
                'is_published': False,  # Reset publication on recalculation
                'published_at': None,
            }
        )
        saved_results.append(result)

    return saved_results


# ─── Result Publication ──────────────────────────────────────────────────────

def publish_course_results(course_id, instructor):
    """
    Publish all calculated results for a course.
    Makes results visible to students.
    """
    try:
        course = Course.objects.get(id=course_id, instructor=instructor)
    except Course.DoesNotExist:
        raise ValueError("Course not found or you are not the instructor.")

    results = Result.objects.filter(
        enrollment__course=course,
        is_published=False,
    )

    if not results.exists():
        raise ValueError(
            "No unpublished results found. Calculate results first, "
            "or results are already published."
        )

    now = timezone.now()
    count = results.update(is_published=True, published_at=now)
    return count
