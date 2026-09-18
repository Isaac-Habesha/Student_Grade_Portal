from django.test import TestCase
from rest_framework.test import APIClient
from accounts.models import User
from accounts.admin import UserAdminAddForm


class PasswordlessStudentAuthTests(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.instructor = User.objects.create_user(
            username='dr.smith',
            email='smith@test.com',
            password='instructor123',
            role='instructor',
            first_name='John',
            last_name='Smith'
        )

    def test_instructor_creates_student_without_password(self):
        # Authenticate as instructor
        res_login = self.client.post('/api/auth/instructor/login/', {
            'username': 'dr.smith',
            'password': 'instructor123',
        }, format='json')
        self.assertEqual(res_login.status_code, 200)
        token = res_login.data['token']

        # Register student with first name and photo
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {token}')
        res_create = self.client.post('/api/auth/students/', {
            'first_name': 'Samantha',
            'last_name': 'Reed',
            'photo_url': 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        }, format='json')

        self.assertEqual(res_create.status_code, 201)
        self.assertIn('student_id', res_create.data)
        self.assertEqual(res_create.data['first_name'], 'Samantha')
        student_id = res_create.data['student_id']

        # Clear credentials and log in as student using only student_id + first_name
        self.client.credentials()
        res_student_login = self.client.post('/api/auth/student/login/', {
            'student_id': student_id,
            'first_name': 'Samantha',
        }, format='json')

        self.assertEqual(res_student_login.status_code, 200)
        self.assertIn('token', res_student_login.data)
        self.assertEqual(res_student_login.data['user']['role'], 'student')

    def test_admin_form_creates_student_without_password(self):
        form_data = {
            'role': 'student',
            'first_name': 'Lucas',
            'last_name': 'Vance',
            'photo_url': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
            'email': 'lucas@test.com',
            'password1': '',
            'password2': '',
        }
        form = UserAdminAddForm(data=form_data)
        self.assertTrue(form.is_valid(), form.errors)
        student_user = form.save()

        self.assertEqual(student_user.role, 'student')
        self.assertTrue(student_user.student_id.startswith('STU-'))
        self.assertEqual(student_user.first_name, 'Lucas')
        self.assertTrue(student_user.has_usable_password())
