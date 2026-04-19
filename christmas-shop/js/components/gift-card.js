const CATEGORY_CONFIG = Object.freeze({
  'For Work': {
    imageSrc: './images/gift-for-work.png',
    tagClass: 'tag-blue',
  },
  'For Health': {
    imageSrc: './images/gift-for-health.png',
    tagClass: 'tag-green',
  },
  'For Harmony': {
    imageSrc: './images/gift-for-harmony.png',
    tagClass: 'tag-pink',
  },
});

function getCategoryConfig(category) {
  return CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG['For Harmony'];
}

export function fillGiftCard(cardElement, gift) {
  if (!cardElement || !gift) {
    return;
  }

  const { imageSrc, tagClass } = getCategoryConfig(gift.category);
  const tagElement = cardElement.querySelector('.tag');
  const nameElement = cardElement.querySelector('.gift-name');
  const imageElement = cardElement.querySelector('img');

  if (tagElement) {
    tagElement.textContent = gift.category;
    tagElement.className = 'tag';
    tagElement.classList.add(tagClass);
  }

  if (nameElement) {
    nameElement.textContent = gift.name;
  }

  if (imageElement) {
    imageElement.src = imageSrc;
    imageElement.alt = gift.name;
  }

  cardElement.dataset.giftName = gift.name;
  cardElement.setAttribute('tabindex', '0');
  cardElement.setAttribute('role', 'button');
  cardElement.setAttribute('aria-label', `${gift.name}. Open gift details`);
}

export function createGiftCard(templateElement, gift) {
  if (!templateElement) {
    return null;
  }

  const cardElement = templateElement.cloneNode(true);
  fillGiftCard(cardElement, gift);

  return cardElement;
}

export function normalizeCategoryLabel(label) {
  return label.trim().toLowerCase();
}
