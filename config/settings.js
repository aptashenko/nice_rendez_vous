import dotenv from 'dotenv';
dotenv.config();

export const CAPTCHA_PAGE_URL = process.env.CHECK_URL;
export const SEARCH_PHRASE = '<th:text>Choisissez votre créneau</th:text>';
export const API_KEY = process.env.TWOCAPTCHA_API_KEY;
export const RETRY_LIMIT = 5;
// export const TELEGRAM_BOT_API = process.env.API_KEY_BOT_TEST; // development
export const TELEGRAM_BOT_API = process.env.API_KEY_BOT; // production
export const SHCEDULE_DELAY = 5;
export const SHCEDULE_DELAY_NIGHT = 120
