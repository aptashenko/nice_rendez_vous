import TelegramBot from "node-telegram-bot-api";
import {
    ACTIVATE_BOT_MENU,
    DEFAULT_USER_MENU, TARIFS_MENU,
    TELEGRAM_BOT_API,
    TELEGRAM_BOT_MENU,
} from "../config/settings.js";
import { addSubscriber, removeSubscriber } from "../services/subscribersManager.js";
import {checkWebsite} from "./checkWebsite.js";
import { db } from "../services/database.js";
import {formatTime, replacePlaceholders} from "../services/utils.js";
import { readFile } from 'fs/promises';
export let TELEGRAM_BOT;

const texts = JSON.parse(await readFile('./config/texts.json', 'utf-8'));

export async function startTelegramBot() {
    TELEGRAM_BOT = new TelegramBot(TELEGRAM_BOT_API, { polling: true });

    TELEGRAM_BOT.setMyCommands(TELEGRAM_BOT_MENU);

    TELEGRAM_BOT.on("polling_error", err => console.log(err));

    TELEGRAM_BOT.on('message', async msg => {
        const chatId = msg.chat.id;
        const subscriber = await db.getSubscriber(chatId); // Получить данные пользователя из базы

        // Добавляем пользователя в подписчики

        if (msg.text === '/start') {
            await addSubscriber(chatId);
            await TELEGRAM_BOT.sendMessage(chatId, texts.greetings);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await TELEGRAM_BOT.sendMessage(chatId, texts.greetings2);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            await TELEGRAM_BOT.sendMessage(chatId, texts.greetings3, {parse_mode: 'MarkdownV2'});
        } else if(msg.text === '/menu') {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.menu.open.response, {
                reply_markup: {
                    keyboard: DEFAULT_USER_MENU,
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })

        } else if(msg.text === '/activate') {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.menu.main.response, {
                reply_markup: {
                    keyboard: ACTIVATE_BOT_MENU(subscriber.showNegativeNotifications),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })
        } else if (msg.text === texts.keyboard.description.button) {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.description.response)

        } else if (msg.text === texts.keyboard.notificationsOn.button) {
            await db.updateSubscriber(chatId, { showNegativeNotifications: false });
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.notificationsOn.response, {
                reply_markup: {
                    keyboard: ACTIVATE_BOT_MENU(subscriber.showNegativeNotifications),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })

        } else if (msg.text === texts.keyboard.notificationsOff.button) {
            await db.updateSubscriber(chatId, { showNegativeNotifications: true });
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.notificationsOff.response, {
                reply_markup: {
                    keyboard: ACTIVATE_BOT_MENU(subscriber.showNegativeNotifications),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })

        } else if (msg.text === texts.keyboard.description_subscription.button) {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.description_subscription.response, {
                reply_markup: {
                    keyboard: TARIFS_MENU,
                    resize_keyboard: true,
                },
                parse_mode: 'MarkdownV2'
            })
        } if (msg.text === texts.keyboard.tarifs.pro.button) {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.tarifs.pro.response)
        } else if (msg.text === texts.keyboard.tarifs.proPlus.button) {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.tarifs.proPlus.response)
        } else if (msg.text === texts.keyboard.back.button) {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.back.response, {
                reply_markup: {
                    keyboard: DEFAULT_USER_MENU,
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })
        } else if(msg.text === texts.keyboard.check.button) {
            const currentTime = Date.now();
            if (subscriber && subscriber.lastCheck && currentTime - subscriber.lastCheck < 5 * 60 * 1000) {
                const remainingTime = Math.ceil((5 * 60 * 1000 - (currentTime - subscriber.lastCheck)) / 1000);
                await TELEGRAM_BOT.sendMessage(chatId, replacePlaceholders(texts.keyboard.check.response2, {time: formatTime(remainingTime)}));
                return;
            }

            await db.updateSubscriber(chatId, { lastCheck: currentTime });

            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.check.response)
            await new Promise((resolve) => setTimeout(resolve, 1000));
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

export async function sendNotification(chatId, message) {
    await TELEGRAM_BOT.sendMessage(chatId, message);
}
