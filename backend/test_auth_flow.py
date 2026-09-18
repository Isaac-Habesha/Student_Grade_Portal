import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from accounts.models import User

client = APIClient()

print("--- Testing Student Passwordless Login (ID + First Name) ---")
res = client.post('/api/auth/student/login/', {
    'student_id': 'STU-260001',
    'first_name': 'Alice',
}, format='json')
print("Student login status:", res.status_code)
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.data}"
print("Student auth token:", res.data.get('token'))
print("Student user role:", res.data.get('user', {}).get('role'))
print("Student photo:", res.data.get('user', {}).get('photo_url'))

print("\n--- Testing Student Case-Insensitive First Name ---")
res_case = client.post('/api/auth/student/login/', {
    'student_id': 'stu-260001',
    'first_name': 'alice',
}, format='json')
print("Case-insensitive login status:", res_case.status_code)
assert res_case.status_code == 200, f"Expected 200, got {res_case.status_code}: {res_case.data}"

print("\n--- Testing Invalid Student First Name ---")
res_invalid = client.post('/api/auth/student/login/', {
    'student_id': 'STU-260001',
    'first_name': 'WrongName',
}, format='json')
print("Invalid login status:", res_invalid.status_code)
assert res_invalid.status_code == 400, f"Expected 400, got {res_invalid.status_code}"

print("\n--- Testing Instructor Login Endpoint ---")
res_inst = client.post('/api/auth/instructor/login/', {
    'username': 'dr.smith',
    'password': 'instructor123',
}, format='json')
print("Instructor login status:", res_inst.status_code)
assert res_inst.status_code == 200, f"Expected 200, got {res_inst.status_code}: {res_inst.data}"

print("\n--- Testing Passwordless Student Registration by Instructor ---")
token = res_inst.data['token']
client.credentials(HTTP_AUTHORIZATION='Token ' + token)
res_create = client.post('/api/auth/students/', {
    'first_name': 'Maya',
    'last_name': 'Lin',
    'photo_url': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
}, format='json')
print("Create student status:", res_create.status_code)
assert res_create.status_code == 201, f"Expected 201, got {res_create.status_code}: {res_create.data}"
new_student_id = res_create.data['student_id']
print(f"Created student ID: {new_student_id}, Photo: {res_create.data['photo_url']}")

# Verify newly created student can immediately log in with First Name + ID
client.credentials() # clear instructor credentials
res_new_login = client.post('/api/auth/student/login/', {
    'student_id': new_student_id,
    'first_name': 'Maya',
}, format='json')
print("New student login status:", res_new_login.status_code)
assert res_new_login.status_code == 200, f"Expected 200, got {res_new_login.status_code}: {res_new_login.data}"

print("\n ALL AUTH FLOW TESTS PASSED SUCCESSFULLY! ")
