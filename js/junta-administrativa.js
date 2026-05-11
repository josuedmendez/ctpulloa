const publicationModal = document.querySelector('#publication-modal');
const publicationTriggers = document.querySelectorAll('.publication-trigger');

if (publicationModal && publicationTriggers.length) {
  const modalImage = publicationModal.querySelector('.publication-modal-image');
  const modalCategory = publicationModal.querySelector('#publication-modal-category');
  const modalDate = publicationModal.querySelector('#publication-modal-date');
  const modalTitle = publicationModal.querySelector('#publication-modal-title');
  const modalDetail = publicationModal.querySelector('#publication-modal-detail');
  const closeControls = publicationModal.querySelectorAll('[data-modal-close]');

  const closeModal = () => {
    publicationModal.hidden = true;
    document.body.classList.remove('modal-is-open');
  };

  const openModal = trigger => {
    const { category, title, date, image, detail } = trigger.dataset;

    modalImage.src = image || '';
    modalImage.alt = title || 'Imagen de publicacion';
    modalCategory.textContent = category || 'Publicacion';
    modalDate.textContent = date || '';
    modalTitle.textContent = title || 'Publicacion';
    modalDetail.textContent = detail || '';

    publicationModal.hidden = false;
    document.body.classList.add('modal-is-open');
    publicationModal.querySelector('.publication-modal-close').focus();
  };

  publicationTriggers.forEach(trigger => {
    trigger.addEventListener('click', () => openModal(trigger));
  });

  closeControls.forEach(control => {
    control.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !publicationModal.hidden) {
      closeModal();
    }
  });
}
