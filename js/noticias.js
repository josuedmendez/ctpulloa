const publicationModal = document.querySelector('#publication-modal');

if (publicationModal) {
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

  document.addEventListener('click', event => {
    const trigger = event.target.closest('.publication-trigger');

    if (trigger) {
      openModal(trigger);
    }
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

const newsItems = Array.from(document.querySelectorAll('[data-news-item]'));
const pagination = document.querySelector('[data-pagination]');
const itemsPerPage = 3;

if (newsItems.length && pagination) {
  let currentPage = 1;
  const totalPages = Math.ceil(newsItems.length / itemsPerPage);

  const showPage = page => {
    currentPage = Math.min(Math.max(page, 1), totalPages);

    newsItems.forEach((item, index) => {
      const itemPage = Math.floor(index / itemsPerPage) + 1;
      item.hidden = itemPage !== currentPage;
    });

    renderPagination();
  };

  const createButton = (label, className, page, isActive = false) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.textContent = label;
    button.dataset.page = String(page);

    if (isActive) {
      button.classList.add('is-active');
      button.setAttribute('aria-current', 'page');
    }

    return button;
  };

  function renderPagination() {
    pagination.replaceChildren();

    const previous = createButton('Anterior', 'page-control', currentPage - 1);
    previous.disabled = currentPage === 1;
    pagination.append(previous);

    for (let page = 1; page <= totalPages; page += 1) {
      pagination.append(createButton(String(page), 'page-number', page, page === currentPage));
    }

    const next = createButton('Siguiente', 'page-control', currentPage + 1);
    next.disabled = currentPage === totalPages;
    pagination.append(next);
  }

  pagination.addEventListener('click', event => {
    const button = event.target.closest('button[data-page]');

    if (!button || button.disabled) {
      return;
    }

    showPage(Number(button.dataset.page));
  });

  showPage(1);
}
