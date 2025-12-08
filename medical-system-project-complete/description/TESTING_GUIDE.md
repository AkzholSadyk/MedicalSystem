# Medical System - Руководство по тестированию

## Тестовые пользователи

После запуска `seed_data.py` доступны следующие тестовые пользователи:

### Администратор
- **Username**: `admin`
- **Password**: `admin123`
- **Email**: admin@medical.com
- **Роль**: admin

### Врачи

**Врач 1 - Терапевт**
- **Username**: `elena_smirnova`
- **Password**: `doctor123`
- **Email**: elena.smirnova@medical.com
- **Роль**: doctor
- **Специализация**: Терапевт

**Врач 2 - Кардиолог**
- **Username**: `olga_novikova`
- **Password**: `doctor123`
- **Email**: olga.novikova@medical.com
- **Роль**: doctor
- **Специализация**: Кардиолог

**Врач 3 - Хирург**
- **Username**: `dmitry_volkov`
- **Password**: `doctor123`
- **Email**: dmitry.volkov@medical.com
- **Роль**: doctor
- **Специализация**: Хирург

### Пациенты

**Пациент 1**
- **Username**: `ivan_petrov`
- **Password**: `patient123`
- **Email**: ivan.petrov@example.com
- **Роль**: patient
- **Имя**: Иван Петров

**Пациент 2**
- **Username**: `maria_sidorova`
- **Password**: `patient123`
- **Email**: maria.sidorova@example.com
- **Роль**: patient
- **Имя**: Мария Сидорова

**Пациент 3**
- **Username**: `alex_kozlov`
- **Password**: `patient123`
- **Email**: alex.kozlov@example.com
- **Роль**: patient
- **Имя**: Александр Козлов

## Тестирование через Swagger UI

### 1. Откройте Swagger UI

```
http://localhost:8000/docs
```

### 2. Авторизация

1. Найдите endpoint `POST /auth/login`
2. Нажмите "Try it out"
3. Введите credentials:
   - username: `ivan_petrov`
   - password: `patient123`
4. Нажмите "Execute"
5. Скопируйте `access_token` из ответа
6. Нажмите кнопку "Authorize" вверху страницы
7. Введите: `Bearer YOUR_ACCESS_TOKEN`
8. Нажмите "Authorize"

Теперь все запросы будут выполняться от имени этого пользователя!

### 3. Тестирование endpoints

После авторизации попробуйте:

- `GET /auth/me` - получить информацию о текущем пользователе
- `GET /appointments` - получить список приёмов
- `GET /appointments/upcoming` - предстоящие приёмы
- `GET /dashboard/stats` - статистика
- `GET /doctors` - список врачей
- `GET /patients/me` - мой профиль пациента

## Тестирование через curl

### 1. Вход в систему

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=ivan_petrov&password=patient123"
```

Ответ:
```json
{
  "access_token": "eyJhbGc...",
  "token_type": "bearer",
  "user": {
    "id": 5,
    "username": "ivan_petrov",
    "email": "ivan.petrov@example.com",
    "role": "patient"
  }
}
```

Сохраните токен в переменную:
```bash
export TOKEN="eyJhbGc..."
```

### 2. Получить информацию о пользователе

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/auth/me
```

### 3. Получить список врачей

```bash
curl http://localhost:8000/doctors
```

### 4. Получить мои приёмы

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/appointments
```

### 5. Создать новый приём

```bash
curl -X POST http://localhost:8000/appointments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_id": 1,
    "appointment_date": "2024-12-15",
    "appointment_time": "10:00",
    "appointment_type": "Консультация",
    "status": "scheduled"
  }'
```

### 6. Получить статистику

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/dashboard/stats
```

### 7. Тестирование AI Chat

**Создать сессию чата:**
```bash
curl -X POST http://localhost:8000/ai-chat/sessions \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "Консультация"}'
```

Ответ:
```json
{
  "session_id": "abc123...",
  "title": "Консультация",
  ...
}
```

**Отправить сообщение:**
```bash
curl -X POST http://localhost:8000/ai-chat/message \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "SESSION_ID_FROM_ABOVE",
    "content": "У меня болит голова. Что делать?"
  }'
```

**Получить историю чата:**
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/ai-chat/sessions/SESSION_ID
```

## Тестирование разных ролей

### Как пациент

```bash
# Войти как пациент
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=ivan_petrov&password=patient123" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Получить мой профиль
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/patients/me

# Получить мои приёмы
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/appointments

# Получить мои медицинские записи
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/medical-records
```

### Как врач

```bash
# Войти как врач
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=elena_smirnova&password=doctor123" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Получить мой профиль
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/doctors/me

