# System Architecture - Medical System

## Общая архитектура системы

Medical System построена по архитектуре **клиент-сервер** с разделением на **Frontend** (Angular SPA) и **Backend** (FastAPI REST API).

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Angular Frontend (TypeScript)                 │   │
│  │  - Components (UI)                                    │   │
│  │  - Services (API calls)                               │   │
│  │  - Guards (Auth)                                      │   │
│  │  - Interceptors (JWT)                                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/HTTPS (REST API)
┌─────────────────────────────────────────────────────────────┐
│                        Server Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           FastAPI Backend (Python)                    │   │
│  │  - Routers (Endpoints)                                │   │
│  │  - Dependencies (Auth, DB)                            │   │
│  │  - Middleware (CORS, JWT)                             │   │
│  │  - Schemas (Pydantic)                                 │   │
│  │  - Models (SQLAlchemy)                                │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ ORM (SQLAlchemy)
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         SQLite / PostgreSQL Database                  │   │
│  │  - Users, Patients, Doctors                           │   │
│  │  - Appointments, Medical Records                      │   │
│  │  - Clinics, Departments                               │   │
│  │  - AI Chat Sessions & Messages                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP API
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              OpenAI API (AI Chat)                     │   │
│  │  - gpt-4.1-mini                                       │   │
│  │  - gpt-4.1-nano                                       │   │
│  │  - gemini-2.5-flash                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Backend Architecture (FastAPI)

### Структура проекта

```
medical-system-backend/
├── main.py                 # Точка входа приложения
├── config.py               # Конфигурация (env variables)
├── database.py             # Настройка БД и сессий
├── models.py               # SQLAlchemy модели
├── schemas.py              # Pydantic схемы для валидации
├── auth.py                 # JWT аутентификация
├── dependencies.py         # Зависимости (get_current_user и т.д.)
├── requirements.txt        # Python зависимости
│
├── routers/                # API endpoints
│   ├── __init__.py
│   ├── auth_router.py      # /auth - регистрация, вход
│   ├── patients_router.py  # /patients - CRUD пациентов
│   ├── doctors_router.py   # /doctors - CRUD врачей
│   ├── appointments_router.py  # /appointments - управление приёмами
│   ├── medical_records_router.py  # /medical-records - мед. записи
│   ├── clinics_router.py   # /clinics - управление клиниками
│   ├── departments_router.py  # /departments - управление отделами
│   ├── dashboard_router.py # /dashboard - статистика
│   └── ai_chat_router.py   # /ai-chat - AI чат
│
├── services/               # Бизнес-логика
│   ├── __init__.py
│   ├── ai_service.py       # Интеграция с OpenAI API
│   ├── appointment_service.py  # Логика приёмов
│   └── stats_service.py    # Статистика для dashboard
│
└── utils/                  # Утилиты
    ├── __init__.py
    ├── security.py         # Хеширование паролей
    └── validators.py       # Кастомные валидаторы
```

### API Endpoints

#### Authentication (`/auth`)
- `POST /auth/register` - регистрация нового пользователя
- `POST /auth/login` - вход в систему (получение JWT токена)
- `POST /auth/refresh` - обновление токена
- `GET /auth/me` - получение информации о текущем пользователе

#### Patients (`/patients`)
- `GET /patients` - список всех пациентов (только для врачей/админов)
- `GET /patients/{id}` - информация о конкретном пациенте
- `POST /patients` - создание нового пациента
- `PUT /patients/{id}` - обновление информации о пациенте
- `DELETE /patients/{id}` - удаление пациента
- `GET /patients/search?q={query}` - поиск пациентов

#### Doctors (`/doctors`)
- `GET /doctors` - список всех врачей
- `GET /doctors/{id}` - информация о враче
- `POST /doctors` - создание врача (только админ)
- `PUT /doctors/{id}` - обновление информации
- `DELETE /doctors/{id}` - удаление врача
- `GET /doctors/specialization/{spec}` - врачи по специализации

#### Appointments (`/appointments`)
- `GET /appointments` - список приёмов (фильтрация по пользователю)
- `GET /appointments/{id}` - детали приёма
- `POST /appointments` - создание нового приёма
- `PUT /appointments/{id}` - обновление приёма
- `DELETE /appointments/{id}` - отмена приёма
- `PATCH /appointments/{id}/status` - изменение статуса
- `GET /appointments/upcoming` - предстоящие приёмы
- `GET /appointments/history` - история приёмов

#### Medical Records (`/medical-records`)
- `GET /medical-records` - список записей (фильтрация по пациенту)
- `GET /medical-records/{id}` - детали записи
- `POST /medical-records` - создание записи (только врач)
- `PUT /medical-records/{id}` - обновление записи
- `DELETE /medical-records/{id}` - удаление записи
- `GET /medical-records/patient/{patient_id}` - записи пациента

