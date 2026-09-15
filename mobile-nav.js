(() => {
  const removeLegacyText = () => {
    if (!document.body) return;
    [...document.body.childNodes].forEach(node => {
      if (node.nodeType !== Node.TEXT_NODE) return;
      const value = (node.textContent || '').trim();
      if (value === '\\n' || value === '\\' || value === 'n') node.remove();
    });
  };

  removeLegacyText();

  const header = document.querySelector('.nav');
  const menu = header?.querySelector('.launch-nav');
  const button = header?.querySelector('.mobile-menu-toggle');
  if (!header || !menu || !button) return;

  const closeMenu = () => {
    header.classList.remove('menu-open');
    document.body.classList.remove('mobile-menu-open');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation menu');
  };

  const openMenu = () => {
    header.classList.add('menu-open');
    document.body.classList.add('mobile-menu-open');
    button.setAttribute('aria-expanded', 'true');
    button.setAttribute('aria-label', 'Close navigation menu');
  };

  button.addEventListener('click', () => {
    if (header.classList.contains('menu-open')) closeMenu();
    else openMenu();
  });

  menu.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });

  document.addEventListener('click', event => {
    if (header.classList.contains('menu-open') && !header.contains(event.target)) closeMenu();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && header.classList.contains('menu-open')) {
      closeMenu();
      button.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) closeMenu();
  });
})();
