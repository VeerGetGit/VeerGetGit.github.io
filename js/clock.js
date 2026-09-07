/**
 * clock.js — Live IST clock displayed in the contact section.
 */

(function () {
  const el = document.getElementById('clock');
  if (!el) return;

  function update() {
    const now = new Date();
    const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const h   = ist.getHours();
    const m   = String(ist.getMinutes()).padStart(2, '0');
    const s   = String(ist.getSeconds()).padStart(2, '0');
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12  = String(h % 12 || 12).padStart(2, '0');

    el.innerHTML = `<span class="live">${h12}:${m}:${s} ${ampm}</span>`;
  }

  update();
  setInterval(update, 1000);
})();
