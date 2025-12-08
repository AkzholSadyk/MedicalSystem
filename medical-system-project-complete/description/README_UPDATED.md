# Medical System - Обновленный Проект (v1.1.0)

## Обзор Изменений

Проект был полностью переработан в соответствии с вашими новыми требованиями. Основные изменения включают:

1.  **AI-Интеграция:** Замена облачного OpenAI API на локальный **Ollama** API.
2.  **Профиль Пользователя:** Добавлены поля **Отчество** (`patronymic`) и **Город** (`city`) для пациентов и врачей.
3.  **Медицинские Записи:** Добавлено поле **Результаты Анализов** (`lab_results`) в медицинские записи.
4.  **Многоязычность (i18n):** Внедрена поддержка **Русского (ru)**, **Казахского (kz)** и **Английского (en)** языков на уровне Frontend с помощью `ngx-translate`.
5.  **Чат Врач-Пациент:** Реализован **Real-Time Чат** с использованием WebSockets (FastAPI) и новой структурой базы данных. В чате отображается полное имя (Фамилия Имя Отчество) отправителя.

## Изменения в Backend (FastAPI)

### 1. Обновление Базы Данных

В `backend/models.py` добавлены новые поля и таблицы:

*   **`Patient` / `Doctor`:** Добавлены поля `first_name`, `last_name` (вместо `name`), `patronymic`, `city`.
*   **`MedicalRecord`:** Добавлено поле `lab_results`.
*   **Новые таблицы:** `ChatSession` и `ChatMessage` для чата Врач-Пациент.

### 2. Ollama Интеграция

*   Файл `backend/services/ai_service.py` полностью переписан для использования библиотеки `requests` и взаимодействия с локальным **Ollama API** (по умолчанию `http://localhost:11434`).
*   В `backend/config.py` добавлены настройки `OLLAMA_URL` и `OLLAMA_MODEL`.

### 3. Real-Time Чат

*   Добавлен новый роутер `backend/routers/chat_router.py` с REST API для управления сессиями и WebSocket-эндпоинтом (`/chat/ws/{session_id}`) для обмена сообщениями.
*   Добавлен сервис `backend/services/chat_service.py` для управления логикой чата и WebSocket-соединениями.
*   В `backend/requirements.txt` добавлены `requests` и `websockets`.

## Изменения в Frontend (Angular)

### 1. Многоязычность

*   Установлены пакеты `@ngx-translate/core` и `@ngx-translate/http-loader`.
*   Созданы файлы переводов: `ru.json`, `kz.json`, `en.json` в `src/assets/i18n/`.
*   Добавлен сервис `I18nService` и компонент `LanguageSwitcherComponent` для переключения языка.

### 2. Новые Компоненты

*   **`ProfileComponent`:** Компонент для управления профилем с новыми полями (Имя, Фамилия, Отчество, Город).
*   **`MedicalRecordsComponent`:** Компонент для отображения медицинских записей, включая результаты анализов.
*   **`ChatComponent`:** Компонент для чата Врач-Пациент с использованием `ChatService` (WebSocket).

## Инструкции по Развертыванию (Обновлено)

Для запуска обновленного проекта необходимо выполнить следующие шаги:

### Шаг 1: Установка Ollama (Локальный AI)

1.  Установите [Ollama](https://ollama.com/download) на ваш компьютер.
2.  Запустите Ollama и загрузите модель, указанную в `backend/config.py` (по умолчанию `llama3`):
    ```bash
    ollama run llama3
    ```
    *Убедитесь, что Ollama запущен и доступен по адресу, указанному в `OLLAMA_URL` (по умолчанию `http://localhost:11434`).*

### Шаг 2: Запуск Backend (FastAPI)

1.  Перейдите в директорию `backend`:
    ```bash
    cd medical-system-project/medical-system-project-complete/backend
    ```
2.  Создайте и активируйте виртуальное окружение:
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
3.  Установите обновленные зависимости:
    ```bash
    pip install -r requirements.txt
    ```
4.  Запустите скрипт для создания базы данных и тестовых данных (обновит схему БД):
    ```bash
    python seed_data.py
    ```
5.  Запустите сервер FastAPI:
    ```bash
    uvicorn main:app --reload
    ```
    *Сервер будет доступен по адресу `http://localhost:8000`.*

### Шаг 3: Запуск Frontend (Angular)

1.  Перейдите в директорию `frontend`:
    ```bash
    cd ../frontend
    ```
2.  Установите зависимости (включая `ngx-translate`):
    ```bash
    npm install
    ```
3.  Запустите Angular-приложение:
    ```bash
    ng serve
    ```
    *Приложение будет доступно по адресу `http://localhost:4200`.*

### Тестовые Данные

Используйте те же тестовые данные, что и раньше:

*   **Администратор:** `admin` / `admin123`
*   **Врач:** `elena_smirnova` / `doctor123`
*   **Пациент:** `ivan_petrov` / `patient123`

---
*Manus AI, 2025*
