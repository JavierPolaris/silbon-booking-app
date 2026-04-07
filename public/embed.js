// public/embed.js en tu app en Vercel
(function () {
  if (window.bookingModal) return;

  function toggleZendeskWidget(isVisible) {
    const command = isVisible ? 'show' : 'hide';

    if (typeof window.zE === 'function') {
      try {
        window.zE('webWidget', command);
      } catch (error) {
        console.warn('No se pudo actualizar Zendesk webWidget:', error);
      }

      try {
        window.zE('messenger', command);
      } catch (error) {
        console.warn('No se pudo actualizar Zendesk messenger:', error);
      }
    }

    const fallbackSelectors = [
      '[id*="launcher"]',
      '[class*="launcher"]',
      'iframe[title*="Zendesk"]',
      'iframe[src*="zendesk"]'
    ];

    fallbackSelectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        element.style.display = isVisible ? '' : 'none';
      });
    });
  }

  function notifyIframe(message) {
    iframe.contentWindow?.postMessage(message, '*');
  }

  const iframe = document.createElement('iframe');
  iframe.src = 'https://silbon-booking-app.vercel.app';
  iframe.id = 'booking-modal-frame';
  iframe.style.cssText = `
    position: fixed;
    z-index: 9999;
    top: 0; left: 0;
    width: 100vw;
    height: 100vh;
    border: none;
    display: none;
    background: rgba(0,0,0,0.5);
  `;

  document.body.appendChild(iframe);

  window.bookingModal = {
    open: () => {
      iframe.style.display = 'block';
      toggleZendeskWidget(false);
      notifyIframe('openBookingModal');
    },
    close: () => {
      iframe.style.display = 'none';
      toggleZendeskWidget(true);
    }
  };

  window.addEventListener('message', (event) => {
    if (event.data === 'bookingModalClose') {
      window.bookingModal.close();
    }
  });
})();
