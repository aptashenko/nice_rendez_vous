import express from 'express';
const app = express();

import schedule from 'node-schedule';
import { checkWebsite } from "./tasks/checkWebsite.js";
import { initializeDB } from './services/database.js';
import {sendNotification, startTelegramBot} from "./tasks/telegramBotHandler.js";
import {getSubscribers} from "./services/subscribersManager.js";


(async () => {
    try {
        // Инициализация базы данных
        await initializeDB();
        console.log("База данных инициализирована.");

        // Запуск Telegram-бота
        await startTelegramBot();
        console.log("Telegram-бот запущен.");

        // Периодическая проверка для всех подписчиков
        schedule.scheduleJob('*/10 * * * *', async () => {
            console.log("Периодическая проверка сайта...");
            const subscribers = await getSubscribers();
            const {status: messageStatus, text: messageText} = await checkWebsite();

            for (const subscriber of subscribers) {
                const { chatId, status, showNegativeNotifications } = subscriber; // chatId и status извлекаются из объекта подписчика

                try {
                    if (!messageStatus && !showNegativeNotifications) {
                        console.log(`Пропущено уведомление для пользователя ${chatId} из-за отрицательного статуса.`);
                        continue;
                    }

                    if (status === 'free') {
                        // Если статус "free", отправляем сообщение раз в 10 минут
                        const currentMinute = new Date().getMinutes();
                        console.log(currentMinute, currentMinute % 10 === 0)
                        if (currentMinute % 10 === 0) {
                            await sendNotification(chatId, messageText);
                            console.log(`Уведомление отправлено (раз в 10 мин) пользователю ${chatId}:`, messageText);
                        }
                    } else {
                        // Для остальных статусов отправляем сообщение каждые 5 минут
                        await sendNotification(chatId, messageText);
                        console.log(`Уведомление отправлено (раз в 5 мин) пользователю ${chatId}:`, messageText);
                    }
                } catch (err) {
                    console.error(`Ошибка при отправке сообщения пользователю ${chatId}:`, err.message);
                }
            }
        });
    } catch (err) {
        console.error("Ошибка при запуске бота:", err.message);
    }
})();

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Webhook server is running on port ${PORT}`);
});
