const publicationModal = document.querySelector('#publication-modal');
const imageLightbox = document.querySelector('#image-lightbox');

const getLargestImageSource = image => {
  if (!image) {
    return '';
  }

  const srcset = image.getAttribute('srcset') || '';
  const candidates = srcset
    .split(',')
    .map(candidate => {
      const [src = '', descriptor = ''] = candidate.trim().split(/\s+/);
      const width = descriptor.endsWith('w') ? Number.parseInt(descriptor, 10) : 0;
      return {
        src,
        width: Number.isFinite(width) ? width : 0,
      };
    })
    .filter(candidate => candidate.src);

  if (!candidates.length) {
    return image.currentSrc || image.src || image.getAttribute('src') || '';
  }

  candidates.sort((first, second) => second.width - first.width);
  return candidates[0].src;
};

const markImageAsExpandable = image => {
  if (!image) {
    return image;
  }

  image.classList.add('publication-expandable-image');
  image.tabIndex = 0;
  image.setAttribute('role', 'button');
  image.setAttribute('aria-label', 'Ampliar imagen');
  return image;
};

if (imageLightbox) {
  const lightboxImage = imageLightbox.querySelector('.image-lightbox-image');
  const lightboxCloseControls = imageLightbox.querySelectorAll('[data-lightbox-close]');
  let lightboxTrigger = null;

  const closeImageLightbox = () => {
    imageLightbox.hidden = true;
    document.body.classList.remove('lightbox-is-open');

    if (lightboxImage) {
      lightboxImage.src = '';
      lightboxImage.alt = '';
    }

    if (lightboxTrigger) {
      lightboxTrigger.focus();
      lightboxTrigger = null;
    }
  };

  const openImageLightbox = trigger => {
    if (!lightboxImage || !trigger) {
      return;
    }

    const src = trigger.dataset.fullSrc || trigger.currentSrc || trigger.src || trigger.getAttribute('src') || '';

    if (!src) {
      return;
    }

    lightboxTrigger = trigger;
    lightboxImage.src = src;
    lightboxImage.alt = trigger.alt || 'Imagen ampliada';
    imageLightbox.hidden = false;
    document.body.classList.add('lightbox-is-open');

    const closeButton = imageLightbox.querySelector('.image-lightbox-close');

    if (closeButton) {
      closeButton.focus();
    }
  };

  document.addEventListener('click', event => {
    const image = event.target.closest('.publication-expandable-image');

    if (image) {
      openImageLightbox(image);
    }
  });

  document.addEventListener('keydown', event => {
    const image = event.target.closest && event.target.closest('.publication-expandable-image');

    if (image && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openImageLightbox(image);
      return;
    }

    if (event.key === 'Escape' && !imageLightbox.hidden) {
      event.preventDefault();
      event.stopImmediatePropagation();
      closeImageLightbox();
    }
  });

  lightboxCloseControls.forEach(control => {
    control.addEventListener('click', closeImageLightbox);
  });
}

