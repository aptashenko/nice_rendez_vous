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
import {createPayment, SECRET_KEY} from "./services/payments.js";
import { SHCEDULE_DELAY, SHCEDULE_DELAY_NIGHT } from "./config/config.js";
import {log} from "./services/logger.js";
import {loggerMessageTypes, usersRoles} from "./types/index.js";
import {readFile} from "fs/promises";
import {transactions} from "./services/transactions.js";
import {DEFAULT_USER_MENU} from "./config/buttons-settings.js";
import {DEFAULT_PRICE} from "./config/prices.js";

const texts = JSON.parse(await readFile('./config/texts.json', 'utf-8'));

let delay;

app.get('/', (req, res) => {
    return res.send('<h2>it is working!</h2>'); // Предполагается, что существует файл hi.ejs в папке views
});

app.post('/wayforpay-callback', async(req, res) => {
    try {
        // Извлечение строки JSON из ключа объекта
        const data = Object.keys(req.body)[0] + '[]}';

        const parsedData = JSON.parse(data);
        // Проверка подписи
        const signature = parsedData.merchantSignature;

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

        const [_, plan, chatId] = parsedData.orderReference.split('__');

        if (parsedData.transactionStatus === 'Approved') {
            // Отмечаем транзакцию как обработанную
            await transactions.markAsProcessed(parsedData.orderReference, {
                status: 'Approved',
                chatId
            });

            const subscriber = db.getSubscriber(Number(chatId))

            db.updateSubscriber(chatId, {paid: true, subscription_date: addMonthToDate(Date.now())})
            log('Оплатил подписку', loggerMessageTypes.success, chatId)
            await sendNotification(chatId, texts.paymentSuccess, {
                reply_markup: {
                    keyboard: DEFAULT_USER_MENU(subscriber?.paid),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })
        } else {
            console.log('Платеж отклонен или находится в ожидании');
        }
        // Отправляем подтверждение
        res.status(200).json({ status: 'OK' });
    } catch (error) {
        console.error('Ошибка при обработке данных:', error.message);
        res.status(400).json({ error: 'Invalid data format' });
    }
});

const checkUnsubscribedUser = async () => {
    const subscribers = await getSubscribers();
    for (const {
        chatId,
        paid,
        trial_ends,
        activated,
        subscription_date
    } of subscribers) {
        if (activated) {
            if (!subscription_date && Date.now() > trial_ends) {
                log(`Конец триала`, loggerMessageTypes.info, chatId)
            }
            if (subscription_date && subscription_date > Date.now()) {
                await db.updateSubscriber(chatId, {subscription_date: null, paid: false});
                log(`Закончилась подписка`, loggerMessageTypes.info, chatId)
            }
            if (!paid && Date.now() > trial_ends) {
                const { invoiceUrl } = await createPayment(chatId, DEFAULT_PRICE);
                await sendNotification(chatId, texts.unpaidMessage, {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: texts.keyboard.buy.button,
                                    url: invoiceUrl
                                }
                            ]
                        ]
                    },
                    parse_mode: 'MarkdownV2'
                });
            }
        }
    }
}

const checkRendezVous = async () => {
    log('Началась проверка сайта', loggerMessageTypes.info)

    const subscribers = await getSubscribers();
    const {status: messageStatus, text: messageText} = await checkWebsite();

    for (const subscriber of subscribers) {
        const {
            chatId,
            role,
            activated,
            paid,
            showNegativeNotifications,
            trial_ends
        } = subscriber; // chatId и status извлекаются из объекта подписчика

        try {
            if (activated) {
                if (paid || Date.now() < trial_ends) {
                    if (!messageStatus && !showNegativeNotifications) {
                        //если отключил уведомления в настройках
                        console.log(`Пропущено уведомление для пользователя ${chatId} из-за отрицательного статуса.`);
                        continue;
                    }

                    if (role === usersRoles.user) {
                        // Обычным пользователям отправляем сообщение раз в 10 минут
                        const currentMinute = new Date().getMinutes();
                        if (currentMinute % (delay * 2) === 0) {
                            await sendNotification(chatId, messageText);
                        }
                    } else {
                        // Для остальных статусов отправляем сообщение каждые 5 минут
                        await sendNotification(chatId, messageText);
                    }
                }
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
        log('База данных инициализирована.', loggerMessageTypes.success)
        // Запуск Telegram-бота
        await startTelegramBot();
        console.log("Telegram-бот запущен.");
        log('Telegram-бот запущен.', loggerMessageTypes.success)
        // Отправка сообщение пользователям без подписки
        await checkUnsubscribedUser();
        // Периодическая проверка для всех подписчиков
        schedule.scheduleJob(`*/${SHCEDULE_DELAY} * * * *`, checkRendezVous);
        // Ежедневная проверка подписки пользователей
        schedule.scheduleJob('0 * * * *', checkUnsubscribedUser);
        // Функция для определения текущего интервала
        const scheduleJobs = () => {
            const now = new Date();
            const currentHour = now.getHours();

            // Определяем задержку в зависимости от времени суток
            delay = (currentHour >= 22 || currentHour < 6) ? SHCEDULE_DELAY_NIGHT : SHCEDULE_DELAY; // 120 минут (2 часа) ночью, 5 минут днём

            // Сбрасываем предыдущие задания
            schedule.gracefulShutdown();

            // Устанавливаем новое расписание
            schedule.scheduleJob(`*/${delay} * * * *`, checkRendezVous);
            console.log(`Периодическая проверка установлена с интервалом ${delay} минут.`);
        };

        // Первоначальная установка расписания
        scheduleJobs();

        // Проверка времени каждый час для обновления расписания
        schedule.scheduleJob('*/60 * * * *', scheduleJobs);

    } catch (err) {
        console.error("Ошибка при запуске бота:", err.message);
        log('Ошибка при запуске бота:', loggerMessageTypes.error)
    }
})();

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Webhook server is running on port ${PORT}`);
    log('Сервер запущен!', loggerMessageTypes.info)
});
