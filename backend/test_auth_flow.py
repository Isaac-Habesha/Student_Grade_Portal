import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from rest_framework.test import APIClient
from accounts.models import User

client = APIClient()

print("--- Testing Student Passwordless Login (ID + Nickname) ---")
res = client.post('/api/auth/student/login/', {
    'student_id': 'STU-260001',
    'nickname': 'Ace',
}, format='json')
print("Student login status:", res.status_code)
assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.data}"
print("Student auth token:", res.data.get('token'))
print("Student user role:", res.data.get('user', {}).get('role'))
print("Student nickname:", res.data.get('user', {}).get('nickname'))

print("\n--- Testing Student Case-Insensitive Nickname ---")
res_case = client.post('/api/auth/student/login/', {
    'student_id': 'stu-260001',
    'nickname': 'ace',
}, format='json')
print("Case-insensitive login status:", res_case.status_code)
assert res_case.status_code == 200, f"Expected 200, got {res_case.status_code}: {res_case.data}"

print("\n--- Testing Invalid Student Nickname ---")
res_invalid = client.post('/api/auth/student/login/', {
    'student_id': 'STU-260001',
    'nickname': 'WrongNick',
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
res_create = client.post('/api/accounts/students/', {
    'first_name': 'TestMaya',
    'last_name': 'TestLin',
    'nickname': 'MayaStar',
}, format='json')
print("Create student status:", res_create.status_code)
assert res_create.status_code == 201, f"Expected 201, got {res_create.status_code}: {res_create.data}"
new_student_id = res_create.data['student_id']
print(f"Created student ID: {new_student_id}, Nickname: {res_create.data['nickname']}")

# Verify newly created student can immediately log in
client.credentials() # clear instructor credentials
res_new_login = client.post('/api/auth/student/login/', {
    'student_id': new_student_id,
    'nickname': 'MayaStar',
}, format='json')
print("New student login status:", res_new_login.status_code)
assert res_new_login.status_code == 200, f"Expected 200, got {res_new_login.status_code}: {res_new_login.data}"

print("\n ALL AUTH FLOW TESTS PASSED SUCCESSFULLY! ")
