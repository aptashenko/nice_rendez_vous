import fs from "node:fs";
import dotenv from "dotenv";

const mode = 'prod'

const environment = {
    prod: '.env.production',
    dev: '.env.development'
}

if (fs.existsSync(environment[mode])) {
    dotenv.config({ path: environment[mode] });
}

if (fs.existsSync('.env')) {
    dotenv.config();
}

export const CAPTCHA_PAGE_URL = process.env.CHECK_URL;
export const SEARCH_PHRASE = '<th:text>Choisissez votre créneau</th:text>';
export const API_KEY = process.env.TWOCAPTCHA_API_KEY;
export const RETRY_LIMIT = 5;
export const TELEGRAM_BOT_API = process.env.API_KEY_BOT;
export const SHCEDULE_DELAY = 5;
export const CHECK_URL = process.env.CHECK_URL;
export const SHCEDULE_DELAY_NIGHT = 120;
export const DB_NAME = process.env.USERS_DB_NAME;
