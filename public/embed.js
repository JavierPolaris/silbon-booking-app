// public/embed.js en tu app en Vercel
(function () {
  if (window.bookingModal) return;

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
    open: () => { iframe.style.display = 'block'; },
    close: () => { iframe.style.display = 'none'; }
  };

  window.addEventListener('message', (event) => {
    if (event.data === 'bookingModalClose') {
      window.bookingModal.close();
    }
  });
})();