if (publicationModal) {
  const modalCarousel = publicationModal.querySelector('#publication-carousel');
  const modalImage = publicationModal.querySelector('.publication-modal-image');
  const carouselImage = publicationModal.querySelector('.publication-carousel-image');
  const carouselPrevious = publicationModal.querySelector('[data-carousel-prev]');
  const carouselNext = publicationModal.querySelector('[data-carousel-next]');
  const carouselDots = publicationModal.querySelector('[data-carousel-dots]');
  const carouselCount = publicationModal.querySelector('[data-carousel-count]');
  const modalCategory = publicationModal.querySelector('#publication-modal-category');
  const modalDate = publicationModal.querySelector('#publication-modal-date');
  const modalTitle = publicationModal.querySelector('#publication-modal-title');
  const modalDetail = publicationModal.querySelector('#publication-modal-detail');
  const closeControls = publicationModal.querySelectorAll('[data-modal-close]');
  let carouselImages = [];
  let carouselIndex = 0;
  let carouselTimer = null;

  markImageAsExpandable(modalImage);
  markImageAsExpandable(carouselImage);

  const sanitizePublicationHtml = html => {
    const template = document.createElement('template');
    template.innerHTML = html || '';

    template.content
      .querySelectorAll('script, object, embed, form, input, button, style, link, meta')
      .forEach(element => element.remove());

    template.content.querySelectorAll('*').forEach(element => {
      Array.from(element.attributes).forEach(attribute => {
        const name = attribute.name.toLowerCase();
        const value = attribute.value.trim().toLowerCase();

        if (name.startsWith('on') || value.startsWith('javascript:')) {
          element.removeAttribute(attribute.name);
        }
      });
    });

    template.content.querySelectorAll('iframe').forEach(iframe => {
      const src = iframe.getAttribute('src') || '';

      if (!src.startsWith('https://')) {
        iframe.remove();
        return;
      }

      iframe.loading = 'lazy';
      iframe.setAttribute('allowfullscreen', '');
    });

    return template.innerHTML;
  };

  const stopCarousel = () => {
    if (carouselTimer) {
      clearInterval(carouselTimer);
      carouselTimer = null;
    }
  };

  const showCarouselImage = index => {
    if (!carouselImages.length) {
      return;
    }

    carouselIndex = (index + carouselImages.length) % carouselImages.length;
    const image = carouselImages[carouselIndex];

    carouselImage.src = image.src;
    carouselImage.alt = image.alt || modalTitle.textContent || 'Imagen de publicacion';
    carouselImage.dataset.fullSrc = image.fullSrc || image.src;

    if (carouselCount) {
      carouselCount.textContent = `${carouselIndex + 1} / ${carouselImages.length}`;
    }

    if (carouselDots) {
      Array.from(carouselDots.children).forEach((dot, dotIndex) => {
        dot.classList.toggle('is-active', dotIndex === carouselIndex);
        dot.setAttribute('aria-current', dotIndex === carouselIndex ? 'true' : 'false');
      });
    }
  };

  const startCarousel = () => {
    stopCarousel();

    if (carouselImages.length <= 1 || publicationModal.hidden) {
      return;
    }

    carouselTimer = setInterval(() => {
      showCarouselImage(carouselIndex + 1);
    }, 3500);
  };

  const moveCarousel = direction => {
    showCarouselImage(carouselIndex + direction);
    startCarousel();
  };

  const preparePublicationContent = ({ content, coverImage, fallbackAlt }) => {
    const template = document.createElement('template');
    template.innerHTML = content ? sanitizePublicationHtml(content) : '';

    const images = [];
    const addImage = (src, alt = '', fullSrc = src) => {
      if (!src || images.some(image => image.src === src)) {
        return;
      }

      images.push({
        src,
        fullSrc,
        alt,
      });
    };

    template.content.querySelectorAll('img').forEach(image => {
      const imageSource = image.getAttribute('src') || image.getAttribute('data-src') || '';
      const fullSource = getLargestImageSource(image) || imageSource;

      if (imageSource !== coverImage) {
        addImage(imageSource, image.getAttribute('alt') || fallbackAlt, fullSource);
      }

      const figure = image.closest('figure');

      if (figure) {
        figure.remove();
        return;
      }

      image.remove();
    });

    template.content.querySelectorAll('p, figure').forEach(element => {
      if (!element.textContent.trim() && !element.querySelector('img, video, iframe')) {
        element.remove();
      }
    });

    return {
      images,
      html: template.innerHTML,
    };
  };

  const renderCarousel = images => {
    carouselImages = images;
    carouselIndex = 0;
    stopCarousel();

    if (!modalCarousel || !carouselImage || !carouselImages.length) {
      if (modalCarousel) {
        modalCarousel.hidden = true;
      }

      return;
    }

    modalCarousel.hidden = false;

    const hasMultipleImages = carouselImages.length > 1;

    if (carouselPrevious && carouselNext) {
      carouselPrevious.hidden = !hasMultipleImages;
      carouselNext.hidden = !hasMultipleImages;
    }

    if (carouselDots) {
      carouselDots.replaceChildren();
      carouselDots.hidden = !hasMultipleImages;

      carouselImages.forEach((image, index) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'publication-carousel-dot';
        dot.setAttribute('aria-label', `Ver imagen ${index + 1}`);
        dot.addEventListener('click', () => {
          showCarouselImage(index);
          startCarousel();
        });
        carouselDots.append(dot);
      });
    }

    if (carouselCount) {
      carouselCount.hidden = !hasMultipleImages;
    }

    showCarouselImage(0);
    startCarousel();
  };

  const closeModal = () => {
    stopCarousel();
    publicationModal.hidden = true;
    document.body.classList.remove('modal-is-open');
  };

  const openModal = trigger => {
    const { category, title, date, datetime, image, detail, content } = trigger.dataset;

    modalImage.src = image || '';
    modalImage.alt = title || 'Imagen de publicacion';
    modalImage.dataset.fullSrc = image || '';
    modalCategory.textContent = category || 'Publicacion';
    modalDate.textContent = date || '';
    modalDate.dateTime = datetime || '';
    modalTitle.textContent = title || 'Publicacion';

    const preparedContent = preparePublicationContent({
      content,
      coverImage: image,
      fallbackAlt: title,
    });

    if (preparedContent.html) {
      modalDetail.innerHTML = preparedContent.html;
    } else {
      const paragraph = document.createElement('p');
      paragraph.textContent = detail || '';
      modalDetail.replaceChildren(paragraph);
    }

    publicationModal.hidden = false;
    document.body.classList.add('modal-is-open');
    renderCarousel(preparedContent.images);
    publicationModal.querySelector('.publication-modal-close').focus();
  };

  if (carouselPrevious) {
    carouselPrevious.addEventListener('click', () => moveCarousel(-1));
  }

  if (carouselNext) {
    carouselNext.addEventListener('click', () => moveCarousel(1));
  }

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
    if (imageLightbox && !imageLightbox.hidden) {
      return;
    }

    if (event.key === 'Escape' && !publicationModal.hidden) {
      closeModal();
    }

    if (event.key === 'ArrowLeft' && !publicationModal.hidden && carouselImages.length > 1) {
      moveCarousel(-1);
    }

    if (event.key === 'ArrowRight' && !publicationModal.hidden && carouselImages.length > 1) {
      moveCarousel(1);
    }
  });
}

