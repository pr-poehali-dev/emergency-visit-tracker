# 🚀 Инструкция по развёртыванию МЧС Tracker на собственном VPS

## Описание

Этот проект полностью автономен и не зависит от внешних сервисов. Все компоненты работают на вашем сервере:
- **Frontend** (React PWA) - веб-интерфейс приложения
- **Backend API** (FastAPI) - серверная логика
- **PostgreSQL** - база данных
- **MinIO** - S3-совместимое хранилище для фото/видео
- **Nginx** - веб-сервер и reverse proxy

---

## Требования

### Минимальные требования к серверу:
- **ОС**: Ubuntu 20.04+, Debian 11+, CentOS 8+
- **CPU**: 2 ядра
- **RAM**: 4 GB
- **Диск**: 20 GB свободного места
- **Сеть**: Внешний IP-адрес

### Требуемое ПО:
- Docker 20.10+
- Docker Compose 2.0+
- Git (опционально, для обновлений)

---

## Шаг 1: Подготовка сервера

### 1.1 Подключитесь к серверу
```bash
ssh root@your-server-ip
```

### 1.2 Обновите систему
```bash
apt update && apt upgrade -y
```

### 1.3 Установите Docker и Docker Compose

**Для Ubuntu/Debian:**
```bash
# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Добавление текущего пользователя в группу docker
usermod -aG docker $USER

# Установка Docker Compose
apt install -y docker-compose-plugin

# Проверка установки
docker --version
docker compose version
```

**Для CentOS:**
```bash
# Установка Docker
yum install -y yum-utils
yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
yum install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Запуск Docker
systemctl start docker
systemctl enable docker

# Проверка
docker --version
docker compose version
```

---

## Шаг 2: Загрузка проекта на сервер

### Вариант А: Через GitHub (рекомендуется)

1. В редакторе poehali.dev нажмите **Скачать → Подключить GitHub**
2. Выберите аккаунт и создайте репозиторий
3. На сервере клонируйте репозиторий:

```bash
cd /opt
git clone https://github.com/your-username/your-repo.git mchs-tracker
cd mchs-tracker
```

### Вариант Б: Через скачивание ZIP

1. В редакторе poehali.dev нажмите **Скачать → Скачать код**
2. Загрузите архив на сервер:

```bash
# На вашем компьютере
scp mchs-tracker.zip root@your-server-ip:/opt/

# На сервере
cd /opt
unzip mchs-tracker.zip -d mchs-tracker
cd mchs-tracker
```

---

## Шаг 3: Настройка окружения

### 3.1 Создайте файл .env с настройками
```bash
cp .env.example .env
nano .env
```

### 3.2 Заполните переменные окружения:
```env
# Пароль для PostgreSQL (придумайте надёжный пароль)
DB_PASSWORD=your_secure_password_here

# Настройки MinIO для хранения фото
MINIO_ROOT_USER=mchs_admin
MINIO_ROOT_PASSWORD=your_minio_secure_password_here

# Ваш домен (опционально, для HTTPS)
DOMAIN=your-domain.com
```

**⚠️ ВАЖНО:** Замените пароли на надёжные! Не используйте значения по умолчанию в продакшене.

---

## Шаг 4: Сборка frontend

### 4.1 Соберите production билд
```bash
# Установите Node.js 18+ (если ещё не установлен)
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Установите зависимости и соберите проект
npm install
npm run build
```

Результат сборки появится в папке `dist/`

---

## Шаг 5: Инициализация MinIO

### 5.1 Создайте скрипт инициализации
```bash
nano init-minio.sh
```

Содержимое скрипта:
```bash
#!/bin/bash

# Ждём пока MinIO запустится
sleep 10

# Устанавливаем MinIO Client
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
mv mc /usr/local/bin/

# Настраиваем алиас
mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD

# Создаём bucket
mc mb local/mchs-tracker

# Устанавливаем публичный доступ на чтение
mc anonymous set download local/mchs-tracker

echo "MinIO initialized successfully!"
```

Сделайте скрипт исполняемым:
```bash
chmod +x init-minio.sh
```

---

## Шаг 6: Запуск приложения

### 6.1 Запустите все сервисы
```bash
docker compose up -d
```

Эта команда запустит:
- PostgreSQL на порту 5432
- MinIO на портах 9000 (API) и 9001 (Console)
- FastAPI Backend на порту 8000
- Nginx на портах 80 (HTTP) и 443 (HTTPS)

### 6.2 Проверьте статус контейнеров
```bash
docker compose ps
```

Все сервисы должны быть в статусе `Up (healthy)`

### 6.3 Инициализируйте MinIO (только первый раз)
```bash
./init-minio.sh
```

