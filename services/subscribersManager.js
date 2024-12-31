import {db} from "./database.js";
import {IUser, loggerMessageTypes, usersRoles} from "../types/index.js";
import {log} from "./logger.js";

function countTrialPeriod (days) {
    const hours = days * 24;
    const minutes = hours * 60;
    const seconds = minutes * 60;
    return seconds * 1000;
}

export async function addSubscriber(chatId, userName = 'unknown') {
    const existingSubscriber = db.data.subscribers.find((sub) => sub?.chatId === Number(chatId));
    const trialPeriod = countTrialPeriod(1);
    if (!existingSubscriber) {
        try {
            db.data.subscribers.push({...IUser, chatId, nick: userName, created_at: Date.now(), trial_ends: Date.now() + trialPeriod, role: usersRoles.user});
            await db.write();
            console.log(`Добавлен новый подписчик: ${chatId}`);
            return true
        } catch (error) {
            log(JSON.stringify(error), loggerMessageTypes.error, chatId);
            console.error(error);
        }
    } else {
        return false
    }
}

export async function updateSubscriber(chatId, updates) {
    const existingSubscriber = db.data.subscribers.find((sub) => sub?.chatId === chatId);
    Object.assign(existingSubscriber, updates);
    console.log(`Подписчик ${chatId} обновлён:`, updates);
}

// Удаление подписчика
export async function removeSubscriber(chatId) {
    db.data.subscribers = db.data.subscribers.filter((sub) => sub?.chatId !== chatId);
    await db.write();
    console.log(`Подписчик ${chatId} удалён.`);
}

export function getSubscribers() {
    return db.data.subscribers;
}
