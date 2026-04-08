import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { enviarAGSheets } from '../services/api';
import { compressImage } from '../utils/imageUtils';
import { 
    FormGroup, 
    Input, 
    Select, 
    ConditionalField, 
    CopyButton 
} from '../components/FormComponents';
import { 
    TIPO_TAREA_OPTIONS, 
    TIPO_ORDEN_OPTIONS, 
    AREA_PERSONAL_OPTIONS, 
    OPERADOR_OPTIONS 
} from '../utils/constants';

const GeneracionOrdenesPage = () => {
    const [formData, setFormData] = useState({
        celular: '',
        tipo_tarea: '',
        numero_orden: '',
        producto: '',
        contrato: '',
        tipo_orden: '',
        area_personal: '',
        area_personal_otro: '',
        persona_solicita: '',
        unidad_trabajo: '',
        operador: '',
        observacion: ''
    });

    const [imagenes, setImagenes] = useState([]); // Array de Base64
    const [resumen, setResumen] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        try {
            const newImages = [];
            for (const file of files) {
                // Comprimir imagen usando la utilidad (0.7 calidad, max 1600px)
                const compressedBase64 = await compressImage(file, 0.7, 1600);
                newImages.push(compressedBase64);
            }
            setImagenes(prev => [...prev, ...newImages]);
        } catch (error) {
            console.error("Error al procesar imagenes:", error);
            alert("Error al procesar las imágenes.");
        }
    };

    const removeImage = (index) => {
        setImagenes(prev => prev.filter((_, i) => i !== index));
    };

    const generarResumen = (e) => {
        e.preventDefault();
        
        // Validación básica de celular (10 dígitos)
        if (formData.celular && formData.celular.length !== 10) {
            alert("Por favor ingrese un número de celular válido de 10 dígitos (ej: 0912345678)");
            return;
        }

        let text = `SOLICITUD DE GENERACIÓN DE ORDEN\n`;
        text += `---------------------------------\n`;
        text += `Celular Contacto: ${formData.celular}\n`;
        text += `Tipo de Tarea: ${formData.tipo_tarea}\n`;
        text += `N° Orden Base: ${formData.numero_orden}\n`;
        text += `Producto: ${formData.producto}\n`;
        text += `Contrato: ${formData.contrato}\n`;
        text += `Tipo de Orden Solicitada: ${formData.tipo_orden}\n`;
        text += `Unidad de Trabajo: ${formData.unidad_trabajo}\n`;
        
        text += `Área de Personal: ${formData.area_personal}`;
        if (formData.area_personal === 'Otros') {
            text += ` (${formData.area_personal_otro})`;
        }
        text += `\n`;
        
        text += `Solicitado por: ${formData.persona_solicita}\n`;
        text += `Operador: ${formData.operador}\n`;
        text += `Observación: ${formData.observacion}\n`;
        
        if (imagenes.length > 0) {
             text += `[CON ${imagenes.length} FOTO(S) ADJUNTA(S)]\n`;
        }

        setResumen(text);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const guardarEnSheets = async () => {
        setIsSaving(true);
        // Ensure "area_personal" includes "Otros" detail if selected
        const dataToSend = { ...formData };
        if (dataToSend.area_personal === 'Otros') {
            dataToSend.area_personal = `Otros: ${dataToSend.area_personal_otro}`;
        }

        // Agregar las imagenes si existen
        if (imagenes.length > 0) {
            dataToSend.imagenes = imagenes;
        }

        const result = await enviarAGSheets('generacion_ordenes', dataToSend);
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
            celular: '',
            tipo_tarea: '',
            numero_orden: '',
            producto: '',
            contrato: '',
            tipo_orden: '',
            area_personal: '',
            area_personal_otro: '',
            persona_solicita: '',
            unidad_trabajo: '',
            operador: '',
            observacion: ''
        });
        setImagenes([]);
        setResumen(null);
        setIsSaved(false);
    };

    if (resumen) {
        return (
             <div className="resumen active">
                <div className="success-message">
                    <h2>¡Solicitud Generada!</h2>
                    <p>Resumen de la orden a generar:</p>
                </div>
                <div className="resumen-content">{resumen}</div>
                
                {imagenes.length > 0 && (
                    <div style={{margin: '20px 0', textAlign: 'center'}}>
                        <p style={{fontWeight: 'bold', marginBottom: '10px'}}>Evidencia ({imagenes.length} fotos):</p>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center'}}>
                            {imagenes.map((img, index) => (
                                <img key={index} src={img} alt={`Evidencia ${index + 1}`} style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #ddd'}} />
                            ))}
                        </div>
                    </div>
                )}

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
                    <button style={{backgroundColor: '#0e4f88', color: 'white'}} onClick={resetForm}>Nueva Solicitud</button>
                </div>
            </div>
        );
    }

    return (
        <div className="formulario active">
            <header>
                <h1>Solicitudes de Actividades Comerciales</h1>
                <p>Formulario de datos para generación de ordenes SOPC</p>
                <Link to="/" className="btn-volver">← Volver al Menú Principal</Link>
            </header>

            <form onSubmit={generarResumen}>
                <div className="form-section">
                    <h2>Datos de Contacto</h2>
                    <FormGroup label="Número de Celular" required>
                        <Input 
                            type="tel" 
                            name="celular" 
                            value={formData.celular} 
                            onChange={handleChange} 
                            required 
                            pattern="[0-9]{10}"
                            title="Ingrese un número de 10 dígitos"
                        />
                    </FormGroup>
                </div>

                <div className="form-section">
                    <h2>Detalle de la Tarea</h2>
                    <FormGroup label="En base a descripción tipo de tarea" required>
                        <Select 
                            name="tipo_tarea"
                            options={TIPO_TAREA_OPTIONS}
                            value={formData.tipo_tarea}
                            onChange={handleChange}
                            placeholder="Seleccione el tipo de tarea"
                            required
                        />
                    </FormGroup>

                    <FormGroup label="Solicitado en base número de orden" required>
                        <Input type="number" name="numero_orden" value={formData.numero_orden} onChange={handleChange} placeholder="Ingrese número de orden" required />
                    </FormGroup>

                    <FormGroup label="Producto">
                         <Input name="producto" value={formData.producto} onChange={handleChange} />
                    </FormGroup>

                    <FormGroup label="Contrato" required>
                        <Input type="number" name="contrato" value={formData.contrato} onChange={handleChange} placeholder="Ingrese número de contrato" required />
                    </FormGroup>

                    <FormGroup label="Tipo de orden que solicita" required>
                        <Select 
                            name="tipo_orden"
                            options={TIPO_ORDEN_OPTIONS}
                            value={formData.tipo_orden}
                            onChange={handleChange}
                            placeholder="Seleccione el tipo de orden"
                            required
                        />
                    </FormGroup>
                </div>

                <div className="form-section">
                    <h2>Personal y Operador</h2>
                    <FormGroup label="Área de Personal" required>
                        <Select 
                            name="area_personal"
                            options={AREA_PERSONAL_OPTIONS}
                            value={formData.area_personal}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>
                    
                    <ConditionalField show={formData.area_personal === 'Otros'}>
                        <FormGroup label="Especifique otra área:" required>
                            <Input name="area_personal_otro" value={formData.area_personal_otro} onChange={handleChange} />
                        </FormGroup>
                    </ConditionalField>

                    <FormGroup label="Persona que solicita" required>
                        <Input name="persona_solicita" value={formData.persona_solicita} onChange={handleChange} required />
                    </FormGroup>

                    <FormGroup label="Unidad de trabajo para la asignacion de orden" required>
                        <Input 
                            type="number" 
                            name="unidad_trabajo" 
                            value={formData.unidad_trabajo} 
                            onChange={handleChange} 
                            placeholder="Ingrese unidad de trabajo" 
                            required 
                        />
                    </FormGroup>

                    <FormGroup label="Operador a solicitar" required>
                        <Select 
                            name="operador"
                            options={OPERADOR_OPTIONS}
                            value={formData.operador}
                            onChange={handleChange}
                            required
                        />
                    </FormGroup>
                </div>

                <div className="form-section">
                    <h2>Observaciones y Evidencia</h2>
                    <FormGroup label="Observación" required>
                        <textarea 
                            name="observacion" 
                            value={formData.observacion} 
                            onChange={handleChange} 
                            rows="3" 
                            required
                        />
                    </FormGroup>

                    <div style={{marginTop: '20px', padding: '20px', backgroundColor: '#f0f9ff', borderRadius: '8px', border: '1px dashed #bae6fd'}}>
                        <label style={{display: 'block', fontWeight: 'bold', marginBottom: '10px', color: '#0369a1'}}>Carga de Evidencia Fotografica</label>
                        
                        <input 
                            type="file" 
                            accept="image/*" 
                            multiple
                            onChange={handleImageChange} 
                            style={{display: 'none'}} 
                            id="file-upload"
                        />

                        {/* Mostrar botón inicial si no hay imágenes */}
                        {imagenes.length === 0 && (
                            <div style={{marginBottom: '15px'}}>
                                <label htmlFor="file-upload" className="btn-guardar" style={{margin: 0, width: 'auto', display: 'inline-block', cursor: 'pointer', textAlign: 'center'}}>
                                    📷 Cargar Fotos
                                </label>
                                <span style={{marginLeft: '10px', fontSize: '0.9em', color: '#666'}}>Sin fotos</span>
                            </div>
                        )}

                        {/* Galería de imágenes + Botón de Agregar (+) */}
                        {imagenes.length > 0 && (
                            <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center'}}>
                                {imagenes.map((img, index) => (
                                    <div key={index} style={{position: 'relative', display: 'inline-block', width: '100px', height: '100px'}}>
                                        <img src={img} alt={`Preview ${index}`} style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '2px solid #0369a1'}} />
                                        <button 
                                            type='button'
                                            onClick={() => removeImage(index)}
                                            style={{
                                                position: 'absolute',
                                                top: '-8px',
                                                right: '-8px',
                                                background: '#ef4444',
                                                color: 'white',
                                                border: '2px solid white',
                                                borderRadius: '50%',
                                                width: '24px',
                                                height: '24px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '12px',
                                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                
                                {/* Botón para agregar más fotos */}
                                <label 
                                    htmlFor="file-upload"
                                    style={{
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                        alignItems: 'center', 
                                        width: '100px', 
                                        height: '100px', 
                                        border: '2px dashed #0369a1', 
                                        borderRadius: '8px', 
                                        cursor: 'pointer', 
                                        backgroundColor: 'white',
                                        transition: 'all 0.2s',
                                        color: '#0369a1'
                                    }}
                                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e0f2fe'; }}
                                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
                                    title="Agregar más fotos"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="12" y1="5" x2="12" y2="19"></line>
                                        <line x1="5" y1="12" x2="19" y2="12"></line>
                                    </svg>
                                </label>
                            </div>
                        )}
                        
                        {imagenes.length > 0 && (
                             <p style={{marginTop: '10px', fontSize: '0.9em', color: '#666'}}>{imagenes.length} foto(s) seleccionada(s)</p>
                        )}
                    </div>
                </div>

                <div className="buttons">
                    <button type="submit" className="btn-submit">Generar Resumen de Orden</button>
                </div>
            </form>
        </div>
    );
};

export default GeneracionOrdenesPage;
