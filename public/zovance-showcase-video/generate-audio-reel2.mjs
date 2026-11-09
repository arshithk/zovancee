import fs from 'fs';
import path from 'path';

// Generate 36.0 seconds of pristine stereo 44.1kHz energetic corporate technology soundtrack
const SAMPLE_RATE = 44100;
const DURATION = 36.0;
const NUM_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);
const BPM = 126;
const BEAT_LEN = 60 / BPM; // ~0.4762 seconds per beat
const SIXTEENTH = BEAT_LEN / 4;

const left = new Float32Array(NUM_SAMPLES);
const right = new Float32Array(NUM_SAMPLES);

// Notes in A Minor / C Major for confident, inspiring, premium tech atmosphere
const NOTES = {
    A1: 55.00,
    C2: 65.41,
    D2: 73.42,
    E2: 82.41,
    F2: 87.31,
    G2: 98.00,
    A2: 110.00,
    C3: 130.81,
    D3: 146.83,
    E3: 164.81,
    F3: 174.61,
    G3: 196.00,
    A3: 220.00,
    B3: 246.94,
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    F4: 349.23,
    G4: 392.00,
    A4: 440.00,
    B4: 493.88,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25
};

// Chord progression: Am -> F -> C -> G
const CHORD_ROOTS = [NOTES.A2, NOTES.F2, NOTES.C3, NOTES.G2];
const CHORD_FREQS = [
    [NOTES.A3, NOTES.C4, NOTES.E4, NOTES.A4], // Am
    [NOTES.F3, NOTES.A3, NOTES.C4, NOTES.F4], // F
    [NOTES.C3, NOTES.E3, NOTES.G3, NOTES.C4], // C
    [NOTES.G3, NOTES.B3, NOTES.D4, NOTES.G4]  // G
];

console.log(`Synthesizing ${DURATION}s corporate soundtrack at ${BPM} BPM...`);

