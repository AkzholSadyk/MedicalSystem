# Medical System 🏥

Комплексная медицинская информационная система с AI ассистентом для управления пациентами, врачами, приёмами и медицинскими записями.

## 📋 Описание

Medical System - это современное веб-приложение для медицинских учреждений, которое включает:

- **Управление пациентами** - регистрация, профили, история болезни
- **Управление врачами** - профили, специализации, расписание
- **Система приёмов** - запись на приём, управление расписанием
- **Медицинские записи** - диагнозы, лечение, рецепты
- **AI Chat** - интеллектуальный медицинский ассистент для консультаций
- **Панели управления** - статистика и аналитика для разных ролей
- **Управление клиниками** - информация о клиниках и отделах

## 🎨 Дизайн

Интерфейс разработан на основе предоставленных Figma макетов с современным и интуитивным дизайном:

- Отдельные интерфейсы для пациентов и врачей
- Боковая навигация с иконками
- Карточки для статистики
- Цветовая индикация статусов
- Адаптивный дизайн

## 🏗️ Архитектура

### Backend (FastAPI)
- **Язык**: Python 3.11+
- **Фреймворк**: FastAPI
- **База данных**: SQLite (dev) / PostgreSQL (prod)
- **ORM**: SQLAlchemy
- **Аутентификация**: JWT
- **AI Integration**: OpenAI API

### Frontend (Angular)
- **Фреймворк**: Angular 17
- **Язык**: TypeScript
- **Стили**: CSS3
- **HTTP Client**: RxJS

### База данных
10 таблиц с полными связями:
- Users (пользователи)
- Patients (пациенты)
- Doctors (врачи)
- Clinics (клиники)
- Departments (отделы)
- Appointments (приёмы)
- Medical Records (медицинские записи)
- Doctor-Clinics (связь врачей и клиник)
- AI Chat Sessions (сессии чата)
- AI Chat Messages (сообщения чата)

## 🚀 Быстрый старт

### Предварительные требования

- Python 3.11+
- Node.js 18+
- npm или yarn
- Git

### 1. Клонирование репозитория

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

# Установить зависимости
pip install -r requirements.txt

# Настроить .env
cp .env.example .env
# Добавьте OPENAI_API_KEY в .env

# Запустить сервер
uvicorn main:app --reload
```

Backend: http://localhost:8000
API Docs: http://localhost:8000/docs

### 3. Запуск Frontend

```bash
cd frontend

# Установить зависимости
npm install

