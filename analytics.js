// ТГК Analytics System
// Полная система аналитики с отправкой данных в Telegram

class TGKAnalytics {
  constructor() {
    this.sessionID = this.generateSessionID();
    this.startTime = Date.now();
    this.pageStartTime = Date.now();
    
    // Получить конфиг
    const config = window.ANALYTICS_CONFIG || {
      BOT_TOKEN: '8116984393:AAExSDTBXPc6qI8wZZSAnp04-P0R53y9HcU',
      CHAT_ID: null,
      SEND_INTERVAL: 30000,
      DEBUG_MODE: true,
    };
    
    this.data = {
      session: {
        id: this.sessionID,
        startTime: new Date().toISOString(),
        pageViews: [],
        events: [],
        heatmapData: [],
      },
      user: {},
      device: {},
      behavior: {
        timeOnPage: 0,
        scrollDepth: 0,
        clicks: [],
        mouseMovement: { x: [], y: [] },
        lastActivity: Date.now(),
      },
    };
    
    this.botToken = config.BOT_TOKEN;
    this.chatId = config.CHAT_ID;
    this.debugMode = config.DEBUG_MODE;
    this.sendInterval = config.SEND_INTERVAL;
    this.firstSendDelay = config.FIRST_SEND_DELAY || 2000;
    this.requestCounter = {};
    this.lastSentTime = 0;
    this.getBotInfo();
    
    this.init();
  }

