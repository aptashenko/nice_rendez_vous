import dotenv from 'dotenv';
import {readFile} from "fs/promises";
dotenv.config();
const texts = JSON.parse(await readFile('./config/texts.json', 'utf-8'));

export const CAPTCHA_PAGE_URL = process.env.CHECK_URL;
export const SEARCH_PHRASE = 'Aucun créneau disponible';
export const API_KEY = process.env.TWOCAPTCHA_API_KEY;
export const RETRY_LIMIT = 5;
export const TELEGRAM_BOT_API = process.env.API_KEY_BOT;
export const TELEGRAM_BOT_MENU = [
  {
    command: "menu",
    description: texts.menu.open.button
  },
  {
    command: 'activate',
    description: texts.menu.main.button
  }
]

export const ACTIVATE_BOT_MENU = (turnOn) => {
    const keyboard = turnOn ? [
        [texts.keyboard.description_subscription.button],
        [texts.keyboard.notificationsOn.button],
        [texts.keyboard.support.button]
    ] : [
        [texts.keyboard.description_subscription.button],
        [texts.keyboard.notificationsOff.button],
        [texts.keyboard.support.button]
    ]
    return keyboard
}

export const DEFAULT_USER_MENU = [
    [texts.keyboard.description.button],
    [texts.keyboard.description_subscription.button],
    [texts.keyboard.support.button]
]

export const TARIFS_MENU = [
    [texts.keyboard.tarifs.pro.button, texts.keyboard.tarifs.proPlus.button],
    [texts.keyboard.back.button],
    [texts.keyboard.support.button]
]

export const PERSONAL_ACCOUNT_MENU = [
    [texts.keyboard.pesonalAccount.info.button, texts.keyboard.pesonalAccount.changePlan.button],
    [texts.keyboard.back.button],
]
