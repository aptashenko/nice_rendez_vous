import {readFile} from "fs/promises";
import {text} from "express";

const texts = JSON.parse(await readFile('./config/texts.json', 'utf-8'));

export const TELEGRAM_BOT_MENU = [
    {
        command: 'activate',
        description: texts.menu.main.button
    },
    {
        command: 'account',
        description: texts.menu.account.button
    }
]

export const TELEGRAM_BOT_MENU_ADMIN = [
    {
        command: 'activate',
        description: texts.menu.main.button
    },
    {
        command: 'account',
        description: texts.menu.account.button
    },
    {
        command: 'admin',
        description: texts.menu.admin.button
    },
]

export const ACTIVATE_BOT_MENU = [
    [texts.keyboard.description_subscription.button],
    [texts.keyboard.support.button],
    [texts.keyboard.back.button]
]

export const DEFAULT_USER_MENU = [
    [texts.keyboard.description.button],
    [texts.keyboard.description_subscription.button],
    [texts.keyboard.support.button]
]

export const TARIFS_MENU = [
    [texts.keyboard.description_subscription.button],
    [texts.keyboard.back.button],
    [texts.keyboard.support.button]
]

export const PERSONAL_ACCOUNT_MENU = (turnOn) => {
    return turnOn ? [
        [texts.keyboard.pesonalAccount.info.button],
        [texts.keyboard.notificationsOn.button],
        [texts.keyboard.back.button],
    ] : [
        [texts.keyboard.pesonalAccount.info.button],
        [texts.keyboard.notificationsOff.button],
        [texts.keyboard.back.button],
    ]
}

export const ADMIN_MENU = [
    [texts.keyboard.usersCount.button]
]
