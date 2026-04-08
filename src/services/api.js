export const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyiJT7VBZohl2ZESJORqffoHIacSXTvgFh3CzUTm6BOCgGDTKDRkjg0oBxxdVhSnP0N/exec';

export async function obtenerRendimiento() {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=resumen_presupuesto`);
        return await response.json();
    } catch (error) {
        console.error('Error al obtener datos:', error);
        return { success: false, error };
    }
}

export async function obtenerPuntosMapa() {
    try {
        const response = await fetch(`${GOOGLE_SCRIPT_URL}?action=obtener_mapa`);
        return await response.json();
    } catch (error) {
        console.error('Error al obtener datos del mapa:', error);
        return { success: false, error };
    }
}

export async function enviarAGSheets(tipo, datos) {
    // Compatibilidad: Reconstruir campo 'cuadrilla' si existen supervisor y obrero
    if (datos.supervisor && datos.obrero) {
        datos.cuadrilla = `${datos.supervisor} / ${datos.obrero}`;
    }

    try {
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ tipo, ...datos }),
            // Usamos text/plain para evitar Preflight OPTIONS que a veces falla en GAS con payloads grandes
            headers: {
                'Content-Type': 'text/plain', 
            },
        });
        
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error al enviar a Google Sheets:', error);
        return { success: false, error: error.message };
    }
}
