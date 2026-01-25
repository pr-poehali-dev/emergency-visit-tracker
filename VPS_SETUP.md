# Инструкция по установке на VPS

## Требования к серверу
- Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- 1GB RAM (минимум)
- 10GB свободного места
- Node.js 18+ и npm/yarn

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

### 1.3 Установите Node.js 18+
```bash
# Установка Node.js 18 LTS
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Проверка версии
node -v  # должно быть v18.x или выше
npm -v
```

### 1.4 Установите Nginx
```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

---

## Шаг 2: Скачивание и сборка проекта

### 2.1 Скачайте код проекта

**Вариант А: Через GitHub** (рекомендуется)
```bash
cd /var/www
git clone https://github.com/your-username/your-repo.git mchs-tracker
cd mchs-tracker
```

**Вариант Б: Через кнопку "Скачать код" в poehali.dev**
1. В редакторе нажмите **Скачать → Скачать код**
2. Загрузите zip-файл на сервер через scp:
```bash
# На вашем компьютере:
scp project.zip root@your-server-ip:/var/www/

# На сервере:
cd /var/www
unzip project.zip -d mchs-tracker
cd mchs-tracker
```

### 2.2 Установите зависимости
```bash
npm install
```

### 2.3 Соберите проект для продакшена
```bash
npm run build
```

После сборки все файлы будут в папке `dist/`

---

## Шаг 3: Настройка Nginx

### 3.1 Создайте конфигурацию сайта
```bash
nano /etc/nginx/sites-available/mchs-tracker
```

### 3.2 Вставьте следующую конфигурацию:

**Для HTTP (без SSL):**
```nginx
server {
    listen 80;
    server_name your-domain.com;  # замените на ваш домен или IP

    root /var/www/mchs-tracker/dist;
    index index.html;

    # Сжатие gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 1000;

    # Кэширование статических файлов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker не кэшируется
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires 0;
    }

    # Все маршруты перенаправляются на index.html (для SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Для HTTPS (с SSL - рекомендуется):**
Сначала установите Certbot для бесплатного SSL от Let's Encrypt:
```bash
apt install -y certbot python3-certbot-nginx
```

Затем используйте эту конфигурацию:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # замените на ваш домен
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;  # замените на ваш домен

    # SSL сертификаты (certbot добавит их автоматически)
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    root /var/www/mchs-tracker/dist;
    index index.html;

    # Сжатие gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript;
    gzip_min_length 1000;

    # Кэширование статических файлов
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker не кэшируется
    location = /sw.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires 0;
    }

    # Все маршруты перенаправляются на index.html (для SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Безопасность
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### 3.3 Активируйте конфигурацию
```bash
# Создайте символическую ссылку
ln -s /etc/nginx/sites-available/mchs-tracker /etc/nginx/sites-enabled/

# Проверьте конфигурацию
nginx -t

# Перезагрузите Nginx
systemctl reload nginx
```

### 3.4 Получите SSL-сертификат (для HTTPS)
```bash
certbot --nginx -d your-domain.com

# Автообновление сертификата (certbot делает это автоматически)
# Проверьте что таймер работает:
systemctl status certbot.timer
```

---

## Шаг 4: Проверка работы

### 4.1 Откройте сайт в браузере
```
http://your-domain.com  # или https://your-domain.com
```

### 4.2 Проверьте что приложение работает офлайн
1. Откройте сайт в браузере
2. Откройте DevTools (F12) → Application → Service Workers
3. Убедитесь что Service Worker активирован
4. Отключите интернет или включите режим "Offline" в DevTools
5. Обновите страницу - приложение должно работать

---

## Шаг 5: Обновление приложения

Когда вы внесёте изменения в код:

```bash
cd /var/www/mchs-tracker

# Получите новый код
git pull  # если используете GitHub

# Пересоберите проект
npm install  # если изменились зависимости
npm run build

# Nginx автоматически подхватит новые файлы
```

---

## Шаг 6: Мониторинг и логи

### Просмотр логов Nginx
```bash
# Логи доступа
tail -f /var/log/nginx/access.log

# Логи ошибок
tail -f /var/log/nginx/error.log
```

### Перезапуск Nginx
```bash
systemctl restart nginx
```

---

## Важные замечания

1. **Замените `your-domain.com`** на ваш реальный домен или IP-адрес сервера
2. **HTTPS настоятельно рекомендуется** для PWA и Service Workers
3. **Service Worker работает только через HTTPS** (кроме localhost)
4. **Backend функции остаются на functions.poehali.dev** - их не нужно переносить на VPS
5. **База данных остаётся на серверах poehali.dev** - приложение обращается к ней через backend функции

---

## Решение проблем

### Приложение не загружается
```bash
# Проверьте что файлы существуют
ls -la /var/www/mchs-tracker/dist/

# Проверьте права доступа
chmod -R 755 /var/www/mchs-tracker/dist/
chown -R www-data:www-data /var/www/mchs-tracker/dist/
```

### Service Worker не работает
- Убедитесь что используете HTTPS (для продакшена обязательно)
- Проверьте что файл `/sw.js` доступен по адресу `https://your-domain.com/sw.js`
- Очистите кэш браузера и перезагрузите страницу

### Ошибка "413 Request Entity Too Large" при синхронизации
Увеличьте лимит размера запроса в Nginx:
```bash
nano /etc/nginx/nginx.conf

# Добавьте в секцию http:
client_max_body_size 50M;

# Перезагрузите Nginx
systemctl reload nginx
```

---

## Автоматическое развёртывание (опционально)

Создайте скрипт для быстрого обновления:

```bash
nano /root/update-mchs.sh
```

Содержимое:
```bash
#!/bin/bash
cd /var/www/mchs-tracker
git pull
npm install
npm run build
echo "Обновление завершено: $(date)"
```

Сделайте скрипт исполняемым:
```bash
chmod +x /root/update-mchs.sh
```

Теперь для обновления просто запускайте:
```bash
/root/update-mchs.sh
```

---

## Поддержка

Если возникнут проблемы:
1. Проверьте логи Nginx: `/var/log/nginx/error.log`
2. Проверьте консоль браузера (F12)
3. Убедитесь что все файлы собраны: `ls /var/www/mchs-tracker/dist/`
