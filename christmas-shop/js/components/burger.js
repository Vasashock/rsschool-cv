export function initBurger() {
    const burgerElem = document.getElementsByClassName('burger-menu')[0];
    const mobMenu = document.getElementsByClassName('mob-burger-menu')[0];
    const linksMobMenu = document.querySelectorAll('.mob-menu_link');
    const bodyElem = document.getElementsByTagName('body')[0];
    const isDesktop = window.matchMedia('(min-width: 769px)');


    burgerElem.addEventListener('click', () => {
        mobMenu.classList.toggle('active');
        burgerElem.classList.toggle('active');
        bodyElem.classList.toggle('lock-scroll');
    });
    
    linksMobMenu.forEach((elem) => {
        elem.addEventListener('click', () => {
            burgerElem.classList.toggle('active');
            mobMenu.classList.toggle('active');
            bodyElem.classList.toggle('lock-scroll');
        })
    })

    isDesktop.addEventListener('change', (e) => {
        if(e.matches){
            burgerElem.classList.remove('active');
            bodyElem.classList.remove('lock-scroll');
            mobMenu.classList.remove('active');
        }
    })

}