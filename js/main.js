const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const navSubmenuToggles = document.querySelectorAll('.nav-submenu-toggle');

const closeSubmenus = exceptItem => {
  navSubmenuToggles.forEach(toggle => {
    const navItem = toggle.closest('.nav-item');

    if (navItem && navItem !== exceptItem) {
      navItem.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
    }
  });
};

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));

    if (!isOpen) {
      closeSubmenus();
    }
  });

  siteNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      closeSubmenus();
    });
  });
}

navSubmenuToggles.forEach(toggle => {
  const navItem = toggle.closest('.nav-item');

  toggle.addEventListener('click', event => {
    if (!navItem) return;

    event.stopPropagation();
    closeSubmenus(navItem);
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
      : 140;
    backToTop.classList.toggle('is-visible', window.scrollY >= Math.max(80, sectionTop - 120));
  };

  backToTop.addEventListener('click', event => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  toggleBackToTop();
  window.addEventListener('scroll', toggleBackToTop, { passive: true });
  window.addEventListener('resize', toggleBackToTop);
}

document.querySelectorAll('[data-carousel]').forEach(carousel => {
  const slides = Array.from(carousel.querySelectorAll('.carousel-person'));
  const dotsWrap = carousel.querySelector('.carousel-dots');
  const profileCard = carousel.querySelector('[data-profile-card]');
  const profileImage = profileCard?.querySelector('[data-profile-image]');
  const profileImagePlaceholder = profileCard?.querySelector('[data-profile-image-placeholder]');
  const profileName = profileCard?.querySelector('[data-profile-name]');
  const profileEmail = profileCard?.querySelector('[data-profile-email]');
  const profileClose = profileCard?.querySelector('[data-profile-close]');
  const profileGroup = profileCard?.dataset.profileGroup || 'equipo institucional';
  const intervalDuration = 1500;
  let autoplay = null;
  let isProfileOpen = false;
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

      if (isProfileOpen) {
        openProfile(slides[index]);
      } else {
        restartAutoplay();
      }
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
    if (slides.length < 2 || isProfileOpen) return;
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

  function openProfile(slide) {
    if (!profileCard || !profileImage || !profileName || !profileEmail) return;

    const sourceImage = slide.querySelector('img');
    const name = slide.dataset.profileName;
    const email = slide.dataset.profileEmail;
    const initials = slide.dataset.profileInitials;

    if ((!sourceImage && !initials) || !name || !email) return;

    isProfileOpen = true;
    stopAutoplay();
    carousel.classList.add('is-profile-open');

    if (sourceImage) {
      profileImage.src = sourceImage.currentSrc || sourceImage.src;
      profileImage.alt = `Perfil de ${name}, integrante del ${profileGroup}`;
      profileImage.hidden = false;

      if (profileImagePlaceholder) {
        profileImagePlaceholder.hidden = true;
      }
    } else if (profileImagePlaceholder) {
      profileImage.removeAttribute('src');
      profileImage.alt = '';
      profileImage.hidden = true;
      profileImagePlaceholder.textContent = initials;
      profileImagePlaceholder.hidden = false;
    }

    profileName.textContent = name;
    profileEmail.textContent = email;
    profileEmail.href = `mailto:${email}`;
    profileCard.hidden = false;
  }

  function closeProfile() {
    if (!profileCard) return;

    isProfileOpen = false;
    profileCard.hidden = true;
    carousel.classList.remove('is-profile-open');
    slides[current]?.focus();
    startAutoplay();
  }

  slides.forEach((slide, index) => {
    slide.addEventListener('click', () => {
      updateCarousel(index);

      if (profileCard) {
        openProfile(slide);
      } else {
        restartAutoplay();
      }
    });
  });

  profileClose?.addEventListener('click', closeProfile);

  carousel.addEventListener('focusin', stopAutoplay);
  carousel.addEventListener('focusout', startAutoplay);

  updateCarousel(current);
  startAutoplay();
});

const partnerMessages = {
  amazon: {
    title: 'Amazon',
    logo: 'assets/img/empresa-amazon.png',
    message:
      'Amazon ha representado una puerta de aprendizaje real para estudiantes del CTP Ulloa, especialmente en áreas donde la disciplina, el servicio y la tecnología se encuentran. Varias prácticas profesionales han fortalecido la confianza de nuestros jóvenes para incorporarse a ambientes laborales exigentes y con visión global.',
    signature: '-- Lic. Josué Méndez, Jefe de TI',
  },
  microsoft: {
    title: 'Microsoft',
    logo: 'assets/img/empresa-microsoft.png',
    message:
      'La relación con Microsoft inspira a nuestra comunidad educativa a mirar la tecnología como una herramienta para crear, resolver y colaborar. Su presencia motiva a estudiantes a fortalecer competencias digitales que luego aplican en sus prácticas, proyectos y primeros pasos profesionales.',
    signature: '-- M.Sc. Valeria Solano, Coordinadora Académica',
  },
  eminsa: {
    title: 'Grupo Eminsa',
    logo: 'assets/img/empresa-eminsa.png',
    message:
      'Grupo Eminsa ha sido un aliado cercano para que estudiantes vivan procesos de práctica profesional con acompañamiento, responsabilidad y sentido de pertenencia. Esa apertura ha permitido que jóvenes del colegio descubran sus fortalezas y proyecten una carrera con mayor seguridad.',
    signature: '-- Ing. Roberto Cordero, Enlace Empresarial',
  },
  zurcher: {
    title: 'Zurcher',
    logo: 'assets/img/empresa-zurcher.png',
    message:
      'Zurcher ha mantenido una relación positiva con el CTP Ulloa al valorar el talento joven, la puntualidad y el compromiso de nuestros estudiantes. Cada experiencia compartida confirma que la formación técnica puede convertirse en una oportunidad concreta de crecimiento laboral.',
    signature: '-- Licda. Mariana Rojas, Orientadora Vocacional',
  },
  cisco: {
    title: 'Cisco',
    logo: 'assets/img/empresa-cisco.png',
    message:
      'Cisco ha sido un referente importante para estudiantes interesados en redes, conectividad y soluciones tecnológicas. Su vínculo con la formación técnica del CTP Ulloa impulsa a los jóvenes a pensar en certificaciones, práctica profesional y empleabilidad con estándares internacionales.',
    signature: '-- Prof. Daniel Vargas, Docente de Redes',
  },
  intel: {
    title: 'Intel',
    logo: 'assets/img/empresa-intel.png',
    message:
      'Intel simboliza innovación, excelencia y futuro para muchos estudiantes del CTP Ulloa. La buena relación con esta empresa refuerza el valor de prepararse bien, cuidar los detalles y asumir la práctica profesional como una etapa decisiva para abrir nuevas posibilidades.',
    signature: '-- Ing. Natalia Araya, Gestora de Innovación',
  },
  garnier: {
    title: 'Garnier',
    logo: 'assets/img/empresa-garnier.png',
    message:
      'Garnier ha brindado espacios donde estudiantes pueden comprender la importancia del diseño, la comunicación y el trabajo con clientes reales. Esa cercanía con el mundo profesional fortalece la creatividad y ayuda a que nuestros jóvenes lleguen mejor preparados a sus retos laborales.',
    signature: '-- Lic. Andrés Calderón, Coordinador de Diseño',
  },
  eaton: {
    title: 'Eaton',
    logo: 'assets/img/empresa-eaton.png',
    message:
      'Eaton ha sido una empresa clave para que estudiantes técnicos visualicen oportunidades en entornos industriales modernos. La experiencia de práctica y la posibilidad de crecimiento dentro de la empresa han dejado una huella muy positiva en la comunidad del CTP Ulloa.',
    signature: '-- Ing. Karla Benavides, Coordinadora Técnica',
  },
};

const partnerModal = document.querySelector('.partner-modal');
const partnerModalTitle = partnerModal?.querySelector('#partner-modal-title');
const partnerModalMessage = partnerModal?.querySelector('.partner-modal-message');
const partnerModalBrand = partnerModal?.querySelector('.partner-modal-brand img');
const partnerModalSignature = partnerModal?.querySelector('.partner-modal-signature');
const partnerModalClose = partnerModal?.querySelector('.partner-modal-close');
const partnerCarouselSection = partnerModal?.closest('.partner-carousel-section');
const partnerCarousel = partnerCarouselSection?.querySelector('.partner-carousel');
const partnerCarouselTrack = partnerCarousel?.querySelector('.partner-carousel-track');
let partnerDragMoved = false;
let partnerPressedButton = null;

const getTranslateX = element => {
  const transform = window.getComputedStyle(element).transform;

  if (!transform || transform === 'none') return 0;

  const matrix = new DOMMatrixReadOnly(transform);
  return matrix.m41;
};

const normalizePartnerDragX = value => {
  if (!partnerCarouselTrack) return value;

  const loopWidth = partnerCarouselTrack.scrollWidth / 2;
  if (!loopWidth) return value;

  let nextValue = value;

  while (nextValue > 0) {
    nextValue -= loopWidth;
  }

  while (nextValue <= -loopWidth) {
    nextValue += loopWidth;
  }

  return nextValue;
};

if (partnerModal && partnerModalTitle && partnerModalMessage && partnerModalBrand && partnerModalSignature) {
  const openPartnerModal = partnerKey => {
    const partner = partnerMessages[partnerKey];

    if (!partner) return;

    partnerModalTitle.textContent = partner.title;
    partnerModalMessage.textContent = partner.message;
    partnerModalBrand.src = partner.logo;
    partnerModalBrand.alt = `Logo de ${partner.title}`;
    partnerModalSignature.textContent = partner.signature;
    partnerCarouselSection?.classList.add('is-modal-open');

    if (typeof partnerModal.showModal === 'function') {
      partnerModal.showModal();
      partnerModalClose?.focus();
    } else {
      partnerModal.setAttribute('open', '');
    }
  };

  partnerCarousel?.addEventListener('click', event => {
    if (partnerDragMoved) {
      event.preventDefault();
      partnerPressedButton = null;
      return;
    }

    const clickedButton = event.target.closest('[data-partner]') || partnerPressedButton;

    if (!clickedButton) return;

    openPartnerModal(clickedButton.dataset.partner);
    partnerPressedButton = null;
  });

  partnerModalClose?.addEventListener('click', () => {
    partnerModal.close();
  });

  partnerModal.addEventListener('click', event => {
    if (event.target === partnerModal) {
      partnerModal.close();
    }
  });

  partnerModal.addEventListener('close', () => {
    partnerCarouselSection?.classList.remove('is-modal-open');
    partnerCarousel?.classList.remove('is-user-controlled', 'is-dragging');
    partnerCarousel?.style.removeProperty('--partner-drag-x');
  });
}

if (partnerCarousel && partnerCarouselTrack) {
  let dragStartX = 0;
  let dragStartTranslateX = 0;
  let activePointerId = null;

  partnerCarousel.addEventListener('pointerdown', event => {
    if (event.button !== undefined && event.button !== 0) return;

    activePointerId = event.pointerId;
    dragStartX = event.clientX;
    dragStartTranslateX = getTranslateX(partnerCarouselTrack);
    partnerDragMoved = false;
    partnerPressedButton = event.target.closest('[data-partner]');

    partnerCarousel.classList.add('is-user-controlled', 'is-dragging');
    partnerCarousel.style.setProperty('--partner-drag-x', `${normalizePartnerDragX(dragStartTranslateX)}px`);
    partnerCarousel.setPointerCapture(activePointerId);
  });

  partnerCarousel.addEventListener('pointermove', event => {
    if (activePointerId !== event.pointerId) return;

    const dragDistance = event.clientX - dragStartX;

    if (Math.abs(dragDistance) > 6) {
      partnerDragMoved = true;
    }

    if (!partnerDragMoved) return;

    partnerCarousel.style.setProperty(
      '--partner-drag-x',
      `${normalizePartnerDragX(dragStartTranslateX + dragDistance)}px`
    );
  });

  const finishPartnerDrag = event => {
    if (activePointerId !== event.pointerId) return;

    const wasDrag = partnerDragMoved;

    partnerCarousel.classList.remove('is-dragging');

    if (partnerCarousel.hasPointerCapture(activePointerId)) {
      partnerCarousel.releasePointerCapture(activePointerId);
    }

    activePointerId = null;

    if (!wasDrag) {
      partnerCarousel.classList.remove('is-user-controlled');
      partnerCarousel.style.removeProperty('--partner-drag-x');
    } else {
      partnerPressedButton = null;
    }

    window.setTimeout(() => {
      partnerDragMoved = false;
    }, 0);
  };

  partnerCarousel.addEventListener('pointerup', finishPartnerDrag);
  partnerCarousel.addEventListener('pointercancel', finishPartnerDrag);
}

const exchangeModal = document.querySelector('.exchange-modal');
const exchangeModalTrigger = document.querySelector('.exchange-modal-trigger');
const exchangeModalClose = exchangeModal?.querySelector('.exchange-modal-close');

if (exchangeModal && exchangeModalTrigger) {
  exchangeModalTrigger.addEventListener('click', () => {
    if (typeof exchangeModal.showModal === 'function') {
      exchangeModal.showModal();
      exchangeModalClose?.focus();
    } else {
      exchangeModal.setAttribute('open', '');
    }
  });

  exchangeModalClose?.addEventListener('click', () => {
    exchangeModal.close();
  });

  exchangeModal.addEventListener('click', event => {
    if (event.target === exchangeModal) {
      exchangeModal.close();
    }
  });
}

const admissionModal = document.querySelector('.admission-modal');
const admissionModalPdf = admissionModal?.querySelector('.admission-modal-pdf');
const admissionModalTitle = admissionModal?.querySelector('#admission-modal-title');
const admissionModalClose = admissionModal?.querySelector('.admission-modal-close');
const admissionModalLink = admissionModal?.querySelector('.admission-modal-link');

if (admissionModal && admissionModalPdf && admissionModalTitle && admissionModalLink) {
  const resetAdmissionModal = () => {
    admissionModalPdf.removeAttribute('src');
    admissionModalPdf.title = '';
  };

  const closeAdmissionModal = () => {
    if (typeof admissionModal.close === 'function') {
      admissionModal.close();
    } else {
      admissionModal.removeAttribute('open');
      resetAdmissionModal();
    }
  };

  document.querySelectorAll('.admission-document[data-admission-pdf]').forEach(documentButton => {
    documentButton.addEventListener('click', () => {
      const pdf = documentButton.dataset.admissionPdf;
      const title = documentButton.dataset.admissionTitle;

      if (!pdf || !title) return;

      admissionModalTitle.textContent = title;
      admissionModalPdf.src = `${pdf}#view=FitH`;
      admissionModalPdf.title = title;
      admissionModalLink.href = pdf;

      if (typeof admissionModal.showModal === 'function') {
        admissionModal.showModal();
        admissionModalClose?.focus();
      } else {
        admissionModal.setAttribute('open', '');
      }
    });
  });

  admissionModalClose?.addEventListener('click', () => {
    closeAdmissionModal();
  });

  admissionModal.addEventListener('click', event => {
    if (event.target === admissionModal) {
      closeAdmissionModal();
    }
  });

  admissionModal.addEventListener('close', () => {
    resetAdmissionModal();
  });
}

const galleryModal = document.querySelector('.gallery-modal');
const galleryModalImage = galleryModal?.querySelector('.gallery-modal-image');
const galleryModalClose = galleryModal?.querySelector('.gallery-modal-close');

if (galleryModal && galleryModalImage) {
  document.querySelectorAll('.gallery-zoom-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const sourceImage = trigger.querySelector('img');

      if (!sourceImage) return;

      galleryModalImage.src = sourceImage.currentSrc || sourceImage.src;
      galleryModalImage.alt = sourceImage.alt;

      if (typeof galleryModal.showModal === 'function') {
        galleryModal.showModal();
        galleryModalClose?.focus();
      } else {
        galleryModal.setAttribute('open', '');
      }
    });
  });

  galleryModalClose?.addEventListener('click', () => {
    galleryModal.close();
  });

  galleryModal.addEventListener('click', event => {
    if (event.target === galleryModal) {
      galleryModal.close();
    }
  });
}
