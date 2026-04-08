import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { guardarCorteLocal } from '../services/storage'; // Assuming verification also serves as a checkpoint
import { enviarAGSheets } from '../services/api';
import PersonalSelect from '../components/PersonalSelect';
import { FormGroup, Input, RadioGroup, ConditionalField, Select, CopyButton } from '../components/FormComponents';

const VerificacionPage = () => {
    const [formData, setFormData] = useState({
        contrato: '',
        supervisor: '',
        obrero: '',
        verificacion: '',
        cortado_opcion: '',
        abastecimiento: '',
        reconectado_opcion: '',
        rotura_medida: '',
        fraude_detalle: '',
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
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const isLlaveCorteNoTiene = formData.llave_corte === 'No tiene';
    
    useEffect(() => {
        if (isLlaveCorteNoTiene && formData.tipo_llave) {
            setFormData(prev => ({ ...prev, tipo_llave: '' }));
        }
    }, [isLlaveCorteNoTiene]);

    const generarResumen = (e) => {
        e.preventDefault();
        
        if (!isLlaveCorteNoTiene && !formData.tipo_llave) {
            alert("Por favor seleccione el Tipo de llave de corte");
            return;
        }

        const { supervisor, obrero } = formData;
        
        let text = `Contrato: ${formData.contrato}, Supervisor: ${supervisor} y Obrero: ${obrero}, al momento de la inspección se procede a dejar el servicio de aapp habilitado. `;
        
        const tipoVerificacion = formData.verificacion;
        let detalleVerificacion = '';

        if (tipoVerificacion === 'se encontró cortado') {
            const cortadoOpcion = formData.cortado_opcion;
            detalleVerificacion = `se encontró cortado (${cortadoOpcion}`;
            
            if (cortadoOpcion === 'Predio habitado, usuario presente' && formData.abastecimiento) {
                detalleVerificacion += `, ${formData.abastecimiento}`;
            }
            detalleVerificacion += ')';

        } else if (tipoVerificacion === 'se encontró reconectado') {
            const reconectadoOpcion = formData.reconectado_opcion;
            detalleVerificacion = `se encontró reconectado (${reconectadoOpcion}`;
            
            if (reconectadoOpcion === 'Corte con rotura' && formData.rotura_medida) {
                detalleVerificacion += ` ${formData.rotura_medida}`;
            }
            detalleVerificacion += ')';

        } else if (tipoVerificacion === 'se encontró posible fraude') {
            detalleVerificacion = `se encontró posible fraude (Derivar inspección para carro`;
            if (formData.fraude_detalle) detalleVerificacion += `, ${formData.fraude_detalle}`;
            detalleVerificacion += ')';
        }

        text += `Se realiza la verificación del servicio donde ${detalleVerificacion}. `;
        
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Note: Verificacion usually doesn't save to Sheets in original JS code? 
    // Wait, original JS `verificacion.js` has `configurarListenersCondicionales` but I don't see `guardarVerificacionEnSheets` in `googleSheets.js`.
    // I see `guardarResidencial`, `guardarComercial`, `guardarReconexion`.
    // Ah, `corte.html` generates summary but doesn't have a save button for ITSELF, specifically. It saves locally.
    // `verificacion.html` generates summary.
    // The user didn't mention saving verification to sheets, but I should check if there is a save button in `verificacion.html`.
    // Looking at file list, `verificacion.html` is 15876 bytes.
    // `verificacion.js` line 152 `mostrarResumen`.
    
    // I will assume for now it just generates summary. If User wants to save, I'll add it later or if I see it in `verificacion.html` (which I didn't fully read).
    // Actually I read `verificacion.js`. It generates summary. It doesn't seem to call `enviarAGSheets`.
    // Wait, `mantenimiento` does call it.
    
    const resetForm = () => {
        setFormData({
            ...formData,
            contrato: '',
            verificacion: '',
            cortado_opcion: '',
            abastecimiento: '',
            reconectado_opcion: '',
            rotura_medida: '',
            fraude_detalle: '',
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
    };

    if (resumen) {
        return (
             <div className="resumen active">
                <div className="success-message">
                    <h2>¡Reporte de Verificación Generado!</h2>
                    <p>El siguiente es el resumen de la tarea realizada:</p>
                </div>
                <div className="resumen-content">{resumen}</div>
                <CopyButton text={resumen} />
                
                <div className="buttons">
                    <Link to="/" className="btn-volver" style={{position: 'static', border: '1px solid #cbd5e1'}}>Volver al Menú</Link>
                    <button style={{backgroundColor: '#0e4f88', color: 'white'}} onClick={resetForm}>Realizar Otra Verificación</button>
                </div>
            </div>
        );
    }

    return (
        <div className="formulario active">
            <header>
                <h1>Formulario de Verificación</h1>
                <p>Complete todos los campos requeridos</p>
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

                    <FormGroup label="Estado de Verificación" required>
                        <RadioGroup 
                            name="verificacion"
                            options={["se encontró cortado", "se encontró reconectado", "se encontró posible fraude"]}
                            value={formData.verificacion}
                            onChange={handleChange}
                        />
                    </FormGroup>
                    
                    <ConditionalField show={formData.verificacion === 'se encontró cortado'}>
                         <FormGroup label="Opciones de Corte:" required>
                            <RadioGroup 
                                name="cortado_opcion"
                                options={["Predio habitado, usuario presente", "Predio deshabitado", "Predio habitado, usuario no atiende"]}
                                value={formData.cortado_opcion}
                                onChange={handleChange}
                            />
                        </FormGroup>
                        <ConditionalField show={formData.cortado_opcion === 'Predio habitado, usuario presente'}>
                             <FormGroup label="Abastecimiento" required>
                                <Input name="abastecimiento" value={formData.abastecimiento} onChange={handleChange} placeholder="Especifique abastecimiento" />
                            </FormGroup>
                        </ConditionalField>
                    </ConditionalField>

                    <ConditionalField show={formData.verificacion === 'se encontró reconectado'}>
                         <FormGroup label="Opciones de Reconexión:" required>
                            <RadioGroup 
                                name="reconectado_opcion"
                                options={["Directo sin medidor", "Directo con medidor", "Bystpass", "Corte con rotura"]}
                                value={formData.reconectado_opcion}
                                onChange={handleChange}
                            />
                        </FormGroup>
                        <ConditionalField show={formData.reconectado_opcion === 'Corte con rotura'}>
                             <FormGroup label="Medida de la rotura" required>
                                <Input name="rotura_medida" value={formData.rotura_medida} onChange={handleChange} placeholder="Especifique medida" />
                            </FormGroup>
                        </ConditionalField>
                    </ConditionalField>

                    <ConditionalField show={formData.verificacion === 'se encontró posible fraude'}>
                         <FormGroup label="Detalle de Fraude" required>
                            <Select 
                                name="fraude_detalle"
                                options={["Manipulación de medidor", "Conexión clandestina", "Bypass enterrado"]}
                                value={formData.fraude_detalle}
                                onChange={handleChange}
                                placeholder="Seleccione detalle de fraude"
                            />
                        </FormGroup>
                    </ConditionalField>

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
                    <button type="submit" className="btn-submit">Generar Reporte de Verificación</button>
                </div>
            </form>
        </div>
    );
};

export default VerificacionPage;
