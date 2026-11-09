import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn, spawnSync } from 'child_process';
import puppeteer from 'puppeteer-core';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const PORT = 9889;
const FPS = 30;
const DURATION = 36.0;
const TOTAL_FRAMES = Math.round(DURATION * FPS); // 1080 frames

const AUDIO_FILE = path.resolve('zovance-showcase-video/assets/human-enterprise-audio.wav');
const FINAL_4K_MP4 = path.resolve('zovance-showcase-video/zovance-4k-master-reel.mp4');
const FINAL_4K_WEBM = path.resolve('zovance-showcase-video/zovance-4k-master-reel.webm');
const FINAL_1080P_MP4 = path.resolve('zovance-showcase-video/zovance-human-reel-1080p.mp4');

const PUBLIC_4K_MP4 = path.resolve('public/zovance-4k-master-reel.mp4');
const PUBLIC_4K_WEBM = path.resolve('public/zovance-4k-master-reel.webm');
const PUBLIC_1080P_MP4 = path.resolve('public/zovance-human-reel-1080p.mp4');

async function main() {
    console.log(`Starting Deterministic 4K Master Video Pipeline (${TOTAL_FRAMES} frames @ ${FPS} FPS = ${DURATION}s)...`);

    const ffmpegPath = ffmpegInstaller.path;
    console.log('Using FFmpeg at:', ffmpegPath);

    // 1. Spawn FFmpeg for 4K Ultra-HD MP4 (2160x3840, CRF 18, 256k AAC Audio)
    const ffmpegArgs = [
        '-y',
        '-f', 'image2pipe',
        '-vcodec', 'mjpeg',
        '-r', String(FPS),
        '-i', '-',
        '-i', AUDIO_FILE,
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'medium',
        '-crf', '18',
        '-c:a', 'aac',
        '-b:a', '256k',
        '-shortest',
        '-movflags', '+faststart',
        FINAL_4K_MP4
    ];

    const ffmpegProc = spawn(ffmpegPath, ffmpegArgs, { stdio: ['pipe', 'inherit', 'inherit'] });

    let framesReceived = 0;
    const allFramesDonePromise = new Promise((resolve) => {
        // 2. HTTP Server to pipe binary JPEG frames directly into FFmpeg stdin
        const server = http.createServer((req, res) => {
            if (req.method === 'POST' && req.url === '/frame') {
                req.on('data', chunk => {
                    ffmpegProc.stdin.write(chunk);
                });
                req.on('end', () => {
                    framesReceived++;
                    if (framesReceived % 108 === 0 || framesReceived === TOTAL_FRAMES) {
                        const pct = ((framesReceived / TOTAL_FRAMES) * 100).toFixed(0);
                        const sec = (framesReceived / FPS).toFixed(1);
                        console.log(`[4K Render Progress] Frame ${framesReceived}/${TOTAL_FRAMES} (${pct}%) — ${sec}s timeline rendered`);
                    }
                    res.writeHead(200);
                    res.end();

                    if (framesReceived === TOTAL_FRAMES) {
                        console.log('All 1,080 4K frames successfully written to FFmpeg stdin!');
                        ffmpegProc.stdin.end();
                        resolve(server);
                    }
                });
            } else {
                res.writeHead(404);
                res.end();
            }
        });

        server.listen(PORT, '127.0.0.1', () => {
            console.log(`Frame pipeline listening on http://127.0.0.1:${PORT}`);
        });
    });

    // 3. Launch Chrome with 2160x3840 viewport
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: true,
        protocolTimeout: 0,
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
    console.log('Loading 4K canvas engine in Chrome:', htmlPath);
    await page.goto(htmlPath, { waitUntil: 'networkidle0' });

    await page.waitForFunction(() => window.isReady === true, { timeout: 30000 });
    console.log('Engine ready! Commencing deterministic frame delivery...');

    // 4. Render and stream every frame deterministically
    await page.evaluate(async (port, totalFrames, fps) => {
        window.isPaused = true;
        const canvas = document.getElementById('reelCanvas');

        for (let i = 0; i < totalFrames; i++) {
            const t = i / fps;
            window.renderFrameAtTime(t);
            const blob = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.94));
            await fetch(`http://127.0.0.1:${port}/frame`, {
                method: 'POST',
                body: blob
            });
        }
    }, PORT, TOTAL_FRAMES, FPS);

    // 5. Wait for all frames to finish streaming
    const serverInstance = await allFramesDonePromise;
    await browser.close();
    serverInstance.close();

    // 6. Wait for FFmpeg 4K Master encoding to complete
    await new Promise((resolve, reject) => {
        ffmpegProc.on('close', code => {
            if (code === 0) {
                console.log('✅ FFmpeg 4K Master MP4 encode finished with code 0!');
                resolve();
            } else {
                reject(new Error(`FFmpeg exited with error code ${code}`));
            }
        });
    });

    // 7. Generate 1080p Mobile-Optimized MP4 (Downscale from 4K Master)
    console.log('Generating Mobile-Optimized 1080p MP4...');
    spawnSync(ffmpegPath, [
        '-y',
        '-i', FINAL_4K_MP4,
        '-vf', 'scale=1080:1920',
        '-c:v', 'libx264',
        '-pix_fmt', 'yuv420p',
        '-preset', 'fast',
        '-crf', '20',
        '-c:a', 'copy',
        '-movflags', '+faststart',
        FINAL_1080P_MP4
    ], { stdio: 'inherit' });

    // 8. Generate 4K WebM version
    console.log('Packaging 4K WebM version...');
    spawnSync(ffmpegPath, [
        '-y',
        '-i', FINAL_4K_MP4,
        '-c:v', 'libvpx-vp9',
        '-b:v', '8M',
        '-crf', '24',
        '-c:a', 'libopus',
        '-b:a', '160k',
        FINAL_4K_WEBM
    ], { stdio: 'inherit' });

    // 9. Deploy to public directory for direct browser viewing & download
    const publicDir = path.resolve('public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

    if (fs.existsSync(FINAL_4K_MP4)) {
        fs.copyFileSync(FINAL_4K_MP4, PUBLIC_4K_MP4);
        const stats = fs.statSync(PUBLIC_4K_MP4);
        console.log(`✅ Deployed 4K Master MP4 to ${PUBLIC_4K_MP4} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
    }
    if (fs.existsSync(FINAL_4K_WEBM)) {
        fs.copyFileSync(FINAL_4K_WEBM, PUBLIC_4K_WEBM);
        console.log(`✅ Deployed 4K WebM to ${PUBLIC_4K_WEBM}`);
    }
    if (fs.existsSync(FINAL_1080P_MP4)) {
        fs.copyFileSync(FINAL_1080P_MP4, PUBLIC_1080P_MP4);
        const stats = fs.statSync(PUBLIC_1080P_MP4);
        console.log(`✅ Deployed 1080p MP4 to ${PUBLIC_1080P_MP4} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
    }

    console.log('🎉 Deterministic 4K Master Reel Rendering & Encoding Completed Successfully!');
}

main().catch(err => {
    console.error('Fatal pipeline error:', err);
    process.exit(1);
});
