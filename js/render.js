/**
 * render.js — Reads DATA (from data.js) and injects HTML into the page.
 * Edit js/data.js to change content; this file handles the templating.
 */

// ── Icon SVG (building) ──────────────────────────────────────────────────────
const BUILDING_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="20" height="20">
    <path d="M3 21h18M9 8h1m4 0h1M9 12h1m4 0h1M9 16h1m4 0h1M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
  </svg>`;

const TROPHY_ICON = `
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>`;

const ARROW_ICON = `
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M7 17L17 7M7 7h10v10"/>
  </svg>`;

// ── Skills ───────────────────────────────────────────────────────────────────
function renderSkills() {
  const container = document.getElementById('skillsGrid');
  if (!container) return;

  container.classList.add('reveal-stagger');

  container.innerHTML = DATA.skills.map(skill => `
    <div class="skill-card">
      <div class="skill-index">${skill.index}</div>
      <div class="skill-name">${skill.name}</div>
      <p class="skill-desc">${skill.desc}</p>
    </div>
  `).join('');
}

// ── Experience ───────────────────────────────────────────────────────────────
function renderExperience() {
  const container = document.getElementById('expList');
  if (!container) return;

  container.innerHTML = DATA.experience.map(exp => `
    <div class="exp-item reveal">
      <div class="exp-icon">${BUILDING_ICON}</div>
      <div class="exp-body">
        <div class="exp-type">${exp.type}</div>
        <div class="exp-title">${exp.title}</div>
        <div class="exp-org">${exp.org}</div>
        <ul class="exp-bullets">
          ${exp.bullets.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
    </div>
  `).join('');
}

// ── Projects ─────────────────────────────────────────────────────────────────
function renderProjects() {
  const container = document.getElementById('projectList');
  if (!container) return;

  container.innerHTML = DATA.projects.map(project => `
    <div class="project-card reveal" onclick="window.open('${project.url}', '_blank')">
      <div class="project-body">
        <div class="project-cat">${project.cat}</div>
        <div class="project-title">${project.title}</div>
        <p class="project-desc">${project.desc}</p>
        <div class="project-tags">
          ${project.tags.map(t => `<span class="tag">${t}</span>`).join('')}
        </div>
      </div>
      <div class="project-arrow">${ARROW_ICON}</div>
    </div>
  `).join('');
}

// ── Honors ───────────────────────────────────────────────────────────────────
function renderHonors() {
  const container = document.getElementById('honorsList');
  if (!container) return;

  container.innerHTML = DATA.honors.map(honor => `
    <div class="honor-card reveal">
      <div class="honor-icon">${TROPHY_ICON}</div>
      <div class="honor-title">${honor.title}</div>
      <p class="honor-desc">${honor.desc}</p>
    </div>
  `).join('');
}

// ── Init ─────────────────────────────────────────────────────────────────────
renderSkills();
renderExperience();
renderProjects();
renderHonors();
