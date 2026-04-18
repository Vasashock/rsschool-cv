import { initBurger } from './components/burger.js';
import { initSlider } from './components/slider.js';
import { initTimer } from './components/timer.js';

document.addEventListener('DOMContentLoaded', () => {
    
initBurger();
initSlider();
initTimer();
//   renderGifts();
});

// console.log(`Implementation of the burger menu on both pages: +22
// At a page width of 768px and less, the navigation panel hides, and the burger icon appears: +2
// When clicking the burger icon, the burger menu slides out from the right, and the burger icon smoothly transforms into a cross: +2
// The burger menu occupies the entire available screen area below the <header> block: +2
// When clicking the cross, the burger menu smoothly hides, moving to the right of the screen, and the cross smoothly transforms into a burger icon: +2
// The burger icon is created using HTML and CSS without the use of images/svg: +2
// Links in the burger menu work, providing smooth scrolling to anchor points: +2
// When clicking on any link (interactive or non-interactive) in the menu, the burger menu hides, and the cross transforms into a burger icon: +2
// When clicking on any link (interactive or non-interactive) in the menu, the burger menu smoothly hides to the right, and the cross smoothly transforms into a burger icon if a user stays on the same page: +2
// The placement and sizes of elements in the burger menu correspond to the layout (horizontal and vertical centering of menu items): +2
// The page behind the open menu does not scroll: +2
// When the page width increases to more than 768px, the burger icon and the open burger menu hide, and the navigation panel appears: +2
// Implementation of the Slider on the home page: +18
// Scrolling the slider in the corresponding direction is implemented by pressing left arrow button and right arrow button: +2
// The left arrow button is inactive at the far left position of the slider: +2
// The right arrow button is inactive at the far right position of the slider: +2
// Scrolling the slider is accompanied by the carousel-like animation (the method of animation execution is not evaluated): +4
// The slider is fully scrolled with 3 presses of the arrow button in one direction for screen widths more than 768px, and with 6 presses of the arrow button in one direction for screen widths of 768px and less: +4
// When the screen width changes, the slider returns to its initial position, and the slider can be fully scrolled with the correct number of the relevant arrow button clicks (it works without reloading the page): +4
// Implementation of the Timer on the home page: +8
// The timer shows the correct value of the remaining days, hours, minutes, and seconds until the New Year in UTC+0: +2
// Leading zeros are not displayed for single-digit numbers: +2
// The timer updates every second, displaying the current remaining time with the labels days, hours, minutes, seconds (the labels must not change): +4
// When both opening or refreshing the page, 4 random cards are displayed in the block Best Gifts on the home page: +4
// Implementation of the Category switching for products on the gifts page: +8
// The ALL category is active and all 36 gifts are displayed when both opening or reloading the gifts page. The order of sorting gifts does not matter: +2
// When switching categories, the gifts of the selected category are displayed. The order of sorting gifts does not matter: +4
// Only the selected category tab is active: +2
// Implementation of the Scroll-to-Top button on the gifts page: +12
// The button can only appear at a screen width of 768px and less: +2
// At the top of the page, the button is not displayed: +4
// The button appears after scrolling the page down by 300px: +4
// When the button is clicked, the page scrolls to the top: +2
// Implementation of the Modal for selected gift on both pages: +18
// The Modal with the description of a specific gift opens when clicking on any part of a card of gift: +4
// The description and superpowers in the Modal corresponds to the selected gift: +4
// The part of the page outside the Modal is darkened: +2
// When the Modal is open, the vertical scroll of the page becomes inactive; when closed, it becomes active again: +4
// Clicking on the area around the Modal and Close button closes it: +2
// The Modal is centered on both axes, sizes of modal elements and their layout match the design: +2`);