# Получить мои приёмы
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/appointments

# Получить список пациентов
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/patients

# Создать медицинскую запись
curl -X POST http://localhost:8000/medical-records \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "doctor_id": 1,
    "diagnosis": "ОРВИ",
    "symptoms": "Температура, кашель",
    "treatment": "Постельный режим",
    "prescriptions": "Парацетамол 500мг"
  }'
```

### Как администратор

```bash
# Войти как админ
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=admin123" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Получить всех пациентов
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/patients

# Получить всех врачей
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/doctors

# Получить все приёмы
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/appointments

# Получить общую статистику
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/dashboard/stats
```

## Проверка прав доступа

### Пациент не может получить список всех пациентов

```bash
# Войти как пациент
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=ivan_petrov&password=patient123" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

# Попытка получить список пациентов (должна вернуть 403)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/patients
```

Ожидаемый результат: `403 Forbidden`

### Пациент не может создать медицинскую запись

```bash
# Попытка создать запись (должна вернуть 403)
curl -X POST http://localhost:8000/medical-records \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": 1,
    "doctor_id": 1,
    "diagnosis": "Test"
  }'
```

Ожидаемый результат: `403 Forbidden`

## Тестирование валидации

### Неправильный email при регистрации

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "invalid-email",
    "password": "test123",
    "role": "patient"
  }'
```

Ожидаемый результат: `422 Validation Error`

### Слишком короткий пароль

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@test.com",
    "password": "12",
    "role": "patient"
  }'
```

### Дублирующийся username

```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ivan_petrov",
    "email": "new@test.com",
    "password": "test123",
    "role": "patient"
  }'
```

Ожидаемый результат: `400 Bad Request - Username or email already registered`

## Автоматизированное тестирование

### Bash скрипт для быстрого тестирования

Создайте файл `test_api.sh`:

```bash
#!/bin/bash

BASE_URL="http://localhost:8000"

echo "🧪 Testing Medical System API..."

# Test 1: Health check
echo -e "\n1️⃣ Testing health endpoint..."
curl -s $BASE_URL/health | python3 -m json.tool

# Test 2: Login as patient
echo -e "\n2️⃣ Testing patient login..."
PATIENT_TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=ivan_petrov&password=patient123" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -n "$PATIENT_TOKEN" ]; then
  echo "✅ Patient login successful"
else
  echo "❌ Patient login failed"
  exit 1
fi

# Test 3: Get patient appointments
echo -e "\n3️⃣ Testing get appointments..."
curl -s -H "Authorization: Bearer $PATIENT_TOKEN" \
  $BASE_URL/appointments | python3 -m json.tool | head -20

# Test 4: Login as doctor
echo -e "\n4️⃣ Testing doctor login..."
DOCTOR_TOKEN=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=elena_smirnova&password=doctor123" \
  | python3 -c "import sys, json; print(json.load(sys.stdin)['access_token'])")

if [ -n "$DOCTOR_TOKEN" ]; then
  echo "✅ Doctor login successful"
else
  echo "❌ Doctor login failed"
  exit 1
fi

# Test 5: Get doctor stats
echo -e "\n5️⃣ Testing doctor dashboard stats..."
curl -s -H "Authorization: Bearer $DOCTOR_TOKEN" \
  $BASE_URL/dashboard/stats | python3 -m json.tool

echo -e "\n✅ All tests completed!"
```

Запустить:
```bash
chmod +x test_api.sh
./test_api.sh
```

## Результаты тестирования

✅ **Пройдено:**
- Аутентификация (регистрация, вход)
- Получение списков (врачи, пациенты, приёмы)
- Создание приёмов
- Создание медицинских записей
- Статистика dashboard
- Контроль доступа по ролям
- Валидация данных

🔧 **Требуется тестирование:**
- AI Chat интеграция (требуется OPENAI_API_KEY)
- Frontend интеграция
- Производительность под нагрузкой
- Безопасность (penetration testing)

## Известные ограничения

1. **AI Chat** - требуется валидный OPENAI_API_KEY в `.env`
2. **Email отправка** - не реализована (можно добавить SMTP)
3. **File uploads** - не реализованы (для медицинских документов)
4. **WebSocket** - не реализован (для real-time уведомлений)

## Следующие шаги

1. Настроить OPENAI_API_KEY для тестирования AI чата
2. Разработать Angular frontend
3. Интегрировать frontend с backend
4. Добавить unit и integration тесты
5. Настроить CI/CD pipeline
6. Провести security audit