#### Clinics (`/clinics`)
- `GET /clinics` - список клиник
- `GET /clinics/{id}` - информация о клинике
- `POST /clinics` - создание клиники (только админ)
- `PUT /clinics/{id}` - обновление клиники
- `DELETE /clinics/{id}` - удаление клиники

#### Departments (`/departments`)
- `GET /departments` - список отделов
- `GET /departments/{id}` - информация об отделе
- `POST /departments` - создание отдела
- `PUT /departments/{id}` - обновление отдела
- `DELETE /departments/{id}` - удаление отдела
- `GET /departments/clinic/{clinic_id}` - отделы клиники

#### Dashboard (`/dashboard`)
- `GET /dashboard/stats` - общая статистика (зависит от роли)
- `GET /dashboard/patient-stats` - статистика для пациента
- `GET /dashboard/doctor-stats` - статистика для врача
- `GET /dashboard/admin-stats` - статистика для админа

#### AI Chat (`/ai-chat`)
- `POST /ai-chat/message` - отправка сообщения в чат
- `GET /ai-chat/sessions` - список сессий пользователя
- `GET /ai-chat/sessions/{session_id}/messages` - история сообщений
- `POST /ai-chat/sessions` - создание новой сессии
- `DELETE /ai-chat/sessions/{session_id}` - удаление сессии

### Middleware и Security

#### CORS Middleware
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200"],  # Angular dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### JWT Authentication
- Использование библиотеки `python-jose` для JWT
- Access token (срок действия: 30 минут)
- Refresh token (срок действия: 7 дней)
- Хранение токенов в localStorage на клиенте

#### Role-Based Access Control (RBAC)
```python
def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Access denied")
        return current_user
    return role_checker

# Использование:
@router.get("/patients")
def get_patients(current_user: User = Depends(require_role(["doctor", "admin"]))):
    ...
```

## Frontend Architecture (Angular)

### Структура проекта

```
medical-frontend/
├── src/
│   ├── app/
│   │   ├── core/                   # Основные модули
│   │   │   ├── guards/             # Route guards (auth)
│   │   │   ├── interceptors/       # HTTP interceptors (JWT)
│   │   │   ├── services/           # Глобальные сервисы
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── api.service.ts
│   │   │   │   └── storage.service.ts
│   │   │   └── models/             # TypeScript интерфейсы
│   │   │
│   │   ├── shared/                 # Общие компоненты
│   │   │   ├── components/
│   │   │   │   ├── sidebar/
│   │   │   │   ├── header/
│   │   │   │   └── card/
│   │   │   ├── pipes/
│   │   │   └── directives/
│   │   │
│   │   ├── features/               # Функциональные модули
│   │   │   ├── auth/
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   │
│   │   │   ├── patient/            # Модуль пациента
│   │   │   │   ├── dashboard/
│   │   │   │   ├── appointments/
│   │   │   │   ├── medical-records/
│   │   │   │   ├── doctors/
│   │   │   │   └── book-appointment/
│   │   │   │
│   │   │   ├── doctor/             # Модуль врача
│   │   │   │   ├── dashboard/
│   │   │   │   ├── patients/
│   │   │   │   ├── appointments/
│   │   │   │   ├── medical-records/
│   │   │   │   ├── clinics/
│   │   │   │   └── departments/
│   │   │   │
│   │   │   └── ai-chat/            # AI чат модуль
│   │   │       ├── chat-window/
│   │   │       ├── chat-sessions/
│   │   │       └── services/
│   │   │           └── ai-chat.service.ts
│   │   │
│   │   ├── app-routing.module.ts
│   │   ├── app.component.ts
│   │   └── app.module.ts
│   │
│   ├── assets/                     # Статические ресурсы
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── environments/               # Конфигурация окружений
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   │
│   └── styles/                     # Глобальные стили
│       ├── _variables.scss
│       ├── _mixins.scss
│       └── styles.scss
│
├── angular.json
├── package.json
└── tsconfig.json
```

### Routing

```typescript
const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  
  // Patient routes
  {
    path: 'patient',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'patient' },
    children: [
      { path: 'dashboard', component: PatientDashboardComponent },
      { path: 'appointments', component: PatientAppointmentsComponent },
      { path: 'medical-records', component: PatientMedicalRecordsComponent },
      { path: 'doctors', component: DoctorsListComponent },
      { path: 'book-appointment', component: BookAppointmentComponent },
      { path: 'ai-chat', component: AiChatComponent },
    ]
  },
  
  // Doctor routes
  {
    path: 'doctor',
    canActivate: [AuthGuard, RoleGuard],
    data: { role: 'doctor' },
    children: [
      { path: 'dashboard', component: DoctorDashboardComponent },
      { path: 'patients', component: PatientsListComponent },
      { path: 'appointments', component: DoctorAppointmentsComponent },
      { path: 'medical-records', component: MedicalRecordsComponent },
      { path: 'clinics', component: ClinicsComponent },
      { path: 'departments', component: DepartmentsComponent },
      { path: 'ai-chat', component: AiChatComponent },
    ]
  },
];
```

