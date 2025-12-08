# Medical System - Руководство по развёртыванию и тестированию

## Быстрый старт (Development)

### Предварительные требования

- Python 3.11+
- Node.js 18+
- npm или yarn
- Git

### 1. Клонирование проекта

```bash
git clone <repository-url>
cd medical-system-project
```

### 2. Запуск Backend

```bash
cd backend

# Создать виртуальное окружение
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# или venv\Scripts\activate для Windows

# Установить зависимости
pip install -r requirements.txt

# Настроить .env файл
cp .env.example .env
# Отредактируйте .env и добавьте OPENAI_API_KEY

# Запустить сервер
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend будет доступен на `http://localhost:8000`
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 3. Запуск Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Запустить dev сервер
ng serve
```

Frontend будет доступен на `http://localhost:4200`

## Тестирование API

### 1. Регистрация пользователя

**Endpoint**: `POST /auth/register`

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "patient1",
    "email": "patient1@example.com",
    "password": "password123",
    "role": "patient"
  }'
```

Роли: `patient`, `doctor`, `admin`

### 2. Вход в систему

**Endpoint**: `POST /auth/login`

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=patient1&password=password123"
```

Ответ:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 1,
    "username": "patient1",
    "email": "patient1@example.com",
    "role": "patient"
  }
}
```

Сохраните `access_token` для дальнейших запросов.

### 3. Получение информации о пользователе

**Endpoint**: `GET /auth/me`

```bash
curl -X GET http://localhost:8000/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Тестирование AI Chat

**Создание сессии чата**:
```bash
curl -X POST http://localhost:8000/ai-chat/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Консультация по симптомам"}'
```

**Отправка сообщения**:
```bash
curl -X POST http://localhost:8000/ai-chat/message \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID_FROM_PREVIOUS_RESPONSE",
    "content": "У меня болит голова и температура 37.5. Что это может быть?"
  }'
```

**Получение истории чата**:
```bash
curl -X GET http://localhost:8000/ai-chat/sessions/SESSION_ID \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Создание приёма

**Endpoint**: `POST /appointments`

```bash
curl -X POST http://localhost:8000/appointments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "doctor_id": 1,
    "appointment_date": "2024-12-15",
    "appointment_time": "10:00",
    "appointment_type": "Плановый осмотр",
    "status": "scheduled"
  }'
```

### 6. Получение статистики

**Endpoint**: `GET /dashboard/stats`

```bash
curl -X GET http://localhost:8000/dashboard/stats \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Создание тестовых данных

### Скрипт для создания тестовых пользователей

Создайте файл `backend/seed_data.py`:

```python
from database import SessionLocal
from models import User, Patient, Doctor, Clinic
from utils.security import get_password_hash
from datetime import date

db = SessionLocal()

# Создать админа
admin_user = User(
    username="admin",
    email="admin@medical.com",
    hashed_password=get_password_hash("admin123"),
    role="admin",
    is_active=True
)
db.add(admin_user)

# Создать врача
doctor_user = User(
    username="doctor1",
    email="doctor1@medical.com",
    hashed_password=get_password_hash("doctor123"),
    role="doctor",
    is_active=True
)
db.add(doctor_user)
db.commit()
db.refresh(doctor_user)

doctor = Doctor(
    user_id=doctor_user.id,
    name="Елена Смирнова",
    specialization="Терапевт",
    phone="+7 (912) 345-67-89",
    license_number="MD12345",
    years_of_experience=10,
    consultation_fee=2000.00
)
db.add(doctor)

# Создать пациента
patient_user = User(
    username="patient1",
    email="patient1@medical.com",
    hashed_password=get_password_hash("patient123"),
    role="patient",
    is_active=True
)
db.add(patient_user)
db.commit()
db.refresh(patient_user)

patient = Patient(
    user_id=patient_user.id,
    name="Иван Петров",
    phone="+7 (912) 345-67-89",
    date_of_birth=date(1990, 5, 15),
    address="г. Москва, ул. Ленина, д. 10, кв. 25",
    blood_type="A+"
)
db.add(patient)

# Создать клинику
clinic = Clinic(
    name="Городская поликлиника №1",
    address="г. Москва, ул. Пушкина, д. 5",
    phone="+7 (495) 123-45-67",
    email="clinic1@medical.com",
    working_hours="Пн-Пт: 8:00-20:00, Сб: 9:00-15:00"
)
db.add(clinic)

db.commit()
print("Тестовые данные созданы!")
```

