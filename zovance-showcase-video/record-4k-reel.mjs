import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import puppeteer from 'puppeteer-core';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';

const PORT = 9877;
const RAW_WEBM = path.resolve('zovance-showcase-video/raw-4k-reel.webm');
const AUDIO_FILE = path.resolve('zovance-showcase-video/assets/human-enterprise-audio.wav');
const FINAL_4K_MP4 = path.resolve('zovance-showcase-video/zovance-4k-master-reel.mp4');
const FINAL_4K_WEBM = path.resolve('zovance-showcase-video/zovance-4k-master-reel.webm');
const FINAL_1080P_MP4 = path.resolve('zovance-showcase-video/zovance-human-reel-1080p.mp4');

const PUBLIC_4K_MP4 = path.resolve('public/zovance-4k-master-reel.mp4');
const PUBLIC_4K_WEBM = path.resolve('public/zovance-4k-master-reel.webm');
const PUBLIC_1080P_MP4 = path.resolve('public/zovance-human-reel-1080p.mp4');

async function main() {
    let uploadResolved;
    const uploadPromise = new Promise((resolve, reject) => {
        uploadResolved = { resolve, reject };
    });

    // 1. HTTP streaming receiver to receive 4K raw chunks from Chrome
    const server = http.createServer((req, res) => {
        if (req.method === 'POST' && req.url === '/upload') {
            console.log('Receiving 4K video stream chunks from Chrome...');
            const fileStream = fs.createWriteStream(RAW_WEBM);
            req.pipe(fileStream);

            fileStream.on('finish', () => {
                const stats = fs.statSync(RAW_WEBM);
                console.log(`Raw 4K video saved to ${RAW_WEBM} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
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
    console.log(`4K HTTP receiver listening on http://127.0.0.1:${PORT}`);

    // 2. Launch Puppeteer Chrome
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
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

    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err.message));

    const fileUrl = 'file://' + path.resolve('zovance-showcase-video/reel-4k-generator.html');
    console.log('Navigating to', fileUrl);
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });

    await page.waitForFunction(() => window.isReady === true, { timeout: 30000 });
    console.log('4K Canvas engine ready. Initializing 60 FPS 4K Ultra-HD recorder (45 Mbps)...');

    // 3. Start 4K recording in browser
    await page.evaluate(async (port) => {
        window.isPaused = true;
        const canvas = document.getElementById('reelCanvas');
        const stream = canvas.captureStream(60);
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : 'video/webm';
        console.log('Using 4K mimeType:', mimeType);

        const recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: 45000000 // 45 Mbps 4K Ultra-HD bitrate
        });

        const chunks = [];
        recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
        };

        window._recordingFinished = new Promise((resolve, reject) => {
            recorder.onstop = async () => {
                console.log('Recorder stopped. Uploading 4K blob to server...');
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
    console.log(`4K Reel total duration: ${totalDuration}s. Playing smoothly with horizontal slide transitions...`);

    // Reset playback clock & unpause
    await page.evaluate(() => {
        window.previewStartTime = performance.now();
        window.isPaused = false;
    });

    // Wait for the full video duration plus buffer
    const waitMs = Math.ceil((totalDuration + 0.8) * 1000);
    console.log(`Recording 4K stream... waiting ${waitMs}ms (${(waitMs / 1000).toFixed(1)}s)...`);
    await new Promise((r) => setTimeout(r, waitMs));

    console.log('Stopping 4K recorder...');
    await page.evaluate(() => {
        window.isPaused = true;
        window._recorder.stop();
    });

    // Wait for upload stream to finish writing to disk
    const savedBytes = await uploadPromise;
    console.log(`Successfully received raw 4K stream: ${(savedBytes / (1024 * 1024)).toFixed(2)} MB`);

    await browser.close();
    server.close();

    // 4. Mux with high-quality soundtrack and encode to 4K H.264 MP4 using ffmpeg
    const ffmpegPath = ffmpegInstaller.path;
    console.log('Using ffmpeg executable at:', ffmpegPath);

    if (fs.existsSync(AUDIO_FILE)) {
        console.log('Muxing 4K video with energetic corporate technology soundtrack...');

        // 4K Ultra-HD MP4 (H.264 / AAC 256k stereo, high-fidelity CRF 18)
        console.log('Encoding 4K Master MP4 (2160x3840 H.264 / AAC)...');
        const mp4Args = [
            '-y',
            '-vsync', '2',
            '-i', RAW_WEBM,
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
        const resMp4 = spawnSync(ffmpegPath, mp4Args, { stdio: 'inherit' });
        if (resMp4.status !== 0) throw new Error('ffmpeg MP4 encode failed');

        // 4K WebM package
        console.log('Packaging 4K WebM (VP9/Opus)...');
        const webmArgs = [
            '-y',
            '-vsync', '2',
            '-i', RAW_WEBM,
            '-i', AUDIO_FILE,
            '-c:v', 'copy',
            '-c:a', 'libopus',
            '-b:a', '160k',
            '-shortest',
            FINAL_4K_WEBM
        ];
        spawnSync(ffmpegPath, webmArgs, { stdio: 'inherit' });

        // Mobile Optimized 1080p MP4 version
        console.log('Encoding mobile-optimized 1080p MP4 version...');
        const mobArgs = [
            '-y',
            '-vsync', '2',
            '-i', RAW_WEBM,
            '-i', AUDIO_FILE,
            '-vf', 'scale=1080:1920',
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-preset', 'fast',
            '-crf', '20',
            '-c:a', 'aac',
            '-b:a', '192k',
            '-shortest',
            '-movflags', '+faststart',
            FINAL_1080P_MP4
        ];
        spawnSync(ffmpegPath, mobArgs, { stdio: 'inherit' });

    } else {
        console.warn('Audio file not found, copying raw webm to final destination.');
        fs.copyFileSync(RAW_WEBM, FINAL_4K_WEBM);
    }

    // 5. Deploy to public/ for web app access and direct client downloads
    if (fs.existsSync(FINAL_4K_MP4)) {
        fs.copyFileSync(FINAL_4K_MP4, PUBLIC_4K_MP4);
        const stats = fs.statSync(FINAL_4K_MP4);
        console.log(`✅ Deployed 4K Master MP4 to ${PUBLIC_4K_MP4} (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
    }
    if (fs.existsSync(FINAL_4K_WEBM)) {
        fs.copyFileSync(FINAL_4K_WEBM, PUBLIC_4K_WEBM);
        console.log(`✅ Deployed 4K WebM to ${PUBLIC_4K_WEBM}`);
    }
    if (fs.existsSync(FINAL_1080P_MP4)) {
        fs.copyFileSync(FINAL_1080P_MP4, PUBLIC_1080P_MP4);
        console.log(`✅ Deployed 1080p MP4 to ${PUBLIC_1080P_MP4}`);
    }

    console.log('🎉 4K Ultra-HD Master Human Showcase Reel recorded, audio-muxed, and exported successfully!');
}

main().catch((err) => {
    console.error('Fatal recording error:', err);
    process.exit(1);
});
