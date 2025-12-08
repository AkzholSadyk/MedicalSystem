# Medical System - Быстрый старт 🚀

## Минимальные требования

- Python 3.11+
- Node.js 18+ (для frontend)
- 2GB RAM
- 1GB свободного места на диске

## Запуск за 5 минут

### Шаг 1: Распаковать проект

```bash
tar -xzf medical-system-complete.tar.gz
cd medical-system-project
```

### Шаг 2: Запустить Backend

```bash
cd backend

# Создать виртуальное окружение
python3 -m venv venv

# Активировать (Linux/Mac)
source venv/bin/activate

# Активировать (Windows)
# venv\Scripts\activate

# Установить зависимости
pip install -r requirements.txt

# Создать тестовые данные
python seed_data.py

# Запустить сервер
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

✅ Backend запущен на http://localhost:8000

### Шаг 3: Открыть API документацию

Откройте в браузере:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Шаг 4: Протестировать API

Используйте тестовых пользователей:

**Пациент:**
- Username: `ivan_petrov`
- Password: `patient123`

**Врач:**
- Username: `elena_smirnova`
- Password: `doctor123`

**Админ:**
- Username: `admin`
- Password: `admin123`

## Настройка AI Chat (опционально)

Если у вас есть OpenAI API ключ:

1. Создайте файл `.env` в папке `backend`:
```bash
cp .env.example .env
```

2. Отредактируйте `.env` и добавьте ваш ключ:
```
OPENAI_API_KEY=sk-your-key-here
```

3. Перезапустите сервер

**Примечание:** В sandbox окружении OpenAI API уже настроен через переменные окружения!

## Запуск Frontend (когда будет готов)

```bash
cd frontend

# Установить зависимости
npm install

# Запустить dev сервер
ng serve
```

Frontend будет доступен на http://localhost:4200

## Запуск с Docker

Если у вас установлен Docker:

```bash
# Создать .env файл
echo "OPENAI_API_KEY=your-key" > .env
echo "SECRET_KEY=$(openssl rand -hex 32)" >> .env

# Запустить все сервисы
docker-compose up -d

# Просмотр логов
docker-compose logs -f
```

Backend: http://localhost:8000
Frontend: http://localhost:80

## Проверка работы

### 1. Проверить здоровье API

```bash
curl http://localhost:8000/health
```

Ответ:
```json
{"status":"healthy","app":"Medical System API","version":"1.0.0"}
```

### 2. Войти в систему

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=ivan_petrov&password=patient123"
```

### 3. Получить список врачей

```bash
curl http://localhost:8000/doctors
```

## Что дальше?

1. **Изучите документацию:**
   - `README.md` - общее описание
   - `backend/README.md` - документация backend
   - `TESTING_GUIDE.md` - руководство по тестированию
   - `DEPLOYMENT_GUIDE.md` - развёртывание в production

2. **Протестируйте API:**
   - Откройте http://localhost:8000/docs
   - Авторизуйтесь через кнопку "Authorize"
   - Попробуйте разные endpoints

3. **Разработайте Frontend:**
   - Используйте Figma дизайн из `figma/` папки
   - Следуйте структуре из `frontend/README.md`
   - Подключитесь к API через `http://localhost:8000`

4. **Настройте AI Chat:**
   - Добавьте OPENAI_API_KEY
   - Протестируйте через `/ai-chat/` endpoints

## Помощь и поддержка

### Проблемы при запуске?

**Backend не запускается:**
```bash
# Проверьте версию Python
python3 --version  # Должна быть 3.11+

# Проверьте виртуальное окружение
which python  # Должен указывать на venv

# Переустановите зависимости
pip install --force-reinstall -r requirements.txt
```

**Ошибка импорта модулей:**
```bash
# Убедитесь что venv активирован
source venv/bin/activate

# Проверьте установленные пакеты
pip list
```

**База данных не создаётся:**
```bash
# Удалите старую БД
rm medical.db

# Запустите seed_data.py снова
python seed_data.py
```

### Полезные команды

```bash
# Просмотр логов сервера
tail -f server.log

# Остановить сервер
pkill -f uvicorn

# Проверить порт 8000
lsof -i :8000

# Очистить базу данных
rm medical.db && python seed_data.py
```

## Структура проекта

```
medical-system-project/
├── backend/              # FastAPI backend
│   ├── routers/         # API endpoints
│   ├── services/        # Бизнес-логика
│   ├── utils/           # Утилиты
│   ├── main.py          # Точка входа
│   ├── models.py        # Database models
│   ├── schemas.py       # Pydantic schemas
│   └── seed_data.py     # Тестовые данные
│
├── frontend/            # Angular frontend
│   ├── src/
│   │   └── app/
│   └── package.json
│
├── README.md            # Главная документация
├── TESTING_GUIDE.md     # Тестирование
├── DEPLOYMENT_GUIDE.md  # Развёртывание
└── docker-compose.yml   # Docker конфигурация
```

## Тестовые данные

После запуска `seed_data.py` создаются:
- 1 администратор
- 3 врача (терапевт, кардиолог, хирург)
- 3 пациента
- 2 клиники
- 4 приёма
- 2 медицинские записи

## Возможности системы

✅ **Реализовано:**
- Аутентификация и авторизация (JWT)
- Управление пациентами
- Управление врачами
- Система приёмов
- Медицинские записи
- Dashboard со статистикой
- AI Chat интеграция
- Role-based access control
- API документация

🚧 **В разработке:**
- Angular frontend
- Real-time уведомления
- Email рассылка
- Загрузка файлов

## API Endpoints

### Основные
- `GET /` - Главная страница
- `GET /health` - Проверка здоровья
- `GET /docs` - Swagger UI
- `GET /redoc` - ReDoc

### Аутентификация
- `POST /auth/register` - Регистрация
- `POST /auth/login` - Вход
- `GET /auth/me` - Текущий пользователь

### Пациенты
- `GET /patients` - Список
- `GET /patients/me` - Мой профиль
- `POST /patients` - Создать
- `PUT /patients/{id}` - Обновить

### Врачи
- `GET /doctors` - Список
- `GET /doctors/me` - Мой профиль
- `GET /doctors/{id}` - По ID

### Приёмы
- `GET /appointments` - Список
- `GET /appointments/upcoming` - Предстоящие
- `POST /appointments` - Создать
- `PATCH /appointments/{id}/status` - Изменить статус

### AI Chat
- `POST /ai-chat/message` - Отправить сообщение
- `GET /ai-chat/sessions` - Список сессий
- `POST /ai-chat/sessions` - Создать сессию

Полный список в Swagger UI: http://localhost:8000/docs

---

**Готово к работе! 🎉**

Если возникнут вопросы, смотрите подробную документацию в других файлах.
