import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {log} from "./logger.js";
import {loggerMessageTypes} from "../types/index.js";

// Восстанавливаем __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Инициализация базы данных
const file = path.resolve(__dirname, 'db.json'); // PRODUCTION
// const file = path.resolve(__dirname, 'db_test.json'); //DEVELOPING
const adapter = new JSONFile(file);
export const db = new Low(adapter);

/**
 * Инициализация структуры базы данных
 */
export async function initializeDB() {
    await db.read();
    db.data ||= { subscribers: [] }; // Устанавливаем начальную структуру
    await db.write();
}

/**
 * Получить подписчика по chatId
 * @param {number} chatId - ID чата пользователя
 * @returns {object|null} - Найденный подписчик или null, если подписчик не найден
 */
db.getSubscriber = (chatId) => {
    return db.data.subscribers.find((sub) => sub?.chatId === Number(chatId)) || null;
};

/**
 * Обновить данные подписчика
 * @param {number} chatId - ID чата пользователя
 * @param {object} updates - Объект с обновляемыми данными
 * @returns {object|null} - Обновлённый подписчик или null, если подписчик не найден
 */
db.updateSubscriber = async (chatId, updates) => {
    const subscriber = db.data.subscribers.find((sub) => Number(sub?.chatId) === Number(chatId));

    if (subscriber) {
        // Обновляем данные подписчика
        Object.assign(subscriber, updates);
        await db.write(); // Сохраняем изменения в файл
        log(`Обновил данные: ${JSON.stringify(updates)}`, loggerMessageTypes.success, chatId);
        console.log(`Подписчик ${chatId} обновлён:`, updates);
        return subscriber;
    } else {
        console.error(`Подписчик ${chatId} не найден.`);
        return null;
    }
};
