import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { enviarAGSheets } from '../services/api';
import { FormGroup, Input, RadioGroup, ConditionalField, Select, CopyButton } from '../components/FormComponents';

const ComercialPage = () => {
    const [formData, setFormData] = useState({
        contrato: '',
        servicio: '',
        estado_medidor: '',
        estado_medidor_otro: '',
        numero_modificacion: '',
        lectura_m3: '',
        lectura_litros: '',
        descripcion: '',
        actividad: '',
        empleados: '',
        abastecimiento: '',
        abastecimiento_otro: '',
        horarios_especificos: '',
        horario: '',
        tipo_consumo: '',
        caudal_ingreso: '',
        caudal_cantidad: '',
        prueba_consumo: '',
        prueba_razon: '',
        motivo_no_permite: '',
        otra_razon: '',
        fugas_detectadas: '',
        puntos_agua_no: '',
        puntos_agua_si: '',
        ubicacion_fuga_detalle: '',
        persona_atendio: '',
        observacion: ''
    });

    const [resumen, setResumen] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const esUsuarioAusente = formData.prueba_consumo === 'No' && formData.prueba_razon === 'usuario ausente';

    const generarResumen = (e) => {
        e.preventDefault();
        
        let text = `ANÁLISIS DE CONSUMO COMERCIAL-INDUSTRIAL: Para el contrato ${formData.contrato}, con servicio ${formData.servicio}. `;
        
        // Estado Medidor
        text += `Estado del Medidor: ${formData.estado_medidor}`;
        if (formData.estado_medidor === 'Otro') text += ` (${formData.estado_medidor_otro})`;
        text += `. `;
        
        if (formData.estado_medidor !== 'Buen estado' && formData.numero_modificacion) {
            text += `Se realiza cadena de custodio, número de sello, se modifica número ${formData.numero_modificacion} por revisión de medida, se instala medidor. `;
        }
        
        // Lecturas
        text += `Lectura (m³): ${formData.lectura_m3}. `;
        if (formData.lectura_litros) text += `Lectura (litros): ${formData.lectura_litros}. `;
        
        // Datos específicos Comercial
        text += `Descripción local/industria: ${formData.descripcion}. Actividad: ${formData.actividad}. Empleados: ${formData.empleados}. `;
        
        text += `Horarios específicos: ${formData.horarios_especificos}`;
        if (formData.horarios_especificos === 'Sí') text += ` (${formData.horario})`;
        text += `. `;

        text += `Tipo consumo: ${formData.tipo_consumo}. `;
        
        // Abastecimiento
        text += `Abastecimiento: ${formData.abastecimiento}`;
        if (formData.abastecimiento === 'Otro') text += ` (${formData.abastecimiento_otro})`;
        text += `. `;
        
        // Fugas y Pruebas
        text += `Registra caudal de ingreso: ${formData.caudal_ingreso}`;
        if (formData.caudal_ingreso === 'Sí') text += ` (${formData.caudal_cantidad} L/min)`;
        text += `. `;
        
        text += `Prueba de consumo: ${formData.prueba_consumo}`;
        if (formData.prueba_consumo === 'No') {
            text += ` - Razón: ${formData.prueba_razon}`;
            if (formData.prueba_razon === 'usuario no permite el ingreso') text += ` (${formData.motivo_no_permite})`;
            if (formData.prueba_razon === 'otra') text += ` (${formData.otra_razon})`;
        }
        text += `. `;
        
        // Fugas
        text += `Detección de fugas: ${formData.fugas_detectadas}`;
        if (formData.fugas_detectadas === 'No se detecto') text += ` (Se revisaron ${formData.puntos_agua_no} puntos)`;
        if (formData.fugas_detectadas === 'Se detectó fuga visible') text += ` (Se revisaron ${formData.puntos_agua_si} puntos, ubicación: ${formData.ubicacion_fuga_detalle})`;
        text += `. `;
        
        text += `Atendido por: ${formData.persona_atendio}. `;
        
        if (formData.observacion) text += `Observación: ${formData.observacion}. `;
        
        text += `Mantenimiento: Se realiza mantenimiento liviano al medidor.`;

        setResumen(text);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const guardarEnSheets = async () => {
        setIsSaving(true);
        const result = await enviarAGSheets('comercial', formData);
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
            contrato: '', servicio: '', estado_medidor: '', estado_medidor_otro: '', numero_modificacion: '',
            lectura_m3: '', lectura_litros: '', descripcion: '', actividad: '', empleados: '', abastecimiento: '',
            abastecimiento_otro: '', horarios_especificos: '', horario: '', tipo_consumo: '', 
            caudal_ingreso: '', caudal_cantidad: '', prueba_consumo: '', prueba_razon: '', 
            motivo_no_permite: '', otra_razon: '', fugas_detectadas: '', puntos_agua_no: '', 
            puntos_agua_si: '', ubicacion_fuga_detalle: '', persona_atendio: '', observacion: ''
        });
        setResumen(null);
        setIsSaved(false);
    };

    if (resumen) {
        return (
             <div className="resumen active">
                <div className="success-message">
                    <h2>¡Análisis Comercial Generado!</h2>
                    <p>El siguiente es el resumen del análisis realizado:</p>
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
                    <Link to="/analisis" className="btn-volver" style={{position: 'static', border: '1px solid #cbd5e1'}}>Volver al Menú Análisis</Link>
                    <button style={{backgroundColor: '#0e4f88', color: 'white'}} onClick={resetForm}>Realizar Otro Análisis</button>
                </div>
            </div>
        );
    }

    return (
        <div className="formulario active">
            <header>
                <h1>Formulario Comercial - Industrial</h1>
                <p>Complete todos los campos requeridos para el análisis de consumo</p>
                <Link to="/analisis" className="btn-volver">← Volver al Menú Análisis</Link>
            </header>

            <form onSubmit={generarResumen}>
                <div className="form-section">
                    <h2>Datos Básicos</h2>
                    <FormGroup label="Contrato" required>
                        <Input type="number" name="contrato" value={formData.contrato} onChange={handleChange} placeholder="Ingrese el número de contrato" required />
                    </FormGroup>
                    
                    <FormGroup label="Servicio" required>
                        <Select 
                            name="servicio"
                            options={["Activo", "Suspendido"]}
                            value={formData.servicio}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>

                    <FormGroup label="Estado del medidor" required>
                        <RadioGroup 
                            name="estado_medidor"
                            options={["Buen estado", "Mal estado", "Visor Derio", "Paralizado", "Otro"]}
                            value={formData.estado_medidor}
                            onChange={handleChange}
                        />
                    </FormGroup>

                    <ConditionalField show={formData.estado_medidor === 'Otro'}>
                        <FormGroup label="Especifique estado:" required>
                            <Input name="estado_medidor_otro" value={formData.estado_medidor_otro} onChange={handleChange} />
                        </FormGroup>
                    </ConditionalField>

                    <ConditionalField show={formData.estado_medidor && formData.estado_medidor !== 'Buen estado'}>
                        <div style={{backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', borderLeft: '3px solid #f39c12', marginTop: '10px'}}>
                            <label style={{marginBottom: '10px', display: 'block'}}>Se realiza cadena de custodio, número de sello, se modifica número</label>
                            <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                                <Input 
                                    type="number" 
                                    name="numero_modificacion" 
                                    value={formData.numero_modificacion} 
                                    onChange={handleChange} 
                                    placeholder="00" 
                                    style={{width: '100px'}} 
                                />
                                <span>por revisión de medida, se instala medidor</span>
                            </div>
                        </div>
                    </ConditionalField>

                    <FormGroup label="Lectura (m³)" required>
                        <Input type="number" name="lectura_m3" value={formData.lectura_m3} onChange={handleChange} required />
                    </FormGroup>

                    <FormGroup label="Lectura (litros)">
                        <Input type="number" name="lectura_litros" value={formData.lectura_litros} onChange={handleChange} />
                    </FormGroup>

                    <FormGroup label="Descripción del local/industria" required>
                        <Input name="descripcion" value={formData.descripcion} onChange={handleChange} required />
                    </FormGroup>

                    <FormGroup label="¿Qué actividad llevan a cabo?" required>
                        <Input name="actividad" value={formData.actividad} onChange={handleChange} required />
                    </FormGroup>

                    <FormGroup label="¿Cuántos empleados/personas trabajan diariamente?" required>
                        <Input type="number" name="empleados" value={formData.empleados} onChange={handleChange} required />
                    </FormGroup>
                </div>

                <div className="form-section">
                    <h2>Información Operativa</h2>
                    <FormGroup label="Tipo de abastecimiento" required>
                        <Select 
                            name="abastecimiento"
                            options={["Directo", "Cisterna", "Tanque elevado", "Otro"]}
                            value={formData.abastecimiento}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>
                    <ConditionalField show={formData.abastecimiento === 'Otro'}>
                        <FormGroup label="Especifique:" required>
                            <Input name="abastecimiento_otro" value={formData.abastecimiento_otro} onChange={handleChange} />
                        </FormGroup>
                    </ConditionalField>

                    <FormGroup label="¿Tienen horarios específicos de operación?" required>
                        <RadioGroup 
                            name="horarios_especificos"
                            options={["Sí", "No"]}
                            value={formData.horarios_especificos}
                            onChange={handleChange}
                        />
                    </FormGroup>
                    <ConditionalField show={formData.horarios_especificos === 'Sí'}>
                        <FormGroup label="Indique el horario:" required>
                            <Input name="horario" value={formData.horario} onChange={handleChange} />
                        </FormGroup>
                    </ConditionalField>

                    <FormGroup label="¿Cómo es el consumo?" required>
                        <RadioGroup 
                            name="tipo_consumo"
                            options={["Constante todos los días", "Varía según producción/actividad"]}
                            value={formData.tipo_consumo}
                            onChange={handleChange}
                        />
                    </FormGroup>
                </div>

                <div className="form-section" style={{opacity: esUsuarioAusente ? 0.5 : 1, pointerEvents: esUsuarioAusente ? 'none' : 'auto'}}>
                    <h2>Detección de Fugas</h2>
                    
                    <FormGroup label="¿Registra caudal de ingreso?" required>
                        <RadioGroup 
                            name="caudal_ingreso"
                            options={["Sí", "No"]}
                            value={formData.caudal_ingreso}
                            onChange={handleChange}
                        />
                    </FormGroup>
                    <ConditionalField show={formData.caudal_ingreso === 'Sí'}>
                        <FormGroup label="Cuantificar registro (L/min)">
                            <Input type="number" name="caudal_cantidad" value={formData.caudal_cantidad} onChange={handleChange} />
                        </FormGroup>
                    </ConditionalField>

                    <div style={{pointerEvents: 'auto', opacity: 1}}>
                        <FormGroup label="Usuario permite realizar prueba de consumo" required>
                            <RadioGroup 
                                name="prueba_consumo"
                                options={["Sí", "No"]}
                                value={formData.prueba_consumo}
                                onChange={handleChange}
                            />
                        </FormGroup>
                    </div>

                    <ConditionalField show={formData.prueba_consumo === 'No'}>
                        <div style={{pointerEvents: 'auto', opacity: 1}}>
                            <FormGroup label="Especifique la razón:" required>
                                <RadioGroup 
                                    name="prueba_razon"
                                    options={["usuario ausente", "usuario no permite el ingreso", "otra"]}
                                    value={formData.prueba_razon}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </div>
                        <ConditionalField show={formData.prueba_razon === 'usuario no permite el ingreso'}>
                             <FormGroup label="Motivo:">
                                <Input name="motivo_no_permite" value={formData.motivo_no_permite} onChange={handleChange} />
                            </FormGroup>
                        </ConditionalField>
                        <ConditionalField show={formData.prueba_razon === 'otra'}>
                             <FormGroup label="Especifique:">
                                <Input name="otra_razon" value={formData.otra_razon} onChange={handleChange} />
                            </FormGroup>
                        </ConditionalField>
                    </ConditionalField>

                    <FormGroup label="¿Ha detectado problemas de fugas?" required>
                        <RadioGroup 
                            name="fugas_detectadas"
                            options={["No se detecto", "Se detectó fuga visible", "Se detectó fuga no visible"]}
                            value={formData.fugas_detectadas}
                            onChange={handleChange}
                        />
                    </FormGroup>

                    <ConditionalField show={formData.fugas_detectadas === 'No se detecto'}>
                         <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <span>Se revisaron</span>
                            <Input type="number" name="puntos_agua_no" value={formData.puntos_agua_no} onChange={handleChange} style={{width: '80px'}} />
                            <span>puntos de agua y se identificó que no existe fuga</span>
                         </div>
                    </ConditionalField>

                    <ConditionalField show={formData.fugas_detectadas === 'Se detectó fuga visible'}>
                         <div style={{display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap'}}>
                            <span>Se revisaron</span>
                            <Input type="number" name="puntos_agua_si" value={formData.puntos_agua_si} onChange={handleChange} style={{width: '80px'}} />
                            <span>puntos de agua y se identificó fuga en:</span>
                            <Input name="ubicacion_fuga_detalle" value={formData.ubicacion_fuga_detalle} onChange={handleChange} placeholder="Ubicación" />
                         </div>
                    </ConditionalField>
                    
                    {(formData.fugas_detectadas === 'Se detectó fuga no visible' || 
                      (formData.prueba_consumo === 'No' && formData.fugas_detectadas === 'Se detectó fuga no visible')) && (
                        <div className="info-message">
                            <strong>Recomendación:</strong> Se recomienda al usuario el servicio de detección y reparación de fugas
                        </div>
                    )}

                    <FormGroup label="Nombre de la persona que atendió" required>
                        <Input name="persona_atendio" value={formData.persona_atendio} onChange={handleChange} required />
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

                <div className="form-section">
                    <h2>Mantenimiento</h2>
                    <div style={{backgroundColor: '#e8f4fd', color: '#0e4f88', padding: '12px 15px', borderLeft: '4px solid #3498db', borderRadius: '5px'}}>
                        <strong>Se realiza mantenimiento liviano al medidor</strong>
                    </div>
                </div>

                <div className="buttons">
                    <button type="submit" className="btn-submit">Generar Análisis</button>
                </div>
            </form>
        </div>
    );
};

export default ComercialPage;
