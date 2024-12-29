import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import path from 'node:path';

// Определяем путь к файлу базы данных
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const file = path.join(__dirname, 'db_transactions.json');

// Настраиваем адаптер и подключаем базу данных
const adapter = new JSONFile(file);
const db = new Low(adapter);

// Инициализация базы данных
await db.read();
db.data ||= { transactions: [] };
await db.write();

// Экспортируем функции для работы с транзакциями
export const transactions = {
    /**
     * Проверка, была ли транзакция обработана
     * @param {string} orderReference
     * @returns {boolean}
     */
    isProcessed(orderReference) {
        return db.data.transactions.some(tx => tx.orderReference === orderReference);
    },

    /**
     * Отметить транзакцию как обработанную
     * @param {string} orderReference
     * @param {object} additionalData - дополнительные данные (например, статус)
     */
    async markAsProcessed(orderReference, additionalData = {}) {
        db.data.transactions.push({
            orderReference,
            processedAt: new Date().toISOString(),
            ...additionalData
        });
        await db.write();
    },

    /**
     * Получить все обработанные транзакции
     * @returns {Array}
     */
    getProcessedTransactions() {
        return db.data.transactions;
    }
};