### 6.4 Просмотр логов
```bash
# Все сервисы
docker compose logs -f

# Только API
docker compose logs -f api

# Только PostgreSQL
docker compose logs -f postgres
```

---

## Шаг 7: Проверка работы

### 7.1 Откройте браузер и проверьте:
- **Frontend**: `http://your-server-ip`
- **API docs**: `http://your-server-ip/api/docs`
- **MinIO Console**: `http://your-server-ip:9001`
  - Логин: значение из `MINIO_ROOT_USER`
  - Пароль: значение из `MINIO_ROOT_PASSWORD`

### 7.2 Проверьте работу синхронизации:
1. Откройте приложение в браузере
2. Войдите как Директор (создайте пользователя если нужно)
3. Перейдите в раздел "Синхронизация"
4. Нажмите "Загрузить с сервера" - должно работать без ошибок

---

## Шаг 8: Настройка HTTPS (рекомендуется)

### 8.1 Установите Certbot
```bash
apt install -y certbot
```

### 8.2 Остановите Nginx в Docker
```bash
docker compose stop nginx
```

### 8.3 Получите SSL-сертификат
```bash
certbot certonly --standalone -d your-domain.com
```

### 8.4 Обновите nginx.conf для HTTPS

Добавьте в начало файла `nginx.conf`:
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # ... остальная конфигурация остаётся без изменений
```

### 8.5 Обновите docker-compose.yml

Добавьте volume для SSL сертификатов в секцию nginx:
```yaml
nginx:
  volumes:
    - ./dist:/usr/share/nginx/html:ro
    - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
    - /etc/letsencrypt:/etc/letsencrypt:ro  # Добавьте эту строку
```

### 8.6 Перезапустите Nginx
```bash
docker compose up -d nginx
```

### 8.7 Настройте автообновление сертификата
```bash
# Добавьте задание в cron
crontab -e

# Добавьте строку (обновление каждый день в 3:00):
0 3 * * * certbot renew --quiet && docker compose -f /opt/mchs-tracker/docker-compose.yml restart nginx
```

---

## Шаг 9: Резервное копирование

### 9.1 Создайте скрипт для бэкапа
```bash
nano /opt/backup-mchs.sh
```

Содержимое:
```bash
#!/bin/bash

BACKUP_DIR="/opt/backups/mchs-tracker"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Бэкап PostgreSQL
docker exec mchs-postgres pg_dump -U mchs_admin mchs_tracker > $BACKUP_DIR/db_$DATE.sql

# Бэкап MinIO (фото)
docker exec mchs-minio mc mirror local/mchs-tracker $BACKUP_DIR/files_$DATE/

# Удаляем старые бэкапы (старше 30 дней)
find $BACKUP_DIR -type f -mtime +30 -delete

echo "Backup completed: $DATE"
```

Сделайте исполняемым:
```bash
chmod +x /opt/backup-mchs.sh
```

### 9.2 Настройте автоматический бэкап
```bash
crontab -e

# Добавьте (бэкап каждый день в 2:00):
0 2 * * * /opt/backup-mchs.sh >> /var/log/mchs-backup.log 2>&1
```

---

## Шаг 10: Обновление приложения

### Через GitHub:
```bash
cd /opt/mchs-tracker
git pull
npm install
npm run build
docker compose restart api nginx
```

### Через ZIP:
```bash
cd /opt/mchs-tracker
# Загрузите новый архив на сервер
unzip -o new-version.zip
npm install
npm run build
docker compose restart api nginx
```

---

## Полезные команды

### Управление сервисами
```bash
# Запуск всех сервисов
docker compose up -d

# Остановка всех сервисов
docker compose down

# Перезапуск конкретного сервиса
docker compose restart api

# Просмотр логов
docker compose logs -f api

# Очистка неиспользуемых ресурсов Docker
docker system prune -a
```

### Проверка состояния
```bash
# Список контейнеров
docker compose ps

# Использование ресурсов
docker stats

# Проверка дискового пространства
df -h

# Размер данных PostgreSQL
du -sh /var/lib/docker/volumes/mchs-tracker_postgres_data

# Размер данных MinIO
du -sh /var/lib/docker/volumes/mchs-tracker_minio_data
```

### Работа с базой данных
```bash
# Подключение к PostgreSQL
docker exec -it mchs-postgres psql -U mchs_admin -d mchs_tracker

# Бэкап базы данных
docker exec mchs-postgres pg_dump -U mchs_admin mchs_tracker > backup.sql

# Восстановление из бэкапа
docker exec -i mchs-postgres psql -U mchs_admin -d mchs_tracker < backup.sql
```

### Работа с MinIO
```bash
# Открыть консоль MinIO
# Браузер: http://your-server-ip:9001

