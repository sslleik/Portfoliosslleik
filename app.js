document.addEventListener('DOMContentLoaded', () => {
  // Плавный скролл по якорям (включая кнопку hero-ghost)
  const scrollTriggers = document.querySelectorAll('a[href^="#"], .hero-ghost');

  scrollTriggers.forEach((el) => {
    el.addEventListener('click', (event) => {
      const targetAttr = el.tagName.toLowerCase() === 'a'
        ? el.getAttribute('href')
        : el.getAttribute('data-scroll');

      if (!targetAttr || !targetAttr.startsWith('#')) return;

      const targetElement = document.querySelector(targetAttr);
      if (!targetElement) return;

      event.preventDefault();
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  // Копирование @ника в буфер
  const copyButtons = document.querySelectorAll('.copy-handle');

  copyButtons.forEach((button) => {
    button.addEventListener('click', async () => {
      const handle = button.dataset.handle;
      if (!handle) return;

      const originalText = button.textContent;

      const setCopiedState = () => {
        button.textContent = 'Скопировано!';
        button.classList.add('copied');
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('copied');
        }, 1500);
      };

      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(handle);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = handle;
          textarea.style.position = 'fixed';
          textarea.style.opacity = '0';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
        setCopiedState();
      } catch (e) {
        console.error('Не удалось скопировать ник:', e);
      }
    });
  });

  // Вкладки каталога
  const tabButtons = document.querySelectorAll('.tab-btn');
  const catalogColumns = document.querySelectorAll('.catalog-column');

  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab || 'all';

      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      catalogColumns.forEach((col) => {
        const group = col.dataset.tabGroup || 'all';
        if (tab === 'all' || tab === group) {
          col.style.display = '';
        } else {
          col.style.display = 'none';
        }
      });
    });
  });

  // Отдельные вкладки с подробным описанием каналов
  const channelTabs = document.querySelectorAll('.channel-tab');
  const channelPanels = document.querySelectorAll('.channel-panel');

  channelTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const panelId = tab.dataset.panel;
      if (!panelId) return;

      channelTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      channelPanels.forEach((panel) => {
        if (panel.dataset.panel === panelId) {
          panel.classList.add('active');
        } else {
          panel.classList.remove('active');
        }
      });
    });
  });
});

