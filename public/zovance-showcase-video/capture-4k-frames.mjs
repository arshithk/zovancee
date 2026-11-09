import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function capture() {
    console.log('Launching Chrome for 4K frame validation...');
    const browser = await puppeteer.launch({
        executablePath: CHROME_PATH,
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-web-security',
            '--allow-file-access-from-files',
            '--use-gl=angle',
            '--use-angle=d3d11',
            '--enable-accelerated-2d-canvas'
        ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 2160, height: 3840 });

    const htmlPath = 'file://' + path.resolve('zovance-showcase-video/reel-4k-generator.html');
    console.log('Loading:', htmlPath);
    await page.goto(htmlPath, { waitUntil: 'networkidle0' });

    await page.waitForFunction(() => window.isReady === true, { timeout: 30000 });
    console.log('4K Engine Ready! Pausing preview loop to capture exact deterministic frames...');

    await page.evaluate(() => {
        window.isPaused = true;
    });

    const outDir = path.resolve('zovance-showcase-video/preview-frames-4k');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const snapshots = [
        { name: 'frame-scene1-precision.png', time: 3.0 },
        { name: 'frame-slide-transition.png', time: 5.25 },
        { name: 'frame-scene2-leadership.png', time: 8.5 },
        { name: 'frame-scene3-deluge.png', time: 14.5 },
        { name: 'frame-scene4-ecosystem.png', time: 21.0 },
        { name: 'frame-scene5-impact.png', time: 27.5 },
        { name: 'frame-scene6-hotline.png', time: 33.5 }
    ];

    for (const snap of snapshots) {
        console.log(`Rendering frame at t = ${snap.time}s -> ${snap.name}`);
        await page.evaluate((t) => {
            window.isPaused = true;
            window.renderFrameAtTime(t);
        }, snap.time);

        const dataUrl = await page.evaluate(() => document.getElementById('reelCanvas').toDataURL('image/png'));
        const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
        const filePath = path.join(outDir, snap.name);
        fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
        const stats = fs.statSync(filePath);
        console.log(`Saved 4K Frame: ${snap.name} (${(stats.size / 1024).toFixed(1)} KB)`);
    }

    await browser.close();
    console.log('🎉 All 4K frame validation snapshots captured successfully!');
}

capture().catch(err => {
    console.error('Frame capture failed:', err);
    process.exit(1);
});
