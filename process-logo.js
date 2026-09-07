const Jimp = require('jimp');

async function processLogo() {
    try {
        const image = await Jimp.read('./src/assets/zovance-logo.png');

        image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
            let red = this.bitmap.data[idx + 0];
            let green = this.bitmap.data[idx + 1];
            let blue = this.bitmap.data[idx + 2];

            let min_val = Math.min(red, Math.min(green, blue));

            // Text in the bottom section ("TECH PRIVATE LIMITED" + lines)
            if (y > 145 && red < 120 && green < 120 && blue < 120) {
                this.bitmap.data[idx + 0] = 255;
                this.bitmap.data[idx + 1] = 255;
                this.bitmap.data[idx + 2] = 255;
                this.bitmap.data[idx + 3] = 255;
                return;
            }

            // For the main logo, keep the body completely solid so it is PERFECTLY sharp.
            // Only fade out pixels that are extremely close to white (background antialiasing fringe).
            if (min_val > 240) {
                // Pure/near white = transparent
                this.bitmap.data[idx + 3] = 0;
            } else if (min_val > 180) {
                // Feather the background fringe slightly
                let alpha = 255 - ((min_val - 180) / 60.0) * 255;
                this.bitmap.data[idx + 3] = Math.round(alpha);
                // We intentionally DO NOT modify the RGB to prevent thinning/blurring the core shapes.
            } else {
                // Solid logo color
                this.bitmap.data[idx + 3] = 255;
            }
        });

        await image.writeAsync('./src/assets/zovance-logo-transparent.png');
        console.log('Successfully written sharp zovance-logo-transparent.png with core colors preserved opaquely.');
    } catch (e) {
        console.error('Error processing image:', e);
    }
}

processLogo();
