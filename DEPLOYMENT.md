# Production Deployment Guide - Mizan Platform

This guide covers the specialized production setup for **Railway**, including PostgreSQL integration and security hardening.

## Prerequisites
- A GitHub repository with the Mizan source code.
- A [Railway.app](https://railway.app) account with a PostgreSQL service added.

## Deployment Steps

1.  **Repository Setup**:
    - Ensure your code is pushed to your GitHub repository.
    - Railway will automatically detect the `Dockerfile` at the root.

2.  **Railway Configuration**:
    - In your Railway project, click **"New" -> "Database" -> "Add PostgreSQL"**.
    - Click on the Mizan service -> **"Variables"** -> **"New Variable"** -> **"Reference Variable"**.
    - Link `DATABASE_URL` to the `DATABASE_URL` of your Postgres service.

3.  **Required Variables**:
    Add the following in Railway Settings:
    - `ENV`: `production`
    - `JWT_SECRET`: A long random string (e.g., `openssl rand -hex 32`)
    - `OPENROUTER_API_KEY`: Your OpenRouter key.
    - `PORT`: `8080` (Railway often sets this automatically).

4.  **Database Migrations**:
    The Dockerfile is configured to run `alembic upgrade head` automatically on startup. No manual action is required.

5.  **Entrypoint Verification**:
    The backend entrypoint is explicitly `backend_api:app`, and it serves the frontend static files from the `/dist` directory.

## Security Features
- **Rate Limiting**: The `/login` endpoint is limited to 5 requests per minute per IP.
- **Postgres SSL**: Supported by default through `psycopg2-binary`.
- **CORS**: Restricted via the `ALLOWED_ORIGINS` environment variable.

## Live Demo
Once you deploy, Railway will provide a public URL (e.g., `mizan-production.up.railway.app`). This becomes your live demo link.
