// ТГК Analytics Config
// ВАЖНО: Установите свои значения здесь для корректной отправки аналитики

const ANALYTICS_CONFIG = {
  // Telegram Bot Token (не добавляйте в публичные репозитории!)
  BOT_TOKEN: '8116984393:AAExSDTBXPc6qI8wZZSAnp04-P0R53y9HcU',
  
  // Ваш Telegram User ID или Chat ID
  // Как найти:
  // 1. Напишите боту @userinfobot в Telegram - он пришлёт ваш ID
  // 2. Или используйте @getidsbot
  CHAT_ID: 1355427490, // ← УСТАНОВИТЕ ЗДЕСЬ ВАШ ID (например: 123456789)
  
  // Интервал отправки данных (в миллисекундах)
  SEND_INTERVAL: 3600000, // 1 час
  
  // Задержка перед отправкой первых данных (в миллисекундах)
  FIRST_SEND_DELAY: 2000, // 2 секунды
  
  // Отправлять ли данные в консоль браузера для отладки
  DEBUG_MODE: true,
  
  // Минимальное время перед отправкой (для оптимизации)
  MIN_SEND_INTERVAL: 5000, // 5 секунд
  
  // Максимальный размер одного сообщения в Telegram
  MAX_MESSAGE_SIZE: 4096,
  
  // Отправлять ли полные данные или сокращённые
  FULL_DATA: false,
  
  // События для отслеживания
  EVENTS_TO_TRACK: {
    clicks: true,
    scrolls: true,
    errors: true,
    navigation: true,
    interactions: true,
  },
};

// Инструкция по настройке:
// ========================
// 1. Откройте Telegram и найдите бота @userinfobot
// 2. Напишите ему /start - вы получите ваш User ID
// 3. Замените null на ваш ID: CHAT_ID: 123456789
// 4. Перезагрузите страницу сайта
// 5. Проверьте консоль браузера (F12) на сообщения о отправке
// 6. Если всё работает, вы будете получать сообщения в Telegram

// Альтернативный способ для канала/группы:
// 1. Создайте группу или канал в Telegram
// 2. Добавьте бота
// 3. Используйте @getidsbot чтобы получить ID канала
// 4. ID канала обычно выглядит как: -1001234567890

console.log('📊 Analytics Config loaded. CHAT_ID is ' + (ANALYTICS_CONFIG.CHAT_ID ? '✅ set' : '❌ NOT SET'));
console.log('   To enable analytics, set CHAT_ID in analytics-config.js');
