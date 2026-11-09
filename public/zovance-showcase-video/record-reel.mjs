import http from 'http';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer-core';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const PORT = 9876;
const RAW_WEBM = path.resolve('zovance-showcase-video/raw-reel.webm');
const AUDIO_FILE = path.resolve('zovance-showcase-video/assets/corporate-tech-audio.wav');
const FINAL_MP4 = path.resolve('zovance-showcase-video/zovance-corporate-reel.mp4');
const FINAL_WEBM = path.resolve('zovance-showcase-video/zovance-corporate-reel.webm');

const PUBLIC_MP4 = path.resolve('public/zovance-corporate-reel.mp4');
const PUBLIC_WEBM = path.resolve('public/zovance-corporate-reel.webm');
const LEGACY_PUBLIC_MP4 = path.resolve('public/zovance-instagram-reel.mp4');
const LEGACY_PUBLIC_WEBM = path.resolve('public/zovance-instagram-reel.webm');

async function main() {
    let uploadResolved;
    const uploadPromise = new Promise((resolve, reject) => {
        uploadResolved = { resolve, reject };
    });

    // 1. Start HTTP streaming server to capture browser canvas stream without memory leaks
    const server = http.createServer((req, res) => {
        if (req.method === 'POST' && req.url === '/upload') {
            console.log('Receiving video upload stream from Chrome...');
            const fileStream = fs.createWriteStream(RAW_WEBM);
            req.pipe(fileStream);

            fileStream.on('finish', () => {
                const stats = fs.statSync(RAW_WEBM);
                console.log(`Raw video saved to ${RAW_WEBM} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
                res.writeHead(200, {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS'
                });
                res.end(JSON.stringify({ success: true, size: stats.size }));
                uploadResolved.resolve(stats.size);
            });

            fileStream.on('error', (err) => {
                console.error('File stream error:', err);
                res.writeHead(500);
                res.end(err.message);
                uploadResolved.reject(err);
            });
        } else if (req.method === 'OPTIONS') {
            res.writeHead(200, {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            });
            res.end();
        } else {
            res.writeHead(404);
            res.end();
        }
    });

    await new Promise((resolve) => server.listen(PORT, '127.0.0.1', resolve));
    console.log(`HTTP receiver listening on http://127.0.0.1:${PORT}`);

    // 2. Launch Puppeteer Chrome
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

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

    const fileUrl = 'file://' + path.resolve('zovance-showcase-video/reel-generator.html');
    console.log('Navigating to', fileUrl);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    await page.waitForFunction(() => window.isReady === true, { timeout: 30000 });
    console.log('Canvas engine ready. Initializing 60 FPS recorder...');

    // 3. Start recording in browser
    await page.evaluate(async (port) => {
        window.isPaused = true;
        const canvas = document.getElementById('reelCanvas');
        const stream = canvas.captureStream(60);
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm';
        console.log('Using mimeType:', mimeType);

        const recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 16000000
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        window._recordingFinished = new Promise((resolve, reject) => {
            recorder.onstop = async () => {
                console.log('Recorder stopped. Uploading blob to server...');
                const blob = new Blob(chunks, { type: 'video/webm' });
                try {
                    const res = await fetch(`http://127.0.0.1:${port}/upload`, {
                        method: 'POST',
                        body: blob
                    });
                    const data = await res.json();
                    resolve(data);
                } catch (err) {
                    reject(err);
                }
            };
        });

        recorder.start(250);
        window._recorder = recorder;
    }, PORT);

    const totalDuration = await page.evaluate(() => window.getTotalDuration());
    console.log(`Reel total duration: ${totalDuration}s. Playing smoothly with horizontal slide transitions...`);

    // Reset playback clock & unpause
    await page.evaluate(() => {
        window.previewStartTime = performance.now();
        window.isPaused = false;
    });

    // Wait for the full video duration plus 0.6s buffer
    const waitMs = Math.ceil((totalDuration + 0.6) * 1000);
    console.log(`Waiting ${waitMs}ms (${(waitMs / 1000).toFixed(1)}s) for full recording...`);
    await new Promise((r) => setTimeout(r, waitMs));

    console.log('Stopping recorder...');
    await page.evaluate(() => {
        window.isPaused = true;
        window._recorder.stop();
    });

    // Wait for upload stream to finish writing to disk
    const savedBytes = await uploadPromise;
    console.log(`Successfully received raw stream: ${(savedBytes / (1024 * 1024)).toFixed(2)} MB`);

    await browser.close();
    server.close();

    // 4. Mux with high-quality soundtrack and encode to H.264 MP4 & WebM using ffmpeg
    const ffmpegPath = ffmpegInstaller.path;
    console.log('Using ffmpeg executable at:', ffmpegPath);

    if (fs.existsSync(AUDIO_FILE)) {
        console.log('Muxing video with energetic technology soundtrack...');

        // MP4 H.264 encode (Universal compatibility for Instagram, LinkedIn, Facebook)
        const mp4Cmd = `"${ffmpegPath}" -y -vsync 2 -i "${RAW_WEBM}" -i "${AUDIO_FILE}" -c:v libx264 -pix_fmt yuv420p -preset medium -crf 19 -c:a aac -b:a 192k -shortest -movflags +faststart "${FINAL_MP4}"`;
        console.log('Encoding MP4 (H.264/AAC)...');
        execSync(mp4Cmd, { stdio: 'inherit' });

        // WebM encode
        const webmCmd = `"${ffmpegPath}" -y -vsync 2 -i "${RAW_WEBM}" -i "${AUDIO_FILE}" -c:v copy -c:a libopus -b:a 160k -shortest "${FINAL_WEBM}"`;
        console.log('Packaging WebM (VP9/Opus)...');
        execSync(webmCmd, { stdio: 'inherit' });
    } else {
        console.warn('Audio file not found, copying raw webm to final destinations.');
        fs.copyFileSync(RAW_WEBM, FINAL_WEBM);
    }

    // 5. Deploy to public/ for web app and download access
    if (fs.existsSync(FINAL_MP4)) {
        fs.copyFileSync(FINAL_MP4, PUBLIC_MP4);
        fs.copyFileSync(FINAL_MP4, LEGACY_PUBLIC_MP4);
        console.log(`✅ Deployed MP4 to ${PUBLIC_MP4}`);
    }
    if (fs.existsSync(FINAL_WEBM)) {
        fs.copyFileSync(FINAL_WEBM, PUBLIC_WEBM);
        fs.copyFileSync(FINAL_WEBM, LEGACY_PUBLIC_WEBM);
        console.log(`✅ Deployed WebM to ${PUBLIC_WEBM}`);
    }

    console.log('🎉 Corporate promotional reel recorded, audio-muxed, and exported successfully!');
}

main().catch((err) => {
    console.error('Fatal recording error:', err);
    process.exit(1);
});
