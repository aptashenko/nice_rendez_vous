import crypto from "crypto";

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

export function encrypt(data, key) {
    const hmac = crypto.createHmac('md5', key);
    hmac.update(data);
    return hmac.digest('hex');
}

export function formatDate(timestamp) {
    const date = new Date(timestamp);

    const day = String(date.getDate()).padStart(2, '0'); // Получаем день с ведущим нулем
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Месяц от 0 до 11, добавляем 1
    const year = date.getFullYear(); // Получаем год

    return `${day}.${month}.${year}`; // Формируем строку в формате DD.MM.YYYY
}

export function addMonthToDate(timestamp) {
    const date = new Date(timestamp); // Преобразуем в объект Date
    date.setMonth(date.getMonth() + 1); // Добавляем один месяц
    return date.getTime(); // Возвращаем timestamp
}
