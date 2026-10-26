import puppeteer from 'puppeteer-core';
import path from 'path';

async function main() {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: ['--allow-file-access-from-files']
    });
    const page = await browser.newPage();
    const videoPath = 'file://' + path.resolve('public/zovance-products-showcase.webm').replace(/\\/g, '/');
    await page.setContent(`<!DOCTYPE html><html><body><video id="v" src="${videoPath}" muted></video></body></html>`);
    const meta = await page.evaluate(async () => {
        const v = document.getElementById('v');
        return new Promise(resolve => {
            v.onloadedmetadata = () => resolve({ duration: v.duration, w: v.videoWidth, h: v.videoHeight });
            v.onerror = (e) => resolve({ error: 'video error', code: v.error?.code, msg: v.error?.message });
            setTimeout(() => resolve({ timeout: true, readyState: v.readyState, currentSrc: v.currentSrc }), 5000);
        });
    });
    console.log('Video metadata:', meta);
    await browser.close();
}

main().catch(console.error);
