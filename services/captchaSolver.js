import axios from 'axios';
import FormData from 'form-data';
import fs from 'node:fs';

export async function solveCaptcha(imagePath, apiKey) {
    const formData = new FormData();
    formData.append('method', 'post');
    formData.append('key', apiKey);

    formData.append('file', fs.createReadStream(imagePath));

    const uploadResponse = await axios.post('https://2captcha.com/in.php', formData, {
        headers: formData.getHeaders(),
    });

    if (uploadResponse.data === 'ERROR_NO_SLOT_AVAILABLE') {
        throw new Error('Нет доступных слотов для обработки капчи после нескольких попыток.');
    }

    const captchaId = uploadResponse.data.split('|')[1];
    console.log('CAPTCHA загружена, ID:', captchaId);

    let solvedCaptcha;
    do {
        await new Promise((resolve) => setTimeout(resolve, 5000));
        const resultResponse = await axios.get(
            `https://2captcha.com/res.php?key=${apiKey}&action=get&id=${captchaId}`
        );
        solvedCaptcha = resultResponse.data;
        console.log(resultResponse)
    } while (solvedCaptcha === 'CAPCHA_NOT_READY');

    return solvedCaptcha.split('|')[1];
}