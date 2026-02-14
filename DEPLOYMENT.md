# Deployment Instructions - Mizan Platform

This guide covers how to deploy the Mizan platform to **Railway**, as requested.

## Prerequisites
- A GitHub repository with the Mizan source code.
- A [Railway.app](https://railway.app) account.

## Option 1: Automatic Deployment (Recommended)

1.  **Push to GitHub**: Initialize a git repository and push your code to GitHub.
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    git remote add origin <your-repo-url>
    git push -u origin main
    ```
2.  **Connect to Railway**:
    - Go to Railway and click "New Project" -> "Deploy from GitHub repo".
    - Select your Mizan repository.
3.  **Add Variables**:
    - In the Railway project settings, add the variables from `.env.example`:
        - `SECRET_KEY`: (generate a random string)
        - `OPENROUTER_API_KEY`: (your API key)
        - `VITE_API_BASE_URL`: (the URL of your backend service)

## Option 2: Docker Deployment

Mizan includes a `Dockerfile` (to be created) for containerized deployment.

### Backend Dockerfile
Create a `Dockerfile.backend`:
```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "backend_api:app", "--host", "0.0.0.0", "--port", "8080"]
```

### Frontend Dockerfile
Create a `Dockerfile.frontend`:
```dockerfile
FROM node:18-slim
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Database Note
Currently, Mizan uses SQLite for simplicity. For production, it is recommended to switch `SQLALCHEMY_DATABASE_URL` to a PostgreSQL instance provided by Railway.
