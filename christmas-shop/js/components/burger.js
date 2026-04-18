export function initBurger() {
    const burgerElement = document.querySelector('.burger-menu');
    const mobileMenuElement = document.querySelector('.mob-burger-menu');
    const mobileMenuLinks = document.querySelectorAll('.mob-menu_link');
    const bodyElement = document.body;
    const desktopMediaQuery = window.matchMedia('(min-width: 769px)');

    if (!burgerElement || !mobileMenuElement) {
        return;
    }

    const closeMenu = () => {
        burgerElement.classList.remove('active');
        mobileMenuElement.classList.remove('active');
        bodyElement.classList.remove('lock-scroll');
    };

    const toggleMenu = () => {
        burgerElement.classList.toggle('active');
        mobileMenuElement.classList.toggle('active');
        bodyElement.classList.toggle('lock-scroll');
    };

    burgerElement.addEventListener('click', toggleMenu);

    mobileMenuLinks.forEach((linkElement) => {
        linkElement.addEventListener('click', closeMenu);
    });

    desktopMediaQuery.addEventListener('change', ({ matches }) => {
        if (matches) {
            closeMenu();
        }
    });
}
