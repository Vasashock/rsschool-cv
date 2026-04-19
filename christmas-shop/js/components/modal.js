import { normalizeCategoryLabel } from './gift-card.js';

const CATEGORY_COLOR_CLASS = Object.freeze({
  'for work': 'tag-blue',
  'for health': 'tag-green',
  'for harmony': 'tag-pink',
});

const POWER_ORDER = ['live', 'create', 'love', 'dream'];

function getCategoryImage(category) {
  const normalizedCategory = normalizeCategoryLabel(category);

  if (normalizedCategory === 'for work') {
    return './images/gift-for-work.png';
  }

  if (normalizedCategory === 'for health') {
    return './images/gift-for-health.png';
  }

  return './images/gift-for-harmony.png';
}

function createSnowflakesMarkup(value) {
  const activeSnowflakesCount = Number.parseInt(value, 10) / 100;
  const maxSnowflakesCount = 5;
  let markup = '';

  for (let index = 0; index < maxSnowflakesCount; index += 1) {
    const opacity = index < activeSnowflakesCount ? '1' : '0.2';
    markup += `<img src="./images/snowflake.png" alt="" aria-hidden="true" style="width: 16px; height: 16px; opacity: ${opacity};">`;
  }

  return markup;
}

function createPowerMarkup(powerName, powerValue) {
  return `
    <li style="display: grid; grid-template-columns: 1fr auto auto; align-items: center; column-gap: 12px;">
      <span class="paragraph" style="text-transform: capitalize;">${powerName}</span>
      <span class="paragraph">${powerValue}</span>
      <span style="display: inline-flex; gap: 8px; min-width: 112px;">${createSnowflakesMarkup(powerValue)}</span>
    </li>
  `;
}

function createModalMarkup() {
  const modalWrapper = document.createElement('div');

  modalWrapper.className = 'gift-modal';
  modalWrapper.setAttribute('aria-hidden', 'true');
  modalWrapper.innerHTML = `
    <div class="gift-overlay gift-overlay-hidden">
      <div class="gift-card-selected" role="dialog" aria-modal="true" aria-labelledby="gift-modal-title" style="width: 400px; max-width: calc(100vw - 16px); background-color: #FFFFFF; border-radius: 20px; overflow: hidden;">
        <button class="modal-close" type="button" aria-label="Close gift details">
          <span aria-hidden="true">&#10005;</span>
        </button>
        <img class="gift-img" data-modal-image src="" alt="" style="height: 230px; object-fit: contain; background-color: #ECF3F8; border-radius: 0;">
        <div class="gift-info" style="gap: 8px;">
          <span class="tag" data-modal-tag></span>
          <h3 class="gift-name h3-text" id="gift-modal-title" data-modal-title style="margin: 0;"></h3>
          <p class="paragraph" data-modal-description></p>
          <div style="width: 100%; display: flex; flex-direction: column; gap: 8px; margin-top: 12px;">
            <p class="action-small" style="margin: 0; color: #181C29;">Adds superpowers to:</p>
            <ul data-modal-powers style="width: 100%; margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 0;"></ul>
          </div>
        </div>
      </div>
    </div>
  `;

  return modalWrapper;
}

export function initModal(giftsData) {
  if (!document.querySelector('.gift-card') || !giftsData.length) {
    return;
  }

  const giftsByName = new Map(giftsData.map((gift) => [gift.name, gift]));
  const modalElement = createModalMarkup();
  const scrollToTopElement = document.querySelector('.scroll-to-top');
  const overlayElement = modalElement.querySelector('.gift-overlay');
  const imageElement = modalElement.querySelector('[data-modal-image]');
  const tagElement = modalElement.querySelector('[data-modal-tag]');
  const titleElement = modalElement.querySelector('[data-modal-title]');
  const descriptionElement = modalElement.querySelector('[data-modal-description]');
  const powersListElement = modalElement.querySelector('[data-modal-powers]');
  const closeButtonElement = modalElement.querySelector('.modal-close');

  if (
    !overlayElement
    || !imageElement
    || !tagElement
    || !titleElement
    || !descriptionElement
    || !powersListElement
    || !closeButtonElement
  ) {
    return;
  }

  let lastFocusedCard = null;

  const closeModal = () => {
    overlayElement.classList.add('gift-overlay-hidden');
    modalElement.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock-scroll');
    if (scrollToTopElement) {
      scrollToTopElement.style.display = '';
    }

    if (lastFocusedCard) {
      lastFocusedCard.focus();
    }
  };

  const openModal = (gift, sourceCard) => {
    const normalizedCategory = normalizeCategoryLabel(gift.category);
    const tagClass = CATEGORY_COLOR_CLASS[normalizedCategory] ?? 'tag-pink';

    imageElement.src = getCategoryImage(gift.category);
    imageElement.alt = gift.name;
    tagElement.textContent = gift.category;
    tagElement.className = 'tag';
    tagElement.classList.add(tagClass);
    titleElement.textContent = gift.name;
    descriptionElement.textContent = gift.description;
    powersListElement.innerHTML = POWER_ORDER
      .map((powerName) => createPowerMarkup(powerName, gift.superpowers[powerName]))
      .join('');

    lastFocusedCard = sourceCard;
    overlayElement.classList.remove('gift-overlay-hidden');
    modalElement.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock-scroll');
    if (scrollToTopElement) {
      scrollToTopElement.style.display = 'none';
    }
    closeButtonElement.focus();
  };

  const handleGiftCardOpen = (cardElement) => {
    const giftName = cardElement.dataset.giftName;
    const gift = giftsByName.get(giftName);

    if (!gift) {
      return;
    }

    openModal(gift, cardElement);
  };

  document.body.append(modalElement);

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const giftCard = event.target.closest('.gift-card');

    if (giftCard) {
      handleGiftCardOpen(giftCard);
      return;
    }

    if (event.target === overlayElement || event.target.closest('.modal-close')) {
      closeModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const giftCard = event.target.closest('.gift-card');

    if ((event.key === 'Enter' || event.key === ' ') && giftCard) {
      event.preventDefault();
      handleGiftCardOpen(giftCard);
    }

    if (event.key === 'Escape' && !overlayElement.classList.contains('gift-overlay-hidden')) {
      closeModal();
    }
  });
}