Запустить:
```bash
cd backend
python seed_data.py
```

## Production развёртывание

### Docker Compose

Создайте `docker-compose.yml`:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    container_name: medical-backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://medical:password@db:5432/medical_db
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db
    volumes:
      - ./backend:/app
    command: uvicorn main:app --host 0.0.0.0 --port 8000

  frontend:
    build: ./frontend
    container_name: medical-frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    volumes:
      - ./frontend/dist:/usr/share/nginx/html

  db:
    image: postgres:15
    container_name: medical-db
    environment:
      - POSTGRES_DB=medical_db
      - POSTGRES_USER=medical
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

volumes:
  postgres_data:
```

### Backend Dockerfile

`backend/Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend Dockerfile

`frontend/Dockerfile`:

```dockerfile
FROM node:18 as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build --prod

FROM nginx:alpine

COPY --from=build /app/dist/medical-system-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Nginx конфигурация

`frontend/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }

        location /api {
            proxy_pass http://backend:8000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
    }
}
```

### Запуск с Docker Compose

```bash
# Создать .env файл
echo "OPENAI_API_KEY=your-key-here" > .env
echo "SECRET_KEY=your-secret-key" >> .env

# Запустить все сервисы
docker-compose up -d

# Просмотр логов
docker-compose logs -f

# Остановить
docker-compose down
```

## Мониторинг и логирование

### Проверка здоровья сервисов

```bash
# Backend health check
curl http://localhost:8000/health

# Проверка базы данных
docker exec medical-db psql -U medical -d medical_db -c "SELECT COUNT(*) FROM users;"
```

### Логи

```bash
# Backend логи
docker logs medical-backend

# Frontend логи
docker logs medical-frontend

# Database логи
docker logs medical-db
```

## Безопасность в Production

1. **Изменить SECRET_KEY** в `.env` на случайную строку:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

2. **Использовать HTTPS** (Let's Encrypt):
```bash
certbot --nginx -d your-domain.com
```

3. **Настроить CORS** только для разрешённых доменов в `backend/config.py`

4. **Использовать PostgreSQL** вместо SQLite

5. **Настроить rate limiting** для API endpoints

6. **Регулярные бэкапы базы данных**:
```bash
docker exec medical-db pg_dump -U medical medical_db > backup.sql
```

## Troubleshooting

### Backend не запускается

```bash
# Проверить логи
docker logs medical-backend

# Проверить переменные окружения
docker exec medical-backend env | grep OPENAI

# Пересоздать контейнер
docker-compose up -d --force-recreate backend
```

### Frontend не подключается к Backend

1. Проверить `environment.ts` - правильный ли `apiUrl`
2. Проверить CORS настройки в backend
3. Проверить что backend запущен: `curl http://localhost:8000/health`

### AI Chat не работает

1. Проверить OPENAI_API_KEY:
```bash
docker exec medical-backend printenv OPENAI_API_KEY
```

2. Проверить логи:
```bash
docker logs medical-backend | grep -i openai
```

3. Тестировать напрямую через API:
```bash
curl -X POST http://localhost:8000/ai-chat/message \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Привет"}'
```

## Обновление приложения

```bash
# Остановить сервисы
docker-compose down

# Обновить код
git pull

# Пересобрать и запустить
docker-compose up -d --build

# Применить миграции БД (если есть)
docker exec medical-backend alembic upgrade head
```

## Бэкап и восстановление

### Бэкап

```bash
# База данных
docker exec medical-db pg_dump -U medical medical_db > backup_$(date +%Y%m%d).sql

# Файлы приложения
tar -czf medical-system-backup.tar.gz ./medical-system-project
```

### Восстановление

```bash
# Восстановить БД
docker exec -i medical-db psql -U medical medical_db < backup_20241130.sql

# Восстановить файлы
tar -xzf medical-system-backup.tar.gz
```

## Производительность

### Оптимизация Backend

1. Использовать Gunicorn с несколькими workers:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

2. Настроить connection pooling для БД

3. Добавить Redis для кэширования

### Оптимизация Frontend

1. Build с production флагом:
```bash
ng build --configuration production --optimization --build-optimizer
```

2. Включить gzip в Nginx

3. Настроить кэширование статических файлов

## Мониторинг

Рекомендуемые инструменты:
- **Prometheus** + **Grafana** - метрики
- **ELK Stack** - логирование
- **Sentry** - отслеживание ошибок
- **Uptime Robot** - мониторинг доступности
