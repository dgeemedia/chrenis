// public/js/main.js
document.addEventListener('DOMContentLoaded', () => {
  // Mobile drawer toggle
  const toggle = document.getElementById('mobile-menu-toggle');
  const drawer = document.getElementById('mobile-drawer');
  const closeBtn = document.getElementById('mobile-drawer-close');

  function openDrawer() {
    if (!drawer) return;
    drawer.style.display = 'block';
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeDrawer() {
    if (!drawer) return;
    drawer.style.display = 'none';
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (toggle) toggle.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  // close when clicking outside drawer-inner
  if (drawer) drawer.addEventListener('click', (e) => {
    if (e.target === drawer) closeDrawer();
  });
  // close with Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeDrawer();
  });

  // mark active nav link
  const navLinks = document.querySelectorAll('.main-nav a');
  const current = window.location.pathname;
  navLinks.forEach(a => {
    if (a.getAttribute('href') === current) {
      a.classList.add('active');
    }
  });

  // progressive enhancement: forms with data-disable-on-submit
  document.querySelectorAll('form[data-disable-on-submit]').forEach(form => {
    form.addEventListener('submit', () => {
      const btn = form.querySelector('button[type="submit"]');
      if (btn) {
        btn.disabled = true;
        const prev = btn.textContent;
        btn.textContent = 'Processing…';
        setTimeout(() => { btn.textContent = prev; btn.disabled = false; }, 10000); // fallback
      }
    });
  });
});
