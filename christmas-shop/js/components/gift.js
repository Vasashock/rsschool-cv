import { fillGiftCard } from './gift-card.js';

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function initGift(giftsData) {
  const giftCards = document.querySelectorAll('.best-gifts .gift-card');
  const availableGifts = [...giftsData];

  if (!giftCards.length || !availableGifts.length) {
    return;
  }

  giftCards.forEach((cardElement) => {
    const randomIndex = getRandomInt(0, availableGifts.length - 1);
    const [randomGift] = availableGifts.splice(randomIndex, 1);

    fillGiftCard(cardElement, randomGift);
  });
}
