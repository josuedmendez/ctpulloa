const specialtyPopupLinks = document.querySelectorAll('[data-specialty-popup]');
const specialtyModal = document.querySelector('#specialty-modal');

if (specialtyPopupLinks.length && specialtyModal) {
  const specialtyFrame = specialtyModal.querySelector('[data-specialty-frame]');
  const closeControls = specialtyModal.querySelectorAll('[data-specialty-close]');
  const modalTitle = specialtyModal.querySelector('#specialty-modal-title');
  let lastFocusedElement = null;

  const closeSpecialtyModal = () => {
    specialtyModal.hidden = true;
    document.body.classList.remove('modal-is-open');

    if (specialtyFrame) {
      specialtyFrame.src = 'about:blank';
    }

    if (lastFocusedElement) {
      lastFocusedElement.focus();
      lastFocusedElement = null;
    }
  };

  const openSpecialtyModal = link => {
    const targetUrl = new URL(link.href, window.location.href);
    targetUrl.searchParams.set('popup', '1');

    lastFocusedElement = document.activeElement;

    if (modalTitle) {
      modalTitle.textContent = link.dataset.specialtyTitle || 'Especialidad técnica';
    }

    if (specialtyFrame) {
      specialtyFrame.src = targetUrl.toString();
    }

    specialtyModal.hidden = false;
    document.body.classList.add('modal-is-open');

    const closeButton = specialtyModal.querySelector('.specialty-modal-close');
    if (closeButton) {
      closeButton.focus();
    }
  };

  specialtyPopupLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      openSpecialtyModal(link);
    });
  });

  closeControls.forEach(control => {
    control.addEventListener('click', closeSpecialtyModal);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !specialtyModal.hidden) {
      closeSpecialtyModal();
    }
  });
}
