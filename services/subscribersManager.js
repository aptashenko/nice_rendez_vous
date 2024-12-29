import {db} from "./database.js";
import {IUser, usersRoles} from "../types/index.js";

export async function addSubscriber(chatId, userName = 'unknown') {
    const existingSubscriber = db.data.subscribers.find((sub) => sub?.chatId === chatId);
    if (!existingSubscriber) {
        db.data.subscribers.push({...IUser, chatId, nick: userName, created_at: Date.now(), role: usersRoles.user});
        await db.write();
        console.log(`Добавлен новый подписчик: ${chatId}`);
        return true
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