(() => {
  const API_BASE = 'https://blog.ctpulloa.com/wp-json/wp/v2/posts';
  const DEFAULT_IMAGE = 'assets/img/portada-colegio.jpg';
  const AUTHOR_LOGO = 'assets/img/logo-web-ctpulloa-2026.png';
  const ITEMS_PER_PAGE = 3;
  const SECONDARY_FETCH_LIMIT = ITEMS_PER_PAGE + 1;
  const CATEGORY_FILTERS = {
    all: {
      label: 'Todas',
      categoryId: null,
      emptyMessage: 'No hay noticias publicadas por el momento.',
    },
    noticia: {
      label: 'Noticia',
      categoryId: 1,
      emptyMessage: 'No hay noticias publicadas en la categoría Noticia por el momento.',
    },
    cooperativa: {
      label: 'Cooperativa',
      categoryId: 3,
      emptyMessage: 'No hay noticias publicadas en la categoría Cooperativa por el momento.',
    },
    steam: {
      label: 'STEAM',
      categoryId: 4,
      emptyMessage: 'No hay noticias publicadas en la categoría STEAM por el momento.',
    },
    pastoral: {
      label: 'Pastoral Educativa',
      categoryId: 6,
      emptyMessage: 'No hay noticias publicadas en la categoría Pastoral Educativa por el momento.',
    },
    junta: {
      label: 'Junta Administrativa',
      categoryId: 5,
      emptyMessage: 'No hay noticias publicadas en la categoría Junta Administrativa por el momento.',
    },
  };

  const featuredWrap = document.querySelector('#featured-news-wrap');
  const newsList = document.querySelector('#news-list');
  const pagination = document.querySelector('[data-pagination]');
  const filterButtons = [...document.querySelectorAll('[data-news-filter]')];

  if (!featuredWrap || !newsList || !pagination) {
    return;
  }

  let activeFilter = 'all';
  let currentPage = 1;
  let totalPosts = null;
  let totalSecondaryPages = 0;
  let canGoNext = false;
  let newsRequestId = 0;
  let secondaryRequestId = 0;

  const getActiveCategory = () => CATEGORY_FILTERS[activeFilter] || CATEGORY_FILTERS.all;

  const buildUrl = ({ perPage, offset, categoryId }) => {
    const url = new URL(API_BASE);
    url.searchParams.set('_embed', '1');
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('offset', String(offset));
    url.searchParams.set('orderby', 'date');
    url.searchParams.set('order', 'desc');

    if (categoryId !== null && categoryId !== undefined) {
      url.searchParams.set('categories', String(categoryId));
    }

    return url.toString();
  };

  const fetchPosts = async ({ perPage, offset, categoryId = getActiveCategory().categoryId }) => {
    const response = await fetch(buildUrl({ perPage, offset, categoryId }), {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress respondió con estado ${response.status}`);
    }

    const totalHeader = response.headers.get('X-WP-Total');
    const parsedTotal = totalHeader === null ? null : Number(totalHeader);
    const total = Number.isFinite(parsedTotal) ? parsedTotal : null;
    const posts = await response.json();

    return {
      posts: Array.isArray(posts) ? posts : [],
      total,
    };
  };

  const updateTotal = total => {
    if (total === null) {
      return;
    }

    totalPosts = total;
    totalSecondaryPages = Math.ceil(Math.max(totalPosts - 1, 0) / ITEMS_PER_PAGE);
  };

  const resetPaginationState = () => {
    currentPage = 1;
    totalPosts = null;
    totalSecondaryPages = 0;
    canGoNext = false;
  };

  const syncFilterButtons = () => {
    filterButtons.forEach(button => {
      const isActive = button.dataset.newsFilter === activeFilter;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  };

  const stripHtml = value => {
    const template = document.createElement('template');
    template.innerHTML = value || '';
    return (template.content.textContent || '').replace(/\s+/g, ' ').trim();
  };

  const trimText = (text, maxLength) => {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength).trim().replace(/[.,;:]+$/, '')}...`;
  };

  const formatDate = post => {
    const rawDate = post.date || post.modified || '';
    const date = new Date(rawDate);

    if (Number.isNaN(date.getTime())) {
      return {
        display: '',
        datetime: '',
      };
    }

    return {
      display: date.toLocaleDateString('es-CR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
      datetime: rawDate.slice(0, 10),
    };
  };

  const getCategory = post => {
    const embedded = post._embedded || {};
    const termGroups = embedded['wp:term'] || [];

    for (const group of termGroups) {
      if (!Array.isArray(group)) {
        continue;
      }

      const category = group.find(term => term.taxonomy === 'category' && term.name);

      if (category) {
        return stripHtml(category.name);
      }
    }

    return 'Noticias';
  };

  const getAuthor = post => {
    const embedded = post._embedded || {};
    const author = Array.isArray(embedded.author) ? embedded.author[0] : null;
    return stripHtml(author && author.name) || 'Comunicación CTP Ulloa';
  };

  const getFeaturedImage = (post, fallbackAlt) => {
    const embedded = post._embedded || {};
    const media = Array.isArray(embedded['wp:featuredmedia']) ? embedded['wp:featuredmedia'][0] : null;

    return {
      src: (media && media.source_url) || DEFAULT_IMAGE,
      alt: stripHtml(media && media.alt_text) || fallbackAlt,
    };
  };

  const normalizePost = post => {
    const title = stripHtml(post.title && post.title.rendered) || 'Noticia institucional';
    const sourceSummary =
      stripHtml(post.excerpt && post.excerpt.rendered) ||
      stripHtml(post.content && post.content.rendered);
    const date = formatDate(post);
    const image = getFeaturedImage(post, title);

    return {
      title,
      summary: trimText(sourceSummary, 190),
      content: (post.content && post.content.rendered) || (post.excerpt && post.excerpt.rendered) || '',
      category: getCategory(post),
      author: getAuthor(post),
      date,
      image,
    };
  };

  const createImage = (post, loading = 'lazy') => {
    const image = document.createElement('img');
    image.src = post.image.src;
    image.alt = post.image.alt;
    image.decoding = 'async';
    image.loading = loading;
    image.dataset.fullSrc = post.image.src;
    return markImageAsExpandable(image);
  };

  const createCategory = post => {
    const category = document.createElement('span');
    category.className = 'news-category';
    category.textContent = post.category;
    return category;
  };

  const applyPublicationDataset = (element, post) => {
    element.dataset.category = post.category;
    element.dataset.title = post.title;
    element.dataset.date = post.date.display;
    element.dataset.datetime = post.date.datetime;
    element.dataset.image = post.image.src;
    element.dataset.detail = post.summary;

    if (post.content) {
      element.dataset.content = post.content;
    }

    return element;
  };

  const createReadMoreButton = (post, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'news-link publication-trigger';
    button.textContent = label;
    return applyPublicationDataset(button, post);
  };

  const createTitleButton = post => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'news-title-trigger publication-trigger';
    button.textContent = post.title;
    return applyPublicationDataset(button, post);
  };

  const renderFeatured = post => {
    const article = document.createElement('article');
    article.className = 'featured-news';

    const media = document.createElement('div');
    media.className = 'featured-news-media';
    media.append(createImage(post, 'eager'));

    const content = document.createElement('div');
    content.className = 'featured-news-content';
    content.append(createCategory(post));

    const title = document.createElement('h2');
    title.append(createTitleButton(post));
    content.append(title);

    if (post.summary) {
      const summary = document.createElement('p');
      summary.textContent = post.summary;
      content.append(summary);
    }

    const footer = document.createElement('div');
    footer.className = 'news-card-footer';

    const author = document.createElement('div');
    author.className = 'news-author';

    const authorImage = document.createElement('img');
    authorImage.src = AUTHOR_LOGO;
    authorImage.alt = '';

    const authorName = document.createElement('span');
    authorName.textContent = post.author;
    author.append(authorImage, authorName);

    if (post.date.display) {
      const time = document.createElement('time');
      time.dateTime = post.date.datetime;
      time.textContent = post.date.display;
      author.append(time);
    }

    footer.append(author, createReadMoreButton(post, 'Leer noticia'));
    content.append(footer);
    article.append(media, content);
    featuredWrap.replaceChildren(article);
  };

  const renderSecondaryPosts = posts => {
    newsList.replaceChildren();

    if (!posts.length) {
      newsList.hidden = true;
      return;
    }

    const fragment = document.createDocumentFragment();

    posts.forEach(post => {
      const article = document.createElement('article');
      article.className = 'recent-news-card';

      const media = document.createElement('div');
      media.className = 'recent-news-media';
      media.append(createImage(post));

      const body = document.createElement('div');
      body.className = 'recent-news-body';
      body.append(createCategory(post));

      const title = document.createElement('h3');
      title.append(createTitleButton(post));
      body.append(title);

      const meta = document.createElement('p');
      meta.className = 'recent-meta';
      meta.append('por ');

      const author = document.createElement('strong');
      author.textContent = post.author;
      meta.append(author);

      if (post.date.display) {
        const time = document.createElement('time');
        time.dateTime = post.date.datetime;
        time.textContent = post.date.display;
        meta.append(time);
      }

      body.append(meta);

      if (post.summary) {
        const summary = document.createElement('p');
        summary.className = 'recent-news-summary';
        summary.textContent = post.summary;
        body.append(summary);
      }

      body.append(createReadMoreButton(post, 'Leer noticia'));
      article.append(media, body);
      fragment.append(article);
    });

    newsList.hidden = false;
    newsList.append(fragment);
  };

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

  const renderPagination = () => {
    pagination.replaceChildren();

    const hasKnownTotal = totalPosts !== null;
    const shouldShowPagination = hasKnownTotal
      ? totalSecondaryPages > 1
      : currentPage > 1 || canGoNext;

    pagination.hidden = !shouldShowPagination;

    if (!shouldShowPagination) {
      return;
    }

    const previous = createPaginationButton('Anterior', 'page-control', currentPage - 1);
    previous.disabled = currentPage === 1;
    pagination.append(previous);

    if (hasKnownTotal) {
      for (let page = 1; page <= totalSecondaryPages; page += 1) {
        pagination.append(createPaginationButton(String(page), 'page-number', page, page === currentPage));
      }
    } else {
      pagination.append(createPaginationButton(String(currentPage), 'page-number', currentPage, true));
    }

    const next = createPaginationButton('Siguiente', 'page-control', currentPage + 1);
    next.disabled = hasKnownTotal ? currentPage >= totalSecondaryPages : !canGoNext;
    pagination.append(next);
  };

  const showMessage = (container, message, className = 'news-loading') => {
    const box = document.createElement('div');
    box.className = className;
    box.textContent = message;

    if (className === 'news-loading') {
      box.setAttribute('role', 'status');
    }

    container.replaceChildren(box);
  };

  const loadSecondaryPage = async (page, requestToken = newsRequestId) => {
    if (totalPosts !== null && totalSecondaryPages === 0) {
      currentPage = 1;
      newsList.removeAttribute('aria-busy');
      renderSecondaryPosts([]);
      renderPagination();
      return;
    }

    const requestedPage = Math.max(1, Number(page) || 1);
    const targetPage = totalPosts !== null
      ? Math.min(requestedPage, totalSecondaryPages)
      : requestedPage;
    const requestId = ++secondaryRequestId;
    const offset = 1 + (targetPage - 1) * ITEMS_PER_PAGE;
    const { categoryId } = getActiveCategory();

    currentPage = targetPage;
    newsList.hidden = false;
    newsList.setAttribute('aria-busy', 'true');
    showMessage(newsList, 'Cargando más noticias...');

    try {
      const { posts, total } = await fetchPosts({
        perPage: SECONDARY_FETCH_LIMIT,
        offset,
        categoryId,
      });

      if (requestId !== secondaryRequestId || requestToken !== newsRequestId) {
        return;
      }

      updateTotal(total);

      const secondaryPosts = posts.slice(0, ITEMS_PER_PAGE).map(normalizePost);
      canGoNext = totalPosts !== null
        ? currentPage < totalSecondaryPages
        : posts.length > ITEMS_PER_PAGE;

      if (!secondaryPosts.length && currentPage > 1) {
        await loadSecondaryPage(currentPage - 1, requestToken);
        return;
      }

      renderSecondaryPosts(secondaryPosts);
      renderPagination();
    } catch (error) {
      console.error('Error al cargar las noticias:', error);
      newsList.hidden = false;
      pagination.hidden = true;
      showMessage(newsList, 'No se pudieron cargar más noticias en este momento.', 'news-empty');
    } finally {
      newsList.removeAttribute('aria-busy');
    }
  };

  const initNews = async (filterKey = activeFilter) => {
    activeFilter = CATEGORY_FILTERS[filterKey] ? filterKey : 'all';
    const { categoryId, emptyMessage } = getActiveCategory();
    const requestId = ++newsRequestId;
    secondaryRequestId += 1;
    resetPaginationState();
    syncFilterButtons();
    showMessage(featuredWrap, 'Cargando noticias...');
    newsList.removeAttribute('aria-busy');
    newsList.hidden = true;
    pagination.hidden = true;

    try {
      const { posts, total } = await fetchPosts({
        perPage: 1,
        offset: 0,
        categoryId,
      });

      if (requestId !== newsRequestId) {
        return;
      }

      updateTotal(total);

      if (!posts.length) {
        showMessage(featuredWrap, emptyMessage, 'news-empty');
        return;
      }

      renderFeatured(normalizePost(posts[0]));
      await loadSecondaryPage(1, requestId);
    } catch (error) {
      if (requestId !== newsRequestId) {
        return;
      }

      console.error('Error al cargar las noticias:', error);
      newsList.hidden = true;
      pagination.hidden = true;
      showMessage(featuredWrap, 'No se pudieron cargar las noticias en este momento.', 'news-empty');
    }
  };

  pagination.addEventListener('click', event => {
    const button = event.target.closest('button[data-page]');

    if (!button || button.disabled) {
      return;
    }

    loadSecondaryPage(Number(button.dataset.page));
  });

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const filterKey = button.dataset.newsFilter;

      if (!filterKey || filterKey === activeFilter) {
        return;
      }

      initNews(filterKey);
    });
  });

  initNews();
})();