  generateSessionID() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getBotInfo() {
    const styles = {
      success: 'color: #2cbb75; font-weight: bold; font-size: 14px;',
      error: 'color: #e74c3c; font-weight: bold; font-size: 14px;',
      warning: 'color: #f39c12; font-weight: bold; font-size: 14px;',
      info: 'color: #3498db; font-weight: bold; font-size: 14px;',
      code: 'background: #f4f4f4; padding: 2px 4px; border-radius: 3px; font-family: monospace;',
    };

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/getMe`);
      const result = await response.json();
      
      if (result.ok) {
        console.log('%c✅ Telegram Bot подключен: ' + result.result.first_name, styles.success);
        
        if (this.chatId) {
          console.log('%c✅ Chat ID настроен: ' + this.chatId, styles.success);
          console.log('%c✨ Аналитика будет отправляться в Telegram!', styles.success);
        } else {
          console.warn('%c⚠️ Chat ID не настроен!', styles.warning);
          console.warn('%c📌 Чтобы включить аналитику:', styles.warning);
          console.log('%c1. Откройте %canalytics-config.js', styles.info, styles.code);
          console.log('%c2. Найдите строку: %cCHAT_ID: null,', styles.info, styles.code);
          console.log('%c3. Получите свой ID у бота: %c@userinfobot', styles.info, styles.code);
          console.log('%c4. Замените null на ваш ID (например): %cCHAT_ID: 123456789,', styles.info, styles.code);
          console.log('%c📖 Подробные инструкции в файле: %cANALYTICS_SETUP.md', styles.info, styles.code);
        }
      } else {
        console.error('%c❌ Ошибка подключения к боту', styles.error);
        console.error(result);
      }
    } catch (e) {
      console.warn('%c⚠️ Не удалось подключиться к боту', styles.warning);
      console.warn(e.message);
    }
  }

  async init() {
    console.log('🚀 TGK Analytics starting...', this.sessionID);
    this.collectBasicData();
    this.collectDeviceData();
    this.setupEventListeners();
    this.setupPeriodicSend();
    this.trackPageView();
    
    // Отправить первые данные сразу после небольшой задержки
    setTimeout(() => {
      this.sendAnalytics(false, true); // true = первая отправка
    }, this.firstSendDelay);
    
    console.log('✅ TGK Analytics initialized successfully');
  }

  // 1. БАЗОВЫЕ ДАННЫЕ ПОЛЬЗОВАТЕЛЯ
  collectBasicData() {
    try {
      // IP-адрес через публичный API (требует прокси для приватности)
      this.data.user.ipAddress = 'Fetching...';
      fetch('https://api.ipify.org?format=json')
        .then(res => res.json())
        .then(data => {
          this.data.user.ipAddress = data.ip;
          this.getGeoLocation(data.ip);
        })
        .catch(() => { this.data.user.ipAddress = 'Unknown'; });

      // Дата и время
      this.data.user.visitDate = new Date().toISOString();
      this.data.user.timestamp = Date.now();

      // Язык браузера
      this.data.user.language = navigator.language || navigator.userLanguage;
      this.data.user.languages = navigator.languages || [this.data.user.language];

      // Часовой пояс
      this.data.user.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      this.data.user.timezoneOffset = new Date().getTimezoneOffset();

      // Referrer
      this.data.user.referrer = document.referrer || 'direct';
      this.data.user.currentPage = window.location.href;

      // Screen info
      this.data.user.screenResolution = `${screen.width}x${screen.height}`;
      this.data.user.screenColorDepth = screen.colorDepth;
    } catch (e) {
      console.error('Error collecting basic data:', e);
    }
  }

  // Получение геолокации по IP
  async getGeoLocation(ip) {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      const geo = await res.json();
      this.data.user.country = geo.country_name || 'Unknown';
      this.data.user.city = geo.city || 'Unknown';
      this.data.user.latitude = geo.latitude;
      this.data.user.longitude = geo.longitude;
      this.data.user.isp = geo.org || 'Unknown';
    } catch (e) {
      this.data.user.country = 'Unknown';
      this.data.user.city = 'Unknown';
    }
  }

  // 2. ДАННЫЕ УСТРОЙСТВА
  collectDeviceData() {
    try {
      const ua = navigator.userAgent;
      
      // Тип устройства
      if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase())) {
        this.data.device.type = 'Mobile';
      } else if (/tablet|ipad|kindle/i.test(ua.toLowerCase())) {
        this.data.device.type = 'Tablet';
      } else {
        this.data.device.type = 'Desktop';
      }

      // Операционная система
      if (ua.indexOf('Win') > -1) this.data.device.os = 'Windows';
      else if (ua.indexOf('Mac') > -1) this.data.device.os = 'MacOS';
      else if (ua.indexOf('Linux') > -1) this.data.device.os = 'Linux';
      else if (ua.indexOf('Android') > -1) this.data.device.os = 'Android';
      else if (ua.indexOf('iphone') > -1) this.data.device.os = 'iOS';
      else this.data.device.os = 'Unknown';

      // Браузер
      this.data.device.browser = this.detectBrowser(ua);
      this.data.device.userAgent = ua;

      // Разрешение экрана и плотность
      this.data.device.screenResolution = `${window.screen.width}x${window.screen.height}`;
      this.data.device.pixelDepth = window.devicePixelRatio || 1;
      this.data.device.viewportSize = `${window.innerWidth}x${window.innerHeight}`;

      // CPU ядра (Chromium)
      if (navigator.hardwareConcurrency) {
        this.data.device.cpuCores = navigator.hardwareConcurrency;
      }

      // RAM (Chromium)
      if (navigator.deviceMemory) {
        this.data.device.ramGB = navigator.deviceMemory;
      }

      // Тип сети
      if (navigator.connection) {
        this.data.device.networkType = navigator.connection.effectiveType;
        this.data.device.downlink = navigator.connection.downlink;
        this.data.device.saveData = navigator.connection.saveData;
      }

      // Батарея (если доступна)
      if (navigator.getBattery) {
        navigator.getBattery().then(battery => {
          this.data.device.batteryLevel = Math.round(battery.level * 100);
          this.data.device.batteryCharging = battery.charging;
        });
      }

      // WebGL информация
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
          this.data.device.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          this.data.device.gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        }
      } catch (e) {
        this.data.device.gpu = 'Unknown';
      }

      // Поддерживаемые функции
      this.data.device.features = {
        localStorage: typeof(Storage) !== 'undefined',
        sessionStorage: typeof(sessionStorage) !== 'undefined',
        indexedDB: !!window.indexedDB,
        serviceWorker: !!navigator.serviceWorker,
        touchSupport: 'ontouchstart' in window,
        webGL: !!this.getWebGLContext(),
      };
    } catch (e) {
      console.error('Error collecting device data:', e);
    }
  }

  detectBrowser(ua) {
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Chromium') === -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) return 'Safari';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    return 'Unknown';
  }

  getWebGLContext() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  // 3. ПОВЕДЕНЧЕСКАЯ АНАЛИТИКА
  setupEventListeners() {
    // Отслеживание прокрутки (scroll depth)
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
        this.data.behavior.scrollDepth = Math.round(scrollPercent);
      }, 100);
    });

    // Отслеживание движения курсора (heatmap)
    let moveCounter = 0;
    document.addEventListener('mousemove', (e) => {
      moveCounter++;
      if (moveCounter % 10 === 0) { // Каждый 10-й евент
        this.data.behavior.mouseMovement.x.push(e.clientX);
        this.data.behavior.mouseMovement.y.push(e.clientY);
      }
      this.data.behavior.lastActivity = Date.now();
    });

    // Отслеживание кликов
    document.addEventListener('click', (e) => {
      const clickData = {
        timestamp: Date.now(),
        x: e.clientX,
        y: e.clientY,
        element: e.target.tagName,
        elementClass: e.target.className,
        elementId: e.target.id,
        elementText: e.target.innerText ? e.target.innerText.substring(0, 50) : '',
      };
      this.data.behavior.clicks.push(clickData);
      this.trackEvent('click', clickData);
      this.data.behavior.lastActivity = Date.now();
    });

    // Отслеживание времени на странице и ухода
    window.addEventListener('beforeunload', () => {
      this.data.behavior.timeOnPage = Date.now() - this.pageStartTime;
      this.trackEvent('page_leave', {
        timeOnPage: this.data.behavior.timeOnPage,
        lastScrollDepth: this.data.behavior.scrollDepth,
      });
      this.sendAnalytics(true);
    });

    // Отслеживание видимости вкладки
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', { time: new Date().toISOString() });
      } else {
        this.trackEvent('page_visible', { time: new Date().toISOString() });
      }
    });

    // Отслеживание фокуса окна
    window.addEventListener('blur', () => {
      this.trackEvent('window_blur', { time: new Date().toISOString() });
    });

    window.addEventListener('focus', () => {
      this.trackEvent('window_focus', { time: new Date().toISOString() });
    });

    // Отслеживание ошибок
    window.addEventListener('error', (e) => {
      this.trackEvent('js_error', {
        message: e.message,
        source: e.filename,
        line: e.lineno,
        column: e.colno,
      });
    });
  }

  // 4. ОТСЛЕЖИВАНИЕ СОБЫТИЙ
  trackEvent(eventName, eventData = {}) {
    const event = {
      name: eventName,
      timestamp: new Date().toISOString(),
      data: eventData,
      url: window.location.href,
    };
    this.data.session.events.push(event);

    // Логирование в консоль для отладки
    if (this.debugMode) {
      console.log(`📈 [Analytics Event] ${eventName}:`, eventData);
    }
  }

  trackPageView() {
    const pageData = {
      url: window.location.href,
      title: document.title,
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct',
    };
    this.data.session.pageViews.push(pageData);
    this.trackEvent('page_view', pageData);
    this.pageStartTime = Date.now();
  }

  // 5. BROWSER FINGERPRINT
  generateFingerprint() {
    const fingerprint = {
      canvas: this.getCanvasFingerprint(),
      fonts: this.detectFonts(),
      plugins: this.getPlugins(),
      webgl: this.getWebGLFingerprint(),
    };
    return fingerprint;
  }

  getCanvasFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Browser Fingerprint', 2, 15);
      return canvas.toDataURL().substring(0, 50); // First 50 chars
    } catch (e) {
      return 'Unknown';
    }
  }

  detectFonts() {
    const fontList = [
      'Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Courier New',
      'Georgia', 'Palatino', 'Garamond', 'Bookman', 'Comic Sans MS',
      'Trebuchet MS', 'Impact'
    ];
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    
    const detected = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    fontList.forEach(font => {
      ctx.font = `14px '${font}'`;
      try {
        if (ctx.measureText('m').width !== ctx.measureText('m').width) {
          detected.push(font);
        }
      } catch (e) {}
    });
    
    return detected;
  }

  getPlugins() {
    try {
      const plugins = [];
      for (let i = 0; i < navigator.plugins.length; i++) {
        plugins.push(navigator.plugins[i].name);
      }
      return plugins;
    } catch (e) {
      return [];
    }
  }

  getWebGLFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
      };
    } catch (e) {
      return { vendor: 'Unknown', renderer: 'Unknown' };
    }
  }

  // 6. БЕЗОПАСНОСТЬ И МОНИТОРИНГ
  checkSuspiciousActivity() {
    const now = Date.now();
    const clientIp = this.data.user.ipAddress || 'unknown';
    
    if (!this.requestCounter[clientIp]) {
      this.requestCounter[clientIp] = { count: 0, firstRequest: now };
    }

    this.requestCounter[clientIp].count++;

    // Проверка на подозрительные паттерны
    const timeSinceFirstRequest = now - this.requestCounter[clientIp].firstRequest;
    const requestsPerSecond = this.requestCounter[clientIp].count / (timeSinceFirstRequest / 1000);

    if (requestsPerSecond > 10) {
      this.trackEvent('suspicious_activity', {
        type: 'high_request_rate',
        requestsPerSecond: requestsPerSecond.toFixed(2),
        ip: clientIp,
      });
    }

    // Проверка на боты по user agent
    const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget'];
    const isBot = botPatterns.some(pattern => navigator.userAgent.toLowerCase().includes(pattern));
    
    if (isBot) {
      this.trackEvent('bot_detected', {
        userAgent: navigator.userAgent,
      });
    }
  }

  // ОТПРАВКА ДАННЫХ В TELEGRAM
  async sendAnalytics(isFinal = false, isFirstSend = false) {
    try {
      const now = Date.now();
      
      // Не отправлять слишком часто (кроме первой отправки)
      if (!isFinal && !isFirstSend && now - this.lastSentTime < this.sendInterval) {
        return;
      }

      this.lastSentTime = now;
      this.data.behavior.timeOnPage = now - this.pageStartTime;
      this.checkSuspiciousActivity();

      // Добавить fingerprint данные
      this.data.fingerprint = this.generateFingerprint();

      // Формирование сообщения для Telegram
      const message = this.formatTelegramMessage();
      const txtData = this.formatTxtData();

      // Отправка в Telegram
      if (isFirstSend) {
        // Первые данные отправляем как txt файл
        await this.sendAsDocument(txtData, isFirstSend);
      } else {
        // Остальные как HTML сообщение
        await this.sendToTelegram(message);
      }
    } catch (e) {
      console.error('Error sending analytics:', e);
    }
  }

  formatTelegramMessage() {
    const data = this.data;
    const lines = [
      `📊 <b>ТГК Analytics Report</b>`,
      ``,
      `<b>👤 User Data:</b>`,
      `IP: ${data.user.ipAddress}`,
      `Language: ${data.user.language}`,
      `Timezone: ${data.user.timezone}`,
      `Location: ${data.user.country}, ${data.user.city}`,
      `Referrer: ${data.user.referrer}`,
      ``,
      `<b>📱 Device Data:</b>`,
      `Type: ${data.device.type}`,
      `OS: ${data.device.os}`,
      `Browser: ${data.device.browser}`,
      `Screen: ${data.device.screenResolution}`,
      `CPU Cores: ${data.device.cpuCores || 'Unknown'}`,
      `RAM: ${data.device.ramGB ? data.device.ramGB + 'GB' : 'Unknown'}`,
      `Network: ${data.device.networkType || 'Unknown'}`,
      ``,
      `<b>🎯 Behavior:</b>`,
      `Time on Page: ${Math.round(data.behavior.timeOnPage / 1000)}s`,
      `Scroll Depth: ${data.behavior.scrollDepth}%`,
      `Clicks: ${data.behavior.clicks.length}`,
      `Mouse Movements: ${data.behavior.mouseMovement.x.length}`,
      ``,
      `<b>📊 Session:</b>`,
      `Session ID: ${data.session.id}`,
      `Page Views: ${data.session.pageViews.length}`,
      `Events: ${data.session.events.length}`,
      ``,
      `<b>🔗 Current Page:</b>`,
      `${data.user.currentPage}`,
    ];

    // Если данных слишком много, разбить на несколько сообщений
    if (lines.length > 100) {
      return lines.slice(0, 100).join('\n');
    }

    return lines.join('\n');
  }

  formatTxtData() {
    const data = this.data;
    const lines = [
      '═══════════════════════════════════════════════════════════',
      '📊 ТГК ANALYTICS REPORT - ПЕРВАЯ ОТПРАВКА',
      '═══════════════════════════════════════════════════════════',
      '',
      '📋 SESSION INFORMATION',
      '─────────────────────────────────────────────────────────',
      `Session ID: ${data.session.id}`,
      `Start Time: ${data.session.startTime}`,
      `Current URL: ${data.user.currentPage}`,
      '',
      '👤 USER DATA',
      '─────────────────────────────────────────────────────────',
      `IP Address: ${data.user.ipAddress || 'Loading...'}`,
      `Country: ${data.user.country || 'Unknown'}`,
      `City: ${data.user.city || 'Unknown'}`,
      `Language: ${data.user.language}`,
      `Languages: ${(data.user.languages || []).join(', ')}`,
      `Timezone: ${data.user.timezone}`,
      `Timezone Offset: ${data.user.timezoneOffset} min`,
      `Referrer: ${data.user.referrer}`,
      `Visit Date: ${data.user.visitDate}`,
      `Screen Resolution: ${data.user.screenResolution}`,
      `Color Depth: ${data.user.screenColorDepth}`,
      '',
      '📱 DEVICE INFORMATION',
      '─────────────────────────────────────────────────────────',
      `Device Type: ${data.device.type}`,
      `Operating System: ${data.device.os}`,
      `Browser: ${data.device.browser}`,
      `User Agent: ${data.device.userAgent}`,
      `Screen Resolution: ${data.device.screenResolution}`,
      `Viewport Size: ${data.device.viewportSize}`,
      `Pixel Depth: ${data.device.pixelDepth}`,
      `CPU Cores: ${data.device.cpuCores || 'Unknown'}`,
      `RAM: ${data.device.ramGB ? data.device.ramGB + 'GB' : 'Unknown'}`,
      `Network Type: ${data.device.networkType || 'Unknown'}`,
      `Downlink Speed: ${data.device.downlink ? data.device.downlink + 'Mbps' : 'N/A'}`,
      `Save Data: ${data.device.saveData ? 'Enabled' : 'Disabled'}`,
      `Battery Level: ${data.device.batteryLevel ? data.device.batteryLevel + '%' : 'N/A'}`,
      `Battery Charging: ${data.device.batteryCharging ? 'Yes' : 'No'}`,
      `GPU: ${data.device.gpu || 'Unknown'}`,
      `GPU Vendor: ${data.device.gpuVendor || 'Unknown'}`,
      '',
      '✨ SUPPORTED FEATURES',
      '─────────────────────────────────────────────────────────',
      data.device.features ? Object.entries(data.device.features).map(([key, val]) => 
        `${key}: ${val ? '✅' : '❌'}`
      ).join('\n') : 'N/A',
      '',
      '🎯 BEHAVIOR DATA',
      '─────────────────────────────────────────────────────────',
      `Time on Page: ${Math.round(data.behavior.timeOnPage / 1000)}s`,
      `Scroll Depth: ${data.behavior.scrollDepth}%`,
      `Total Clicks: ${data.behavior.clicks.length}`,
      `Mouse Movements Recorded: ${data.behavior.mouseMovement.x.length}`,
      `Last Activity: ${new Date(data.behavior.lastActivity).toISOString()}`,
      '',
      data.behavior.clicks.length > 0 ? '🖱️ RECENT CLICKS\n' +
        '─────────────────────────────────────────────────────────\n' +
        data.behavior.clicks.slice(-5).map((click, i) => 
          `${i + 1}. [${new Date(click.timestamp).toLocaleTimeString()}] ${click.element}${click.elementId ? '#' + click.elementId : ''}${click.elementClass ? '.' + click.elementClass : ''}`
        ).join('\n') +
        '\n' : '',
      '',
      '📊 SESSION ANALYTICS',
      '─────────────────────────────────────────────────────────',
      `Page Views: ${data.session.pageViews.length}`,
      `Total Events Tracked: ${data.session.events.length}`,
      '',
      data.session.pageViews.length > 0 ? '📄 PAGE VIEWS\n' +
        '─────────────────────────────────────────────────────────\n' +
        data.session.pageViews.map((pv, i) => 
          `${i + 1}. ${pv.url}\n   Title: ${pv.title}\n   Time: ${pv.timestamp}`
        ).join('\n\n') +
        '\n' : '',
      '',
      '🌐 BROWSER FINGERPRINT',
      '─────────────────────────────────────────────────────────',
      `Canvas FP: ${data.fingerprint?.canvas?.substring(0, 30) || 'N/A'}...`,
      `Detected Fonts: ${data.fingerprint?.fonts?.length || 0}`,
      `Plugins: ${data.fingerprint?.plugins?.length || 0}`,
      `WebGL: ${data.fingerprint?.webgl ? JSON.stringify(data.fingerprint.webgl).substring(0, 50) : 'N/A'}...`,
      '',
      '═══════════════════════════════════════════════════════════',
      `Report Generated: ${new Date().toISOString()}`,
      '═══════════════════════════════════════════════════════════',
    ];

    return lines.join('\n');
  }

  async sendToTelegram(message) {
    try {
      // Если chat_id не установлен, используем альтернативные методы
      if (!this.chatId) {
        console.warn('⚠️ Chat ID not set. To use analytics:');
        console.log('1. Message bot @sslleikAnalyticsBot with /start');
        console.log('2. Or set chatId in analytics.js');
        return;
      }

      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      
      const payload = {
        chat_id: this.chatId,
        text: message,
        parse_mode: 'HTML',
      };

      console.log('📤 Sending analytics to Telegram:', { chat_id: this.chatId, messageLength: message.length });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log('✅ Analytics sent to Telegram successfully');
      } else {
        console.error('❌ Failed to send analytics:', result.description);
        // Попытка альтернативного способа - отправка как файл
        if (result.description.includes('chat_id')) {
          console.log('📌 Please set correct chat ID in analytics.js');
          console.log('   Find your ID: @userinfobot in Telegram');
        }
      }
    } catch (e) {
      console.error('❌ Error sending to Telegram:', e.message);
      console.log('📝 Analytics data will be logged to console instead');
      console.log('Session data:', this.getFullReport());
    }
  }

  async sendAsDocument(txtData, isFirstSend = false) {
    try {
      if (!this.chatId) {
        console.warn('⚠️ Chat ID not set');
        console.log('📝 First data logged to console:');
        console.log(txtData);
        return;
      }

      const url = `https://api.telegram.org/bot${this.botToken}/sendDocument`;
      
      // Создаём Blob с текстовыми данными
      const blob = new Blob([txtData], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('chat_id', this.chatId);
      formData.append('document', blob, 'analytics-first-data.txt');
      formData.append('caption', isFirstSend ? '📊 <b>Analytics First Data Report</b>\n\nПолный отчет аналитики содержится в файле ниже' : '📊 Analytics Data Report');
      formData.append('parse_mode', 'HTML');

      console.log('📤 Sending first analytics as TXT file:', { chat_id: this.chatId, fileSize: txtData.length });

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      
      if (result.ok) {
        console.log('✅ Analytics file sent to Telegram successfully');
      } else {
        console.error('❌ Failed to send analytics file:', result.description);
      }
    } catch (e) {
      console.error('❌ Error sending file to Telegram:', e.message);
      console.log('📝 Analytics data:');
      console.log(txtData);
    }
  }

