export function initSlider() {
  const sliderViewport = document.querySelector('.slider-viewport');
  const sliderTrack = document.querySelector('.slider-container');
  const prevButton = document.querySelector('.arrow-left');
  const nextButton = document.querySelector('.arrow-right');

  if (!sliderViewport || !sliderTrack || !prevButton || !nextButton) {
    return;
  }

  const state = {
    currentStep: 0,
    maxSteps: 0,
    stepWidth: 0,
    hiddenWidth: 0,
  };

  sliderTrack.style.transition = 'transform 0.5s ease';
  sliderTrack.style.willChange = 'transform';

  function getSlidesCount() {
    return window.innerWidth <= 768 ? 6 : 3;
  }

  function getSliderMetrics() {
    const viewportStyles = window.getComputedStyle(sliderViewport);
    const paddingLeft = Number.parseFloat(viewportStyles.paddingLeft || '0');
    const paddingRight = Number.parseFloat(viewportStyles.paddingRight || '0');
    const visibleWidth = sliderViewport.clientWidth - paddingLeft - paddingRight;
    const totalWidth = sliderTrack.scrollWidth;
    const hiddenWidth = Math.max(totalWidth - visibleWidth, 0);
    const slidesCount = getSlidesCount();
    const maxSteps = hiddenWidth > 0 ? slidesCount : 0;
    const stepWidth = maxSteps > 0 ? hiddenWidth / maxSteps : 0;

    return {
      hiddenWidth,
      maxSteps,
      stepWidth,
    };
  }

  function updateButtons() {
    const isAtStart = state.currentStep === 0;
    const isAtEnd = state.currentStep === state.maxSteps;

    prevButton.disabled = isAtStart;
    nextButton.disabled = isAtEnd;

    prevButton.style.opacity = isAtStart ? '0.5' : '1';
    nextButton.style.opacity = isAtEnd ? '0.5' : '1';

    prevButton.style.cursor = isAtStart ? 'default' : 'pointer';
    nextButton.style.cursor = isAtEnd ? 'default' : 'pointer';
  }

  function moveSlider() {
    const rawOffset = state.currentStep * state.stepWidth;
    const offset = Math.min(rawOffset, state.hiddenWidth);

    sliderTrack.style.transform = `translateX(-${offset}px)`;
    updateButtons();
  }

  function recalculateSlider(resetPosition = false) {
    const { hiddenWidth, maxSteps, stepWidth } = getSliderMetrics();

    state.hiddenWidth = hiddenWidth;
    state.maxSteps = maxSteps;
    state.stepWidth = stepWidth;

    if (resetPosition) {
      state.currentStep = 0;
    } else if (state.currentStep > state.maxSteps) {
      state.currentStep = state.maxSteps;
    }

    moveSlider();
  }

  function goToNextSlide() {
    if (state.currentStep >= state.maxSteps) {
      return;
    }

    state.currentStep += 1;
    moveSlider();
  }

  function goToPrevSlide() {
    if (state.currentStep <= 0) {
      return;
    }

    state.currentStep -= 1;
    moveSlider();
  }

  let resizeTimeoutId = null;

  function handleResize() {
    clearTimeout(resizeTimeoutId);

    resizeTimeoutId = setTimeout(() => {
      sliderTrack.style.transition = 'none';
      recalculateSlider(true);

      requestAnimationFrame(() => {
        sliderTrack.style.transition = 'transform 0.5s ease';
      });
    }, 120);
  }

  prevButton.addEventListener('click', goToPrevSlide);
  nextButton.addEventListener('click', goToNextSlide);
  window.addEventListener('resize', handleResize);

  recalculateSlider(true);
}
