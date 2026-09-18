#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "=== Installing Python dependencies ==="
pip install --upgrade pip
pip install -r requirements.txt

echo "=== Collecting Static Files ==="
python manage.py collectstatic --no-input

echo "=== Running Database Migrations ==="
python manage.py migrate

echo "=== Seeding Sample Data (Optional) ==="
python seed_data.py || true

echo "=== Build Complete ==="
