/**
 * Reads an image File from the user's device and resizes/compresses it
 * to a lightweight Base64 Data URL, ideal for avatars and quick network transfers.
 *
 * @param {File} file - Image file from file input
 * @param {number} maxWidth - Max width in pixels (default 400)
 * @param {number} maxHeight - Max height in pixels (default 400)
 * @param {number} quality - JPEG compression quality (0.1 - 1.0, default 0.85)
 * @returns {Promise<string>} Base64 Data URL
 */
export const resizeImageFile = (file, maxWidth = 400, maxHeight = 400, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      return reject(new Error('No file provided'));
    }

    if (!file.type.startsWith('image/')) {
      return reject(new Error('الملف المختار ليس صورة صالحة'));
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio while bounding within maxWidth x maxHeight
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target.result); // Fallback to raw data url
        }

        ctx.drawImage(img, 0, 0, width, height);

        try {
          const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve(dataUrl);
        } catch (err) {
          resolve(e.target.result);
        }
      };

      img.onerror = () => {
        // Fallback to raw data URL if Image element decoding has any issue
        resolve(e.target.result);
      };

      img.src = e.target.result;
    };

    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};
