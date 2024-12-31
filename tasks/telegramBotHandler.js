import TelegramBot from "node-telegram-bot-api";
import { SHCEDULE_DELAY, TELEGRAM_BOT_API } from "../config/config.js";
import {
    ADMIN_MENU,
    DEFAULT_USER_MENU,
    PERSONAL_ACCOUNT_MENU,
    TELEGRAM_BOT_MENU
} from "../config/buttons-settings.js"
import {addSubscriber, getSubscribers} from "../services/subscribersManager.js";
import { db } from "../services/database.js";
import {formatDate, pause, replacePlaceholders} from "../services/utils.js";
import { readFile } from 'fs/promises';
import {log} from "../services/logger.js";
import {loggerMessageTypes, usersRoles} from "../types/index.js";
import {createPayment} from "../services/payments.js";
import {DEFAULT_PRICE} from "../config/prices.js";
export let TELEGRAM_BOT;


const texts = JSON.parse(await readFile('./config/texts.json', 'utf-8'));

export async function startTelegramBot() {
    TELEGRAM_BOT = new TelegramBot(TELEGRAM_BOT_API, { polling: true });

    TELEGRAM_BOT.setMyCommands(TELEGRAM_BOT_MENU);

    TELEGRAM_BOT.on("polling_error", err => console.log(err));

    TELEGRAM_BOT.on('message', async msg => {
        const admins = getSubscribers().filter(user => user?.role === 'admin');

        const chatId = msg.chat.id;

        const subscriber = await db.getSubscriber(chatId); // Получить данные пользователя из базы
        const checkingDelay = subscriber?.role === 'user' ? SHCEDULE_DELAY * 2 : SHCEDULE_DELAY;
        const trialMode = Date.now() <= subscriber?.trial_ends;
        let planName;
        if (!subscriber?.paid && trialMode) {
            planName = 'Trial активний'
        } else if (subscriber?.paid) {
            planName = 'PRO+'
        } else {
            planName = 'Не проплачено'
        }
        let subscriptionDate;
        if (subscriber?.subscription_date) {
            subscriptionDate = formatDate(subscriber?.subscription_date)
        } else if (!subscriber?.subscription_date && trialMode) {
            subscriptionDate = formatDate(subscriber?.trial_ends)
        } else {
            subscriptionDate = 'бескінечності'
        }

        // Добавляем пользователя в подписчики

        if (msg.text === '/start') {
            const isNew = await addSubscriber(chatId, msg.from?.username);
            for (const admin of admins) {
                if (isNew) {
                    await TELEGRAM_BOT.sendMessage(admin?.chatId, replacePlaceholders(texts.keyboard.usersCount.response2, {date: new Date(Date.now()).toLocaleString(), nick: msg.from.username || 'unknown'}));
                    log(`Регистрация пользователя, ${msg.from.username}`, loggerMessageTypes.info, chatId);
                    log(`Регистрация пользователя ${chatId}`, loggerMessageTypes.info);
                    log(`Старт триала`, loggerMessageTypes.info, chatId)
                }
            }
            await TELEGRAM_BOT.sendMessage(chatId, texts.greetings);
            await pause(1000);
            await TELEGRAM_BOT.sendMessage(chatId, texts.greetings2);
            await pause(1000);
            await TELEGRAM_BOT.sendMessage(chatId, replacePlaceholders(texts.greetings3, {delay: checkingDelay}), {parse_mode: 'MarkdownV2'});
        } else if(msg.text === '/menu') {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.menu.open.response, {
                reply_markup: {
                    keyboard: DEFAULT_USER_MENU(subscriber?.paid),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })

        } else if(msg.text === '/activate') {
            await db.updateSubscriber(chatId, { activated: true });

            await TELEGRAM_BOT.sendMessage(msg.chat.id, replacePlaceholders(texts.menu.main.response, {delay: checkingDelay}), {
                reply_markup: {
                    keyboard: DEFAULT_USER_MENU(subscriber?.paid),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })
        } else if (msg.text === '/account') {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.menu.account.response, {
                reply_markup: {
                    keyboard: PERSONAL_ACCOUNT_MENU(subscriber?.showNegativeNotifications),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })
        } else if (msg.text === '/admin') {
            if (subscriber?.role !== usersRoles.admin) {
                await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.menu.accessDenied)
            } else {
                await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.menu.admin.response, {
                    reply_markup: {
                        keyboard: ADMIN_MENU,
                        resize_keyboard: true,
                        one_time_keyboard: false
                    }
                })
            }
        } else if (msg.text === texts.keyboard.description.button) {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, replacePlaceholders(texts.keyboard.description.response, {delay: checkingDelay}))

        } else if (msg.text === texts.keyboard.usersCount.button) {
            const allUsers = getSubscribers();
            const paidUsers = allUsers.filter(user => user?.subscription_date)
            await TELEGRAM_BOT.sendMessage(msg.chat.id, replacePlaceholders(texts.keyboard.usersCount.response, {sum: allUsers.length, paid: paidUsers.length}))

        } else if (msg.text === texts.keyboard.description_subscription.button) {
            const { invoiceUrl } = await createPayment(chatId, DEFAULT_PRICE);
            await sendNotification(chatId, replacePlaceholders(texts.keyboard.description_subscription.response, {price: DEFAULT_PRICE.amount}), {
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
        } else if (msg.text === texts.keyboard.notificationsOn.button) {
            await db.updateSubscriber(chatId, { showNegativeNotifications: false });
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.notificationsOn.response, {
                reply_markup: {
                    keyboard: PERSONAL_ACCOUNT_MENU(subscriber?.showNegativeNotifications),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })

        } else if (msg.text === texts.keyboard.notificationsOff.button) {
            await db.updateSubscriber(chatId, { showNegativeNotifications: true });
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.notificationsOff.response, {
                reply_markup: {
                    keyboard: PERSONAL_ACCOUNT_MENU(subscriber?.showNegativeNotifications),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })

        } else if (msg.text === texts.keyboard.back.button) {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.back.response, {
                reply_markup: {
                    keyboard: DEFAULT_USER_MENU(subscriber?.paid),
                    resize_keyboard: true,
                    one_time_keyboard: false
                }
            })

        } else if (msg.text === texts.keyboard.pesonalAccount.info.button) {
            await TELEGRAM_BOT.sendMessage(
                msg.chat.id,
                replacePlaceholders(texts.keyboard.pesonalAccount.info.response, {date: subscriptionDate, id: subscriber?.chatId, planName: planName, active: subscriber?.activated ? 'Активна' : 'Не активна'},
                {parse_mode: 'MarkdownV2'}
            )
          )
        } else if (msg.text === texts.keyboard.support.button) {
            await TELEGRAM_BOT.sendMessage(msg.chat.id, texts.keyboard.support.response)
            log('Натиснув на саппорт', loggerMessageTypes.info, subscriber?.chatId)
        }
    })
}

export async function sendNotification(chatId, message, options) {
    await TELEGRAM_BOT.sendMessage(chatId, message, options);
}
