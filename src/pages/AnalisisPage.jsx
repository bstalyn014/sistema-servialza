import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Building2 } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
  }
};

const MenuCard = ({ to, icon: Icon, title, description }) => (
  <Link to={to} className="menu-card-link">
     <div className="menu-card">
        <div className="menu-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon size={40} color="#0ea5e9" />
        </div>
        <h3>{title}</h3>
        <p>{description}</p>
     </div>
  </Link>
);

const AnalisisPage = () => {
    return (
        <motion.div 
            className="menu-section active"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <header>
                <h1>Sistema de Análisis de Consumo</h1>
                <p>Seleccione el tipo de formulario que desea completar</p>
                <Link to="/" className="btn-volver">← Volver al Menú Principal</Link>
            </header>
            
            <div className="menu-options" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
                <MenuCard 
                    to="/residencial"
                    icon={Home}
                    title="Residenciales"
                    description="Formulario para análisis de consumo en viviendas"
                />
                
                <MenuCard 
                    to="/comercial"
                    icon={Building2}
                    title="Comerciales - Industriales"
                    description="Formulario para análisis de consumo en negocios e industrias"
                />
            </div>
        </motion.div>
    );
};

export default AnalisisPage;
