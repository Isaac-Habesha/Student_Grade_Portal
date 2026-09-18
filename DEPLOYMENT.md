# 🚀 Deployment Guide — Student Grade Portal

This guide provides step-by-step instructions to deploy the Student Grade Portal (Django Backend + PostgreSQL + Cloudinary + React Vite Frontend) to production.

---

## 1. Cloudinary Setup (For Student Photos)

1. Sign up for a free account at [Cloudinary](https://cloudinary.com/).
2. In your Cloudinary Dashboard, copy your:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   *(or the combined `CLOUDINARY_URL`)*
3. Add these as Environment Variables on your backend deployment service.

---

## 2. Option A: 1-Click Full-Stack Deployment on Render (Recommended)

Render can deploy the **PostgreSQL Database**, **Django Backend**, and **React Frontend** together using the included `render.yaml` Blueprint.

### Steps:
1. Push this repository to GitHub or GitLab.
2. Log in to [Render](https://dashboard.render.com/).
3. Click **New +** → **Blueprint**.
4. Connect your GitHub repository containing this project.
5. Render will detect `render.yaml` and configure:
   - **PostgreSQL Database** (`gradeportal-db`)
   - **Backend Web Service** (`gradeportal-backend` via Gunicorn & WhiteNoise)
   - **Frontend Static Site** (`gradeportal-frontend` via Vite build)
6. Fill in your Cloudinary keys under the backend environment variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
7. Click **Apply**. Render will automatically build and deploy both services!

---

## 3. Option B: Split Deployment (Backend on Render/Railway, Frontend on Vercel)

### Deploy Backend (Render / Railway):
1. **Root Directory**: `backend`
2. **Build Command**: `./build.sh` (or `pip install -r requirements.txt && python manage.py collectstatic --no-input && python manage.py migrate`)
3. **Start Command**: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`
4. **Environment Variables**:
   - `SECRET_KEY`: *(Generate a secure random string)*
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `*` (or your domain)
   - `CORS_ALLOW_ALL_ORIGINS`: `True` (or your frontend domain URL)
   - `DATABASE_URL`: *(Your PostgreSQL connection string)*
   - `CLOUDINARY_CLOUD_NAME`: *(Your Cloudinary cloud name)*
   - `CLOUDINARY_API_KEY`: *(Your Cloudinary API key)*
   - `CLOUDINARY_API_SECRET`: *(Your Cloudinary API secret)*

### Deploy Frontend (Vercel):
1. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
2. Select your repository.
3. Set **Root Directory** to `frontend`.
4. Framework Preset: **Vite**.
5. Add Environment Variable:
   - `VITE_API_URL`: `https://your-backend-url.onrender.com`
6. Click **Deploy**.

---

## 4. Default Seed Accounts for Testing

After deployment, the seed script provides ready-to-use accounts:

| Role | Username / ID | Password / Login Key |
|---|---|---|
| **Instructor / Admin** | `admin` | `admin123` |
| **Instructor** | `dr.smith` | `instructor123` |
| **Student** | `STU-260001` | First Name: `Alice` |
| **Student** | `STU-260002` | First Name: `Bob` |
| **Student** | `STU-260003` | First Name: `Charlie` |

> 💡 **Passwordless Student Access:** Students sign in at `/login` using their **Student ID** and registered **First Name** (no password required).