  setupPeriodicSend() {
    // Отправлять данные каждые 30 секунд
    setInterval(() => {
      this.sendAnalytics();
    }, this.sendInterval);
  }

  // Методы для отслеживания конкретных событий
  trackButtonClick(buttonElement) {
    this.trackEvent('button_click', {
      buttonText: buttonElement.innerText,
      buttonId: buttonElement.id,
      buttonClass: buttonElement.className,
    });
  }

  trackFormSubmit(formElement) {
    this.trackEvent('form_submit', {
      formId: formElement.id,
      formName: formElement.name,
      fieldCount: formElement.querySelectorAll('input, textarea, select').length,
    });
  }

  trackLink(linkElement) {
    this.trackEvent('link_click', {
      href: linkElement.href,
      text: linkElement.innerText,
      target: linkElement.target,
    });
  }

  trackVideo(videoElement) {
    this.trackEvent('video_play', {
      src: videoElement.src,
      duration: videoElement.duration,
    });
  }

  trackDownload(filename) {
    this.trackEvent('file_download', {
      filename: filename,
      timestamp: new Date().toISOString(),
    });
  }

  // Получить полный отчет
  getFullReport() {
    return {
      sessionID: this.sessionID,
      sessionDuration: Date.now() - this.startTime,
      data: this.data,
    };
  }

  // Экспортировать данные
  exportData(format = 'json') {
    if (format === 'json') {
      return JSON.stringify(this.getFullReport(), null, 2);
    } else if (format === 'csv') {
      // Простой CSV экспорт
      let csv = 'Session ID,Duration,Events Count\n';
      csv += `${this.sessionID},${Date.now() - this.startTime},${this.data.session.events.length}\n`;
      return csv;
    }
  }
}

// Инициализация аналитики
let analytics;
document.addEventListener('DOMContentLoaded', () => {
  analytics = new TGKAnalytics();
  console.log('TGK Analytics initialized');
});

// Экспорт для использования в других скриптах
window.TGKAnalytics = analytics;
