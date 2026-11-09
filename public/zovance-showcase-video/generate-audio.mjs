import fs from 'fs';
import path from 'path';

// Generate 38.5 seconds of high-quality stereo 44.1kHz energetic corporate technology soundtrack
const SAMPLE_RATE = 44100;
const DURATION = 38.5;
const NUM_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);
const BPM = 124;
const BEAT_LEN = 60 / BPM; // ~0.4838 seconds per beat
const SIXTEENTH = BEAT_LEN / 4;

const left = new Float32Array(NUM_SAMPLES);
const right = new Float32Array(NUM_SAMPLES);

// Pentatonic scales for uplifting, high-trust corporate tech (D, F, G, A, C)
const NOTES = {
    D2: 73.42,
    F2: 87.31,
    G2: 98.00,
    A2: 110.00,
    C3: 130.81,
    D3: 146.83,
    F3: 174.61,
    G3: 196.00,
    A3: 220.00,
    C4: 261.63,
    D4: 293.66,
    F4: 349.23,
    G4: 392.00,
    A4: 440.00,
    C5: 523.25
};

const BASS_LINE = [NOTES.D2, NOTES.D2, NOTES.F2, NOTES.G2, NOTES.D2, NOTES.C3, NOTES.A2, NOTES.D2];
const ARP_NOTES = [NOTES.D4, NOTES.F4, NOTES.A4, NOTES.C5, NOTES.A4, NOTES.G4, NOTES.F4, NOTES.D4];

for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    const beatIndex = Math.floor(t / BEAT_LEN);
    const beatTime = t % BEAT_LEN;
    const sixteenthIndex = Math.floor(t / SIXTEENTH);
    const sixteenthTime = t % SIXTEENTH;

    // Overall volume envelope (fade in 0-1s, fade out 36.5-38.5s)
    let masterEnv = 1.0;
    if (t < 1.0) masterEnv = t;
    else if (t > 36.5) masterEnv = Math.max(0, 1.0 - (t - 36.5) / 2.0);

    let sampleL = 0;
    let sampleR = 0;

    // 1. Kick Drum (on every beat after 3.8s intro, and lighter on intro)
    const kickFreq = 140 * Math.exp(-beatTime * 35);
    const kickEnv = Math.exp(-beatTime * 14);
    const kick = Math.sin(2 * Math.PI * kickFreq * beatTime) * kickEnv;
    const kickVol = t < 5.0 ? 0.35 : 0.85;
    sampleL += kick * kickVol;
    sampleR += kick * kickVol;

    // 2. Snare / Clap (on beats 2 & 4)
    if (beatIndex % 2 === 1 && t > 5.0) {
        const snareNoise = (Math.random() * 2 - 1) * Math.exp(-beatTime * 18);
        const snareSnap = Math.sin(2 * Math.PI * 190 * beatTime) * Math.exp(-beatTime * 30);
        const snare = (snareNoise * 0.7 + snareSnap * 0.3) * 0.45;
        sampleL += snare;
        sampleR += snare;
    }

    // 3. Crisp Hi-Hats (every 16th note with stereo spread)
    if (t > 4.5) {
        const hatNoise = (Math.random() * 2 - 1) * Math.exp(-sixteenthTime * 45);
        const hatAccent = (sixteenthIndex % 4 === 2) ? 0.28 : 0.15;
        sampleL += hatNoise * hatAccent * 0.85;
        sampleR += hatNoise * hatAccent * 1.15;
    }

    // 4. Driving Synth Bass (16th note pulse with analog warmth)
    if (t > 2.0) {
        const bassNote = BASS_LINE[Math.floor(t / (BEAT_LEN * 2)) % BASS_LINE.length];
        const bassEnv = Math.exp(-sixteenthTime * 8);
        // Sawtooth approximation with fundamental and harmonics
        const bassWave = Math.sin(2 * Math.PI * bassNote * t) * 0.6 +
                         Math.sin(2 * Math.PI * bassNote * 2 * t) * 0.3 +
                         Math.sin(2 * Math.PI * bassNote * 3 * t) * 0.1;
        const sidechain = Math.min(1.0, beatTime * 5.0); // Sidechain compression dip on kick
        const bass = bassWave * bassEnv * sidechain * 0.42;
        sampleL += bass;
        sampleR += bass;
    }

    // 5. Tech Arpeggio (Syncopated 16th notes with ping-pong delay)
    if (t > 5.0) {
        const arpNote = ARP_NOTES[sixteenthIndex % ARP_NOTES.length];
        const arpEnv = Math.exp(-sixteenthTime * 12);
        const arpWave = Math.sin(2 * Math.PI * arpNote * t) + 0.3 * Math.sin(2 * Math.PI * arpNote * 2 * t);
        const arpPan = Math.sin(sixteenthIndex * 0.8) * 0.35 + 0.5; // Ping-pong pan
        const arp = arpWave * arpEnv * 0.18;
        sampleL += arp * (1 - arpPan);
        sampleR += arp * arpPan;
    }

    // 6. Warm Corporate Ambient Chords / Pad (rich multi-oscillator pad)
    const chordTime = t * 0.5;
    const pad1 = Math.sin(2 * Math.PI * NOTES.D3 * t) * 0.12;
    const pad2 = Math.sin(2 * Math.PI * NOTES.A3 * t * 1.002) * 0.10;
    const pad3 = Math.sin(2 * Math.PI * NOTES.F4 * t * 0.998) * 0.08;
    const pad4 = Math.sin(2 * Math.PI * NOTES.C4 * t) * 0.08;
    const pad = (pad1 + pad2 + pad3 + pad4) * 0.6;
    sampleL += pad * 0.9;
    sampleR += pad * 1.1;

    // 7. Transition Risers & Whooshes at scene boundaries (t: 4.8, 10.3, 18.3, 26.3, 33.3)
    const transitions = [4.8, 10.3, 18.3, 26.3, 33.3];
    for (const transTime of transitions) {
        if (t >= transTime - 0.7 && t <= transTime + 0.3) {
            const rel = (t - (transTime - 0.7)) / 1.0;
            const sweepFreq = 300 + Math.pow(rel, 2.5) * 2200;
            const sweepNoise = (Math.random() * 2 - 1) * Math.sin(rel * Math.PI) * 0.22;
            const sweepTone = Math.sin(2 * Math.PI * sweepFreq * t) * Math.sin(rel * Math.PI) * 0.18;
            sampleL += sweepNoise + sweepTone;
            sampleR += sweepNoise + sweepTone;
        }
    }

    // Apply Master Envelope & soft clipping
    sampleL *= masterEnv * 0.82;
    sampleR *= masterEnv * 0.82;

    left[i] = Math.max(-0.95, Math.min(0.95, sampleL));
    right[i] = Math.max(-0.95, Math.min(0.95, sampleR));
}

