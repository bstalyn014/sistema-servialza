import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { guardarCorteLocal } from '../services/storage';
import { toTitleCase } from '../utils/formatters';
import { ITEMS_COBRO_RECONEXION } from '../utils/constants'; // Uses Reconexion items for the extra option
import PersonalSelect from '../components/PersonalSelect';
import { FormGroup, Input, RadioGroup, ConditionalField, Select, CopyButton } from '../components/FormComponents';
import { enviarAGSheets } from '../services/api';

const CortePage = () => {
    const [formData, setFormData] = useState({
        contrato: '',
        supervisor: '',
        obrero: '',
        corte: '',
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
        observacion: ''
    });

    const [resumen, setResumen] = useState(null);
    const [showReconexionOption, setShowReconexionOption] = useState(false);
    
    // Estados para la sección extra de Reconexión
    const [itemCobroExtra, setItemCobroExtra] = useState('');
    const [resumenReconexionExtra, setResumenReconexionExtra] = useState(null);
    const [isSavingExtra, setIsSavingExtra] = useState(false);
    const [extraSaved, setExtraSaved] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Logic for disabling Tipo Llave
    const isLlaveCorteNoTiene = formData.llave_corte === 'No tiene';
    
    // Clear disabled fields when they become disabled
    useEffect(() => {
        if (isLlaveCorteNoTiene && formData.tipo_llave) {
            setFormData(prev => ({ ...prev, tipo_llave: '' }));
        }
    }, [isLlaveCorteNoTiene]);

    const generarResumen = (e) => {
        e.preventDefault();
        
        // Basic Validation (HTML5 usually handles this but good to double check specific logic)
        // If Llave Corte is NOT "No tiene", Tipo Llave is required.
        if (!isLlaveCorteNoTiene && !formData.tipo_llave) {
            alert("Por favor seleccione el Tipo de llave de corte");
            return;
        }

        // Generate Summary String
        const { supervisor, obrero } = formData;
        
        let text = `Contrato: ${formData.contrato}, Supervisor: ${supervisor} y Obrero: ${obrero}, al momento de la inspección se procede a dejar el servicio de aapp habilitado. Se realiza el corte del servicio ${formData.corte}. Se encontró medidor en ${formData.medidor}`;
        
        text += `, lectura ${formData.lectura} M3, litros ${formData.litros}, Cajetin ${formData.cajetin}`;
        
        if (formData.cajetin === 'Mal estado') {
            text += ` (${formData.cajetin_tipo_dano})`;
        }

        if (formData.llave_corte === 'No tiene') {
            text += `, Llave de corte No tiene`;
        } else {
            text += `, Tipo de llave de corte ${formData.tipo_llave}, Llave de corte ${formData.llave_corte}`;
        }

        text += `, Llave de paso ${formData.llave_paso}`;
        text += `, Predio ${formData.predio}, Color ${formData.color}, Perno ${formData.perno}`;

        if (formData.perno === 'No se instala') {
            text += ` (${formData.perno_razon})`;
        }

        if (formData.observacion) {
            text += `, Observación: ${formData.observacion}`;
        }

        setResumen(text);
        
        // Save to LocalStorage
        guardarCorteLocal(formData.contrato, formData);
        
        // Show Extra Option
        setShowReconexionOption(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const generarReconexionExtra = () => {
         if (!itemCobroExtra) {
            alert("Por favor seleccione un Ítem de Cobro");
            return;
         }

         // Map logic
         let reconexionValor = formData.corte;
         if (formData.corte === "Con ficha") reconexionValor = "Se retira ficha";
         else if (formData.corte === "Con ficha y llave trabada") reconexionValor = "Se retira ficha y se destraba llave";
         else if (formData.corte === "Solo llave trabada") reconexionValor = "Se destraba llave";

         // Map to gerundio
         let accionTexto = reconexionValor;
         if (reconexionValor === "Se retira ficha") accionTexto = "retirando ficha";
         else if (reconexionValor === "Se retira ficha y se destraba llave") accionTexto = "retirando ficha y destrabando llave";
         else if (reconexionValor === "Se destraba llave") accionTexto = "destrabando llave";

         let text = `Contrato: ${formData.contrato}, Supervisor: ${formData.supervisor} y Obrero: ${formData.obrero}, al momento de la inspección se procede a dejar el servicio de aapp habilitado. Se realiza la reconexión del servicio ${accionTexto}. Se encontró el Medidor en ${formData.medidor}`;
         
         // Add rest of fields (reused from corte)
         text += `, Lectura ${formData.lectura} M3, Litros ${formData.litros}, Cajetin ${formData.cajetin}`;
         if (formData.cajetin === 'Mal estado') text += ` (${formData.cajetin_tipo_dano})`;
         
         if (formData.llave_corte === 'No tiene') {
            text += `, Llave de corte No tiene`;
         } else {
            text += `, Tipo de llave de corte ${formData.tipo_llave}, Llave de corte ${formData.llave_corte}`;
         }
         
         text += `, Llave de paso ${formData.llave_paso}, Predio ${formData.predio}, Color ${formData.color}, Perno ${formData.perno}`;
         if (formData.perno === 'No se instala') text += ` (${formData.perno_razon})`;
         
         if (formData.observacion) text += `, Observación: ${formData.observacion}`;

         setResumenReconexionExtra(text);
    };

    const guardarReconexionExtra = async () => {
        setIsSavingExtra(true);
        
        // Map data
        let reconexionValor = formData.corte;
        if (formData.corte === "Con ficha") reconexionValor = "Se retira ficha";
        else if (formData.corte === "Con ficha y llave trabada") reconexionValor = "Se retira ficha y se destraba llave";
        else if (formData.corte === "Solo llave trabada") reconexionValor = "Se destraba llave";

        const datos = {
            ...formData,
            reconexion: reconexionValor,
            item_cobro: itemCobroExtra,
            // overwrite corte-specific fields? no, passing all is fine, API handles what it needs or ignores
        };

        const result = await enviarAGSheets('reconexion', datos);
        setIsSavingExtra(false);
        if (result.success) {
            setExtraSaved(true);
            alert("✅ Datos de Reconexión guardados exitosamente en Google Sheets");
        } else {
            alert("❌ Error al guardar: " + result.error);
        }
    };



    const resetForm = () => {
        setFormData({
            ...formData, // keep supervisor/obrero ? usually yes per session? No, user requested new corte button resets form
            contrato: '',
            corte: '',
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
            observacion: ''
        });
        setResumen(null);
        setShowReconexionOption(false);
        setResumenReconexionExtra(null);
        setExtraSaved(false);
        setItemCobroExtra('');
    };

    // If showing resumen, hide form? In original JS: "Ocultar contenido del formulario (header y form)"
    if (resumen) {
        return (
            <div className="resumen active">
                <div className="success-message">
                    <h2>¡Reporte de Corte Generado!</h2>
                    <p>El siguiente es el resumen de la tarea realizada:</p>
                </div>

                <div className="resumen-content">{resumen}</div>
                <CopyButton text={resumen} />

                {showReconexionOption && (
                    <div className="reconexion-option-container">
                        <h3>Generar Resumen de Reconexión</h3>
                        <p>Si desea generar también el reporte de reconexión con estos datos, seleccione un ítem de cobro:</p>
                        
                        <div style={{maxWidth: '400px', margin: '0 auto 20px'}}>
                             <Select 
                                value={itemCobroExtra}
                                onChange={(e) => setItemCobroExtra(e.target.value)}
                                options={ITEMS_COBRO_RECONEXION.map(i => i.nombre)}
                                placeholder="Seleccione Item de Cobro"
                             />
                        </div>

                        <button className="btn-submit" style={{backgroundColor: '#27ae60', borderColor: '#27ae60'}} onClick={generarReconexionExtra}>
                            Generar Resumen de Reconexión
                        </button>
                    </div>
                )}

                {resumenReconexionExtra && (
                    <div className="resumen-content" style={{marginTop: '20px', backgroundColor: '#e8f6f3', borderLeft: '5px solid #27ae60'}}>
                        <h4>Resumen de Reconexión Adicional</h4>
                        {resumenReconexionExtra}
                        <CopyButton text={resumenReconexionExtra} label="Copiar" style={{marginTop: '10px'}} />
                        
                        <div className="buttons" style={{marginTop: '15px'}}>
                            <button 
                                className={`btn-guardar ${extraSaved ? 'enviado' : ''}`} 
                                onClick={guardarReconexionExtra}
                                disabled={isSavingExtra || extraSaved}
                            >
                                {isSavingExtra ? '⏳ Enviando...' : extraSaved ? '✅ Enviado' : '💾 Guardar en Google Sheets'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="buttons">
                    <Link to="/" className="btn-volver" style={{position: 'static', border: '1px solid #cbd5e1'}}>Volver al Menú</Link>
                    <button style={{backgroundColor: '#0e4f88', color: 'white'}} onClick={resetForm}>Realizar Otro Corte</button>
                </div>
            </div>
        );
    }

    return (
        <div className="formulario active">
            <header>
                <h1>Formulario de Corte del Servicio</h1>
                <p>Complete todos los campos requeridos para generar el reporte de inspección</p>
                <Link to="/" className="btn-volver">← Volver al Menú Principal</Link>
            </header>

            <form onSubmit={generarResumen}>
                <div className="form-section">
                    <h2>Información de la Cuadrilla y Contrato</h2>
                    <FormGroup label="Contrato" required>
                        <Input type="number" name="contrato" value={formData.contrato} onChange={handleChange} placeholder="Ingrese el número de contrato" required />
                    </FormGroup>
                    
                    <PersonalSelect 
                        supervisor={formData.supervisor} 
                        obrero={formData.obrero}
                        onSupervisorChange={(e) => setFormData(prev => ({ ...prev, supervisor: e.target.value }))}
                        onObreroChange={(e) => setFormData(prev => ({ ...prev, obrero: e.target.value }))}
                    />

                    <FormGroup label="Se realiza corte" required>
                        <RadioGroup 
                            name="corte"
                            options={["Con ficha", "Con ficha y llave trabada", "Solo llave trabada"]}
                            value={formData.corte}
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
                    <button type="submit" className="btn-submit">Generar Reporte de Inspección</button>
                </div>
            </form>
        </div>
    );
};

export default CortePage;
