import {createBrowser, navigateToPage} from "../services/puppeteerManager.js";
import {RETRY_LIMIT, CAPTCHA_PAGE_URL} from "../config/config.js";
import {handleCaptcha} from "./captchaHandler.js";
import {log} from "../services/logger.js";
import {readFile} from "fs/promises";
import {loggerMessageTypes} from "../types/index.js";
const texts = JSON.parse(await readFile('./config/texts.json', 'utf-8'));


export async function checkWebsite() {
    const browser = await createBrowser();
    let attempts = 0;

    while (attempts < RETRY_LIMIT) {
        const page = await navigateToPage(browser, CAPTCHA_PAGE_URL);
        try {
            const isPhraseFound = await handleCaptcha(page);
            if (isPhraseFound === 'incorrect') {
                log('Код CAPTCHA неверный. Повторяем попытку...', loggerMessageTypes.warning);
                return await checkWebsite()
            }
            if (isPhraseFound) {
                log('Есть свободные слоты', loggerMessageTypes.success);
                return {status: 1, text: texts.success};
            } else {
                log('Свободных слотов нет!', loggerMessageTypes.success);
                return {status: 0, text: texts.unsuccess}
            }
        } catch (error) {
            console.log(error)
            log(`Ошибка: ${error.message}`, loggerMessageTypes.error);
            process.exit(0)
        } finally {
            await page.close();
            attempts++;
        }
    }
    await browser.close();
}
