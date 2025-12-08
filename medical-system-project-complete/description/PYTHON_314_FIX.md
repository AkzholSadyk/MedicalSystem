# Исправление ошибки для Python 3.14

## Проблема

При установке зависимостей на **Python 3.14** возникает ошибка компиляции `pydantic-core`:

```
Building wheel for pydantic-core (pyproject.toml) ... error
exit code: 1
```

**Причина:** Старые версии Pydantic (2.5.0) не поддерживают Python 3.14, так как требуют компиляции Rust компонентов, которые ещё не адаптированы для этой версии Python.

## Решение 1: Использовать Python 3.11 (Рекомендуется)

Python 3.14 очень новый и многие пакеты ещё не полностью поддерживают его. **Рекомендуется использовать Python 3.11** для стабильной работы.

### Шаги:

1. **Установить Python 3.11** (если ещё не установлен):

```bash
# macOS с Homebrew
brew install python@3.11
```

2. **Создать виртуальное окружение с Python 3.11**:

```bash
cd ~/Desktop/medical-system-project/backend

# Удалить старое venv
rm -rf venv

# Создать новое с Python 3.11
python3.11 -m venv venv

# Активировать
source venv/bin/activate

# Проверить версию
python --version  # Должно быть Python 3.11.x
```

3. **Установить зависимости**:

```bash
pip install -r requirements-py311.txt
```

4. **Запустить seed_data.py**:

```bash
python seed_data.py
```

5. **Запустить сервер**:

```bash
uvicorn main:app --reload
```

✅ **Готово!** Сервер должен запуститься на http://localhost:8000

## Решение 2: Обновить пакеты для Python 3.14

Если вы хотите продолжить использовать Python 3.14, используйте обновлённый файл зависимостей:

### Шаги:

1. **Очистить кэш pip**:

```bash
pip cache purge
```

2. **Обновить pip и setuptools**:

```bash
pip install --upgrade pip setuptools wheel
```

3. **Установить зависимости из обновлённого файла**:

```bash
pip install -r requirements-py314.txt
```

**Примечание:** Некоторые пакеты могут работать нестабильно на Python 3.14, так как это очень новая версия.

## Решение 3: Использовать pre-built wheels

Если компиляция не работает, можно попробовать установить пакеты без компиляции:

```bash
# Установить без компиляции из исходников
pip install --only-binary :all: pydantic pydantic-core

# Затем установить остальные зависимости
pip install -r requirements.txt
```

## Решение 4: Использовать Docker

Самый надёжный способ - использовать Docker с фиксированной версией Python:

```bash
cd ~/Desktop/medical-system-project

# Запустить через Docker Compose
docker-compose up -d
```

Docker образ использует Python 3.11, поэтому все зависимости установятся корректно.

## Проверка установки

После установки зависимостей проверьте:

```bash
# Активировать venv
source venv/bin/activate

# Проверить версию Python
python --version

# Проверить установленные пакеты
pip list | grep -E "fastapi|pydantic|uvicorn"

# Попробовать импортировать
python -c "import fastapi, pydantic, sqlalchemy; print('✅ All packages imported successfully')"
```

## Рекомендации

### ✅ Лучший вариант: Python 3.11

- Стабильный и проверенный
- Все пакеты гарантированно работают
- Используется в production

### ⚠️ Python 3.14

- Очень новый (вышел недавно)
- Не все пакеты поддерживают
- Могут быть неожиданные ошибки
- Подходит только для экспериментов

### 🐳 Docker

- Изолированная среда
- Фиксированные версии всех зависимостей
- Работает одинаково на всех системах
- Идеально для production

## Быстрое решение (копировать и выполнить)

```bash
# Перейти в папку проекта
cd ~/Desktop/medical-system-project/backend

# Удалить старое окружение
rm -rf venv

# Установить Python 3.11 (если нужно)
brew install python@3.11

# Создать новое окружение с Python 3.11
python3.11 -m venv venv

# Активировать
source venv/bin/activate

# Обновить pip
pip install --upgrade pip

# Установить зависимости
pip install -r requirements-py311.txt

# Создать тестовые данные
python seed_data.py

# Запустить сервер
uvicorn main:app --reload
```

После этого откройте http://localhost:8000/docs

## Если ничего не помогло

1. **Проверьте версию Python**:
```bash
python3 --version
python3.11 --version
python3.14 --version
```

2. **Используйте pyenv для управления версиями Python**:
```bash
# Установить pyenv
brew install pyenv

# Установить Python 3.11
pyenv install 3.11.10

# Установить как локальную версию для проекта
cd ~/Desktop/medical-system-project/backend
pyenv local 3.11.10

# Создать venv
python -m venv venv
source venv/bin/activate
```

3. **Используйте Docker** (самый надёжный способ):
```bash
cd ~/Desktop/medical-system-project
docker-compose up -d
```

## Дополнительная информация

### Почему возникает ошибка?

Pydantic использует Rust для компиляции критичных по производительности частей (`pydantic-core`). Когда выходит новая версия Python, требуется время для адаптации Rust компонентов.

### Когда будет поддержка Python 3.14?

Обычно через 2-3 месяца после выхода новой версии Python основные пакеты обновляются. Следите за обновлениями:
- Pydantic: https://github.com/pydantic/pydantic
- FastAPI: https://github.com/tiangolo/fastapi

### Альтернативы

Если вам критично использовать Python 3.14, можете попробовать:
- Использовать альтернативные валидаторы (marshmallow, cerberus)
- Дождаться обновления Pydantic
- Собрать pydantic-core из исходников с патчами

---

**Рекомендация:** Используйте Python 3.11 для стабильной работы проекта! 🐍
