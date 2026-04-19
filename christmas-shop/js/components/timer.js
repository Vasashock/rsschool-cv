function getTimeElements() {
  const countdownItems = document.querySelectorAll('.countdown-item span');

  return {
    daysElement: countdownItems[0],
    hoursElement: countdownItems[1],
    minutesElement: countdownItems[2],
    secondsElement: countdownItems[3],
  };
}

function getRemainingTimeUntilNewYear() {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const nextYearDate = new Date(Date.UTC(currentYear + 1, 0, 1, 0, 0, 0));
  const difference = nextYearDate - now;

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
  };
}

export function initTimer() {
  const { daysElement, hoursElement, minutesElement, secondsElement } = getTimeElements();

  if (!daysElement || !hoursElement || !minutesElement || !secondsElement) {
    return;
  }

  const updateTime = () => {
    const { days, hours, minutes, seconds } = getRemainingTimeUntilNewYear();

    daysElement.textContent = days;
    hoursElement.textContent = hours;
    minutesElement.textContent = minutes;
    secondsElement.textContent = seconds;
  };

  updateTime();
  setInterval(updateTime, 1000);
}
