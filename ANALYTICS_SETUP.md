# 📊 ТГК Analytics - Инструкция по настройке

## Проблема: Данные не отправляются в Telegram

Это происходит потому, что нужно установить правильный `CHAT_ID` - это ваш уникальный ID в Telegram.

## Решение в 3 шага:

### Шаг 1: Получить ваш Telegram User ID

**Способ 1 (рекомендуется):**
1. Откройте Telegram
2. Найдите бота `@userinfobot`
3. Напишите ему `/start`
4. Бот пришлёт вам ваш User ID (обычно 9-10 цифр)
5. Скопируйте этот ID

**Способ 2:**
1. Найдите бота `@getidsbot`
2. Напишите `/start`
3. Скопируйте ваш ID

**Способ 3 (для канала/группы):**
1. Добавьте бота в канал или группу
2. Используйте `@getidsbot` чтобы получить ID канала
3. ID канала обычно начинается с `-100` (например: `-1001234567890`)

### Шаг 2: Открыть файл `analytics-config.js`

В корне вашего проекта найдите файл `analytics-config.js` и откройте его в редакторе.

### Шаг 3: Установить CHAT_ID

Найдите строку:
```javascript
CHAT_ID: null, // ← УСТАНОВИТЕ ЗДЕСЬ ВАШ ID (например: 123456789)
```

Замените `null` на ваш ID:
```javascript
CHAT_ID: 123456789, // Ваш реальный ID
```

**Пример 1 (личный аккаунт):**
```javascript
CHAT_ID: 987654321,
```

**Пример 2 (канал):**
```javascript
CHAT_ID: -1001234567890,
```

### Шаг 4: Перезагрузить страницу

1. Сохраните файл `analytics-config.js`
2. Обновите страницу сайта (Ctrl+R или Cmd+R)
3. Откройте консоль браузера (F12 или Ctrl+Shift+I)
4. Вы должны увидеть сообщение:
   ```
   ✅ Bot connected: TGK_Bot
   ✅ Chat ID configured: 123456789
   ```

## Проверка работы

### В консоли браузера (F12)

Должны появиться сообщения:
```
🚀 TGK Analytics starting... [session-id]
✅ Bot connected: TGK_Bot
✅ Chat ID configured: 123456789
✅ TGK Analytics initialized successfully
📤 Sending analytics to Telegram: {chat_id: 123456789, messageLength: 2850}
✅ Analytics sent to Telegram successfully
```

### В Telegram

Вы начнёте получать сообщения с данными аналитики, например:
```
📊 ТГК Analytics Report

👤 User Data:
IP: 192.168.1.100
Language: ru-RU
Timezone: Europe/Moscow
Location: Russia, Moscow
...
```

## Если всё ещё не работает

### Проверка 1: Неправильный CHAT_ID

```bash
# Убедитесь что ID правильный
❌ CHAT_ID: "123456789"    # неправильно - строка
✅ CHAT_ID: 123456789       # правильно - число
```

### Проверка 2: Бот не добавлен в группу

Если используете ID группы/канала, добавьте бота в группу:
1. Перейдите в группу
2. Нажмите на название группы
3. Выберите "Добавить участника"
4. Найдите бота по токену

### Проверка 3: Интернет соединение

```javascript
// В консоли браузера проверьте:
fetch('https://api.telegram.org/bot8542793603:AAG2brS5_L7JhBSTvNuo0938ujzqNSFGrZg/getMe')
  .then(r => r.json())
  .then(d => console.log(d))
```

### Проверка 4: Консоль браузера

Откройте F12 и посмотрите вкладку "Console" на ошибки:
- `❌ Bot connection failed` - проблема с токеном
- `❌ Failed to send analytics` - проблема с chat_id
- `⚠️ Chat ID not set` - забыли установить CHAT_ID

## Параметры конфига

```javascript
const ANALYTICS_CONFIG = {
  // Telegram Bot Token
  BOT_TOKEN: '8542793603:AAG2brS5_L7JhBSTvNuo0938ujzqNSFGrZg',
  
  // Ваш Telegram ID или ID группы/канала
  CHAT_ID: null, // Установите здесь ваш ID
  
  // Интервал отправки (миллисекунды)
  SEND_INTERVAL: 30000, // 30 секунд
  
  // Отладка в консоли
  DEBUG_MODE: true, // true = логировать всё, false = тихо
  
  // Минимальный интервал между отправками
  MIN_SEND_INTERVAL: 5000,
  
  // Максимум символов в одном сообщении Telegram
  MAX_MESSAGE_SIZE: 4096,
  
  // Отправлять полные данные или сокращённые
  FULL_DATA: false,
};
```

## Улучшения безопасности

⚠️ **ВАЖНО:** Никогда не добавляйте этот файл в публичный репозиторий!

Если используете Git:
```bash
# Добавьте в .gitignore:
analytics-config.js
```

Для продакшена используйте:
1. Backend endpoint для получения chat_id
2. Environment переменные для хранения токена
3. Шифрование данных при передаче

## Отключение аналитики

Если не используете аналитику, просто:
```javascript
// В analytics-config.js установите:
CHAT_ID: null,
DEBUG_MODE: false,
```

Сайт будет работать без отправки данных, но сбор информации продолжится.

## Поддержка

Если возникли проблемы:
1. Проверьте консоль браузера (F12 → Console)
2. Убедитесь что CHAT_ID число, а не строка
3. Убедитесь что интернет соединение работает
4. Пересчитайте сессию (Ctrl+Shift+Del → Clear browsing data)
