(() => {
  const PUBLIC_SITE_URL = 'https://www.ctpulloa.com/';
  const frame = document.querySelector('#blog-post-frame');
  const iframe = frame && frame.querySelector('iframe');

  const getBlogPostUrl = postId => {
    const url = new URL('blog.html', PUBLIC_SITE_URL);
    url.searchParams.set('post', postId);
    return url.toString();
  };

  const closeBlogPostFrame = () => {
    if (!frame) return;
    frame.hidden = true;
    document.body.classList.remove('modal-is-open');
    if (iframe) iframe.src = 'about:blank';
  };

  window.openBlogPostFrame = postId => {
    if (!frame || !iframe || !postId) return;
    iframe.src = getBlogPostUrl(postId);
    frame.hidden = false;
    document.body.classList.add('modal-is-open');
    frame.querySelector('.blog-frame-close')?.focus();
  };

  window.shareBlogPost = postId => {
    const shareUrl = getBlogPostUrl(postId);
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, 'facebook-share', 'width=620,height=520,menubar=no,toolbar=no,location=yes,status=no,resizable=yes,scrollbars=yes');
  };

  if (!frame) return;
  frame.querySelectorAll('[data-blog-frame-close]').forEach(control => control.addEventListener('click', closeBlogPostFrame));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !frame.hidden) closeBlogPostFrame();
  });
})();
