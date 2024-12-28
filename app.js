import express from 'express';
const app = express();
import { db } from "./services/database.js";
app.use(express.urlencoded({ extended: true }));

import schedule from 'node-schedule';
import { checkWebsite } from "./tasks/checkWebsite.js";
import { initializeDB } from './services/database.js';
import {sendNotification, startTelegramBot} from "./tasks/telegramBotHandler.js";
import {getSubscribers} from "./services/subscribersManager.js";
import {addMonthToDate, encrypt} from "./services/utils.js";
import { SECRET_KEY } from "./services/payments.js";
import { SHCEDULE_DELAY } from "./config/settings.js";

const checkUsersSubscriptionDate = async () => {
    const subscribers = await getSubscribers();

    for (const subscriber of subscribers) {
        if (subscriber.subscription_date && subscriber.subscription_date > Date.now()) {
            db.updateSubscriber(subscriber.chatId, {subscription_date: null, status: 'free'})
        }
    }
}

app.get('/', (req, res) => {
    return res.send('<h2>it is working!</h2>'); // Предполагается, что существует файл hi.ejs в папке views
});

app.post('/wayforpay-callback', (req, res) => {
    try {
        // Извлечение строки JSON из ключа объекта
        const data = Object.keys(req.body)[0] + '[]}';

        const parsedData = JSON.parse(data);
        // Логируем распарсенные данные
        console.log('Распарсенные данные:', parsedData);

        // Проверка подписи
        const signature = parsedData.merchantSignature;

        console.log('Подпись: ', signature)

        const stringToSign = [
            parsedData.merchantAccount,
            parsedData.orderReference,
            parsedData.amount,
            parsedData.currency,
            parsedData.authCode,
            parsedData.cardPan,
            parsedData.transactionStatus,
            parsedData.reasonCode
        ].join(';');

        const calculatedSignature = encrypt(stringToSign, SECRET_KEY)

        if (calculatedSignature !== signature) {
            console.error('Неверная подпись!');
            return res.status(400).send('Invalid signature');
        }

        // Обработка данных
        if (parsedData.transactionStatus === 'Approved') {
            console.log('Платеж успешно завершен!');
            const [_, plan, chatId, other] = parsedData.orderReference.split('__');
            const subscriber = db.getSubscriber(chatId);

            db.updateSubscriber(subscriber.chatId, {status: plan, subscription_date: addMonthToDate(Date.now())})

            console.log(subscriber)
        } else {
            console.log('Платеж отклонен или находится в ожидании');
        }
        // Отправляем подтверждение
        res.json({ status: 'OK' });
    } catch (error) {
        console.error('Ошибка при обработке данных:', error.message);
        res.status(400).json({ error: 'Invalid data format' });
    }
});

const checkRendezVous = async () => {
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
                if (currentMinute % (SHCEDULE_DELAY * 2) === 0) {
                    await sendNotification(chatId, messageText);
                    console.log(`Уведомление отправлено (раз в ${SHCEDULE_DELAY * 2} мин) пользователю ${chatId}:`, messageText);
                }
            } else {
                // Для остальных статусов отправляем сообщение каждые 5 минут
                await sendNotification(chatId, messageText);
                console.log(`Уведомление отправлено (раз в ${SHCEDULE_DELAY} мин) пользователю ${chatId}:`, messageText);
            }
        } catch (err) {
            console.error(`Ошибка при отправке сообщения пользователю ${chatId}:`, err.message);
        }
    }
}

(async () => {
    try {
        // Инициализация базы данных
        await initializeDB();
        console.log("База данных инициализирована.");
        // Запуск Telegram-бота
        await startTelegramBot();
        console.log("Telegram-бот запущен.");
        // Периодическая проверка для всех подписчиков
        schedule.scheduleJob(`*/${SHCEDULE_DELAY} * * * *`, checkRendezVous);
        schedule.scheduleJob(`0 0 * * *`, checkUsersSubscriptionDate);
    } catch (err) {
        console.error("Ошибка при запуске бота:", err.message);
    }
})();

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Webhook server is running on port ${PORT}`);
});