# Список файлов через CLI
docker exec mchs-minio mc ls local/mchs-tracker/

# Копирование файла в MinIO
docker cp photo.jpg mchs-minio:/data/mchs-tracker/
```

---

## Решение проблем

### Приложение не открывается в браузере
```bash
# Проверьте что все контейнеры запущены
docker compose ps

# Проверьте порты
netstat -tulpn | grep -E '80|443|8000|9000'

# Проверьте логи Nginx
docker compose logs nginx

# Проверьте firewall
ufw status
ufw allow 80/tcp
ufw allow 443/tcp
```

### Ошибки синхронизации
```bash
# Проверьте логи API
docker compose logs api

# Проверьте подключение к БД
docker exec mchs-postgres psql -U mchs_admin -d mchs_tracker -c "\dt"

# Перезапустите API
docker compose restart api
```

### MinIO не сохраняет файлы
```bash
# Проверьте что bucket создан
docker exec mchs-minio mc ls local/

# Пересоздайте bucket
docker exec mchs-minio mc rb --force local/mchs-tracker
docker exec mchs-minio mc mb local/mchs-tracker
docker exec mchs-minio mc anonymous set download local/mchs-tracker

# Проверьте права доступа
docker exec mchs-minio mc policy get local/mchs-tracker
```

### Нехватка места на диске
```bash
# Проверьте использование места
df -h
du -sh /var/lib/docker/volumes/*

# Очистите старые логи Docker
truncate -s 0 /var/lib/docker/containers/*/*-json.log

# Очистите неиспользуемые образы
docker system prune -a --volumes
```

### Service Worker не работает
- Service Worker работает только через HTTPS (кроме localhost)
- Убедитесь что настроен HTTPS через Certbot
- Очистите кэш браузера и перезагрузите страницу
- Проверьте в DevTools → Application → Service Workers

---

## Безопасность

### Рекомендации:
1. **Используйте сильные пароли** в `.env` файле
2. **Настройте HTTPS** через Certbot (обязательно для production)
3. **Настройте firewall**:
```bash
ufw enable
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
```
4. **Регулярно обновляйте систему**:
```bash
apt update && apt upgrade -y
docker compose pull  # Обновление Docker образов
```
5. **Настройте автоматические бэкапы** (см. Шаг 9)
6. **Ограничьте доступ к MinIO Console** (порт 9001) через firewall:
```bash
# Разрешить доступ только с определённого IP
ufw allow from YOUR_OFFICE_IP to any port 9001
```

---

## Мониторинг

### Простой мониторинг через cron
```bash
nano /opt/monitor-mchs.sh
```

Содержимое:
```bash
#!/bin/bash

# Проверка работы контейнеров
if ! docker compose -f /opt/mchs-tracker/docker-compose.yml ps | grep -q "Up"; then
    echo "ALERT: Some containers are down!" | mail -s "MCHS Tracker Alert" your-email@example.com
    docker compose -f /opt/mchs-tracker/docker-compose.yml up -d
fi

# Проверка места на диске
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "ALERT: Disk usage is ${DISK_USAGE}%" | mail -s "MCHS Tracker Disk Alert" your-email@example.com
fi
```

Добавьте в cron:
```bash
crontab -e
# Проверка каждые 5 минут
*/5 * * * * /opt/monitor-mchs.sh
```

---

## Архитектура проекта

```
┌─────────────────────────────────────────────────────────┐
│                        Internet                          │
└────────────────────────┬────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │  Nginx  │  (Port 80/443)
                    │  Proxy  │
                    └────┬────┘
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
   │ React   │     │ FastAPI │     │  MinIO  │
   │Frontend │     │   API   │     │   S3    │
   │  (PWA)  │     │  (8000) │     │  (9000) │
   └─────────┘     └────┬────┘     └────┬────┘
                        │               │
                   ┌────▼────┐     ┌────▼────┐
                   │  Postgre│     │  Files  │
                   │   SQL   │     │ Storage │
                   └─────────┘     └─────────┘
```

---

## Поддержка

Если возникли проблемы:
1. Проверьте логи: `docker compose logs -f`
2. Проверьте статус контейнеров: `docker compose ps`
3. Проверьте файл `.env` на корректность паролей
4. Убедитесь что все порты открыты в firewall
5. Проверьте свободное место: `df -h`

---

## Полезные ссылки

- [Документация Docker](https://docs.docker.com/)
- [Документация FastAPI](https://fastapi.tiangolo.com/)
- [Документация MinIO](https://min.io/docs/)
- [Документация PostgreSQL](https://www.postgresql.org/docs/)
- [Let's Encrypt / Certbot](https://certbot.eff.org/)

---

**Готово!** 🎉 Ваше приложение теперь полностью автономно и работает на вашем сервере.
