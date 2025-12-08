# Medical System Backend

FastAPI backend для Medical System с интеграцией AI чата.

## Технологии

- **FastAPI** - современный веб-фреймворк для Python
- **SQLAlchemy** - ORM для работы с базой данных
- **Pydantic** - валидация данных
- **JWT** - аутентификация
- **OpenAI API** - AI чат интеграция
- **SQLite/PostgreSQL** - база данных

## Установка

### 1. Создать виртуальное окружение

```bash
python3 -m venv venv
source venv/bin/activate  # Mac

```

### 2. Установить зависимости

```bash
pip install -r requirements.txt
```

### 3. Настроить переменные окружения

Скопируйте `.env.example` в `.env` и настройте:

```bash
cp .env.example .env
```

Отредактируйте `.env` файл:
- `OPENAI_API_KEY` - ваш OpenAI API ключ (уже настроен в системе)
- `SECRET_KEY` - секретный ключ для JWT (сгенерируйте новый для production)
- `DATABASE_URL` - URL базы данных

### 4. Запустить сервер

```bash
# Development режим с auto-reload
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Или через Python
python main.py
```

Сервер будет доступен на `http://localhost:8000`

## API Документация

После запуска сервера:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## Структура проекта

```
backend/
├── main.py                 # Точка входа
├── config.py               # Конфигурация
├── database.py             # Настройка БД
├── models.py               # SQLAlchemy модели
├── schemas.py              # Pydantic схемы
├── dependencies.py         # FastAPI зависимости
├── requirements.txt        # Python зависимости
│
├── routers/                # API endpoints
│   ├── auth_router.py
│   ├── patients_router.py
│   ├── doctors_router.py
│   ├── appointments_router.py
│   ├── medical_records_router.py
│   ├── dashboard_router.py
│   └── ai_chat_router.py
│
├── services/               # Бизнес-логика
│   └── ai_service.py
│
└── utils/                  # Утилиты
    └── security.py
```

## API Endpoints

### Authentication
- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход
- `GET /auth/me` - Текущий пользователь

### Patients
- `GET /patients` - Список пациентов
- `GET /patients/me` - Мой профиль
- `GET /patients/{id}` - Пациент по ID
- `POST /patients` - Создать пациента
- `PUT /patients/{id}` - Обновить пациента
- `DELETE /patients/{id}` - Удалить пациента

### Doctors
- `GET /doctors` - Список врачей
- `GET /doctors/me` - Мой профиль
- `GET /doctors/{id}` - Врач по ID
- `POST /doctors` - Создать врача
- `PUT /doctors/{id}` - Обновить врача

### Appointments
- `GET /appointments` - Список приёмов
- `GET /appointments/upcoming` - Предстоящие приёмы
- `GET /appointments/{id}` - Приём по ID
- `POST /appointments` - Создать приём
- `PUT /appointments/{id}` - Обновить приём
- `PATCH /appointments/{id}/status` - Изменить статус
- `DELETE /appointments/{id}` - Отменить приём

### Medical Records
- `GET /medical-records` - Список записей
- `GET /medical-records/patient/{id}` - Записи пациента
- `GET /medical-records/{id}` - Запись по ID
- `POST /medical-records` - Создать запись
- `PUT /medical-records/{id}` - Обновить запись
- `DELETE /medical-records/{id}` - Удалить запись

### Dashboard
- `GET /dashboard/stats` - Общая статистика
- `GET /dashboard/patient-stats` - Статистика пациента
- `GET /dashboard/doctor-stats` - Статистика врача

### AI Chat
- `POST /ai-chat/message` - Отправить сообщение
- `GET /ai-chat/sessions` - Список сессий
- `GET /ai-chat/sessions/{id}` - Сессия с сообщениями
- `POST /ai-chat/sessions` - Создать сессию
- `DELETE /ai-chat/sessions/{id}` - Удалить сессию

## Роли пользователей

- **patient** - Пациент (может просматривать свои данные, записываться на приём)
- **doctor** - Врач (может управлять пациентами, создавать медицинские записи)
- **admin** - Администратор (полный доступ ко всем данным)

## Безопасность

- Пароли хешируются с помощью bcrypt
- JWT токены для аутентификации
- Role-based access control (RBAC)
- CORS настроен для разрешённых origins
- Input validation через Pydantic

## База данных

### SQLite (по умолчанию)
Файл `medical.db` создаётся автоматически при первом запуске.

### PostgreSQL (для production)
Измените `DATABASE_URL` в `.env`:
```
DATABASE_URL=postgresql://user:password@localhost/medical_db
```

## AI Chat

AI чат использует OpenAI API с моделями:
- `gpt-4.1-mini` (по умолчанию)
- `gpt-4.1-nano` (более быстрая)
- `gemini-2.5-flash` (альтернатива)

Функции:
- Ответы на медицинские вопросы
- Предварительный анализ симптомов
- Рекомендации по записи к специалисту
- История чата для каждого пользователя

**Важно**: AI не ставит диагнозы и не заменяет врача!

## Разработка

### Создание миграций (если используете Alembic)

```bash
alembic revision --autogenerate -m "Description"
alembic upgrade head
```

### Тестирование

```bash
pytest
```

## Production

Для production используйте:
- Gunicorn + Uvicorn workers
- PostgreSQL вместо SQLite
- HTTPS (SSL сертификаты)
- Сильный SECRET_KEY
- Rate limiting
- Логирование

Пример запуска с Gunicorn:
```bash
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```
