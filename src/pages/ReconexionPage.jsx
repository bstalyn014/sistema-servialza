import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { obtenerCorteLocal, guardarCorteLocal } from '../services/storage';
import { enviarAGSheets } from '../services/api';
import { ITEMS_COBRO_RECONEXION } from '../utils/constants';
import PersonalSelect from '../components/PersonalSelect';
import { FormGroup, Input, RadioGroup, ConditionalField, Select, CopyButton } from '../components/FormComponents';

const ReconexionPage = () => {
    const [formData, setFormData] = useState({
        contrato: '',
        supervisor: '',
        obrero: '',
        reconexion: '', // Action field
        medidor: '',
        lectura: '',
        litros: '',
        cajetin: '',
        cajetin_tipo_dano: '',
        llave_corte: '',
        tipo_llave: '',
        llave_paso: '',
        predio: '',
        color: '',
        perno: '',
        perno_razon: '',
        observacion: '',
        item_cobro: '' 
    });

    const [resumen, setResumen] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    
    // Load Data Logic
    const [corteDataFound, setCorteDataFound] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'contrato') {
            const found = obtenerCorteLocal(value);
            setCorteDataFound(found);
        }
    };

    // Logic for properties
    const isLlaveCorteNoTiene = formData.llave_corte === 'No tiene';
    
    useEffect(() => {
        if (isLlaveCorteNoTiene && formData.tipo_llave) {
            setFormData(prev => ({ ...prev, tipo_llave: '' }));
        }
    }, [isLlaveCorteNoTiene]);

    const cargarDatosCorte = () => {
        if (!corteDataFound) return;
        
        if (!window.confirm('¿Desea cargar los datos del corte realizado anteriormente? Esto reemplazará los valores actuales.')) {
            return;
        }

        const data = corteDataFound;
        
        // Map Logic (Corte -> Reconexion action)
        let reconexionValor = '';
        if (data.corte === "Con ficha") reconexionValor = "se retira ficha";
        else if (data.corte === "Con ficha y llave trabada") reconexionValor = "se retira ficha y se destraba llave";
        else if (data.corte === "Solo llave trabada") reconexionValor = "se destraba llave";
        else if (data.corte) reconexionValor = data.corte; // Fallback

        setFormData(prev => ({
            ...prev,
            supervisor: data.supervisor || prev.supervisor,
            obrero: data.obrero || prev.obrero,
            medidor: data.medidor || prev.medidor,
            lectura: data.lectura || prev.lectura,
            litros: data.litros || prev.litros,
            cajetin: data.cajetin || prev.cajetin,
            cajetin_tipo_dano: data.cajetin_tipo_dano || prev.cajetin_tipo_dano,
            llave_corte: data.llave_corte || prev.llave_corte,
            tipo_llave: data.tipo_llave || prev.tipo_llave,
            llave_paso: data.llave_paso || prev.llave_paso,
            predio: data.predio || prev.predio,
            color: data.color || prev.color,
            perno: (data.perno === 'No se coloca') ? 'No se instala' : (data.perno || prev.perno),
            perno_razon: data.perno_razon || prev.perno_razon,
            observacion: data.observacion || prev.observacion,
            reconexion: reconexionValor || prev.reconexion
        }));
    };

    const generarResumen = (e) => {
        e.preventDefault();
        
        if (!isLlaveCorteNoTiene && !formData.tipo_llave) {
            alert("Por favor seleccione el Tipo de llave de corte");
            return;
        }

        // Generate Summary
        const { supervisor, obrero } = formData;
        
        let text = `Contrato: ${formData.contrato}, Supervisor: ${supervisor} y Obrero: ${obrero}, al momento de la inspección se procede a dejar el servicio de aapp habilitado. `;
        
        const tipoReconexion = formData.reconexion;
        if (tipoReconexion === 'se encontró reconectado') {
            text += `Se encontró el servicio reconectado. `;
        } else {
             // Map to gerundio
             let accionTexto = tipoReconexion;
             if (tipoReconexion === "se retira ficha") accionTexto = "retirando ficha";
             else if (tipoReconexion === "se retira ficha y se destraba llave") accionTexto = "retirando ficha y destrabando llave";
             else if (tipoReconexion === "se destraba llave") accionTexto = "destrabando llave";
             
             text += `Se realiza la reconexión del servicio ${accionTexto}. `;
        }

        text += `Se encontró el Medidor en ${formData.medidor}`;
        text += `, Lectura ${formData.lectura} M3, Litros ${formData.litros}, Cajetin ${formData.cajetin}`;
        
        if (formData.cajetin === 'Mal estado') text += ` (${formData.cajetin_tipo_dano})`;

        if (formData.llave_corte === 'No tiene') {
            text += `, Llave de corte No tiene`;
        } else {
            text += `, Tipo de llave de corte ${formData.tipo_llave}, Llave de corte ${formData.llave_corte}`;
        }

        text += `, Llave de paso ${formData.llave_paso}`;
        text += `, Predio ${formData.predio}, Color ${formData.color}, Perno ${formData.perno}`;

        if (formData.perno === 'No se instala') text += ` (${formData.perno_razon})`;

        if (formData.observacion) text += `, Observación: ${formData.observacion}`;

        setResumen(text);
        // Persistence for next steps (Mantenimiento)
        guardarCorteLocal(formData.contrato, formData); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const guardarEnSheets = async () => {
        setIsSaving(true);
        const result = await enviarAGSheets('reconexion', formData);
        setIsSaving(false);
        if (result.success) {
            setIsSaved(true);
            alert("✅ Datos guardados exitosamente en Google Sheets");
        } else {
            alert("❌ Error al guardar: " + result.error);
        }
    };

    const resetForm = () => {
        setFormData({
            ...formData,
            contrato: '',
            reconexion: '',
            medidor: '',
            lectura: '',
            litros: '',
            cajetin: '',
            cajetin_tipo_dano: '',
            llave_corte: '',
            tipo_llave: '',
            llave_paso: '',
            predio: '',
            color: '',
            perno: '',
            perno_razon: '',
            observacion: '',
            item_cobro: ''
        });
        setResumen(null);
        setIsSaved(false);
        setCorteDataFound(null);
    };

    if (resumen) {
        return (
             <div className="resumen active">
                <div className="success-message">
                    <h2>¡Reporte de Reconexión Generado!</h2>
                    <p>El siguiente es el resumen de la tarea realizada:</p>
                </div>
                <div className="resumen-content">{resumen}</div>
                <CopyButton text={resumen} />
                
                <div className="buttons">
                    <button 
                        className={`btn-guardar ${isSaved ? 'enviado' : ''}`} 
                        onClick={guardarEnSheets}
                        disabled={isSaving || isSaved}
                    >
                        {isSaving ? '⏳ Enviando...' : isSaved ? '✅ Enviado' : '💾 Guardar en Google Sheets'}
                    </button>
                </div>

                <div className="buttons">
                    <Link to="/" className="btn-volver" style={{position: 'static', border: '1px solid #cbd5e1'}}>Volver al Menú</Link>
                    <button style={{backgroundColor: '#0e4f88', color: 'white'}} onClick={resetForm}>Realizar Otra Reconexión</button>
                </div>
            </div>
        );
    }

    return (
        <div className="formulario active">
            <header>
                <h1>Formulario de Reconexión</h1>
                <p>Complete todos los campos requeridos</p>
                <Link to="/" className="btn-volver">← Volver al Menú Principal</Link>
            </header>

            <form onSubmit={generarResumen}>
                <div className="form-section">
                    <h2>Información de la Cuadrilla y Contrato</h2>
                    <div style={{display: 'flex', alignItems: 'flex-end', gap: '10px'}}>
                        <div style={{flexGrow: 1}}>
                            <FormGroup label="Contrato" required>
                                <Input type="number" name="contrato" value={formData.contrato} onChange={handleChange} placeholder="Ingrese el número de contrato" required />
                            </FormGroup>
                        </div>
                        {corteDataFound && (
                            <button 
                                type="button" 
                                className="btn-submit" 
                                onClick={cargarDatosCorte}
                                style={{marginBottom: '25px', padding: '12px 15px', fontSize: '0.9rem'}}
                            >
                                🔄 Cargar datos de Corte
                            </button>
                        )}
                    </div>
                    
                    <PersonalSelect 
                        supervisor={formData.supervisor} 
                        obrero={formData.obrero}
                        onSupervisorChange={(e) => setFormData(prev => ({ ...prev, supervisor: e.target.value }))}
                        onObreroChange={(e) => setFormData(prev => ({ ...prev, obrero: e.target.value }))}
                    />
                </div>
                
                 <div className="form-section">
                    <h2>Item de Cobro & Acción</h2>


                    <FormGroup label="Acción de Reconexión" required>
                        <RadioGroup 
                            name="reconexion"
                            options={["se retira ficha", "se retira ficha y se destraba llave", "se destraba llave", "se encontró reconectado"]}
                            value={formData.reconexion}
                            onChange={handleChange}
                        />
                    </FormGroup>
                </div>

                <div className="form-section">
                    <h2>Estado del Servicio y Medidor</h2>
                    <FormGroup label="Medidor" required>
                        <RadioGroup 
                            name="medidor"
                            options={["Buen estado", "Mal estado"]}
                            value={formData.medidor}
                            onChange={handleChange}
                        />
                    </FormGroup>

                    <FormGroup label="Lectura (M3)" required>
                        <Input type="number" name="lectura" value={formData.lectura} onChange={handleChange} placeholder="Ingrese la lectura" required />
                    </FormGroup>

                    <FormGroup label="Litros" required>
                        <Input type="number" name="litros" value={formData.litros} onChange={handleChange} placeholder="Ingrese los litros" required />
                    </FormGroup>
                </div>

                <div className="form-section">
                    <h2>Estado de Componentes</h2>
                    <FormGroup label="Cajetin" required>
                        <RadioGroup 
                            name="cajetin" 
                            options={["Buen estado", "Mal estado"]}
                            value={formData.cajetin}
                            onChange={handleChange}
                        />
                    </FormGroup>
                    
                    <ConditionalField show={formData.cajetin === 'Mal estado'}>
                         <FormGroup label="Seleccione el tipo de daño:" required>
                            <RadioGroup 
                                name="cajetin_tipo_dano"
                                options={["tapa dañada sin visor", "cajetin roto", "sin tapa"]}
                                value={formData.cajetin_tipo_dano}
                                onChange={handleChange}
                            />
                        </FormGroup>
                    </ConditionalField>

                    <FormGroup label="Llave de corte" required>
                        <RadioGroup 
                            name="llave_corte"
                            options={["Buen estado", "Mal estado", "No tiene"]}
                            value={formData.llave_corte}
                            onChange={handleChange}
                        />
                    </FormGroup>

                    <ConditionalField show={!isLlaveCorteNoTiene}>
                        <FormGroup label="Tipo de llave de corte" required>
                            <RadioGroup 
                                name="tipo_llave"
                                options={["PVC", "PEAD"]}
                                value={formData.tipo_llave}
                                onChange={handleChange}
                            />
                        </FormGroup>
                    </ConditionalField>

                    <FormGroup label="Llave de paso" required>
                        <RadioGroup 
                            name="llave_paso"
                            options={["Buen estado", "Mal estado", "No tiene"]}
                            value={formData.llave_paso}
                            onChange={handleChange}
                        />
                    </FormGroup>
                </div>

                <div className="form-section">
                    <h2>Detalles Finales</h2>
                    <FormGroup label="Predio" required>
                        <RadioGroup 
                            name="predio"
                            options={["1 planta", "2 planta", "3 planta", "4 planta", "Departamento"]}
                            value={formData.predio}
                            onChange={handleChange}
                         />
                    </FormGroup>

                    <FormGroup label="Color" required>
                        <Input name="color" value={formData.color} onChange={handleChange} placeholder="Ingrese el color" required />
                    </FormGroup>

                    <FormGroup label="Perno" required>
                        <RadioGroup 
                            name="perno"
                            options={["Se instala", "Se ajusta", "No se instala"]}
                            value={formData.perno}
                            onChange={handleChange}
                        />
                    </FormGroup>

                    <ConditionalField show={formData.perno === 'No se instala'}>
                        <FormGroup label="Seleccione la razón:" required>
                            <RadioGroup 
                                name="perno_razon"
                                options={["no hay en stock", "tapa dañada", "No se puede ajustar perno", "orificio en mal estado"]}
                                value={formData.perno_razon}
                                onChange={handleChange}
                            />
                        </FormGroup>
                    </ConditionalField>
                </div>

                <div className="form-section">
                    <h2>Item de Cobro</h2>
                    <FormGroup label="Item de Cobro" required>
                         <Select 
                            name="item_cobro"
                            options={ITEMS_COBRO_RECONEXION.map(i => i.nombre)} 
                            placeholder="Seleccione un ítem de cobro"
                            value={formData.item_cobro}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>
                </div>

                <div className="form-section">
                    <h2>Observación Final</h2>
                     <textarea 
                        name="observacion" 
                        value={formData.observacion} 
                        onChange={handleChange} 
                        rows="3" 
                        placeholder="Escriba cualquier observación adicional" 
                     />
                </div>

                <div className="buttons">
                    <button type="submit" className="btn-submit">Generar Reporte de Reconexión</button>
                </div>
            </form>
        </div>
    );
};

export default ReconexionPage;
