# Database Schema Design - Medical System

## Улучшенная схема базы данных

### 1. Users (Пользователи системы)
Основная таблица для аутентификации всех пользователей системы.

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,  -- 'patient', 'doctor', 'admin'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Поля:**
- `id` - уникальный идентификатор
- `username` - имя пользователя для входа
- `email` - электронная почта
- `hashed_password` - хешированный пароль (bcrypt)
- `role` - роль пользователя (patient, doctor, admin)
- `is_active` - активен ли аккаунт
- `created_at` - дата создания
- `updated_at` - дата последнего обновления

### 2. Patients (Пациенты)
Расширенная информация о пациентах, связанная с таблицей users.

```sql
CREATE TABLE patients (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    blood_type VARCHAR(5),
    allergies TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Поля:**
- `user_id` - связь с таблицей users (один к одному)
- `name` - полное имя пациента
- `phone` - номер телефона
- `date_of_birth` - дата рождения
- `address` - адрес проживания
- `blood_type` - группа крови
- `allergies` - аллергии
- `emergency_contact` - контактное лицо в экстренных случаях
- `emergency_phone` - телефон экстренного контакта

### 3. Doctors (Врачи)
Информация о врачах в системе.

```sql
CREATE TABLE doctors (
    id INTEGER PRIMARY KEY,
    user_id INTEGER UNIQUE,
    name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100),
    phone VARCHAR(20),
    license_number VARCHAR(50),
    years_of_experience INTEGER,
    education TEXT,
    bio TEXT,
    consultation_fee DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Поля:**
- `user_id` - связь с таблицей users
- `name` - полное имя врача
- `specialization` - специализация (Терапевт, Кардиолог и т.д.)
- `phone` - номер телефона
- `license_number` - номер медицинской лицензии
- `years_of_experience` - лет опыта
- `education` - образование
- `bio` - биография/описание
- `consultation_fee` - стоимость консультации

### 4. Clinics (Клиники)
Медицинские учреждения в системе.

