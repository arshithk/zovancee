import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

async function capture() {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--allow-file-access-from-files',
            '--use-gl=angle',
            '--use-angle=d3d11',
            '--enable-accelerated-2d-canvas'
        ]
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 });
    const fileUrl = 'file://' + path.resolve('zovance-showcase-video/reel-generator.html');
    console.log('Navigating to', fileUrl);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    await page.waitForFunction(() => window.isReady === true, { timeout: 30000 });
    await new Promise(r => setTimeout(r, 1500));

    await page.evaluate(() => { window.isPaused = true; });

    const canvasElement = await page.$('canvas');

    const scenesToCapture = [
        { name: 'scene1-intro', time: 2.5 },
        { name: 'slide-transition', time: 5.05 }, // mid-slide horizontal kinetic transition
        { name: 'scene2-challenges', time: 7.5 },
        { name: 'scene3-solutions', time: 14.5 },
        { name: 'scene4-transformation', time: 22.5 },
        { name: 'scene5-why-zovance', time: 30.0 },
        { name: 'scene6-cta', time: 36.0 }
    ];

    const outDir = path.resolve('zovance-showcase-video/preview-frames');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    for (const sc of scenesToCapture) {
        await page.evaluate((t) => window.renderFrame(t), sc.time);
        await new Promise(r => setTimeout(r, 200));
        const buf = await canvasElement.screenshot({ type: 'png' });
        const outPath = path.join(outDir, `frame-${sc.name}.png`);
        fs.writeFileSync(outPath, buf);
        console.log(`✅ Saved ${outPath}`);
    }

    await browser.close();
    console.log('All slides captured successfully!');
}

capture().catch(err => {
    console.error('Capture error:', err);
    process.exit(1);
});
