# 🚀 Инструкция по установке на Beget (85.198.100.9)

## Что нужно знать про Beget

На Beget есть ограничения:
- ❌ Нет root-доступа
- ❌ Нельзя использовать Docker
- ❌ Нельзя запускать системные сервисы
- ✅ Есть SSH доступ
- ✅ Можно использовать Python/Node.js
- ✅ Есть PostgreSQL и MySQL базы
- ✅ Есть файловый менеджер

**Решение:** Развернём приложение через Python FastAPI + встроенную PostgreSQL от Beget

---

## Вариант 1: Простой (только Frontend на Beget)

Если у вас есть доступ к другому серверу для backend, можете разместить на Beget только frontend.

### Шаг 1: Подключитесь к Beget по SSH

```bash
ssh your_login@85.198.100.9
```

### Шаг 2: Соберите frontend локально

На вашем компьютере:
```bash
# Установите зависимости
npm install

# Соберите production версию
npm run build
```

### Шаг 3: Загрузите на Beget

Используйте FileZilla или SCP:
```bash
# Через SCP (на вашем компьютере)
scp -r dist/* your_login@85.198.100.9:~/your-domain.ru/public_html/

# Или через FileZilla:
# Host: 85.198.100.9
# Username: ваш логин
# Password: ваш пароль
# Port: 22
```

### Шаг 4: Настройте .htaccess для SPA

Создайте файл `public_html/.htaccess`:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Кэширование статических файлов
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType application/x-javascript "access plus 1 year"
</IfModule>

# Service Worker не кэшируется
<Files "sw.js">
  FileETag None
  Header unset ETag
  Header set Cache-Control "max-age=0, no-cache, no-store, must-revalidate"
  Header set Pragma "no-cache"
  Header set Expires "Wed, 11 Jan 1984 05:00:00 GMT"
</Files>

# Сжатие
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/plain
  AddOutputFilterByType DEFLATE text/html
  AddOutputFilterByType DEFLATE text/xml
  AddOutputFilterByType DEFLATE text/css
  AddOutputFilterByType DEFLATE application/xml
  AddOutputFilterByType DEFLATE application/xhtml+xml
  AddOutputFilterByType DEFLATE application/rss+xml
  AddOutputFilterByType DEFLATE application/javascript
  AddOutputFilterByType DEFLATE application/x-javascript
