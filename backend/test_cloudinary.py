import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import cloudinary
import cloudinary.uploader
import cloudinary.api
from decouple import config

print("=" * 60)
print("  Testing Cloudinary Connection & Upload")
print("=" * 60)

cloud_name = config('CLOUDINARY_CLOUD_NAME', default=None)
api_key = config('CLOUDINARY_API_KEY', default=None)
api_secret = config('CLOUDINARY_API_SECRET', default=None)
cloudinary_url = config('CLOUDINARY_URL', default=None)

print(f"Cloud Name: {cloud_name if cloud_name else 'Not Set'}")
print(f"API Key:    {'***' + str(api_key)[-4:] if api_key else 'Not Set'}")
print(f"API Secret: {'[Configured]' if api_secret else 'Not Set'}")

sample_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

try:
    print("\nAttempting test image upload to Cloudinary...")
    upload_result = cloudinary.uploader.upload(
        sample_image,
        folder="gradeportal_test",
        public_id="test_connection_check",
        overwrite=True
    )
    print("[SUCCESS] Upload Completed!")
    print(f"  - Public ID:   {upload_result.get('public_id')}")
    print(f"  - Secure URL:  {upload_result.get('secure_url')}")
    print(f"  - Image Format: {upload_result.get('format')}")
    print(f"  - Dimensions:  {upload_result.get('width')}x{upload_result.get('height')}")

    print("\nCleaning up test asset from Cloudinary...")
    del_res = cloudinary.uploader.destroy(upload_result.get('public_id'))
    print(f"[SUCCESS] Cleaned up asset (Result: {del_res.get('result')})")

    print("\n" + "=" * 60)
    print("  SUCCESS: Cloudinary credentials are 100% valid and working!")
    print("=" * 60)
except Exception as e:
    print("\n" + "=" * 60)
    print(f"  ERROR: Cloudinary failed: {e}")
    print("=" * 60)
