/**
 * Lee y COMPRIME una imagen usando Canvas
 * Portado de VCO_App
 * @param {File} file - El archivo de imagen
 * @param {number} quality - Calidad (0.0 a 1.0)
 * @param {number} maxWidth - Ancho máximo en px
 */
export const compressImage = (file, quality = 0.7, maxWidth = 1600) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = function(event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = function() {
                // Calcular nuevas dimensiones manteniendo aspecto
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = Math.round(height * (maxWidth / width));
                    width = maxWidth;
                }

                // Crear canvas
                const canvas = document.createElement('canvas');
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Exportar a blob/base64 comprimido (JPEG)
                const dataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(dataUrl);
            }
            img.onerror = (err) => reject(err);
        }
        reader.onerror = (err) => reject(err);
    });
};
