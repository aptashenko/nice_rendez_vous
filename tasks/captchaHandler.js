import { solveCaptcha } from '../services/captchaSolver.js';
import { SEARCH_PHRASE, API_KEY } from '../config/settings.js';
import {log} from "../services/logger.js";
import {loggerMessageTypes} from "../types/index.js";
import {pause} from "../services/utils.js";

export async function handleCaptcha(page) {
   try {
       await page.waitForSelector('img.BDC_CaptchaImage', { timeout: 10000 }); // Ждём до 10 секунд
       const captchaImageElement = await page.$('img.BDC_CaptchaImage');
       log('Изображение получено: ' + captchaImageElement);

       await pause(5000);

       const imagePath = 'captcha.jpg';
       await captchaImageElement.screenshot({ path: imagePath });
       console.log(`CAPTCHA сохранена в файл: ${imagePath}`);

       const captchaSolution = await solveCaptcha(imagePath, API_KEY);
       await page.type('#captchaFormulaireExtInput', captchaSolution);

       await page.click('button.q-btn:not([disabled])');
       await pause(10000);

       // Проверяем наличие сообщения об ошибке
       const errorMessage = await page.$eval('#text-input-captcha-desc-error', (el) => el.textContent).catch(() => null);

       if (errorMessage && errorMessage.includes('est incorrect')) {
           log('Код CAPTCHA неверный.', loggerMessageTypes.error)
           console.error('Код CAPTCHA неверный. Повторяем попытку...');
           return 'incorrect'; // Указывает, что CAPTCHA не прошла проверку
       }

       // Проверяем, есть ли искомая фраза

       const pageContent = await page.content();
       log(JSON.stringify(content), loggerMessageTypes.info)
       return pageContent.includes(SEARCH_PHRASE);
   } catch (err) {
       log('Ошибка в обработке CAPTCHA: ' + JSON.stringify(err), loggerMessageTypes.error)
       console.error('Ошибка в обработке CAPTCHA:', err);
       throw err;
   }
}
