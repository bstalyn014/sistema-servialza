import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { obtenerRendimiento } from '../services/api';
import { RefreshCw, AlertCircle } from 'lucide-react';

const RendimientoPage = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        const result = await obtenerRendimiento();
        
        if (result.success) {
            setData(result.data);
        } else {
            setError(result.error?.message || result.error || "Error desconocido");
        }
        setLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    const maxVal = data.length > 0 ? Math.max(...data.map(d => d.total)) : 1;

    return (
        <div className="formulario active">
            <header>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <h1>Rendimiento Diario</h1>
                    <button 
                        onClick={loadData} 
                        className="refresh-btn"
                        style={{
                            background: 'var(--tech-violet)',
                            color: 'white',
                            border: 'none',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(139, 92, 246, 0.3)'
                        }}
                    >
                        <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
                    </button>
                </div>
                <p>Producción estimada del día (Reconexiones)</p>
                <Link to="/" className="btn-volver">← Volver al Menú Principal</Link>
            </header>

            <div className="chart-container" style={{marginTop: '30px'}}>
                {loading ? (
                    <div style={{textAlign: 'center', padding: '40px', color: 'var(--text-sec)'}}>
                        <RefreshCw className="animate-spin" style={{margin: '0 auto 10px'}} size={30} />
                        <p>Cargando datos del servidor...</p>
                    </div>
                ) : error ? (
                    <div className="empty-state" style={{borderColor: 'var(--tech-red)', background: '#fef2f2', padding: '30px', borderRadius: '8px', border: '1px dashed', textAlign: 'center'}}>
                         <AlertCircle color="var(--tech-red)" size={40} style={{marginBottom: '10px'}} />
                         <h3 style={{color: 'var(--tech-red)'}}>Error de conexión</h3>
                         <p>No se pudieron cargar los datos.</p>
                         <p style={{fontSize: '0.8rem', color: '#991b1b'}}>{error.toString()}</p>
                         <button onClick={loadData} style={{marginTop: '15px', padding: '8px 16px', background: 'white', border: '1px solid var(--tech-red)', borderRadius: '4px', cursor: 'pointer'}}>Reintentar</button>
                    </div>
                ) : data.length === 0 ? (
                    <div className="empty-state" style={{padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1'}}>
                        <h3>Sin registros hoy</h3>
                        <p>Aún no se han cargado formularios de reconexión este día.</p>
                    </div>
                ) : (
                    <div className="bars-list">
                        {data.map((item, index) => (
                            <motion.div 
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="cuadrilla-bar"
                                style={{
                                    marginBottom: '20px',
                                    background: 'white',
                                    padding: '15px',
                                    borderRadius: '4px',
                                    border: '1px solid #f1f5f9',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                }}
                            >
                                <div className="bar-header" style={{display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: '600'}}>
                                    <span className="cuadrilla-name" style={{color: 'var(--text-primary)'}}>{item.cuadrilla}</span>
                                    <span className="cuadrilla-total" style={{color: 'var(--tech-blue)', fontFamily: 'Orbitron'}}>${item.total.toFixed(2)}</span>
                                </div>
                                <div className="progress-bg" style={{height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden'}}>
                                    <motion.div 
                                        className="progress-fill" 
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(item.total / maxVal) * 100}%` }}
                                        transition={{ duration: 1, ease: "easeOut" }}
                                        style={{
                                            height: '100%',
                                            background: 'linear-gradient(90deg, var(--tech-cyan), var(--tech-blue))',
                                            borderRadius: '6px'
                                        }}
                                    />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <div className="info-message" style={{marginTop: '30px'}}>
                <strong>Nota:</strong> Estos valores son calculados según los ítems de cobro registrados hoy.
            </div>

            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default RendimientoPage;
