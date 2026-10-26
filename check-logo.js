const Jimp = require('jimp');

async function checkLogo() {
    try {
        const image = await Jimp.read('./src/assets/zovance-logo.png');
        console.log(`Dimensions: ${image.bitmap.width}x${image.bitmap.height}`);

        let minY = image.bitmap.height;
        let maxY = 0;

        // Let's find exactly the bounds of the dark pixels "TECH PRIVATE LIMITED"
        image.scan(0, Math.floor(image.bitmap.height * 0.5), image.bitmap.width, image.bitmap.height - Math.floor(image.bitmap.height * 0.5), function (x, y, idx) {
            let r = this.bitmap.data[idx + 0];
            let g = this.bitmap.data[idx + 1];
            let b = this.bitmap.data[idx + 2];
            // Look for dark pixels (text)
            if (r < 80 && g < 80 && b < 80) {
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        });

        console.log(`Dark pixels in bottom half span Y: ${minY} to ${maxY}`);
    } catch (e) {
        console.error(e);
    }
}
checkLogo();
