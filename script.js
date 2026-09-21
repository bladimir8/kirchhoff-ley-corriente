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

  // ---- staggered entrance: tag each slide's elements and give them a delay ----
  document.documentElement.classList.add('js');
  const REVEAL = '.eyebrow, h2, .lead, .formula-box, .card, .check-list li, .step-list li, ' +
    '.sub-list li, .proc-step, .error-card, .solve-line, .ref, .diagram-caption, .mini-caption, ' +
    '.biblio-list li, .logo-row, .col-diagram, .diagram-center, .bio-strip, .portada > *';
  const SLOW_STEP = '.solve-line, .proc-step, .error-card';
  slides.forEach((slide) => {
    const els = Array.from(slide.querySelectorAll(REVEAL)).filter((el) =>
      !el.parentElement.closest(REVEAL) && !el.closest('.formula-float-layer, .node-bg-layer'));
    let n = 0;
    els.forEach((el) => {
      el.classList.add('rv');
      let delay;
      if(el.matches('.col-diagram, .diagram-center')){
        el.classList.add('rv-diagram');
        delay = 260;
      } else {
        delay = 60 + n * (el.matches(SLOW_STEP) ? 150 : 80);
        n++;
      }
      el.style.setProperty('--d', Math.min(delay, 1400) + 'ms');
    });
  });
  let firstRender = true;

  function render(){
    slides.forEach((s, i) => {
      s.classList.remove('active', 'prev');
      if(i === current) s.classList.add('active');
      else if(i < current) s.classList.add('prev');
    });
    const applyIn = () => slides.forEach((s, i) => s.classList.toggle('in', i === current));
    if(firstRender){
      firstRender = false;
      void document.body.offsetWidth; // commit the hidden state so the first entrance animates too
    }
    applyIn();
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
  const MIN_ZOOM = 0.55;
  const MAX_ZOOM = 1.3;
  function fitSlides(){
    const mobile = window.matchMedia('(max-width: 640px)').matches;
    const avail = window.innerHeight * 0.86;
    document.querySelectorAll('.slide > .content, .slide > .portada').forEach((el) => {
      el.style.zoom = 1;
      if(mobile) return;
      const slide = el.parentElement;
      // real rendered height, ignoring the slide's own transition scale
      const realHeight = () => {
        const k = slide.getBoundingClientRect().width / slide.offsetWidth || 1;
        return el.getBoundingClientRect().height / k;
      };
      // grow when there is room (legible from far away), shrink when there is not
      let z = 1;
      for(let i = 0; i < 4; i++){
        const h = realHeight();
        if(Math.abs(h - avail) / avail < 0.03 && h <= avail) break;
        z = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * avail / h));
        el.style.zoom = z.toFixed(3);
      }
      if(realHeight() > avail && z > MIN_ZOOM){
        z = Math.max(MIN_ZOOM, z * avail / realHeight());
        el.style.zoom = z.toFixed(3);
      }
    });
  }
  window.addEventListener('resize', fitSlides);
  document.addEventListener('fullscreenchange', () => setTimeout(fitSlides, 150));
  window.addEventListener('load', fitSlides);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(fitSlides);
  fitSlides();

  render();
})();