for (let i = 0; i < NUM_SAMPLES; i++) {
    const t = i / SAMPLE_RATE;
    const beatIndex = Math.floor(t / BEAT_LEN);
    const beatTime = t % BEAT_LEN;
    const barIndex = Math.floor(beatIndex / 4);
    const sixteenthIndex = Math.floor(t / SIXTEENTH);
    const sixteenthTime = t % SIXTEENTH;

    // Volume Envelope (Smooth fade-in 0-0.8s, smooth fade-out 34.2-36.0s)
    let masterEnv = 1.0;
    if (t < 0.8) masterEnv = t / 0.8;
    else if (t > 34.2) masterEnv = Math.max(0, 1.0 - (t - 34.2) / 1.8);

    let sampleL = 0;
    let sampleR = 0;

    // 1. Kick Drum (Deep punchy 4-on-the-floor after 3.8s intro)
    if (t >= 3.8 || (t < 3.8 && beatIndex % 2 === 0)) {
        const kickFreq = 150 * Math.exp(-beatTime * 38);
        const kickEnv = Math.exp(-beatTime * 14);
        const kick = Math.sin(2 * Math.PI * kickFreq * beatTime) * kickEnv;
        const kickVol = t < 3.8 ? 0.4 : 0.88;
        sampleL += kick * kickVol;
        sampleR += kick * kickVol;
    }

    // 2. Crisp Snare / Clap on beats 2 & 4
    if (t >= 3.8 && (beatIndex % 4 === 1 || beatIndex % 4 === 3)) {
        const snareEnv = Math.exp(-beatTime * 18);
        const snareNoise = (Math.random() * 2 - 1) * snareEnv;
        const snareTone = Math.sin(2 * Math.PI * 210 * beatTime) * Math.exp(-beatTime * 24);
        const snare = (snareNoise * 0.75 + snareTone * 0.25) * 0.55;
        sampleL += snare * 0.95;
        sampleR += snare * 1.05;
    }

    // 3. Shimmering Hi-Hats & Shakers on sixteenth notes
    if (t >= 2.0) {
        const hatEnv = Math.exp(-sixteenthTime * 35);
        const hatNoise = (Math.random() * 2 - 1) * hatEnv;
        // Accent on the offbeat
        const isOffbeat = (sixteenthIndex % 2 === 1);
        const hatVol = isOffbeat ? 0.22 : 0.12;
        const pan = (sixteenthIndex % 4 < 2) ? -0.15 : 0.15;
        sampleL += hatNoise * hatVol * (1 - pan);
        sampleR += hatNoise * hatVol * (1 + pan);
    }

    // 4. Warm Analog Rolling Bassline (16th note groove)
    const currentChordIdx = barIndex % 4;
    const currentRoot = CHORD_ROOTS[currentChordIdx];
    // Syncopated bass pattern: Hit on 1, 3, 4, 6, 7, 9, 11, 14
    const sixteenthInBar = sixteenthIndex % 16;
    const bassHits = [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1];
    if (bassHits[sixteenthInBar] && t >= 3.8) {
        const bassEnv = Math.exp(-sixteenthTime * 12);
        // Slightly vary pitch for groove
        const pitchMod = sixteenthInBar === 14 ? 1.2 : (sixteenthInBar === 6 ? 1.12 : 1.0);
        const freq = currentRoot * pitchMod;
        // Dual oscillator with soft saturation
        const osc1 = Math.sin(2 * Math.PI * freq * t);
        const osc2 = Math.sin(4 * Math.PI * freq * t) * 0.45;
        const sub = Math.sin(Math.PI * freq * t) * 0.35;
        const bassRaw = (osc1 + osc2 + sub) * bassEnv;
        const bassSaturated = Math.tanh(bassRaw * 1.6) * 0.48;
        sampleL += bassSaturated;
        sampleR += bassSaturated;
    }

    // 5. Lush Glassmorphic Chords / Rhodes Electric Piano
    const chord = CHORD_FREQS[currentChordIdx];
    const barTime = (t % (BEAT_LEN * 4)) / (BEAT_LEN * 4);
    // Swell envelope per bar
    const chordEnv = Math.sin(Math.PI * barTime) * 0.22;
    for (let c = 0; c < chord.length; c++) {
        const noteFreq = chord[c];
        const tone = Math.sin(2 * Math.PI * noteFreq * t) + 0.3 * Math.sin(4 * Math.PI * noteFreq * t);
        const pan = (c / (chord.length - 1)) * 0.4 - 0.2; // Stereo spread
        sampleL += tone * chordEnv * (1 - pan);
        sampleR += tone * chordEnv * (1 + pan);
    }

    // 6. Kinetic High Tech Arpeggio (Flowing 16th notes)
    const arpSeq = [0, 2, 1, 3, 2, 0, 1, 2];
    const arpNoteIdx = arpSeq[sixteenthIndex % arpSeq.length];
    const arpFreq = chord[arpNoteIdx] * 2.0; // One octave higher
    const arpEnv = Math.exp(-sixteenthTime * 16);
    const arpTone = Math.sin(2 * Math.PI * arpFreq * t) * arpEnv * 0.16;
    const arpPan = Math.sin(t * 3.5) * 0.35;
    sampleL += arpTone * (1 - arpPan);
    sampleR += arpTone * (1 + arpPan);

    // 7. Transition Impact Whooshes at Scene Drops (approx every 6 seconds)
    const transitionPoints = [5.5, 11.5, 18.0, 24.5, 30.5];
    for (const tp of transitionPoints) {
        const dt = t - tp;
        if (dt >= -0.5 && dt < 1.2) {
            if (dt < 0) {
                // Riser
                const rNorm = (dt + 0.5) / 0.5;
                const riserNoise = (Math.random() * 2 - 1) * Math.pow(rNorm, 3) * 0.25;
                sampleL += riserNoise;
                sampleR += riserNoise;
            } else {
                // Impact sub-boom
                const impEnv = Math.exp(-dt * 4.5);
                const subFreq = 85 * Math.exp(-dt * 8);
                const subBoom = Math.sin(2 * Math.PI * subFreq * dt) * impEnv * 0.5;
                const cymbal = (Math.random() * 2 - 1) * Math.exp(-dt * 6) * 0.22;
                sampleL += subBoom + cymbal;
                sampleR += subBoom + cymbal;
            }
        }
    }

    // Master Soft Limiter & Volume Normalization
    const outL = Math.tanh(sampleL * masterEnv * 0.85);
    const outR = Math.tanh(sampleR * masterEnv * 0.85);

    left[i] = outL;
    right[i] = outR;
}

// Write to 16-bit PCM WAV
const byteLength = NUM_SAMPLES * 4; // 2 channels * 2 bytes
const buffer = Buffer.alloc(44 + byteLength);

// RIFF header
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + byteLength, 4);
buffer.write('WAVE', 8);

// fmt chunk
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16); // Chunk size
buffer.writeUInt16LE(1, 20);  // PCM format
buffer.writeUInt16LE(2, 22);  // Channels (2)
buffer.writeUInt32LE(SAMPLE_RATE, 24); // Sample rate
buffer.writeUInt32LE(SAMPLE_RATE * 4, 28); // Byte rate
buffer.writeUInt16LE(4, 32);  // Block align
buffer.writeUInt16LE(16, 34); // Bits per sample

// data chunk
buffer.write('data', 36);
buffer.writeUInt32LE(byteLength, 40);

let offset = 44;
for (let i = 0; i < NUM_SAMPLES; i++) {
    const sL = Math.max(-1, Math.min(1, left[i]));
    const sR = Math.max(-1, Math.min(1, right[i]));
    buffer.writeInt16LE(Math.floor(sL < 0 ? sL * 32768 : sL * 32767), offset);
    buffer.writeInt16LE(Math.floor(sR < 0 ? sR * 32768 : sR * 32767), offset + 2);
    offset += 4;
}

const outPath = path.resolve('zovance-showcase-video/assets/human-enterprise-audio.wav');
fs.writeFileSync(outPath, buffer);
console.log(`✅ Pristine audio soundtrack generated: ${outPath} (${(buffer.length / (1024 * 1024)).toFixed(2)} MB)`);