### Services

#### AuthService
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  login(credentials): Observable<AuthResponse>
  register(userData): Observable<User>
  logout(): void
  getCurrentUser(): Observable<User>
  isAuthenticated(): boolean
  getToken(): string
  getUserRole(): string
}
```

#### API Services
- `PatientsService` - работа с пациентами
- `DoctorsService` - работа с врачами
- `AppointmentsService` - управление приёмами
- `MedicalRecordsService` - медицинские записи
- `ClinicsService` - клиники
- `DepartmentsService` - отделы
- `DashboardService` - статистика
- `AiChatService` - AI чат

### State Management

Для простоты используем **сервисы с BehaviorSubject** вместо NgRx:

```typescript
@Injectable({ providedIn: 'root' })
export class AppStateService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();
  
  setCurrentUser(user: User) {
    this.currentUserSubject.next(user);
  }
}
```

## AI Chat Integration

### OpenAI API Integration

```python
# services/ai_service.py
from openai import OpenAI
import os

class AIService:
    def __init__(self):
        self.client = OpenAI()  # API key из env
        self.model = "gpt-4.1-mini"  # или gpt-4.1-nano, gemini-2.5-flash
    
    async def chat_completion(self, messages: List[dict], user_context: dict = None):
        """
        Отправка запроса к AI модели
        """
        system_message = {
            "role": "system",
            "content": """Вы - медицинский AI ассистент в системе Medical System.
            Ваша задача - помогать пользователям с общими медицинскими вопросами,
            предварительным анализом симптомов и рекомендациями.
            
            ВАЖНО:
            - Не ставьте окончательные диагнозы
            - Всегда рекомендуйте обратиться к врачу при серьёзных симптомах
            - Будьте вежливы и профессиональны
            - Отвечайте на русском языке
            """
        }
        
        full_messages = [system_message] + messages
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=full_messages,
            temperature=0.7,
            max_tokens=500
        )
        
        return {
            "content": response.choices[0].message.content,
            "model": self.model,
            "tokens": response.usage.total_tokens
        }
```

### Chat Flow

```
User (Frontend) 
    ↓ POST /ai-chat/message
Backend (FastAPI)
    ↓ Validate & Save user message
    ↓ Get chat history
    ↓ Call AIService
OpenAI API
    ↓ Generate response
Backend
    ↓ Save AI response
    ↓ Return to user
Frontend
    ↓ Display in chat UI
```

## Security Considerations

### Backend Security
1. **Password Hashing** - bcrypt для хеширования паролей
2. **JWT Tokens** - короткий срок действия access token
3. **HTTPS** - обязательно в production
4. **SQL Injection Protection** - использование ORM (SQLAlchemy)
5. **Rate Limiting** - ограничение запросов к API
6. **Input Validation** - Pydantic схемы
7. **CORS** - ограничение разрешённых origins

### Frontend Security
1. **XSS Protection** - Angular автоматически экранирует
2. **CSRF Protection** - JWT в headers вместо cookies
3. **Secure Storage** - токены в localStorage (или httpOnly cookies)
4. **Route Guards** - защита маршрутов по ролям
5. **Input Sanitization** - валидация форм

### AI Chat Security
1. **Content Filtering** - проверка на вредный контент
2. **Rate Limiting** - ограничение запросов к AI
3. **Context Isolation** - каждый пользователь видит только свои чаты
4. **Disclaimer** - предупреждение о том, что AI не заменяет врача

## Deployment Architecture

### Development
```
Frontend: http://localhost:4200 (ng serve)
Backend: http://localhost:8000 (uvicorn)
Database: SQLite (medical.db)
```

### Production
```
Frontend: Nginx (static files)
Backend: Gunicorn + Uvicorn workers
Database: PostgreSQL
Reverse Proxy: Nginx
SSL: Let's Encrypt
```

### Docker Setup
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/medical
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - db
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=medical
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## Performance Optimization

### Backend
- Database indexing на часто запрашиваемых полях
- Connection pooling для БД
- Caching (Redis) для статистики
- Async endpoints где возможно
- Pagination для списков

### Frontend
- Lazy loading модулей
- OnPush change detection
- Virtual scrolling для больших списков
- Image optimization
- Build optimization (AOT compilation)

### AI Chat
- Streaming responses для лучшего UX
- Caching частых вопросов
- Использование более лёгких моделей (gpt-4.1-nano) где возможно
