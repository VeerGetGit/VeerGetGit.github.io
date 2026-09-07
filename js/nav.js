/**
 * nav.js — Sticky nav: scroll class, active link highlighting, hamburger toggle.
 */

(function () {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  const links     = navLinks.querySelectorAll('.nav-link');

  // Scroll → add .scrolled class
  function onScroll() {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
    highlightActive();
  }

  // Highlight the nav link whose section is currently in view
  function highlightActive() {
    const fromTop = window.scrollY + 80;

    links.forEach(link => {
      const section = document.querySelector(link.getAttribute('href'));
      if (!section) return;
      const top    = section.offsetTop;
      const bottom = top + section.offsetHeight;

      link.classList.toggle('active', fromTop >= top && fromTop < bottom);
    });
  }

  // Hamburger toggle
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  // Close mobile menu when a link is clicked
  links.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
})();
