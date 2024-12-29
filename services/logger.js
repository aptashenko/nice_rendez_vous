import fs from 'fs';
import path from 'path';

const LOG_DIR = path.resolve('logs');

// Создаём папку для логов, если её нет
if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Логирование сообщений
 * @param {string} message - Сообщение для лога
 * @param {string} [type='info'] - Тип сообщения ('info', 'error', и т.д.)
 * @param {string} [id] - Идентификатор для создания отдельного файла
 */
export function log(message, type = 'info', id) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}]: ${message}\n`;

    // Определяем путь к файлу
    const logFilePath = id ? path.resolve(LOG_DIR, `${id}.log`) : path.resolve(LOG_DIR, 'app.log');

    // Печатаем в консоль
    console.log(logMessage.trim());

    // Записываем в файл
    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error(`[ERROR]: Не удалось записать лог в файл ${logFilePath}: ${err.message}`);
        }
    });
}
