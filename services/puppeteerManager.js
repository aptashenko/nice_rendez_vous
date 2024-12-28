import puppeteer from 'puppeteer';

export async function createBrowser() {
    return puppeteer.launch({ headless: false });
}

export async function navigateToPage(browser, url) {
    const page = await browser.newPage();
    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
        return page;
    } catch (error) {
        console.log('Ошибка: ' + error)
    }
}
