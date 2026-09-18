"""
Seed the database with test data for development.
Creates instructor, students, courses, enrollments, grade components, sample grades, and calculates/publishes CS101 results.

Usage: python manage.py shell < seed_data.py
"""

import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from decimal import Decimal
import secrets
import random
from accounts.models import User
from courses.models import Course, Enrollment, GradeComponent
from grades.models import StudentGrade, Result
from grades.services import calculate_course_results, publish_course_results

print("=" * 60)
print("  Seeding Student Grade Portal Database")
print("=" * 60)

# ─── Create Superadmin ────────────────────────────────────────────────────────

admin_user, created = User.objects.get_or_create(
    username='admin',
    defaults={
        'email': 'admin@gradeportal.com',
        'first_name': 'Admin',
        'last_name': 'User',
        'role': 'instructor',
        'is_staff': True,
        'is_superuser': True,
    }
)
if created:
    admin_user.set_password('admin123')
    admin_user.save()
    print("✓ Created superadmin: admin / admin123")
else:
    print("· Superadmin already exists")

# ─── Create Instructors ──────────────────────────────────────────────────────

instructors_data = [
    {
        'username': 'dr.smith',
        'email': 'smith@gradeportal.com',
        'first_name': 'John',
        'last_name': 'Smith',
        'password': 'instructor123',
    },
    {
        'username': 'dr.johnson',
        'email': 'johnson@gradeportal.com',
        'first_name': 'Sarah',
        'last_name': 'Johnson',
        'password': 'instructor123',
    },
]

instructors = []
for data in instructors_data:
    password = data.pop('password')
    instructor, created = User.objects.get_or_create(
        username=data['username'],
        defaults={**data, 'role': 'instructor'},
    )
    if created:
        instructor.set_password(password)
        instructor.save()
        print(f"✓ Created instructor: {instructor.username} / {password}")
    else:
        print(f"· Instructor {instructor.username} already exists")
    instructors.append(instructor)

# ─── Create Students (with Profile Avatars) ───────────────────────────────────

students_data = [
    {
        'username': 'alice.wonder',
        'email': 'alice@student.com',
        'first_name': 'Alice',
        'last_name': 'Wonder',
        'photo_url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80',
    },
    {
        'username': 'bob.miller',
        'email': 'bob@student.com',
        'first_name': 'Bob',
        'last_name': 'Miller',
        'photo_url': 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=400&auto=format&fit=crop&q=80',
    },
    {
        'username': 'charlie.davis',
        'email': 'charlie@student.com',
        'first_name': 'Charlie',
        'last_name': 'Davis',
        'photo_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
    },
    {
        'username': 'diana.ross',
        'email': 'diana@student.com',
        'first_name': 'Diana',
        'last_name': 'Ross',
        'photo_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
    },
    {
        'username': 'edward.kim',
        'email': 'edward@student.com',
        'first_name': 'Edward',
        'last_name': 'Kim',
        'photo_url': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
    },
    {
        'username': 'fiona.chen',
        'email': 'fiona@student.com',
        'first_name': 'Fiona',
        'last_name': 'Chen',
        'photo_url': 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
    },
    {
        'username': 'george.brown',
        'email': 'george@student.com',
        'first_name': 'George',
        'last_name': 'Brown',
        'photo_url': 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=400&auto=format&fit=crop&q=80',
    },
    {
        'username': 'hannah.white',
        'email': 'hannah@student.com',
        'first_name': 'Hannah',
        'last_name': 'White',
        'photo_url': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&auto=format&fit=crop&q=80',
    },
]

students = []
for data in students_data:
    photo = data.get('photo_url')
    student, created = User.objects.get_or_create(
        username=data['username'],
        defaults={**data, 'role': 'student'},
    )
    if not created and (not student.photo_url or student.photo_url != photo):
        student.photo_url = photo
        student.save()
    if created:
        student.set_password(secrets.token_urlsafe(32))
        student.save()
        print(f"✓ Created student: {student.get_full_name()} (ID: {student.student_id}, First Name: {student.first_name})")
    else:
        print(f"· Student {student.get_full_name()} already exists (ID: {student.student_id})")
    students.append(student)

# ─── Create Courses ───────────────────────────────────────────────────────────

courses_data = [
    {
        'code': 'CS101',
        'name': 'Introduction to Computer Science',
        'description': 'Fundamental concepts of computer science including algorithms, data structures, and programming.',
        'instructor': instructors[0],
        'credit_hours': 3,
    },
    {
        'code': 'MATH201',
        'name': 'Linear Algebra',
        'description': 'Study of vectors, matrices, linear transformations, and eigenvalues.',
        'instructor': instructors[0],
        'credit_hours': 4,
    },
    {
        'code': 'ENG102',
        'name': 'Academic Writing',
        'description': 'Developing academic writing skills for research papers and essays.',
        'instructor': instructors[1],
        'credit_hours': 3,
    },
]

