export function getCurrentTimestamp() {
    return Date.now();
}

export function isOnCooldown(lastActionTime, cooldown) {
    const now = getCurrentTimestamp();
    return now - lastActionTime < cooldown;
}

export function getRemainingCooldownTime(lastActionTime, cooldown) {
    const now = getCurrentTimestamp();
    const remainingTime = cooldown - (now - lastActionTime);
    return remainingTime;
}

export function formatRemainingTime(remainingTime) {
    const remainingHours = Math.floor(remainingTime / 3600000);
    const remainingMinutes = Math.floor((remainingTime % 3600000) / 60000);
    const remainingSeconds = Math.floor((remainingTime % 60000) / 1000);

    if (remainingHours > 0) {
        return `${remainingHours} heure${remainingHours > 1 ? 's' : ''} et ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
    } else if (remainingMinutes > 0) {
        return `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
    } else {
        return `${remainingSeconds} seconde${remainingSeconds > 1 ? 's' : ''}`;
    }
}
