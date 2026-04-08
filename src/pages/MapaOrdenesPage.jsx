import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { obtenerPuntosMapa } from '../services/api';
import L from 'leaflet';

// ICONOS EN FORMATO RAW (Garantiza que siempre se muestren sin depender de librerías externas)
const IconLocate = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block'}}>
        <circle cx="12" cy="12" r="10"></circle>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>
);

const IconMaximize = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block'}}>
        <polyline points="15 3 21 3 21 9"></polyline>
        <polyline points="9 21 3 21 3 15"></polyline>
        <line x1="21" y1="3" x2="14" y2="10"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>
);

const IconMinimize = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block'}}>
        <polyline points="4 14 10 14 10 20"></polyline>
        <polyline points="20 10 14 10 14 4"></polyline>
        <line x1="14" y1="10" x2="21" y2="3"></line>
        <line x1="3" y1="21" x2="10" y2="14"></line>
    </svg>
);

// Solución para el ícono por defecto de Leaflet en React/Vite
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const defaultIcon = new L.Icon({
    iconUrl,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Función auxiliar para obtener la dirección normalizada
const obtenerDireccion = (info) => {
    return info["Dirección Producto"] || info["DirecciÃ³n Producto"] || "Sin Dirección";
};

// Componente para ajustar los límites del mapa para que todos los pines se vean
function MapBounds({ markers }) {
    const map = useMap();
    useEffect(() => {
        if (markers && markers.length > 0) {
            const bounds = L.latLngBounds(markers.map(m => [m.y, m.x]));
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [markers, map]);
    return null;
}

// Componente para controles personalizados (Geolocalización y Pantalla Completa)
function MapControls() {
    const map = useMap();
    const [userLoc, setUserLoc] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFull = !!document.fullscreenElement;
            setIsFullscreen(isFull);
            // Hacer que leaftlet recalcule el tamaño luego del cambio de pantalla
            setTimeout(() => {
                map.invalidateSize();
            }, 100);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [map]);

    const handleLocate = () => {
        map.locate({ setView: true, maxZoom: 16 });
        
        map.once('locationfound', function (e) {
            setUserLoc(e.latlng);
        });
        
        map.once('locationerror', function (e) {
            alert("No se pudo obtener la ubicación. Verifique que los permisos de ubicación estén habilitados en su navegador o dispositivo móvil.");
        });
    };

    const toggleFullScreen = () => {
        const elem = document.getElementById('map-container-fs');
        if (!document.fullscreenElement) {
            if (elem.requestFullscreen) {
                elem.requestFullscreen().catch(err => {
                    alert(`El modo pantalla completa no es soportado: ${err.message}`);
                });
            } else if (elem.webkitRequestFullscreen) { /* Safari */
                elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) { /* IE11 */
                elem.msRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) { /* Safari */
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) { /* IE11 */
                document.msExitFullscreen();
            }
        }
    };

    // Hemos movido estos controles más abajo para que no choquen con la barra de búsqueda en el top-right
    return (
        <>
            <div style={{ position: 'absolute', top: '70px', right: '10px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '8px', pointerEvents: 'auto' }}>
                <button 
                    onClick={handleLocate} 
                    style={{ width: '40px', height: '40px', backgroundColor: 'white', border: '2px solid rgba(0,0,0,0.2)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', padding: 0 }} 
                    title="Mi Ubicación"
                    type="button"
                >
                    <IconLocate />
                </button>
                <button 
                    onClick={toggleFullScreen} 
                    style={{ width: '40px', height: '40px', backgroundColor: 'white', border: '2px solid rgba(0,0,0,0.2)', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.3)', padding: 0 }} 
                    title={isFullscreen ? "Salir de Pantalla Completa" : "Pantalla Completa"}
                    type="button"
                >
                    {isFullscreen ? <IconMinimize /> : <IconMaximize />}
                </button>
            </div>
            {userLoc && (
                <Marker position={userLoc} icon={new L.DivIcon({
                    className: 'user-location-marker',
                    html: '<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>',
                    iconSize: [22, 22],
                    iconAnchor: [11, 11]
                })}>
                    <Popup>Tu ubicación actual</Popup>
                </Marker>
            )}
        </>
    );
}

const MapaOrdenesPage = () => {
    const [puntos, setPuntos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroTipoTarea, setFiltroTipoTarea] = useState(""); 
    
    // Nueveos estados
    const [tipoBusqueda, setTipoBusqueda] = useState("Producto");
    const [valorBusqueda, setValorBusqueda] = useState("");
    const [mostrarPanelOT, setMostrarPanelOT] = useState(false);

    const DEFAULT_CENTER = [-2.18, -79.9]; // Guayaquil aproximado

    // --- CONFIGURACIÓN DE CAMPOS A MOSTRAR EN EL POPUP ---
    const camposAMostrar = [
        "Orden",
        "Contrato",
        "Producto"
    ];

    useEffect(() => {
        const cargarPuntos = async () => {
            setLoading(true);
            const response = await obtenerPuntosMapa();
            if (response.success) {
                if (response.data.length === 0) {
                    setError("No se encontraron puntos con coordenadas X y Y.");
                } else {
                    setPuntos(response.data);
                }
            } else {
                setError(response.error || "Ocurrió un error al cargar las coordenadas.");
            }
            setLoading(false);
        };

        cargarPuntos();
    }, []);

    // Extraer los tipos de tarea únicos para el filtro de forma dinámica
    const tiposTareaUnicos = [...new Set(puntos.map(p => p.info["Tipo Tarea"]).filter(Boolean))];

    // Filtrar los puntos basados en el tipo de tarea y la búsqueda
    const puntosFiltrados = puntos.filter(p => {
        // Filtro por tipo tarea
        if (filtroTipoTarea && p.info["Tipo Tarea"] !== filtroTipoTarea) {
            return false;
        }

        // Filtro por búsqueda (Producto/Contrato)
        if (valorBusqueda.trim() !== "") {
            const termino = valorBusqueda.toLowerCase();
            if (tipoBusqueda === "Producto") {
                const prod = p.info["Producto"]?.toString()?.toLowerCase() || "";
                if (!prod.includes(termino)) return false;
            } else if (tipoBusqueda === "Contrato") {
                const cont = p.info["Contrato"]?.toString()?.toLowerCase() || "";
                if (!cont.includes(termino)) return false;
            }
        }

        return true;
    });

    return (
        <div className="formulario active" style={{ maxWidth: '100%', padding: '10px' }}>
            <header>
                <h1>Mapa de Órdenes Centralizado</h1>
                <p>Ubicaciones cargadas desde Google Sheets</p>
                <Link to="/" className="btn-volver">← Volver al Menú</Link>
            </header>

            <div className="map-container-wrapper" style={{ marginTop: '20px', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                {loading && <div style={{ padding: '20px', textAlign: 'center' }}>Cargando ubicaciones... ⏳</div>}
                {error && <div style={{ padding: '20px', textAlign: 'center', color: '#dc2626', backgroundColor: '#fee2e2', borderRadius: '8px' }}>❌ {error}</div>}
                
                {!loading && !error && (
                    <div id="map-container-fs" style={{ position: 'relative', height: '65vh', width: '100%', backgroundColor: '#f9f9f9', overflow: 'hidden' }}>
                        
                        {/* Controles Superpuestos del Mapa */}
                        <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 1000, display: 'flex', justifyContent: 'space-between', gap: '10px', pointerEvents: 'none', flexWrap: 'wrap' }}>
                            {/* Buscar Producto/Contrato (Top Left) */}
                            <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', border: '1px solid #d1d5db' }}>
                                <select 
                                    value={tipoBusqueda}
                                    onChange={(e) => setTipoBusqueda(e.target.value)}
                                    style={{ padding: '8px 12px', border: 'none', backgroundColor: '#f3f4f6', outline: 'none', cursor: 'pointer', borderRight: '1px solid #d1d5db', appearance: 'none', paddingRight: '25px', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center', backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="black" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>')` }}
                                >
                                    <option value="Producto">Producto</option>
                                    <option value="Contrato">Contrato</option>
                                </select>
                                <input 
                                    type="text"
                                    placeholder="Ej: 188669"
                                    value={valorBusqueda}
                                    onChange={(e) => setValorBusqueda(e.target.value)}
                                    style={{ padding: '8px 12px', border: 'none', outline: 'none', minWidth: '150px', flex: 1, backgroundColor: '#e5e7eb' }}
                                />
                                <div style={{ padding: '8px 15px', backgroundColor: '#e5e7eb', display: 'flex', alignItems: 'center' }}>
                                    <span style={{ cursor: 'pointer', color: '#3b82f6' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                    </span>
                                </div>
                            </div>

                            {/* Dropdown Tipo Tarea (Top Right) */}
                            <div style={{ pointerEvents: 'auto', backgroundColor: '#e5e7eb', borderRadius: '4px', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', border: '1px solid #d1d5db' }}>
                                <select 
                                    id="filtro-tipo" 
                                    value={filtroTipoTarea} 
                                    onChange={(e) => setFiltroTipoTarea(e.target.value)}
                                    style={{ padding: '8px 15px', border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#4b5563', textTransform: 'uppercase', appearance: 'none', paddingRight: '30px', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundImage: `url('data:image/svg+xml;utf8,<svg fill="black" height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path d="M7 10l5 5 5-5z"/><path d="M0 0h24v24H0z" fill="none"/></svg>')` }}
                                >
                                    <option value="">TODAS ({puntos.length})</option>
                                    {tiposTareaUnicos.map((tipo, idx) => (
                                        <option key={idx} value={tipo}>{tipo}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Botón Flotante OT (Bottom Left) */}
                        <button
                            onClick={() => setMostrarPanelOT(!mostrarPanelOT)}
                            style={{ position: 'absolute', bottom: mostrarPanelOT ? '50%' : '20px', left: '10px', zIndex: 1000, padding: '10px 0', width: '45px', textAlign: 'center', backgroundColor: 'white', color: '#1f2937', border: '1px solid #d1d5db', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: 'bold', transition: 'bottom 0.3s ease' }}
                        >
                            OT
                        </button>

                        <MapContainer 
                            center={DEFAULT_CENTER} 
                            zoom={12} 
                            style={{ height: '100%', width: '100%', zIndex: 1 }}
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MapBounds markers={puntosFiltrados} />
                            <MapControls />
                            
                            {puntosFiltrados.map((punto, idx) => (
                                <Marker 
                                    key={idx} 
                                    position={[punto.y, punto.x]} 
                                    icon={defaultIcon}
                                >
                                    <Popup>
                                        <div style={{ minWidth: '150px' }}>
                                            <h3 style={{ margin: '0 0 10px 0', borderBottom: '1px solid #ccc', paddingBottom: '5px' }}>Detalles de Orden</h3>
                                            
                                            {/* Renderizamos solo los campos que tú has definido en la lista camposAMostrar */}
                                            {camposAMostrar.map((campo) => (
                                                punto.info[campo] !== undefined && punto.info[campo] !== "" && (
                                                    <div key={campo} style={{ marginBottom: '5px' }}>
                                                        <strong>{campo}:</strong> {punto.info[campo]}
                                                    </div>
                                                )
                                            ))}
                                            <div style={{ marginBottom: '5px' }}>
                                                <strong>Dirección:</strong> {obtenerDireccion(punto.info)}
                                            </div>
                                            
                                            <div style={{ marginTop: '10px', textAlign: 'center' }}>
                                                <a 
                                                    href={`https://maps.google.com/?q=${punto.y},${punto.x}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ display: 'inline-block', padding: '6px 12px', background: '#2563eb', color: 'white', textDecoration: 'none', borderRadius: '6px', fontSize: '0.9rem', fontWeight: 'bold' }}
                                                >
                                                    📍 Abrir en Google Maps
                                                </a>
                                            </div>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>

                        {/* Panel de Órdenes Desplegable */}
                        {mostrarPanelOT && (
                            <div style={{ position: 'absolute', bottom: '0', left: '0', width: '100%', height: '50%', backgroundColor: '#eef2e6', zIndex: 1001, borderTopLeftRadius: '16px', borderTopRightRadius: '16px', boxShadow: '0 -4px 10px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', transition: 'all 0.3s ease' }}>
                                {/* Cabecera del Panel */}
                                <div style={{ padding: '15px 20px', borderBottom: '1px solid #d1d5db', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#eef2e6', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
                                    <h3 style={{ margin: 0, color: '#111827', fontSize: '1.2rem', fontWeight: '700' }}>Órdenes ({puntosFiltrados.length}/{puntos.length})</h3>
                                    
                                    {/* Búsqueda rápida por número de orden dentro del panel (Opción Visual) */}
                                    <div style={{ display: 'flex', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #d1d5db', padding: '4px 12px', width: '250px' }}>
                                        <input 
                                            type="text"
                                            placeholder="Buscar por número de orden..."
                                            style={{ border: 'none', outline: 'none', width: '100%', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    
                                    <button onClick={() => setMostrarPanelOT(false)} style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: '#6b7280', lineHeight: 1 }}>&times;</button>
                                </div>
                                
                                {/* Lista Scrollable */}
                                <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
                                    {puntosFiltrados.map((p, idx) => {
                                        const direccion = obtenerDireccion(p.info);
                                        return (
                                            <div key={idx} style={{ backgroundColor: '#ffffff', padding: '15px', marginBottom: '10px', borderRadius: '12px', border: '1px solid #d1d5db', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', justifyContent: 'space-between' }}>
                                                <div style={{ flex: '1', paddingRight: '15px' }}>
                                                    <div style={{ fontSize: '0.95rem', marginBottom: '4px' }}>
                                                        <span style={{ color: '#6b7280' }}>Orden:</span> <strong style={{ color: '#059669', fontSize: '1.05rem' }}>{p.info["Orden"]}</strong>
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#4b5563', marginBottom: '4px' }}>
                                                        <span style={{ color: '#6b7280' }}>Dirección:</span> {direccion}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: '#4b5563' }}>
                                                        <span style={{ color: '#6b7280' }}>Actividad:</span> {p.info["Actividad"]}
                                                    </div>
                                                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                        <input type="checkbox" id={`listo-${idx}`} />
                                                        <label htmlFor={`listo-${idx}`} style={{ fontSize: '0.85rem', color: '#374151' }}>Listo</label>
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', minWidth: '100px' }}>
                                                    <div style={{ marginBottom: '2px' }}>producto . contrato</div>
                                                    <div style={{ fontWeight: 'bold', color: '#1f2937', fontSize: '1rem' }}>
                                                        {p.info["Producto"]} <span style={{ margin: '0 5px' }}>—</span> {p.info["Contrato"] || '—'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {puntosFiltrados.length === 0 && (
                                        <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '20px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>No hay órdenes que coincidan con la búsqueda.</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
            <div style={{ marginTop: '15px', fontSize: '0.9rem', color: '#666', textAlign: 'center' }}>
                <p>Las coordenadas se obtienen del archivo Excel pegado en la hoja <strong>Ordenes_Mapa</strong> de Google Sheets.</p>
            </div>
        </div>
    );
};

export default MapaOrdenesPage;
