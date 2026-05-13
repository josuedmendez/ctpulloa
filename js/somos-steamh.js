const steamhItems = Array.from(document.querySelectorAll('[data-steamh-item]'));
const steamhPagination = document.querySelector('[data-steamh-pagination]');
const steamhItemsPerPage = 3;

if (steamhItems.length && steamhPagination) {
  let currentPage = 1;
  const totalPages = Math.ceil(steamhItems.length / steamhItemsPerPage);

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

  const renderPagination = () => {
    steamhPagination.replaceChildren();

    const previous = createButton('Anterior', 'steamh-page-control', currentPage - 1);
    previous.disabled = currentPage === 1;
    steamhPagination.append(previous);

    for (let page = 1; page <= totalPages; page += 1) {
      steamhPagination.append(createButton(String(page), 'steamh-page-number', page, page === currentPage));
    }

    const next = createButton('Siguiente', 'steamh-page-control', currentPage + 1);
    next.disabled = currentPage === totalPages;
    steamhPagination.append(next);
  };

  const showPage = page => {
    currentPage = Math.min(Math.max(page, 1), totalPages);

    steamhItems.forEach((item, index) => {
      const itemPage = Math.floor(index / steamhItemsPerPage) + 1;
      item.hidden = itemPage !== currentPage;
    });

    renderPagination();
  };

  steamhPagination.addEventListener('click', event => {
    const button = event.target.closest('button[data-page]');

    if (!button || button.disabled) {
      return;
    }

    showPage(Number(button.dataset.page));
  });

  showPage(1);
}
