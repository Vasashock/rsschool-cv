import { createGiftCard, normalizeCategoryLabel } from './gift-card.js';

const TAB_ACTIVE_CLASS = 'gifts-tab-active';
const ALL_CATEGORY = 'all';

function getCategoryFromTab(tabElement) {
    return normalizeCategoryLabel(tabElement.textContent);
}

function filterGiftsByCategory(giftsData, category) {
    if (category === ALL_CATEGORY) {
        return giftsData;
    }

    return giftsData.filter(
        (gift) => normalizeCategoryLabel(gift.category) === category
    );
}

function renderGiftCards(containerElement, templateElement, gifts) {
    const giftCards = gifts
        .map((gift) => createGiftCard(templateElement, gift))
        .filter(Boolean);

    containerElement.replaceChildren(...giftCards);
}

export function initCategory(giftsData) {
    const giftsGridElement = document.querySelector('.gifts-page-grid');
    const templateCardElement = giftsGridElement?.firstElementChild;
    const tabs = document.querySelectorAll('.gifts-tab');

    if (!giftsGridElement || !templateCardElement || !giftsData.length) {
        return;
    }

    const updateActiveTab = (selectedTab) => {
        tabs.forEach((tabElement) => {
            tabElement.classList.toggle(TAB_ACTIVE_CLASS, tabElement === selectedTab);
        });
    };

    const renderCategory = (category) => {
        const filteredGifts = filterGiftsByCategory(giftsData, category);
        renderGiftCards(giftsGridElement, templateCardElement, filteredGifts);
    };

    renderCategory(ALL_CATEGORY);

    tabs.forEach((tabElement) => {
        tabElement.addEventListener('click', () => {
            updateActiveTab(tabElement);
            renderCategory(getCategoryFromTab(tabElement));
        });
    });
}