courses = []
for data in courses_data:
    course, created = Course.objects.get_or_create(
        code=data['code'],
        defaults=data,
    )
    if created:
        print(f"✓ Created course: {course.code} — {course.name}")
    else:
        print(f"· Course {course.code} already exists")
    courses.append(course)

# ─── Define Grade Components ─────────────────────────────────────────────────

components_data = {
    'CS101': [
        {'name': 'Midterm Exam', 'max_score': Decimal('100'), 'weight_percent': Decimal('25'), 'display_order': 1},
        {'name': 'Final Exam', 'max_score': Decimal('100'), 'weight_percent': Decimal('35'), 'display_order': 2},
        {'name': 'Assignments', 'max_score': Decimal('100'), 'weight_percent': Decimal('20'), 'display_order': 3},
        {'name': 'Lab Work', 'max_score': Decimal('50'), 'weight_percent': Decimal('20'), 'display_order': 4},
    ],
    'MATH201': [
        {'name': 'Midterm Exam', 'max_score': Decimal('100'), 'weight_percent': Decimal('30'), 'display_order': 1},
        {'name': 'Final Exam', 'max_score': Decimal('100'), 'weight_percent': Decimal('40'), 'display_order': 2},
        {'name': 'Homework', 'max_score': Decimal('100'), 'weight_percent': Decimal('15'), 'display_order': 3},
        {'name': 'Quizzes', 'max_score': Decimal('50'), 'weight_percent': Decimal('15'), 'display_order': 4},
    ],
    'ENG102': [
        {'name': 'Essay 1', 'max_score': Decimal('100'), 'weight_percent': Decimal('20'), 'display_order': 1},
        {'name': 'Essay 2', 'max_score': Decimal('100'), 'weight_percent': Decimal('20'), 'display_order': 2},
        {'name': 'Final Paper', 'max_score': Decimal('100'), 'weight_percent': Decimal('35'), 'display_order': 3},
        {'name': 'Participation', 'max_score': Decimal('50'), 'weight_percent': Decimal('25'), 'display_order': 4},
    ],
}

for course in courses:
    for comp_data in components_data.get(course.code, []):
        comp, created = GradeComponent.objects.get_or_create(
            course=course,
            name=comp_data['name'],
            defaults=comp_data,
        )
        if created:
            print(f"  ✓ {course.code}: {comp.name} ({comp.weight_percent}%)")

# ─── Enroll Students ─────────────────────────────────────────────────────────

enrollment_map = {
    'CS101': students[:8],
    'MATH201': students[:6],
    'ENG102': students[2:8],
}

for course in courses:
    for student in enrollment_map.get(course.code, []):
        enrollment, created = Enrollment.objects.get_or_create(
            student=student,
            course=course,
        )
        if created:
            print(f"  ✓ Enrolled {student.get_full_name()} in {course.code}")

# ─── Enter Sample Grades & Publish CS101 ─────────────────────────────────────

random.seed(42)  # For reproducible test data

cs101 = courses[0]
cs101_components = list(GradeComponent.objects.filter(course=cs101).order_by('display_order'))
cs101_enrollments = list(Enrollment.objects.filter(course=cs101).select_related('student'))

print("\n--- Entering sample grades for CS101 ---")
for enrollment in cs101_enrollments:
    for component in cs101_components:
        min_pct = 0.55
        max_pct = 0.98
        score = round(float(component.max_score) * random.uniform(min_pct, max_pct), 2)
        score = Decimal(str(score))

        grade, created = StudentGrade.objects.update_or_create(
            enrollment=enrollment,
            component=component,
            defaults={'score': score},
        )
        if created:
            print(f"  ✓ {enrollment.student.get_full_name()} — {component.name}: {score}/{component.max_score}")

# Calculate & Publish results for CS101
try:
    calculate_course_results(cs101.id, instructors[0])
    publish_course_results(cs101.id, instructors[0])
    print("✓ Calculated and published CS101 rankings!")
except Exception as e:
    print(f"· Calculation note: {e}")

print("\n" + "=" * 60)
print("  Seed data complete!")
print("=" * 60)
print("\n--- Test Accounts ---")
print(f"  Admin:       admin / admin123")
print(f"  Instructor:  dr.smith / instructor123")
print(f"  Instructor:  dr.johnson / instructor123")
print("\n--- Student Accounts (Student ID + First Name) ---")
for s in students:
    print(f"  Student:     {s.get_full_name():<16} ID: {s.student_id:<12} First Name: {s.first_name}")
print()
