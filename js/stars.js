/**
 * stars.js — Animated canvas star field for the hero section.
 */

(function () {
  const canvas = document.getElementById('starCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let stars = [];
  let W, H, raf;

  const STAR_COUNT  = 80;
  const STAR_COLOR  = '96, 165, 250'; // blue-light rgb
  const TWINKLE_SPD = 0.006;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildStars();
  }

  function buildStars() {
    stars = Array.from({ length: STAR_COUNT }, () => ({
      x:       Math.random() * W,
      y:       Math.random() * H,
      r:       Math.random() * 1.5 + 0.4,
      alpha:   Math.random(),
      dAlpha:  (Math.random() - 0.5) * TWINKLE_SPD,
    }));
  }

  function tick() {
    ctx.clearRect(0, 0, W, H);

    for (const s of stars) {
      s.alpha += s.dAlpha;
      if (s.alpha <= 0.05 || s.alpha >= 0.9) s.dAlpha *= -1;
      s.alpha = Math.max(0.05, Math.min(0.9, s.alpha));

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${STAR_COLOR}, ${s.alpha.toFixed(2)})`;
      ctx.fill();
    }

    raf = requestAnimationFrame(tick);
  }

  const ro = new ResizeObserver(() => resize());
  ro.observe(canvas.parentElement);
  resize();
  tick();

  // Pause when tab is hidden (battery-friendly)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else tick();
  });
})();
