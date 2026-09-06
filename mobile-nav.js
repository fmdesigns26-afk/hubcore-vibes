(() => {
  const header = document.querySelector('.nav');
  const menu = header?.querySelector('.launch-nav');
  const button = header?.querySelector('.mobile-menu-toggle');
  if (!header || !menu || !button) return;

  const closeMenu = () => {
    header.classList.remove('menu-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation menu');
  };

  button.addEventListener('click', () => {
    const willOpen = !header.classList.contains('menu-open');
    header.classList.toggle('menu-open', willOpen);
    button.setAttribute('aria-expanded', String(willOpen));
    button.setAttribute('aria-label', willOpen ? 'Close navigation menu' : 'Open navigation menu');
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('click', (event) => {
    if (header.classList.contains('menu-open') && !header.contains(event.target)) closeMenu();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
      button.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) closeMenu();
  });
})();
