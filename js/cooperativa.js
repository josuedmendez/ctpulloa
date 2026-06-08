const cooperativePublicationModal = document.querySelector('#cooperative-publication-modal');

if (cooperativePublicationModal) {
  const modalCarousel = cooperativePublicationModal.querySelector('#cooperative-publication-carousel');
  const modalImage = cooperativePublicationModal.querySelector('.publication-modal-image');
  const carouselImage = cooperativePublicationModal.querySelector('.publication-carousel-image');
  const carouselPrevious = cooperativePublicationModal.querySelector('[data-carousel-prev]');
  const carouselNext = cooperativePublicationModal.querySelector('[data-carousel-next]');
  const carouselDots = cooperativePublicationModal.querySelector('[data-carousel-dots]');
  const carouselCount = cooperativePublicationModal.querySelector('[data-carousel-count]');
  const modalCategory = cooperativePublicationModal.querySelector('#cooperative-publication-modal-category');
  const modalDate = cooperativePublicationModal.querySelector('#cooperative-publication-modal-date');
  const modalTitle = cooperativePublicationModal.querySelector('#cooperative-publication-modal-title');
  const modalDetail = cooperativePublicationModal.querySelector('#cooperative-publication-modal-detail');
  const closeControls = cooperativePublicationModal.querySelectorAll('[data-modal-close]');
  let carouselImages = [];
  let carouselIndex = 0;
  let carouselTimer = null;

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
    carouselImage.alt = image.alt || modalTitle.textContent || 'Imagen de la entrada';

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

    if (carouselImages.length <= 1 || cooperativePublicationModal.hidden) {
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
    const addImage = (src, alt = '') => {
      if (!src || images.some(image => image.src === src)) {
        return;
      }

      images.push({
        src,
        alt,
      });
    };

    template.content.querySelectorAll('img').forEach(image => {
      const imageSource = image.getAttribute('src') || image.getAttribute('data-src') || '';

      if (imageSource !== coverImage) {
        addImage(imageSource, image.getAttribute('alt') || fallbackAlt);
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
    cooperativePublicationModal.hidden = true;
    document.body.classList.remove('modal-is-open');
  };

  const openModal = trigger => {
    const { category, title, date, datetime, image, detail, content } = trigger.dataset;

    if (image) {
      modalImage.hidden = false;
      modalImage.src = image;
      modalImage.alt = title || 'Imagen de la entrada';
    } else {
      modalImage.hidden = true;
      modalImage.removeAttribute('src');
      modalImage.alt = '';
    }

    modalCategory.textContent = category || '';
    modalDate.textContent = date || '';
    modalDate.dateTime = datetime || '';
    modalTitle.textContent = title || '';

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

    cooperativePublicationModal.hidden = false;
    document.body.classList.add('modal-is-open');
    renderCarousel(preparedContent.images);
    cooperativePublicationModal.querySelector('.publication-modal-close').focus();
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
    if (event.key === 'Escape' && !cooperativePublicationModal.hidden) {
      closeModal();
    }

    if (event.key === 'ArrowLeft' && !cooperativePublicationModal.hidden && carouselImages.length > 1) {
      moveCarousel(-1);
    }

    if (event.key === 'ArrowRight' && !cooperativePublicationModal.hidden && carouselImages.length > 1) {
      moveCarousel(1);
    }
  });
}

(() => {
  const API_BASE = 'https://cooperativa.ctpulloa.com/wp-json/wp/v2/posts';
  const CACHE_KEY = 'ctpulloa:cooperative-blog-cache:v1';
  const INDEX_PER_PAGE = 100;
  const ITEMS_PER_PAGE = 3;
  const SECONDARY_FETCH_LIMIT = ITEMS_PER_PAGE + 1;

  const featuredWrap = document.querySelector('#cooperative-featured-wrap');
  const postList = document.querySelector('#cooperative-post-list');
  const pagination = document.querySelector('[data-cooperative-pagination]');

  if (!featuredWrap || !postList || !pagination) {
    return;
  }

  let currentPage = 1;
  let totalPosts = null;
  let totalSecondaryPages = 0;
  let canGoNext = false;
  let secondaryRequestId = 0;
  let blogSignature = '';

  const buildUrl = ({ perPage, offset, fields }) => {
    const url = new URL(API_BASE);
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('orderby', 'date');
    url.searchParams.set('order', 'desc');
    url.searchParams.set('_embed', '1');

    if (typeof offset === 'number') {
      url.searchParams.set('offset', String(offset));
    }

    if (fields && fields.length) {
      url.searchParams.set('_fields', fields.join(','));
    }

    return url.toString();
  };

  const fetchPosts = async ({ perPage, offset }) => {
    const response = await fetch(buildUrl({ perPage, offset }), {
      cache: 'no-cache',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress respondio con estado ${response.status}`);
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

  const getHeaderNumber = (response, headerName) => {
    const value = Number(response.headers.get(headerName));
    return Number.isFinite(value) ? value : 0;
  };

  const fetchPostIndexPage = async offset => {
    const url = new URL(buildUrl({
      perPage: INDEX_PER_PAGE,
      offset,
      fields: ['id', 'modified', 'modified_gmt'],
    }));

    url.searchParams.set('cooperative_check', String(Date.now()));

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`WordPress respondio con estado ${response.status}`);
    }

    const posts = await response.json();

    return {
      posts: Array.isArray(posts) ? posts : [],
      total: getHeaderNumber(response, 'X-WP-Total'),
    };
  };

  const fetchPostIndex = async () => {
    const firstPage = await fetchPostIndexPage(0);
    const posts = [...firstPage.posts];
    const indexedTotal = firstPage.total || posts.length;

    for (let offset = INDEX_PER_PAGE; offset < indexedTotal; offset += INDEX_PER_PAGE) {
      const nextPage = await fetchPostIndexPage(offset);
      posts.push(...nextPage.posts);
    }

    const signature = [
      `total:${indexedTotal}`,
      ...posts.map(post => `${post.id}:${post.modified_gmt || post.modified || ''}`),
    ].join('|');

    return {
      signature,
      total: indexedTotal,
    };
  };

  const readCache = () => {
    try {
      const rawCache = localStorage.getItem(CACHE_KEY);
      return rawCache ? JSON.parse(rawCache) : null;
    } catch (error) {
      console.warn('No se pudo leer el cache de Cooperativa:', error);
      return null;
    }
  };

  const writeCache = cache => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch (error) {
      console.warn('No se pudo guardar el cache de Cooperativa:', error);
    }
  };

  const getSignatureCache = () => {
    const cache = readCache();

    if (!cache || cache.signature !== blogSignature) {
      return null;
    }

    return cache;
  };

  const getValidCache = () => {
    const cache = getSignatureCache();

    if (!cache || !cache.featuredPost) {
      return null;
    }

    return cache;
  };

  const updateCache = updates => {
    if (!blogSignature) {
      return;
    }

    const cache = getSignatureCache() || {
      signature: blogSignature,
      featuredPost: null,
      secondaryPages: {},
      totalPosts,
      totalSecondaryPages,
    };

    writeCache({
      ...cache,
      ...updates,
      signature: blogSignature,
      totalPosts,
      totalSecondaryPages,
      secondaryPages: {
        ...(cache.secondaryPages || {}),
        ...(updates.secondaryPages || {}),
      },
    });
  };

  const updateTotal = total => {
    if (total === null) {
      return;
    }

    totalPosts = total;
    totalSecondaryPages = Math.ceil(Math.max(totalPosts - 1, 0) / ITEMS_PER_PAGE);
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

    return '';
  };

  const getAuthor = post => {
    const embedded = post._embedded || {};
    const author = Array.isArray(embedded.author) ? embedded.author[0] : null;
    return stripHtml(author && author.name);
  };

  const getFeaturedImage = post => {
    const embedded = post._embedded || {};
    const media = Array.isArray(embedded['wp:featuredmedia']) ? embedded['wp:featuredmedia'][0] : null;
    const source = media && media.source_url;

    if (!source) {
      return null;
    }

    return {
      src: source,
      alt: stripHtml(media && media.alt_text),
    };
  };

  const normalizePost = post => {
    const title = stripHtml(post.title && post.title.rendered);
    const sourceSummary =
      stripHtml(post.excerpt && post.excerpt.rendered) ||
      stripHtml(post.content && post.content.rendered);
    const date = formatDate(post);
    const image = getFeaturedImage(post);

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

  const createImage = (imageData, fallbackAlt, loading = 'lazy') => {
    const image = document.createElement('img');
    image.src = imageData.src;
    image.alt = imageData.alt || fallbackAlt || '';
    image.decoding = 'async';
    image.loading = loading;
    return image;
  };

  const createCategory = post => {
    const category = document.createElement('span');
    category.className = 'cooperative-category';
    category.textContent = post.category;
    return category;
  };

  const createReadMoreButton = (post, label) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'cooperative-link publication-trigger';
    button.textContent = label;
    button.dataset.category = post.category;
    button.dataset.title = post.title;
    button.dataset.date = post.date.display;
    button.dataset.datetime = post.date.datetime;
    button.dataset.detail = post.summary;

    if (post.image) {
      button.dataset.image = post.image.src;
    }

    if (post.content) {
      button.dataset.content = post.content;
    }

    return button;
  };

  const renderFeatured = post => {
    const article = document.createElement('article');
    article.className = 'cooperative-featured-post';

    if (post.image) {
      const media = document.createElement('div');
      media.className = 'cooperative-featured-media';
      media.append(createImage(post.image, post.title, 'eager'));
      article.append(media);
    } else {
      article.classList.add('has-no-image');
    }

    const content = document.createElement('div');
    content.className = 'cooperative-featured-copy';

    if (post.category) {
      content.append(createCategory(post));
    }

    const title = document.createElement('h2');
    title.textContent = post.title;
    content.append(title);

    if (post.summary) {
      const summary = document.createElement('p');
      summary.textContent = post.summary;
      content.append(summary);
    }

    const footer = document.createElement('div');
    footer.className = 'cooperative-card-footer';

    const author = document.createElement('div');
    author.className = 'cooperative-author';

    if (post.author) {
      const authorName = document.createElement('span');
      authorName.textContent = post.author;
      author.append(authorName);
    }

    if (post.date.display) {
      const time = document.createElement('time');
      time.dateTime = post.date.datetime;
      time.textContent = post.date.display;
      author.append(time);
    }

    footer.append(author, createReadMoreButton(post, 'Leer entrada'));
    content.append(footer);
    article.append(content);
    featuredWrap.replaceChildren(article);
  };

  const renderSecondaryPosts = posts => {
    postList.replaceChildren();

    if (!posts.length) {
      postList.hidden = true;
      return;
    }

    const fragment = document.createDocumentFragment();

    posts.forEach(post => {
      const article = document.createElement('article');
      article.className = 'cooperative-post-card';

      if (post.image) {
        const media = document.createElement('figure');
        media.className = 'cooperative-post-media';
        media.append(createImage(post.image, post.title));
        article.append(media);
      } else {
        article.classList.add('has-no-image');
      }

      const body = document.createElement('div');
      body.className = 'cooperative-post-body';

      if (post.category) {
        body.append(createCategory(post));
      }

      const title = document.createElement('h3');
      title.textContent = post.title;
      body.append(title);

      const meta = document.createElement('p');
      meta.className = 'cooperative-post-meta';

      if (post.author) {
        meta.append('por ');

        const author = document.createElement('strong');
        author.textContent = post.author;
        meta.append(author);
      }

      if (post.date.display) {
        const time = document.createElement('time');
        time.dateTime = post.date.datetime;
        time.textContent = post.date.display;
        meta.append(time);
      }

      if (meta.childNodes.length) {
        body.append(meta);
      }

      if (post.summary) {
        const summary = document.createElement('p');
        summary.className = 'cooperative-post-summary';
        summary.textContent = post.summary;
        body.append(summary);
      }

      body.append(createReadMoreButton(post, 'Leer más'));
      article.append(body);
      fragment.append(article);
    });

    postList.hidden = false;
    postList.append(fragment);
  };

  const renderFromCache = cache => {
    totalPosts = Number(cache.totalPosts) || 0;
    totalSecondaryPages = Number(cache.totalSecondaryPages) || 0;
    currentPage = 1;
    canGoNext = totalSecondaryPages > 1;

    renderFeatured(cache.featuredPost);
    renderSecondaryPosts((cache.secondaryPages && cache.secondaryPages[1]) || []);
    renderPagination();
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

    const previous = createPaginationButton('Anterior', 'cooperative-page-control', currentPage - 1);
    previous.disabled = currentPage === 1;
    pagination.append(previous);

    if (hasKnownTotal) {
      for (let page = 1; page <= totalSecondaryPages; page += 1) {
        pagination.append(createPaginationButton(String(page), 'cooperative-page-number', page, page === currentPage));
      }
    } else {
      pagination.append(createPaginationButton(String(currentPage), 'cooperative-page-number', currentPage, true));
    }

    const next = createPaginationButton('Siguiente', 'cooperative-page-control', currentPage + 1);
    next.disabled = hasKnownTotal ? currentPage >= totalSecondaryPages : !canGoNext;
    pagination.append(next);
  };

  const showMessage = (container, message, className = 'cooperative-loading') => {
    const box = document.createElement('div');
    box.className = className;
    box.textContent = message;

    if (className === 'cooperative-loading') {
      box.setAttribute('role', 'status');
    }

    container.replaceChildren(box);
  };

  const loadSecondaryPage = async page => {
    const targetPage = Math.max(1, Number(page) || 1);
    const requestId = ++secondaryRequestId;
    const offset = 1 + (targetPage - 1) * ITEMS_PER_PAGE;
    const cachedBlog = getValidCache();
    const cachedPage = cachedBlog && cachedBlog.secondaryPages && cachedBlog.secondaryPages[targetPage];

    currentPage = targetPage;

    if (cachedPage) {
      renderSecondaryPosts(cachedPage);
      canGoNext = currentPage < totalSecondaryPages;
      renderPagination();
      return;
    }

    postList.hidden = false;
    postList.setAttribute('aria-busy', 'true');
    showMessage(postList, 'Cargando más entradas...');

    try {
      const { posts, total } = await fetchPosts({
        perPage: SECONDARY_FETCH_LIMIT,
        offset,
      });

      if (requestId !== secondaryRequestId) {
        return;
      }

      updateTotal(total);

      const secondaryPosts = posts.slice(0, ITEMS_PER_PAGE).map(normalizePost);
      canGoNext = totalPosts !== null
        ? currentPage < totalSecondaryPages
        : posts.length > ITEMS_PER_PAGE;

      if (!secondaryPosts.length && currentPage > 1) {
        await loadSecondaryPage(currentPage - 1);
        return;
      }

      renderSecondaryPosts(secondaryPosts);
      renderPagination();
      updateCache({
        secondaryPages: {
          [currentPage]: secondaryPosts,
        },
      });
    } catch (error) {
      console.error('Error al cargar las entradas de Cooperativa:', error);
      postList.hidden = false;
      pagination.hidden = true;
      showMessage(postList, 'No se pudieron cargar más entradas en este momento.', 'cooperative-empty');
    } finally {
      postList.removeAttribute('aria-busy');
    }
  };

  const initCooperativeBlog = async () => {
    showMessage(featuredWrap, 'Cargando entradas...');
    postList.hidden = true;
    pagination.hidden = true;

    try {
      const postIndex = await fetchPostIndex();
      blogSignature = postIndex.signature;
      updateTotal(postIndex.total);

      if (postIndex.total === 0) {
        showMessage(featuredWrap, 'No hay entradas de Cooperativa publicadas por el momento.', 'cooperative-empty');
        return;
      }

      const cachedBlog = getValidCache();

      if (cachedBlog) {
        renderFromCache(cachedBlog);
        return;
      }

      const { posts, total } = await fetchPosts({
        perPage: 1,
        offset: 0,
      });

      updateTotal(total);

      if (!posts.length) {
        showMessage(featuredWrap, 'No hay entradas de Cooperativa publicadas por el momento.', 'cooperative-empty');
        return;
      }

      const featuredPost = normalizePost(posts[0]);
      renderFeatured(featuredPost);

      if (totalPosts !== null && totalPosts <= 1) {
        renderSecondaryPosts([]);
        renderPagination();
        updateCache({
          featuredPost,
          secondaryPages: {
            1: [],
          },
        });
        return;
      }

      await loadSecondaryPage(1);
      updateCache({
        featuredPost,
      });
    } catch (error) {
      console.error('Error al cargar las entradas de Cooperativa:', error);
      postList.hidden = true;
      pagination.hidden = true;
      showMessage(featuredWrap, 'No se pudieron cargar las entradas de Cooperativa en este momento.', 'cooperative-empty');
    }
  };

  pagination.addEventListener('click', event => {
    const button = event.target.closest('button[data-page]');

    if (!button || button.disabled) {
      return;
    }

    loadSecondaryPage(Number(button.dataset.page));
  });

  initCooperativeBlog();
})();
