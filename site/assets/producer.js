/* Producer bios animate open and closed. Without JavaScript, or when the user
   prefers reduced motion, the native details toggle applies instantly. */
(() => {
  const DURATION = 350;
  const EASING = 'cubic-bezier(.4, 0, .2, 1)';
  const TRANSITION = `height ${DURATION}ms ${EASING}, margin-top ${DURATION}ms ${EASING}, opacity ${DURATION}ms ${EASING}`;

  const animate = (details, open) => {
    const bio = details.querySelector('.producer-bio');
    if (!bio) {
      details.open = open;
      return;
    }
    const margin = parseFloat(getComputedStyle(bio).marginTop) || 0;
    const setTo = (height, top, opacity) => {
      bio.style.height = height;
      bio.style.marginTop = top;
      bio.style.opacity = opacity;
    };
    let finish;
    if (open) {
      details.open = true;
      const height = bio.scrollHeight;
      bio.style.transition = 'none';
      bio.style.overflow = 'hidden';
      setTo('0px', '0px', '0');
      bio.offsetHeight;
      bio.style.transition = TRANSITION;
      setTo(`${height}px`, `${margin}px`, '1');
      finish = () => { bio.style.cssText = ''; };
    } else {
      const height = bio.offsetHeight;
      bio.style.transition = 'none';
      bio.style.overflow = 'hidden';
      setTo(`${height}px`, `${margin}px`, '1');
      bio.offsetHeight;
      bio.style.transition = TRANSITION;
      setTo('0px', '0px', '0');
      finish = () => {
        details.open = false;
        bio.style.cssText = '';
      };
    }
    details.finishAnimation = finish;
    const stop = event => {
      if (event.target !== bio || event.propertyName !== 'height') return;
      bio.removeEventListener('transitionend', stop);
      if (details.finishAnimation !== finish) return;
      details.finishAnimation = null;
      finish();
    };
    bio.addEventListener('transitionend', stop);
  };

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const summary = event.target.closest('summary');
    if (!summary || !summary.parentElement.matches('.producer-profile')) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const details = summary.parentElement;
    event.preventDefault();
    if (details.finishAnimation) details.finishAnimation();
    animate(details, !details.open);
  });
})();
