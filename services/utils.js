export function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    // Форматируем с ведущим нулём, если значение меньше 10
    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

export function replacePlaceholders(template, data) {
    return template.replace(/{(\w+)}/g, (match, key) => {
        return key in data ? data[key] : match;
    });
}