# Запустить dev сервер
ng serve
```

Frontend: http://localhost:4200

## 📚 Документация

- [Backend README](backend/README.md) - подробная документация по backend
- [Frontend README](frontend/README.md) - подробная документация по frontend
- [Database Schema](DATABASE_SCHEMA.md) - схема базы данных
- [Architecture](ARCHITECTURE.md) - архитектура системы
- [Deployment Guide](DEPLOYMENT_GUIDE.md) - руководство по развёртыванию
- [Project Analysis](PROJECT_ANALYSIS.md) - анализ требований

## 🔑 Основные функции

### Для пациентов
- ✅ Регистрация и вход в систему
- ✅ Просмотр личного профиля
- ✅ Запись на приём к врачу
- ✅ Просмотр истории приёмов
- ✅ Просмотр медицинских записей
- ✅ Поиск врачей по специализации
- ✅ AI чат для консультаций
- ✅ Панель управления со статистикой

### Для врачей
- ✅ Управление профилем
- ✅ Просмотр списка пациентов
- ✅ Управление приёмами
- ✅ Создание медицинских записей
- ✅ Просмотр расписания
- ✅ AI чат для консультаций
- ✅ Панель управления со статистикой
- ✅ Управление клиниками и отделами

### Для администраторов
- ✅ Полный доступ ко всем данным
- ✅ Управление пользователями
- ✅ Управление врачами и пациентами
- ✅ Управление клиниками
- ✅ Общая статистика системы

## 🤖 AI Chat

AI ассистент использует OpenAI API для:
- Ответов на общие медицинские вопросы
- Предварительного анализа симптомов
- Рекомендаций по записи к специалисту
- Объяснения медицинской терминологии

**Важно**: AI не ставит диагнозы и не заменяет профессиональную медицинскую консультацию!

Доступные модели:
- `gpt-4.1-mini` (по умолчанию)
- `gpt-4.1-nano` (быстрее)
- `gemini-2.5-flash` (альтернатива)

## 📊 API Endpoints

### Authentication
- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход
- `GET /auth/me` - Текущий пользователь

### Patients
- `GET /patients` - Список пациентов
- `POST /patients` - Создать пациента
- `PUT /patients/{id}` - Обновить пациента
- `DELETE /patients/{id}` - Удалить пациента

### Doctors
- `GET /doctors` - Список врачей
- `GET /doctors?specialization=...` - Фильтр по специализации

### Appointments
- `GET /appointments` - Список приёмов
- `GET /appointments/upcoming` - Предстоящие приёмы
- `POST /appointments` - Создать приём
- `PATCH /appointments/{id}/status` - Изменить статус

### Medical Records
- `GET /medical-records` - Список записей
- `POST /medical-records` - Создать запись
- `PUT /medical-records/{id}` - Обновить запись

### Dashboard
- `GET /dashboard/stats` - Статистика
- `GET /dashboard/patient-stats` - Статистика пациента
- `GET /dashboard/doctor-stats` - Статистика врача

### AI Chat
- `POST /ai-chat/message` - Отправить сообщение
- `GET /ai-chat/sessions` - Список сессий
- `POST /ai-chat/sessions` - Создать сессию
- `DELETE /ai-chat/sessions/{id}` - Удалить сессию

## 🔒 Безопасность

- **Хеширование паролей** - bcrypt
- **JWT токены** - для аутентификации
- **RBAC** - контроль доступа на основе ролей
- **CORS** - настроенные разрешённые origins
- **Input validation** - Pydantic схемы
- **SQL Injection protection** - SQLAlchemy ORM

## 🐳 Docker

Запуск с Docker Compose:

```bash
# Создать .env файл
echo "OPENAI_API_KEY=your-key" > .env

# Запустить все сервисы
docker-compose up -d

# Просмотр логов
docker-compose logs -f
```

## 🧪 Тестирование

### Backend тесты

```bash
cd backend
pytest
```

### Frontend тесты

```bash
cd frontend
ng test
```

### API тестирование

Используйте Swagger UI: http://localhost:8000/docs

Или curl:
```bash
# Регистрация
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123","role":"patient"}'

# Вход
curl -X POST http://localhost:8000/auth/login \
  -d "username=test&password=test123"
```

## 📈 Статус разработки

- ✅ Backend API (100%)
- ✅ Database models (100%)
- ✅ Authentication (100%)
- ✅ AI Chat integration (100%)
- ✅ API documentation (100%)
- 🚧 Frontend components (структура готова)
- 🚧 UI implementation (требуется Angular разработка)
- 📝 Testing (требуется)
- 📝 Deployment (Docker готов)

## 🤝 Роли пользователей

| Роль | Описание | Возможности |
|------|----------|-------------|
| **patient** | Пациент | Просмотр своих данных, запись на приём, AI чат |
| **doctor** | Врач | Управление пациентами, создание записей, AI чат |
| **admin** | Администратор | Полный доступ ко всем функциям системы |

## 📝 Создание тестовых данных

```bash
cd backend
python seed_data.py
```

Тестовые пользователи:
- **Admin**: username: `admin`, password: `admin123`
- **Doctor**: username: `doctor1`, password: `doctor123`
- **Patient**: username: `patient1`, password: `patient123`

## 🛠️ Технологии

### Backend
- FastAPI 0.104+
- SQLAlchemy 2.0+
- Pydantic 2.5+
- Python-Jose (JWT)
- Passlib (bcrypt)
- OpenAI 1.3+
- Uvicorn

### Frontend
- Angular 17
- TypeScript 5.2+
- RxJS 7.8+
- CSS3

### Database
- SQLite (development)
- PostgreSQL 15+ (production)

### DevOps
- Docker
- Docker Compose
- Nginx

## 📞 Поддержка

Для вопросов и предложений создайте issue в репозитории.

## 📄 Лицензия

MIT License

## 👥 Авторы

Medical System Team

---

**Версия**: 1.0.0  
**Последнее обновление**: 30 ноября 2024
