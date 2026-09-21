(function(){
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  const dotsEl = document.getElementById('dots');
  const counterEl = document.getElementById('counter');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const fsBtn = document.getElementById('fsBtn');

  let current = 0;

  slides.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.addEventListener('click', () => goTo(i));
    dotsEl.appendChild(dot);
  });
  const dots = Array.from(dotsEl.children);

  function render(){
    slides.forEach((s, i) => {
      s.classList.remove('active', 'prev');
      if(i === current) s.classList.add('active');
      else if(i < current) s.classList.add('prev');
    });
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    counterEl.textContent = (current + 1) + ' / ' + total;
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    updateFsAttention();
  }

  function updateFsAttention(){
    const isFs = !!document.fullscreenElement;
    if(!isFs && current === 0){
      fsBtn.classList.add('attention');
    } else if(isFs && current === total - 1){
      fsBtn.classList.add('attention');
    } else {
      fsBtn.classList.remove('attention');
    }
  }

  function goTo(i){
    current = Math.max(0, Math.min(total - 1, i));
    render();
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));

  document.addEventListener('keydown', (e) => {
    if(['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)){
      e.preventDefault();
      goTo(current + 1);
    } else if(['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)){
      e.preventDefault();
      goTo(current - 1);
    } else if(e.key === 'Home'){
      goTo(0);
    } else if(e.key === 'End'){
      goTo(total - 1);
    }
  });

  // swipe support
  let touchStartX = null;
  document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; });
  document.addEventListener('touchend', (e) => {
    if(touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if(Math.abs(dx) > 50) goTo(current + (dx < 0 ? 1 : -1));
    touchStartX = null;
  });

  fsBtn.addEventListener('click', () => {
    fsBtn.classList.remove('attention');
    if(!document.fullscreenElement) document.documentElement.requestFullscreen();
    else document.exitFullscreen();
  });
  document.addEventListener('fullscreenchange', updateFsAttention);

  // auto-hiding nav: hides after 2s, reappears when the pointer nears the
  // bottom of the screen, then hides again 2s after the pointer leaves
  const navEl = document.querySelector('.ui-nav');
  const HIDE_DELAY = 2000;
  const REVEAL_ZONE = 140;
  let hideTimer = null;

  function scheduleHide(){
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if(navEl.matches(':hover')) scheduleHide();
      else document.body.classList.add('nav-hidden');
    }, HIDE_DELAY);
  }
  function revealNav(){
    document.body.classList.remove('nav-hidden');
    scheduleHide();
  }
  document.addEventListener('pointermove', (e) => {
    if(e.clientY >= window.innerHeight - REVEAL_ZONE) revealNav();
  });
  document.addEventListener('pointerdown', (e) => {
    if(e.clientY >= window.innerHeight - REVEAL_ZONE) revealNav();
  });
  revealNav();

  // fit each slide's content inside the viewport with a safe bottom margin,
  // so text never touches the screen edge (desktop only; phones scroll)
  function fitSlides(){
    const mobile = window.matchMedia('(max-width: 640px)').matches;
    const avail = window.innerHeight * 0.84;
    document.querySelectorAll('.slide > .content, .slide > .portada').forEach((el) => {
      el.style.zoom = 1;
      if(mobile) return;
      const h = el.offsetHeight;
      if(h > avail) el.style.zoom = Math.max(0.55, avail / h).toFixed(3);
    });
  }
  window.addEventListener('resize', fitSlides);
  document.addEventListener('fullscreenchange', () => setTimeout(fitSlides, 150));
  window.addEventListener('load', fitSlides);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitSlides);
  fitSlides();

  render();
})();
