const publicationModal = document.querySelector('#publication-modal');
const publishForm = document.querySelector('#junta-publish-form');
const postGrid = document.querySelector('#junta-post-grid');
const juntaPagination = document.querySelector('[data-junta-pagination]');
const fallbackImage = 'assets/img/comunidad-educativa-junta-administrativa.png';
const juntaItemsPerPage = 3;

let juntaItems = Array.from(document.querySelectorAll('[data-junta-item]'));
let juntaCurrentPage = 1;

const createPaginationButton = (label, className, page, isActive = false) => {
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

const renderJuntaPagination = () => {
  if (!juntaPagination || !juntaItems.length) {
    return;
  }

  const totalPages = Math.ceil(juntaItems.length / juntaItemsPerPage);
  juntaPagination.replaceChildren();

  if (totalPages <= 1) {
    return;
  }

  const previous = createPaginationButton('Anterior', 'junta-page-control', juntaCurrentPage - 1);
  previous.disabled = juntaCurrentPage === 1;
  juntaPagination.append(previous);

  for (let page = 1; page <= totalPages; page += 1) {
    juntaPagination.append(
      createPaginationButton(String(page), 'junta-page-number', page, page === juntaCurrentPage)
    );
  }

  const next = createPaginationButton('Siguiente', 'junta-page-control', juntaCurrentPage + 1);
  next.disabled = juntaCurrentPage === totalPages;
  juntaPagination.append(next);
};

const showJuntaPage = page => {
  if (!juntaItems.length) {
    return;
  }

  const totalPages = Math.ceil(juntaItems.length / juntaItemsPerPage);
  juntaCurrentPage = Math.min(Math.max(page, 1), totalPages);

  juntaItems.forEach((item, index) => {
    const itemPage = Math.floor(index / juntaItemsPerPage) + 1;
    item.hidden = itemPage !== juntaCurrentPage;
  });

  renderJuntaPagination();
};

if (juntaItems.length && juntaPagination) {
  juntaPagination.addEventListener('click', event => {
    const button = event.target.closest('button[data-page]');

    if (!button || button.disabled) {
      return;
    }

    showJuntaPage(Number(button.dataset.page));
  });

  showJuntaPage(1);
}

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

    modalImage.src = image || fallbackImage;
    modalImage.alt = title || 'Imagen de publicación';
    modalCategory.textContent = category || 'Publicación';
    modalDate.textContent = date || '';
    modalTitle.textContent = title || 'Publicación';
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

if (publishForm && postGrid) {
  publishForm.addEventListener('submit', event => {
    event.preventDefault();

    const formData = new FormData(publishForm);
    const title = String(formData.get('title') || '').trim();
    const category = String(formData.get('category') || 'Comunicado');
    const dateValue = String(formData.get('date') || '');
    const detail = String(formData.get('detail') || '').trim();
    const imageFile = formData.get('image');
    const image = imageFile && imageFile.size ? URL.createObjectURL(imageFile) : fallbackImage;
    const displayDate = dateValue ? dateValue.split('-').reverse().join('/') : 'Sin fecha';

    const card = document.createElement('article');
    card.className = 'junta-post-card';
    card.dataset.juntaItem = '';
    card.innerHTML = `
      <img src="${image}" alt="">
      <div class="junta-post-card-body">
        <span class="junta-pill"></span>
        <h3></h3>
        <p></p>
        <div class="junta-post-meta">
          <span>Junta Administrativa</span>
          <time></time>
        </div>
        <button class="junta-link publication-trigger" type="button">Ver publicación</button>
      </div>
    `;

    card.querySelector('.junta-pill').textContent = category;
    card.querySelector('h3').textContent = title;
    card.querySelector('p').textContent = detail;
    card.querySelector('time').dateTime = dateValue;
    card.querySelector('time').textContent = displayDate;

    const trigger = card.querySelector('.publication-trigger');
    trigger.dataset.category = category;
    trigger.dataset.title = title;
    trigger.dataset.date = displayDate;
    trigger.dataset.image = image;
    trigger.dataset.detail = detail;

    postGrid.prepend(card);
    juntaItems = Array.from(document.querySelectorAll('[data-junta-item]'));
    showJuntaPage(1);
    publishForm.reset();
  });
}
