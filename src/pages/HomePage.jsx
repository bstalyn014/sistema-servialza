import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

const MenuCard = ({ to, emoji, title, description }) => (
  <Link to={to} className="menu-card-link">
     <div className="menu-card">
        <div className="menu-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
            {emoji}
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
     </div>
  </Link>
);

const HomePage = () => {
    return (
        <motion.div 
            className="menu-section active"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <header>
                <h1>Sistema de Gestión Técnica</h1>
                <p>Seleccione el tipo de tarea a realizar</p>
            </header>
            
            <div className="menu-options">
                <MenuCard 
                    to="/corte"
                    emoji="🚱"
                    title="Corte del Servicio"
                    description="Realizar corte de servicio técnico"
                />
                
                <MenuCard 
                    to="/reconexion"
                    emoji="🚰"
                    title="Reconexión del Servicio"
                    description="Restablecer servicio previamente cortado"
                />
                
                <MenuCard 
                    to="/verificacion"
                    emoji="🔍"
                    title="Verificación de Corte"
                    description="Verificar estado de servicio cortado"
                />

                <MenuCard 
                    to="/mantenimiento"
                    emoji="🔧"
                    title="Mantenimiento"
                    description="Cambio de medidor y correcciones"
                />
                
                <MenuCard 
                    to="/analisis"
                    emoji="📊"
                    title="Sistema de Análisis"
                    description="Análisis de consumo residencial y comercial"
                />

                <MenuCard 
                    to="/generacion-ordenes"
                    emoji="📋"
                    title="Generación de Ordenes"
                    description="Solicitud de actividades comerciales SOPC"
                />

                <MenuCard 
                    to="/rendimiento"
                    emoji="📈"
                    title="Rendimiento Diario"
                    description="Ver producción acumulada de cuadrillas"
                />

                <MenuCard 
                    to="/calculo-pre"
                    emoji="🧮"
                    title="Calculo PRE"
                    description="Cálculo de prueba de exactitud del medidor"
                />
            </div>

            <div className="menu-options" style={{ marginTop: '20px' }}>
                <MenuCard 
                    to="/mapa-ordenes"
                    emoji="🗺️"
                    title="Mapa de Órdenes"
                    description="Visualizar ubicaciones de órdenes en mapa"
                />
            </div>
        </motion.div>
    );
};

export default HomePage;
