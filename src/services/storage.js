const STORAGE_KEY = 'cortesRecientes';

export function guardarCorteLocal(contrato, datos) {
    if (!contrato) return;
    try {
        const cortesGuardados = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        // Guardar con timestamp para poder limpiar antiguos
        cortesGuardados[contrato] = {
            timestamp: new Date().getTime(),
            datos: datos
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cortesGuardados));
        console.log(`Datos de corte guardados para contrato: ${contrato}`);
    } catch (e) {
        console.error('Error al guardar en localStorage:', e);
    }
}

export function obtenerCorteLocal(contrato) {
    if (!contrato) return null;
    try {
        const cortesGuardados = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const registro = cortesGuardados[contrato];
        
        if (registro) {
            return registro.datos;
        }
    } catch (e) {
        console.error('Error al leer de localStorage:', e);
    }
    return null;
}

export function limpiarCortesAntiguos() {
    try {
        const cortesGuardados = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const ahora = new Date().getTime();
        const LIMITE_DIAS = 3;
        const LIMITE_MS = LIMITE_DIAS * 24 * 60 * 60 * 1000;
        
        let cambios = false;
        let contador = 0;

        for (const contrato in cortesGuardados) {
            const registro = cortesGuardados[contrato];
            if (!registro.timestamp || (ahora - registro.timestamp > LIMITE_MS)) {
                delete cortesGuardados[contrato];
                cambios = true;
                contador++;
            }
        }

        if (cambios) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cortesGuardados));
            console.log(`🧹 Limpieza automática: Se eliminaron ${contador} registros antiguos.`);
        }
    } catch (e) {
        console.error('Error durante la limpieza automática:', e);
    }
}