```sql
CREATE TABLE clinics (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    working_hours TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Поля:**
- `name` - название клиники
- `address` - адрес
- `phone` - телефон
- `email` - электронная почта
- `working_hours` - часы работы
- `description` - описание клиники

### 5. Departments (Отделы)
Отделы внутри клиник.

```sql
CREATE TABLE departments (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    clinic_id INTEGER NOT NULL,
    floor INTEGER,
    phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE
);
```

**Поля:**
- `clinic_id` - связь с клиникой
- `name` - название отдела
- `description` - описание
- `floor` - этаж
- `phone` - телефон отдела

### 6. Doctor_Clinics (Связь врачей и клиник)
Многие-ко-многим связь: один врач может работать в нескольких клиниках.

```sql
CREATE TABLE doctor_clinics (
    id INTEGER PRIMARY KEY,
    doctor_id INTEGER NOT NULL,
    clinic_id INTEGER NOT NULL,
    department_id INTEGER,
    schedule TEXT,  -- JSON с расписанием
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    UNIQUE(doctor_id, clinic_id)
);
```

**Поля:**
- `doctor_id` - ID врача
- `clinic_id` - ID клиники
- `department_id` - ID отдела
- `schedule` - расписание работы врача в этой клинике (JSON)

### 7. Appointments (Приёмы)
Записи на приём к врачу.

```sql
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    clinic_id INTEGER,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(10) NOT NULL,
    duration INTEGER DEFAULT 30,  -- минуты
    status VARCHAR(20) DEFAULT 'scheduled',  -- scheduled, completed, cancelled, no_show
    appointment_type VARCHAR(50),  -- плановый осмотр, консультация и т.д.
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE SET NULL
);
```

**Поля:**
- `patient_id` - ID пациента
- `doctor_id` - ID врача
- `clinic_id` - ID клиники
- `appointment_date` - дата приёма
- `appointment_time` - время приёма
- `duration` - продолжительность (минуты)
- `status` - статус (scheduled/completed/cancelled/no_show)
- `appointment_type` - тип приёма
- `notes` - заметки

### 8. Medical_Records (Медицинские записи)
История медицинских записей пациентов.

```sql
CREATE TABLE medical_records (
    id INTEGER PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    appointment_id INTEGER,
    diagnosis TEXT NOT NULL,
    symptoms TEXT,
    treatment TEXT,
    prescriptions TEXT,
    test_results TEXT,
    notes TEXT,
    record_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL
);
```

**Поля:**
- `patient_id` - ID пациента
- `doctor_id` - ID врача
- `appointment_id` - связь с приёмом (опционально)
- `diagnosis` - диагноз
- `symptoms` - симптомы
- `treatment` - лечение
- `prescriptions` - назначения/рецепты
- `test_results` - результаты анализов
- `notes` - дополнительные заметки
- `record_date` - дата записи

### 9. AI_Chat_Messages (Сообщения AI чата)
История общения пользователей с AI ассистентом.

```sql
CREATE TABLE ai_chat_messages (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_id VARCHAR(100),
    role VARCHAR(20) NOT NULL,  -- 'user' or 'assistant'
    content TEXT NOT NULL,
    model VARCHAR(50),
    tokens_used INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Поля:**
- `user_id` - ID пользователя
- `session_id` - ID сессии чата (для группировки сообщений)
- `role` - роль отправителя (user/assistant)
- `content` - содержимое сообщения
- `model` - использованная модель AI
- `tokens_used` - количество использованных токенов
- `created_at` - время создания

### 10. AI_Chat_Sessions (Сессии AI чата)
Сессии общения с AI.

```sql
CREATE TABLE ai_chat_sessions (
    id INTEGER PRIMARY KEY,
    session_id VARCHAR(100) UNIQUE NOT NULL,
    user_id INTEGER NOT NULL,
    title VARCHAR(200),
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Поля:**
- `session_id` - уникальный ID сессии
- `user_id` - ID пользователя
- `title` - название сессии (автогенерируемое)
- `started_at` - время начала
- `last_message_at` - время последнего сообщения
- `is_active` - активна ли сессия

## Индексы для оптимизации

```sql
-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);

-- Patients
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_name ON patients(name);

-- Doctors
CREATE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);

-- Appointments
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);

-- Medical Records
CREATE INDEX idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX idx_medical_records_date ON medical_records(record_date);

-- AI Chat
CREATE INDEX idx_ai_chat_messages_user_id ON ai_chat_messages(user_id);
CREATE INDEX idx_ai_chat_messages_session_id ON ai_chat_messages(session_id);
CREATE INDEX idx_ai_chat_sessions_user_id ON ai_chat_sessions(user_id);
```

## Связи между таблицами

```
users (1) -----> (1) patients
users (1) -----> (1) doctors
users (1) -----> (*) ai_chat_sessions
users (1) -----> (*) ai_chat_messages

patients (1) -----> (*) appointments
patients (1) -----> (*) medical_records

doctors (1) -----> (*) appointments
doctors (1) -----> (*) medical_records
doctors (*) <-----> (*) clinics (через doctor_clinics)

clinics (1) -----> (*) departments
clinics (1) -----> (*) appointments

appointments (1) -----> (0..1) medical_records

ai_chat_sessions (1) -----> (*) ai_chat_messages
```

## Примеры данных

### Роли пользователей
- `patient` - обычный пациент
- `doctor` - врач
- `admin` - администратор системы

### Статусы приёмов
- `scheduled` - запланирован
- `completed` - завершён
- `cancelled` - отменён
- `no_show` - пациент не явился

### Специализации врачей
- Терапевт
- Кардиолог
- Хирург
- Педиатр
- Невролог
- Дерматолог
- Офтальмолог
- ЛОР
- и т.д.

## Миграция существующих данных

Существующая схема будет расширена следующим образом:
1. Добавление поля `role` в таблицу `users`
2. Добавление `user_id` в таблицы `patients` и `doctors`
3. Создание новых таблиц для AI чата
4. Создание связующей таблицы `doctor_clinics`
5. Расширение полей в существующих таблицах
