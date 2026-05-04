const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  siteNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const backToTop = document.querySelector('.back-to-top');
const collegeSection = document.querySelector('#nuestro-colegio');

if (backToTop && collegeSection) {
  const toggleBackToTop = () => {
    const sectionTop = collegeSection.getBoundingClientRect().top + window.scrollY;
    backToTop.classList.toggle('is-visible', window.scrollY >= sectionTop - 120);
  };

  toggleBackToTop();
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  window.addEventListener('resize', toggleBackToTop);
}
