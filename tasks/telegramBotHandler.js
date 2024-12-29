import TelegramBot from "node-telegram-bot-api";
import { SHCEDULE_DELAY, TELEGRAM_BOT_API } from "../config/settings.js";
import {
    ACTIVATE_BOT_MENU, ADMIN_MENU,
    DEFAULT_USER_MENU,
    PERSONAL_ACCOUNT_MENU,
    TELEGRAM_BOT_MENU, TELEGRAM_BOT_MENU_ADMIN
} from "../config/buttons-settings.js"
import {addSubscriber, getSubscribers, removeSubscriber} from "../services/subscribersManager.js";
import {checkWebsite} from "./checkWebsite.js";
import { db } from "../services/database.js";
import {formatDate, formatTime, pause, replacePlaceholders} from "../services/utils.js";
import { readFile } from 'fs/promises';
import {createPayment} from "../services/payments.js";
import {log} from "../services/logger.js";
import {loggerMessageTypes} from "../types/index.js";
export let TELEGRAM_BOT;

const texts = JSON.parse(await readFile('./config/texts.json', 'utf-8'));

export async function startTelegramBot() {
    TELEGRAM_BOT = new TelegramBot(TELEGRAM_BOT_API, { polling: true });

    TELEGRAM_BOT.setMyCommands(TELEGRAM_BOT_MENU);


    TELEGRAM_BOT.on("polling_error", err => console.log(err));

    TELEGRAM_BOT.on('message', async msg => {
        const admins = getSubscribers().filter(user => user.role === 'admin');

        const chatId = msg.chat.id;

        const subscriber = await db.getSubscriber(chatId); // Получить данные пользователя из базы

        if (subscriber.role === 'admin') {
            TELEGRAM_BOT.setMyCommands(TELEGRAM_BOT_MENU_ADMIN);
        }

        // Добавляем пользователя в подписчики

        if (msg.text === '/start') {
            const isNew = await addSubscriber(chatId);
            for (const admin of admins) {
                if (isNew) {
                    await TELEGRAM_BOT.sendMessage(admin.chatId, replacePlaceholders(texts.keyboard.usersCount.response2, {date: new Date(msg.date).toLocaleString(), nick: msg.from.username}));
                    log(`Регистрация пользователя, ${msg.from.username}`, loggerMessageTypes.info, chatId);
                    log(`Регистрация пользователя ${chatId}`, loggerMessageTypes.info);
                }
            }
            await TELEGRAM_BOT.sendMessage(chatId, texts.greetings);
            await pause(1000);
            await TELEGRAM_BOT.sendMessage(chatId, texts.greetings2);
            await pause(1000);
            await TELEGRAM_BOT.sendMessage(chatId, texts.greetings3, {parse_mode: 'MarkdownV2'});
        } else if(msg.text === '/menu') {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.menu.open.response, {
                reply_markup: {
                    keyboard: DEFAULT_USER_MENU(subscriber.subscription_date),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })

        } else if(msg.text === '/activate') {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, replacePlaceholders(texts.menu.main.response, {delay: subscriber.status === 'free' ? SHCEDULE_DELAY * 2 : SHCEDULE_DELAY}), {
                reply_markup: {
                    keyboard: DEFAULT_USER_MENU(subscriber.subscription_date),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })
        } else if (msg.text === '/account') {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.menu.account.response, {
                reply_markup: {
                    keyboard: PERSONAL_ACCOUNT_MENU(subscriber.showNegativeNotifications),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })
        } else if (msg.text === '/admin') {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.menu.admin.response, {
                reply_markup: {
                    keyboard: ADMIN_MENU,
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })
        } else if (msg.text === texts.keyboard.description.button) {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.description.response)

        } else if (msg.text === texts.keyboard.usersCount.button) {
            const allUsers = getSubscribers();
            const paidUsers = allUsers.filter(user => user.subscription_date)
            await TELEGRAM_BOT.sendMessage(msg.chat.id, replacePlaceholders(texts.keyboard.usersCount.response, {sum: allUsers.length, paid: paidUsers.length}))

        } else if (msg.text === texts.keyboard.notificationsOn.button) {
            await db.updateSubscriber(chatId, { showNegativeNotifications: false });
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.notificationsOn.response, {
                reply_markup: {
                    keyboard: PERSONAL_ACCOUNT_MENU(subscriber.showNegativeNotifications),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })

        } else if (msg.text === texts.keyboard.notificationsOff.button) {
            await db.updateSubscriber(chatId, { showNegativeNotifications: true });
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.notificationsOff.response, {
                reply_markup: {
                    keyboard: PERSONAL_ACCOUNT_MENU(subscriber.showNegativeNotifications),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })

        } else if (msg.text === texts.keyboard.back.button) {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.back.response, {
                reply_markup: {
                    keyboard: DEFAULT_USER_MENU(subscriber.subscription_date),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })

        } else if (msg.text === texts.keyboard.description_subscription.button) {
            const planSettings = {
                amount: 1,
                label: 'standard',
                products: {
                    productName: ['Допомогти проекту'],
                    productCount: [1],
                    productPrice: [1]
                },
                currency: 'EUR'
            }
            const {invoiceUrl} = await createPayment(subscriber.chatId, planSettings);
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.description_subscription.response, {
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
            })
            log('Натиснув на кнопку оплати', loggerMessageTypes.info, subscriber.chatId)
        } else if (msg.text === texts.keyboard.pesonalAccount.info.button) {
            const subscriptionDate = subscriber.subscription_date ? formatDate(subscriber.subscription_date) : 'бескінечності'
            await TELEGRAM_BOT.sendMessage(
                msg.chat.id,
                replacePlaceholders(texts.keyboard.pesonalAccount.info.response, {date: subscriptionDate, id: subscriber.chatId, planName: subscriber.status === 'free' ? 'Звичайний' : 'PRO'},
                {parse_mode: 'MarkdownV2'}
            )
          )
        } else if (msg.text === texts.keyboard.pesonalAccount.changePlan.button) {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.pesonalAccount.changePlan.response)
        } else if (msg.text === texts.keyboard.support.button) {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.support.response)
            log('Натиснув на саппорт', loggerMessageTypes.info, subscriber.chatId)
        } else if(msg.text === texts.keyboard.check.button) {
            const currentTime = Date.now();
            if (subscriber && subscriber.lastCheck && currentTime - subscriber.lastCheck < 5 * 60 * 1000) {
                const remainingTime = Math.ceil((5 * 60 * 1000 - (currentTime - subscriber.lastCheck)) / 1000);
                await TELEGRAM_BOT.sendMessage(chatId, replacePlaceholders(texts.keyboard.check.response2, {time: formatTime(remainingTime)}));
                return;
            }

            await db.updateSubscriber(chatId, { lastCheck: currentTime });

            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.check.response)
            await pause(1000);
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.check.response3)
            const message = await checkWebsite();
            if (message) {
                await sendNotification(texts.keyboard.check.response4 + message, msg.chat.id);
            }
        }
    })


   // Команда для отписки
    TELEGRAM_BOT.onText(/\/unsubscribe/, async (msg) => {
        const chatId = msg.chat.id;

        const existingSubscriber = db.data.subscribers.find((sub) => sub.chatId === chatId);
        if (existingSubscriber) {
            await removeSubscriber(chatId);
            await TELEGRAM_BOT.sendMessage(chatId, texts.keyboard.unsubscribe.response);
        }
    });
}

export async function sendNotification(chatId, message, options) {
    await TELEGRAM_BOT.sendMessage(chatId, message, options);
}