</IfModule>
```

### Шаг 5: Настройте backend URL

В файле `.env.production` укажите URL вашего backend сервера:
```env
VITE_API_URL=https://your-backend-server.com/api/sync
```

Пересоберите и загрузите заново:
```bash
npm run build
scp -r dist/* your_login@85.198.100.9:~/your-domain.ru/public_html/
```

**Готово!** Frontend будет работать на `http://85.198.100.9` или вашем домене.

---

## Вариант 2: Полный (Frontend + Backend на Beget)

⚠️ **Сложнее**, но всё будет на одном хостинге.

### Шаг 1: Подключитесь по SSH

```bash
ssh your_login@85.198.100.9
cd ~
```

### Шаг 2: Установите Python виртуальное окружение

```bash
# Beget обычно использует Python 3.9+
python3 --version

# Создайте виртуальное окружение
mkdir mchs-tracker
cd mchs-tracker
python3 -m venv venv
source venv/bin/activate
```

### Шаг 3: Загрузите код backend

На вашем компьютере создайте архив:
```bash
# Упакуйте только server папку
tar -czf backend.tar.gz server/
```

Загрузите на Beget:
```bash
scp backend.tar.gz your_login@85.198.100.9:~/mchs-tracker/
```

На сервере распакуйте:
```bash
cd ~/mchs-tracker
tar -xzf backend.tar.gz
```

### Шаг 4: Установите зависимости Python

```bash
source venv/bin/activate
cd server
pip install -r requirements.txt
```

### Шаг 5: Создайте базу данных PostgreSQL

1. Зайдите в панель управления Beget
2. Раздел **MySQL/PostgreSQL**
3. Создайте новую PostgreSQL базу:
   - Имя БД: `mchs_tracker`
   - Пользователь: запишите логин и пароль

4. Подключитесь к базе и создайте таблицы:

Через SSH:
```bash
psql -h localhost -U your_db_user -d mchs_tracker < ~/mchs-tracker/server/init.sql
```

Или через phpPgAdmin в панели Beget.

### Шаг 6: Создайте конфигурацию для FastAPI

Создайте файл `~/mchs-tracker/.env`:
```bash
nano ~/mchs-tracker/.env
```

Содержимое:
```env
DATABASE_URL=postgresql://your_db_user:your_db_password@localhost:5432/mchs_tracker
S3_ENDPOINT=disabled
S3_ACCESS_KEY=disabled
S3_SECRET_KEY=disabled
```

⚠️ **Важно:** На Beget нельзя запустить MinIO, поэтому фото будут храниться как base64 в БД (не оптимально, но работает).

### Шаг 7: Обновите код для работы без MinIO

Создайте файл `~/mchs-tracker/server/main_beget.py`:
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import psycopg2
import os

app = FastAPI(title="МЧС Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Модели (скопируйте из main.py)
# ... (вставьте все модели из server/main.py)

def get_db():
    return psycopg2.connect(os.environ.get('DATABASE_URL'))

# Эндпоинты (скопируйте из main.py, но без S3)
# Вместо S3 храните фото как base64 в БД

@app.get("/")
async def root():
    return {"status": "ok", "service": "МЧС Tracker API (Beget)"}

@app.get("/api/sync")
async def get_data():
    # Код из main.py для GET
    pass

@app.post("/api/sync")
async def sync_data(request: dict):
    # Код из main.py для POST, но без S3
    # Фото сохраняем как base64 прямо в photo_url
    pass
```

### Шаг 8: Настройте запуск FastAPI как CGI

На Beget FastAPI нельзя запустить как daemon, используем **Passenger** или **CGI**.

Создайте `~/mchs-tracker/passenger_wsgi.py`:
```python
import sys
import os

# Путь к виртуальному окружению
INTERP = os.path.expanduser("~/mchs-tracker/venv/bin/python3")
if sys.executable != INTERP:
    os.execl(INTERP, INTERP, *sys.argv)

# Добавляем путь к приложению
sys.path.insert(0, os.path.expanduser("~/mchs-tracker/server"))

from main_beget import app as application
```

### Шаг 9: Настройте домен на Beget

1. Панель управления Beget
2. **Сайты** → ваш домен
3. Включите поддержку **Python/Node.js**
4. Укажите путь к `passenger_wsgi.py`

### Шаг 10: Загрузите Frontend

```bash
# На вашем компьютере
npm run build
tar -czf frontend.tar.gz dist/

# Загрузите на Beget
scp frontend.tar.gz your_login@85.198.100.9:~/your-domain.ru/

# На сервере
cd ~/your-domain.ru/public_html
tar -xzf ../frontend.tar.gz --strip-components=1
```

### Шаг 11: Создайте .htaccess для проксирования API

`~/your-domain.ru/public_html/.htaccess`:
```apache
# SPA маршрутизация
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # API проксируется на Python приложение
  RewriteCond %{REQUEST_URI} ^/api/
  RewriteRule ^api/(.*)$ http://127.0.0.1:YOUR_PORT/api/$1 [P,L]
  
  # Frontend SPA
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

⚠️ `YOUR_PORT` - порт который выделит Beget (узнайте в панели управления).

---

## Вариант 3: Рекомендуемый (Hybrid)

**Лучший вариант для Beget:**

1. **Frontend на Beget** - статический сайт (быстро, просто)
2. **Backend на отдельном VPS** - полноценный Docker со всем (PostgreSQL + MinIO + FastAPI)

### Почему это лучше:

✅ Frontend на Beget очень быстрый (CDN, кэширование)  
✅ Backend на VPS - полный контроль, Docker, все сервисы  
✅ Легко масштабировать  
✅ Легко обновлять  

### Как сделать:

1. **На Beget (85.198.100.9):**
   - Загрузите только `dist/` папку
   - Настройте `.htaccess` для SPA
   - Готово!

2. **На любом VPS с Docker:**
   - Используйте `docker-compose.yml` из проекта
   - Получите домен или IP
   - Backend будет на `https://api.your-domain.com`

3. **Соедините их:**
   - В `.env.production` укажите `VITE_API_URL=https://api.your-domain.com/api/sync`
   - Пересоберите frontend и загрузите на Beget
   - Работает!

---

## Пошаговая инструкция для Hybrid варианта

### 1. Подготовьте VPS для backend

```bash
# На VPS сервере (не Beget)
git clone your-repo.git
cd your-repo
cp .env.example .env
nano .env  # Настройте пароли

docker compose up -d
chmod +x init-minio.sh && ./init-minio.sh
```

Получите URL вашего API, например: `http://123.45.67.89:8000` или `https://api.yourdomain.com`

### 2. Настройте frontend для этого API

На вашем компьютере:
```bash
# Создайте .env.production
echo "VITE_API_URL=http://123.45.67.89:8000/api/sync" > .env.production

# Соберите
npm run build
```

### 3. Загрузите frontend на Beget

```bash
# Создайте архив
cd dist
tar -czf ../frontend.tar.gz .
cd ..

# Загрузите на Beget
scp frontend.tar.gz your_login@85.198.100.9:~/
```

### 4. На Beget распакуйте в public_html

```bash
ssh your_login@85.198.100.9

cd ~/your-domain.ru/public_html
tar -xzf ~/frontend.tar.gz

# Создайте .htaccess (см. Вариант 1)
nano .htaccess
```

### 5. Откройте сайт

```
http://85.198.100.9  или  http://your-domain.ru
```

---

## Проверка работы

### Тест 1: Frontend загружается
```bash
curl http://85.198.100.9
# Должен вернуть HTML
```

### Тест 2: API доступен
```bash
curl http://your-backend-server:8000/api/sync
# Должен вернуть JSON с данными
```

### Тест 3: Синхронизация работает
1. Откройте сайт в браузере
2. Войдите как Директор
3. Перейдите в "Синхронизация"
4. Нажмите "Загрузить с сервера"
5. Не должно быть ошибок

---

## Автоматическое обновление на Beget

Создайте скрипт `~/update.sh`:
```bash
#!/bin/bash

cd ~/mchs-tracker
git pull

# Пересборка (если нужно)
npm install
npm run build

# Копирование в public_html
cp -r dist/* ~/your-domain.ru/public_html/

echo "Updated: $(date)"
```

Сделайте исполняемым:
```bash
chmod +x ~/update.sh
```

Добавьте в cron (панель Beget → Cron):
```
0 3 * * * /home/your_login/update.sh
```

---

## Решение проблем на Beget

### Ошибка "500 Internal Server Error"
```bash
# Проверьте логи Apache
tail -f ~/logs/error_log

# Проверьте права на файлы
chmod -R 755 ~/your-domain.ru/public_html
```

### Service Worker не работает
- Beget поддерживает HTTPS через Let's Encrypt
- Включите SSL в панели управления: **Сайты → SSL**
- Service Worker работает только через HTTPS

### API не доступен
- Проверьте что backend сервер запущен
- Проверьте CORS настройки
- Проверьте URL в `.env.production`

---

## Контакты поддержки Beget

- Техподдержка: https://beget.com/ru/support
- Телефон: 8 800 700-06-08
- Документация: https://beget.com/ru/kb

---

## Итоговая рекомендация для 85.198.100.9

**Используйте Hybrid вариант:**

1. ✅ Frontend на Beget (85.198.100.9) - простая загрузка через FTP/SCP
2. ✅ Backend на отдельном VPS с Docker - полный контроль, легко обновлять
3. ✅ Соедините их через VITE_API_URL в .env.production

**Плюсы:**
- Быстро настроить (30 минут)
- Легко обновлять
- Надёжно работает
- Полный контроль над backend
- Можно использовать бесплатный VPS (Oracle Cloud, Google Cloud Free Tier)

---

**Нужна помощь с конкретным шагом? Спрашивайте!**
