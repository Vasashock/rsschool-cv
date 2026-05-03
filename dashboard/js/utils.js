export function getInitialPeriod() {
    const now = new Date();
    const year = Math.min(2027, Math.max(2025, now.getFullYear()));
    return {
        month: now.getMonth(),
        year,
    };
}

export function getPeriodKey(year, month) {
    return `${year}-${month}`;
}

export function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}

export function uid() {
    if (window.crypto?.randomUUID) {
        return window.crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function formatCurrency(value) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value) || 0);
}

export function formatNumber(value, digits = 2) {
    return Number(value || 0).toFixed(digits);
}

export function calculateAge(dob) {
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const monthDiff = now.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
        age -= 1;
    }
    return age;
}

export function humanizeKey(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

export function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export function escapeAttribute(value) {
    return escapeHtml(value).replaceAll('`', '&#96;');
}

export function isVacationContinuous(previousDay, nextDay, isWeekendFn) {
    if (nextDay - previousDay === 1) {
        return true;
    }
    for (let day = previousDay + 1; day < nextDay; day += 1) {
        if (!isWeekendFn(day)) {
            return false;
        }
    }
    return true;
}

export function formatVacationRanges(days, year, month, isWeekendFn) {
    if (!days.length) {
        return '';
    }
    const groups = [];
    let start = days[0];
    let previous = days[0];
    for (let index = 1; index < days.length; index += 1) {
        const day = days[index];
        if (isVacationContinuous(previous, day, (value) => isWeekendFn(year, month, value))) {
            previous = day;
            continue;
        }
        groups.push([start, previous]);
        start = day;
        previous = day;
    }
    groups.push([start, previous]);
    return groups.map(([from, to]) => from === to
        ? `${String(from).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}`
        : `${String(from).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}-${String(to).padStart(2, '0')}.${String(month + 1).padStart(2, '0')}`)
        .join(', ');
}
