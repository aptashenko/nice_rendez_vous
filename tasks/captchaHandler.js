import { solveCaptcha } from '../services/captchaSolver.js';
import { SEARCH_PHRASE, API_KEY } from '../config/settings.js';

export async function handleCaptcha(page) {
   try {
       await page.waitForSelector('img.BDC_CaptchaImage', { timeout: 10000 }); // Ждём до 10 секунд
       const captchaImageElement = await page.$('img.BDC_CaptchaImage');

       await new Promise((resolve) => setTimeout(resolve, 5000));

       const imagePath = 'captcha.jpg';
       await captchaImageElement.screenshot({ path: imagePath });
       console.log(`CAPTCHA сохранена в файл: ${imagePath}`);

       const captchaSolution = await solveCaptcha(imagePath, API_KEY);
       await page.type('#captchaFormulaireExtInput', captchaSolution);

       await page.click('button.q-btn:not([disabled])');
       await new Promise((resolve) => setTimeout(resolve, 5000));

       // Проверяем наличие сообщения об ошибке
       const errorMessage = await page.$eval('#text-input-captcha-desc-error', (el) => el.textContent).catch(() => null);

       if (errorMessage && errorMessage.includes('est incorrect')) {
           console.error('Код CAPTCHA неверный. Повторяем попытку...');
           return 'incorrect'; // Указывает, что CAPTCHA не прошла проверку
       }

       // Проверяем, есть ли искомая фраза

       const pageContent = await page.content();
       return pageContent.includes(SEARCH_PHRASE);
   } catch (err) {
       console.error('Ошибка в обработке CAPTCHA:', err);
       throw err;
   }
}
