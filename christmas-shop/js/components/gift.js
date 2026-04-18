import { fillGiftCard } from './gift-card.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function initGift(giftsData) {
  const giftCards = document.querySelectorAll('.best-gifts .gift-card');

  if (!giftCards.length || !giftsData.length) {
    return;
  }

  giftCards.forEach((cardElement) => {
    const randomIndex = getRandomInt(0, giftsData.length - 1);
    const randomGift = giftsData[randomIndex];

    fillGiftCard(cardElement, randomGift);
  });
}
