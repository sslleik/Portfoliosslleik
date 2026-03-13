class TGKAnalyticsBasic {
  constructor() {
    this.sessionID = this.generateSessionID();
    this.startTime = Date.now();
    const config = window.ANALYTICS_CONFIG || {
      BOT_TOKEN: '8116984393:AAExSDTBXPc6qI8wZZSAnp04-P0R53y9HcU',
      CHAT_ID: null,
      SEND_INTERVAL: 3600000,
      DEBUG_MODE: true,
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
    if (this.debugMode) {
      console.log('TGK Analytics Basic starting...', this.sessionID);
      console.log('botToken:', this.botToken ? 'SET' : 'NOT SET');
      console.log('chatId:', this.chatId);
    }
  }

  async init() {
    this.collectBasicData();
    setTimeout(() => {
      this.sendData();
    }, this.firstSendDelay);

    // Send data periodically
    setInterval(() => {
      this.sendData();
    }, this.sendInterval);
  }

  collectBasicData() {
    this.data = {
      session: {
        id: this.sessionID,
        startTime: new Date().toISOString(),
        pageViews: [{
          url: window.location.href,
          timestamp: Date.now(),
        }],
      },
      basicInfo: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
      },
    };
    if (this.debugMode) {
      console.log('Basic data collected:', this.data);
    }
  }

  async sendData() {
    if (!this.botToken || !this.chatId) {
      if (this.debugMode) console.warn('Bot token or chat ID not set');
      return;
    }

    const now = Date.now();
    if (now - this.lastSentTime < 5000) {
      if (this.debugMode) console.log('Too soon to send again');
      return;
    }
    this.lastSentTime = now;

    const message = this.formatMessage();

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text: message,
          parse_mode: 'Markdown',
        }),
      });

      if (response.ok) {
        if (this.debugMode) console.log('Analytics sent to Telegram successfully');
      } else {
        if (this.debugMode) console.error('Failed to send analytics:', response.status);
      }
    } catch (e) {
      if (this.debugMode) console.error('Error sending analytics:', e);
    }
  }

  formatMessage() {
    const d = this.data;
    return `📊 *TGK Basic Analytics*

*Session ID:* ${d.session.id}
*Start Time:* ${d.session.startTime}
*Page Views:* ${d.session.pageViews.length}
*Current Page:* ${d.session.pageViews[0].url}
*User Agent:* ${d.basicInfo.userAgent}
*Language:* ${d.basicInfo.language}
*Platform:* ${d.basicInfo.platform}
*Timestamp:* ${new Date().toISOString()}`;
  }
}

// Auto-init
let analytics;
if (typeof window !== 'undefined') {
  analytics = new TGKAnalyticsBasic();
  window.TGKAnalytics = analytics;
}