/**
 * reveal.js — IntersectionObserver-based scroll reveal.
 * Elements with class "reveal" or "reveal-stagger" animate in when visible.
 * Must run after render.js so injected cards are in the DOM.
 */

(function () {
  const THRESHOLD = 0.12;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target); // fire once
      }
    });
  }, { threshold: THRESHOLD });

  function observe() {
    document.querySelectorAll('.reveal, .reveal-stagger').forEach(el => {
      observer.observe(el);
    });
  }

  // Run once DOM-injected cards exist
  observe();

  // Also observe after a short delay to catch any late-rendered elements
  setTimeout(observe, 200);
})();
