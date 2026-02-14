# Build Stage for Frontend
FROM node:18-slim AS frontend-build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Final Stage for Backend + Frontend
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies for psycopg2
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy built frontend from stage 1
COPY --from=frontend-build /app/dist ./dist

# Copy backend code
COPY . .

# Environment Variables
ENV ENV=production
ENV PORT=8080

EXPOSE 8080

# Start script: Run migrations then start the server
CMD alembic upgrade head && uvicorn backend_api:app --host 0.0.0.0 --port $PORT
