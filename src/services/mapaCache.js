const MAPA_CACHE_KEY = 'mapaOrdenesCache_v1';
const MAPA_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas

function leerCacheCrudo() {
  try {
    const raw = localStorage.getItem(MAPA_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.data) || !parsed.savedAt) return null;
    return parsed;
  } catch (error) {
    console.error('Error leyendo cache del mapa:', error);
    return null;
  }
}

export function guardarPuntosMapaEnCache(data) {
  if (!Array.isArray(data)) return;
  try {
    const payload = {
      data,
      savedAt: Date.now(),
    };
    localStorage.setItem(MAPA_CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.error('Error guardando cache del mapa:', error);
  }
}

export function obtenerPuntosMapaDesdeCache() {
  const cache = leerCacheCrudo();
  if (!cache) return { data: [], stale: true, savedAt: null };

  const edad = Date.now() - cache.savedAt;
  const stale = edad > MAPA_CACHE_MAX_AGE_MS;
  return { data: cache.data, stale, savedAt: cache.savedAt };
}
