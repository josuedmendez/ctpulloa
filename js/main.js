const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const navSubmenuToggles = document.querySelectorAll('.nav-submenu-toggle');

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

navSubmenuToggles.forEach(toggle => {
  const navItem = toggle.closest('.nav-item');

  toggle.addEventListener('click', event => {
    if (!navItem) return;

    event.stopPropagation();
    const isOpen = navItem.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(isOpen));
  });
});

document.addEventListener('click', event => {
  navSubmenuToggles.forEach(toggle => {
    const navItem = toggle.closest('.nav-item');

    if (navItem && !navItem.contains(event.target)) {
      navItem.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
});

const backToTop = document.querySelector('.back-to-top');
const collegeSection = document.querySelector('#nuestro-colegio');

if (backToTop) {
  const toggleBackToTop = () => {
    const sectionTop = collegeSection
      ? collegeSection.getBoundingClientRect().top + window.scrollY
      : 320;
    backToTop.classList.toggle('is-visible', window.scrollY >= sectionTop - 120);
  };

  toggleBackToTop();
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  window.addEventListener('resize', toggleBackToTop);
}

document.querySelectorAll('[data-carousel]').forEach(carousel => {
  const slides = Array.from(carousel.querySelectorAll('.carousel-person'));
  const dotsWrap = carousel.querySelector('.carousel-dots');
  const intervalDuration = 1500;
  let autoplay = null;
  let current = slides.findIndex(slide => slide.classList.contains('is-active'));

  if (!slides.length || !dotsWrap) return;

  if (current < 0) current = 0;

  const dots = slides.map((_, index) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.type = 'button';
    dot.setAttribute('aria-label', `Ver persona ${index + 1}`);
    dot.addEventListener('click', () => {
      updateCarousel(index);
      restartAutoplay();
    });
    dotsWrap.appendChild(dot);
    return dot;
  });

  const getPrevIndex = index => (index - 1 + slides.length) % slides.length;
  const getNextIndex = index => (index + 1) % slides.length;
  const showNextSlide = () => updateCarousel(getNextIndex(current));

  function updateCarousel(index) {
    current = index;
    const prev = getPrevIndex(current);
    const next = getNextIndex(current);
    const hasSiblings = slides.length > 1;

    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === current);
      slide.classList.toggle('is-prev', hasSiblings && slideIndex === prev);
      slide.classList.toggle('is-next', hasSiblings && slideIndex === next);
      slide.setAttribute('aria-pressed', String(slideIndex === current));
    });

    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle('is-active', dotIndex === current);
      dot.setAttribute('aria-current', dotIndex === current ? 'true' : 'false');
    });
  }

  function startAutoplay() {
    if (slides.length < 2) return;
    stopAutoplay();
    autoplay = window.setInterval(showNextSlide, intervalDuration);
  }

  function stopAutoplay() {
    if (!autoplay) return;

    window.clearInterval(autoplay);
    autoplay = null;
  }

  function restartAutoplay() {
    stopAutoplay();
    startAutoplay();
  }

  slides.forEach((slide, index) => {
    slide.addEventListener('click', () => {
      updateCarousel(index);
      restartAutoplay();
    });
  });

  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);

  updateCarousel(current);
  startAutoplay();
});
