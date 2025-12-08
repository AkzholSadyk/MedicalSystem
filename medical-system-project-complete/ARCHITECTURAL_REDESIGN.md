# Architectural Redesign Plan for Medical System

## 1. Обзор изменений (Overview of Changes)

Этот документ описывает архитектурные изменения, необходимые для реализации новых требований пользователя: замена AI-интеграции на **Ollama**, добавление расширенных полей **профиля**, улучшение раздела **медицинских записей**, внедрение **многоязычной поддержки (i18n)** и реализация **чата между врачом и пациентом** в реальном времени.

| Требование | Компонент | Изменение |
| :--- | :--- | :--- |
| **AI** | Backend (AI Service) | Замена OpenAI API на локальный Ollama API. |
| **Профиль** | DB Schema, Backend API | Добавление полей `patronymic` (Отчество) и `city` (Город) в модели пользователей. |
| **Мед. Записи** | DB Schema, Backend API | Добавление поля `lab_results` (Результаты анализов) в `MedicalRecords`. |
| **Многоязычность** | Frontend (Angular) | Внедрение `ngx-translate` или встроенного i18n для поддержки RU, KZ, EN. |
| **Чат** | DB Schema, Backend (WebSockets), Frontend | Новые таблицы для чата, WebSocket-сервер для real-time общения, новый UI. |

## 2. Изменения в Backend (FastAPI/SQLAlchemy)

### 2.1. Обновление Схемы Базы Данных

Необходимо внести изменения в существующие модели и добавить новые для чата.

#### A. Обновление Моделей `Users`, `Patients`, `Doctors`

Предполагается, что поля `first_name` (Имя) и `last_name` (Фамилия) уже существуют.

| Модель | Поле | Тип | Описание |
| :--- | :--- | :--- | :--- |
| `Users` / `Patients` / `Doctors` | `patronymic` | `String` (nullable) | Отчество пользователя. |
| `Users` / `Patients` / `Doctors` | `city` | `String` (nullable) | Город проживания. |

#### B. Обновление Модели `MedicalRecords`

Для хранения результатов анализов.

| Модель | Поле | Тип | Описание |
| :--- | :--- | :--- | :--- |
| `MedicalRecords` | `lab_results` | `JSONB` (PostgreSQL) / `Text` (SQLite) | Структурированные или неструктурированные данные анализов. |

#### C. Новые Модели для Doctor-Patient Chat

Для обеспечения чата между двумя пользователями (врач и пациент).

| Модель | Поле | Тип | Связь |
| :--- | :--- | :--- | :--- |
| **`ChatSession`** | `id` | `Integer` (PK) | |
| | `patient_id` | `Integer` (FK) | `Patients.id` |
| | `doctor_id` | `Integer` (FK) | `Doctors.id` |
| | `created_at` | `DateTime` | |
| | `last_message_at` | `DateTime` | |
| **`ChatMessage`** | `id` | `Integer` (PK) | |
| | `session_id` | `Integer` (FK) | `ChatSession.id` |
| | `sender_id` | `Integer` (FK) | `Users.id` (Отправитель) |
| | `content` | `Text` | Содержание сообщения. |
| | `timestamp` | `DateTime` | |

### 2.2. Интеграция Ollama

1.  **Конфигурация:** В `backend/config.py` добавить переменные:
    ```python
    OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
    OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")
    ```
2.  **Сервис:** В `backend/services/ai_service.py` заменить логику вызова OpenAI на HTTP-запросы к `OLLAMA_URL/api/generate`.

### 2.3. Реализация WebSockets для Чата

1.  **Зависимости:** Добавить `python-multipart` и `websockets` (если не установлены) в `requirements.txt`.
2.  **Роутер:** Создать `backend/routers/real_time_chat_router.py` с WebSocket-эндпоинтом:
    ```python
    @router.websocket("/ws/{session_id}")
    async def websocket_endpoint(websocket: WebSocket, session_id: int):
        # Логика подключения, аутентификации и обработки сообщений
        pass
    ```
3.  **Менеджер Подключений:** Создать класс `ConnectionManager` для управления активными WebSocket-соединениями.

## 3. Изменения в Frontend (Angular)

### 3.1. Многоязычная Поддержка (i18n)

1.  **Библиотека:** Использовать `ngx-translate` для динамической смены языка без перезагрузки.
2.  **Файлы переводов:** Создать файлы `en.json`, `ru.json`, `kz.json` в `frontend/src/assets/i18n/`.
3.  **Компонент:** Создать компонент `LanguageSwitcherComponent` в шапке (header) для выбора языка.

### 3.2. Обновление UI/UX

#### A. Профиль Пользователя

*   Обновить форму профиля для добавления полей **Отчество** и **Город**.
*   Обеспечить отображение полного имени (Фамилия Имя Отчество) в шапке и в чате.

#### B. Медицинские Записи

*   Обновить компонент `MedicalRecords` для отображения списка **прошлых посещений** (из `Appointments`).
*   Добавить детальный просмотр записи, включая поле **Результаты анализов** (`lab_results`).

#### C. Doctor-Patient Chat

*   **Список Чатов:** Новый компонент для отображения списка активных `ChatSession` с полными именами собеседников.
*   **Окно Чата:** Компонент с полем ввода и областью сообщений, использующий WebSocket для real-time обмена. Каждое сообщение должно отображать **Фамилию и Имя** отправителя.

## 4. План Реализации

1.  **Backend (DB & Models):** Обновить `models.py` и `schemas.py` для новых полей профиля и новых таблиц чата.
2.  **Backend (Ollama):** Обновить `config.py` и `ai_service.py` для интеграции с Ollama.
3.  **Backend (Chat):** Реализовать `real_time_chat_router.py` (REST и WebSockets) и логику в `services/chat_service.py`.
4.  **Frontend (i18n):** Настроить `ngx-translate` и создать базовые файлы переводов.
5.  **Frontend (UI):** Реализовать новые компоненты и обновить существующие (Профиль, Мед. Записи, Чат).
6.  **Тестирование:** Проверить все новые и измененные API-эндпоинты и функционал.
7.  **Документация:** Обновить `README.md`, `DATABASE_SCHEMA.md` и `DEPLOYMENT_GUIDE.md`.

---
*Manus AI, 2025*
