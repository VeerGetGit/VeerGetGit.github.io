/**
 * contact.js — Contact form: validation + mailto submission.
 */

(function () {
  const form    = document.getElementById('contactForm');
  const msgEl   = document.getElementById('formMsg');
  const nameIn  = document.getElementById('f-name');
  const emailIn = document.getElementById('f-email');
  const msgIn   = document.getElementById('f-message');

  if (!form) return;

  function setMsg(text, type) {
    msgEl.textContent  = text;
    msgEl.className    = 'form-message ' + type;
  }

  function clearError(input) {
    input.classList.remove('error');
  }

  function validateEmail(val) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  }

  [nameIn, emailIn, msgIn].forEach(input =>
    input.addEventListener('input', () => clearError(input))
  );

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const name  = nameIn.value.trim();
    const email = emailIn.value.trim();
    const msg   = msgIn.value.trim();

    // Validate
    let hasError = false;

    if (!name) {
      nameIn.classList.add('error');
      hasError = true;
    }
    if (!email || !validateEmail(email)) {
      emailIn.classList.add('error');
      hasError = true;
    }
    if (!msg) {
      msgIn.classList.add('error');
      hasError = true;
    }

    if (hasError) {
      setMsg('Please fill in all fields correctly.', 'error');
      return;
    }

    // Build mailto
    const subject  = encodeURIComponent(`Portfolio Contact from ${name}`);
    const body     = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${msg}`);
    const mailto   = `mailto:harshveerstar1@gmail.com?subject=${subject}&body=${body}`;

    window.location.href = mailto;
    setMsg('Opening your mail app…', 'success');

    // Reset after delay
    setTimeout(() => {
      form.reset();
      setMsg('', '');
    }, 3000);
  });
})();
