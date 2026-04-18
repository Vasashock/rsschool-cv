export function initTimer() {
    const daysElem = document.querySelector('.countdown-item:nth-child(1) span');
    const hoursElem = document.querySelector('.countdown-item:nth-child(2) span');
    const minutesElem = document.querySelector('.countdown-item:nth-child(3) span');
    const secondsElem = document.querySelector('.countdown-item:nth-child(4) span');

    function updateTime() {
        const now = new Date();
        const currentYear = now.getUTCFullYear();
        const nextYear = new Date(Date.UTC(currentYear + 1, 0, 1, 0, 0, 0));

        const diffrent = nextYear - now;

        const days = Math.floor(diffrent / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffrent % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffrent % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffrent % (1000 * 60)) / 1000);

        daysElem.textContent = days;
        hoursElem.textContent = hours;
        minutesElem.textContent = minutes;
        secondsElem.textContent = seconds;
    }
  updateTime();             
  setInterval(updateTime, 1000); 
}