// Write to 16-bit Stereo PCM WAV
const blockAlign = 4; // 2 channels * 2 bytes
const byteRate = SAMPLE_RATE * blockAlign;
const dataSize = NUM_SAMPLES * blockAlign;
const buffer = Buffer.alloc(44 + dataSize);

// RIFF header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // subchunk1 size
buffer.writeUInt16LE(1, 20);  // PCM format
buffer.writeUInt16LE(2, 22);  // stereo
buffer.writeUInt32LE(SAMPLE_RATE, 24);
buffer.writeUInt32LE(byteRate, 28);
buffer.writeUInt16LE(blockAlign, 32);
buffer.writeUInt16LE(16, 34); // bits per sample
buffer.write('data', 36);
buffer.writeUInt32LE(dataSize, 40);

let offset = 44;
for (let i = 0; i < NUM_SAMPLES; i++) {
    const sL = Math.max(-1, Math.min(1, left[i]));
    const sR = Math.max(-1, Math.min(1, right[i]));
    const intL = sL < 0 ? sL * 32768 : sL * 32767;
    const intR = sR < 0 ? sR * 32768 : sR * 32767;
    buffer.writeInt16LE(Math.floor(intL), offset);
    buffer.writeInt16LE(Math.floor(intR), offset + 2);
    offset += 4;
}

const outPath = path.resolve('zovance-showcase-video/assets/corporate-tech-audio.wav');
fs.writeFileSync(outPath, buffer);
console.log(`✅ Successfully synthesized 38.5s corporate tech soundtrack: ${outPath} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);
