# Mizan (ميزان) - Fintech Budgeting Platform

Mizan is a high-performance, bilingual (Arabic/English) fintech platform designed to help users take control of their financial future. It combines modern expense tracking with AI-powered financial insights.

![Banner](https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6)

## 🚀 Key Features

- **Bilingual Interface**: Seamless support for Arabic (RTL) and English (LTR) layouts.
- **AI Financial Advisor**: Smart analysis of transactions using Gemini 2.0 (via OpenRouter).
- **Custom Categories**: Fully customizable income and expense categories.
- **Secure Authentication**: JWT-based auth with password hashing and email verification flows.
- **Professional Reports**: Export data to CSV or high-quality PDF financial reports.
- **Premium Design**: Glassmorphic UI with smooth animations and responsive layouts (Mobile/Tablet/Desktop).
- **Production Ready**: PostgreSQL support, Alembic migrations, and security hardening (Rate limiting/Secure headers).

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Recharts, Lucide Icons.
- **Backend**: FastAPI (Python), SQLAlchemy, PostgreSQL (SQLite fallback).
- **AI**: OpenRouter (Gemini 2.0 Flash).
- **DevOps**: Docker (Multi-stage), Alembic (Migrations), Railway.

## 📦 Setup & Installation

### Local Development

1. **Clone the repository**:
   ```bash
   git clone <repo-url>
   cd mizan
   ```

2. **Backend Setup**:
   ```bash
   pip install -r requirements.txt
   uvicorn backend_api:app --reload
   ```

3. **Frontend Setup**:
   ```bash
   npm install
   npm run dev
   ```

4. **Environment Variables**:
   Copy `.env.example` to `.env` and fill in your keys (Database, JWT Secret, OpenRouter API Key).

### Production Deployment (Railway)

The platform is optimized for **Railway** deployment using the included multi-stage `Dockerfile`.

1. Connect your GitHub repository to Railway.
2. Add a **PostgreSQL** database service.
3. Configure the following environment variables in Railway:
   - `DATABASE_URL`: Linked to your Postgres service.
   - `JWT_SECRET`: A secure random string.
   - `OPENROUTER_API_KEY`: Your OpenRouter key.
   - `ALLOWED_ORIGINS`: Your production domain.
4. Railway will automatically build the container and run migrations via Alembic.

## 📄 Documentation

- [Deployment Guide](DEPLOYMENT.md): Detailed production steps.
- [Walkthrough](walkthrough.md): Visual guide of features and screenshots.

## ⚖️ License
MIT License.
