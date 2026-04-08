import React, { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PersonalSelect from '../components/PersonalSelect';
import { CopyButton, FormGroup, Input, RadioGroup, Select } from '../components/FormComponents';

function parseNullableNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const raw = String(value).trim();
  if (!raw) return null;
  const normalized = raw.replace(',', '.');
  const num = Number(normalized);
  return Number.isFinite(num) ? num : null;
}

function timeStringToSeconds(timeStr) {
  if (!timeStr) return null;
  const parts = timeStr.split(':');
  let seconds = 0;
  if (parts.length === 3) {
    seconds = parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
  } else if (parts.length === 2) {
    seconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  } else if (parts.length === 1) {
    seconds = parseInt(parts[0], 10);
  }
  return isNaN(seconds) ? null : seconds;
}

function formatNumber(value, decimals = 2) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  const rounded = Number(value.toFixed(decimals));
  // Evita "-0.00"
  const safe = Object.is(rounded, -0) ? 0 : rounded;
  return safe.toFixed(decimals);
}

function formatSignedPercent(value, decimals = 2) {
  const s = formatNumber(value, decimals);
  if (!s) return '';
  return (value > 0 ? '+' : '') + s;
}

function calcularResultados({ lip, lfp, liu, lfu, tiempo, errorPiloto }) {
  const LIP = parseNullableNumber(lip);
  const LFP = parseNullableNumber(lfp);
  const LIU = parseNullableNumber(liu);
  const LFU = parseNullableNumber(lfu);
  const T = timeStringToSeconds(tiempo);
  const EP = parseNullableNumber(errorPiloto);

  const volumenPiloto = LIP !== null && LFP !== null ? (LFP - LIP) : null;
  const volumenUsuario = LIU !== null && LFU !== null ? (LFU - LIU) : null;

  const caudal =
    volumenPiloto !== null && T !== null && T > 0
      ? (volumenPiloto / T) * 3600
      : null;

  const errorRelativo =
    volumenPiloto !== null &&
    volumenUsuario !== null &&
    volumenPiloto !== 0
      ? ((volumenUsuario - volumenPiloto) / volumenPiloto) * 100
      : null;

  const volumenCorregidoPiloto =
    volumenPiloto !== null && EP !== null
      ? ((100 - EP) * volumenPiloto) / 100
      : null;

  const errorUsuario =
    volumenUsuario !== null &&
    volumenCorregidoPiloto !== null &&
    volumenCorregidoPiloto !== 0
      ? ((volumenUsuario / volumenCorregidoPiloto) - 1) * 100
      : null;

  const cumpleNorma =
    errorUsuario !== null ? (errorUsuario >= -4 && errorUsuario <= 4) : null;

  return {
    inputs: { LIP, LFP, LIU, LFU, T, EP },
    volumenPiloto,
    volumenUsuario,
    caudal,
    errorRelativo,
    volumenCorregidoPiloto,
    errorUsuario,
    cumpleNorma,
  };
}

const CalculoPREPage = () => {
  const [inputs, setInputs] = useState({
    lip: '',
    lfp: '',
    liu: '',
    lfu: '',
    tiempo: '',
    errorPiloto: '',
  });

  const [calculo, setCalculo] = useState(null);
  const [mostrarGeneradorComentario, setMostrarGeneradorComentario] = useState(false);
  const [comentario, setComentario] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [caudalTemp, setCaudalTemp] = useState(null);
  const commentOutputRef = useRef(null);
  const modalRef = useRef(null);
  const justClosedModal = useRef(false);

  const [consumoInputs, setConsumoInputs] = useState({
    fechaActual: '',
    lecturaActual: '',
    fechaAnterior: '',
    lecturaAnterior: '',
  });
  const [calculoConsumo, setCalculoConsumo] = useState(null);

  const [comentarioData, setComentarioData] = useState({
    contrato: '',
    orden: '',
    medidor: '',
    lecturaM3: '',
    predioTipo: 'RESIDENCIAL',
    predioPlantas: '',
    color: '',
    material: '',
    cliente: 'USUARIO AUSENTE',
    horaLlegada: '',
    horaSalida: '',
    hallazgo: 'NO_ANOMALIA',
    hallazgoDetalle: '',
    medidorPosicion: 'CORRECTA POSICIÓN',
    cajetinAccion: 'MANTENIMIENTO_SIN_FUGA',
    fugaDetalle: '',
    llaveCorte: '',
    requiereOrden: 'NO',
    caudalIngreso: '',
    pernoCajetin: '',
    guiaEstado: '',
    observacionFinal: '',
    supervisor: '',
    obrero: '',
  });

  const resultadosDerivados = useMemo(() => {
    if (!calculo) return null;
    return calcularResultados(calculo);
  }, [calculo]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const formatTiempoInput = (val) => {
    // Solo permitir números y formatar a HH:MM:SS
    let v = val.replace(/\D/g, '');
    if (v.length > 6) v = v.substring(0, 6);
    
    if (v.length > 4) {
      v = v.replace(/(\d{2})(\d{2})(\d+)/, '$1:$2:$3');
    } else if (v.length > 2) {
      v = v.replace(/(\d{2})(\d+)/, '$1:$2');
    }
    
    return v;
  };

  const formatHoraInput = (val) => {
    // Solo permitir números y formatar a HH:MM
    let v = val.replace(/\D/g, '');
    if (v.length > 4) v = v.substring(0, 4);
    
    if (v.length > 2) {
      v = v.replace(/(\d{2})(\d+)/, '$1:$2');
    }
    return v;
  };

  const handleTiempoChange = (e) => {
    const formattedVal = formatTiempoInput(e.target.value);
    setInputs((prev) => ({ ...prev, tiempo: formattedVal }));
  };

  const handleErrorPilotoFocus = () => {
    // Si ya tiene valor, no mostramos
    if (inputs.errorPiloto) return;
    
    // Si acabamos de cerrar el modal, no lo volvemos a mostrar para permitir que el usuario escriba
    if (justClosedModal.current) {
      justClosedModal.current = false;
      return; 
    }

    const LIP = parseNullableNumber(inputs.lip);
    const LFP = parseNullableNumber(inputs.lfp);
    const T = timeStringToSeconds(inputs.tiempo);

    if (LIP !== null && LFP !== null && T !== null && T > 0) {
      const volumenPiloto = LFP - LIP;
      const caudal = (volumenPiloto / T) * 3600;
      setCaudalTemp(caudal);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    justClosedModal.current = true;
    setShowModal(false);
  };

  const onCalcular = (e) => {
    e.preventDefault();
    setCalculo({ ...inputs });
    setMostrarGeneradorComentario(false);
    setComentario('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const onLimpiar = () => {
    setInputs({
      lip: '',
      lfp: '',
      liu: '',
      lfu: '',
      tiempo: '',
      errorPiloto: '',
    });
    setCalculo(null);
    setCalculoConsumo(null);
    setConsumoInputs({
      fechaActual: '',
      lecturaActual: '',
      fechaAnterior: '',
      lecturaAnterior: '',
    });
    setMostrarGeneradorComentario(false);
    setComentario('');
    justClosedModal.current = false;
  };

  const handleConsumoChange = (e) => {
    const { name, value } = e.target;
    setConsumoInputs((prev) => ({ ...prev, [name]: value }));
  };

  const onCalcularConsumo = (e) => {
    e.preventDefault();
    const { fechaActual, lecturaActual, fechaAnterior, lecturaAnterior } = consumoInputs;

    if (!fechaActual || !fechaAnterior || lecturaActual === '' || lecturaAnterior === '') {
      setCalculoConsumo(null);
      return;
    }

    const fActual = new Date(fechaActual);
    const fAnterior = new Date(fechaAnterior);
    
    // Usar UTC ms directo para evitar corrupcion logica en zonas horarias de dias enteros
    const utc1 = Date.UTC(fActual.getFullYear(), fActual.getMonth(), fActual.getDate());
    const utc2 = Date.UTC(fAnterior.getFullYear(), fAnterior.getMonth(), fAnterior.getDate());

    const lActual = Number(lecturaActual.toString().replace(',', '.'));
    const lAnterior = Number(lecturaAnterior.toString().replace(',', '.'));

    const msDiff = utc1 - utc2;
    const diasTranscurridos = Math.round(msDiff / (1000 * 3600 * 24));
    const consumoTotal = lActual - lAnterior;

    let consumoProyectado = 0;
    if (diasTranscurridos > 0) {
      consumoProyectado = (consumoTotal / diasTranscurridos) * 30;
    }

    setCalculoConsumo({
      diasTranscurridos,
      consumoTotal,
      consumoProyectado
    });
  };

  const generarComentario = () => {
    if (!resultadosDerivados) return;

    const { errorUsuario, cumpleNorma } = resultadosDerivados;

    const {
      contrato,
      orden,
      medidor,
      lecturaM3,
      predioTipo,
      predioPlantas,
      color,
      material,
      cliente,
      horaLlegada,
      horaSalida,
      hallazgo,
      hallazgoDetalle,
      medidorPosicion,
      cajetinAccion,
      fugaDetalle,
      llaveCorte,
      requiereOrden,
      caudalIngreso,
      pernoCajetin,
      guiaEstado,
      observacionFinal,
      supervisor,
      obrero,
    } = comentarioData;

    const lines = [];
    if (contrato) lines.push(`Contrato: ${contrato}`);
    if (orden) lines.push(`Orden: ${orden}`);
    if (medidor) lines.push(`Medidor: ${medidor}`);
    lines.push('');

    if (hallazgo === 'NO_ANOMALIA') {
      lines.push('NO SE ENCONTRÓ NINGUNA ANOMALÍA');
    } else if (hallazgo === 'ANOMALIA' && hallazgoDetalle) {
      lines.push(hallazgoDetalle);
    }

    if (predioTipo) lines.push('');
    if (predioTipo) lines.push(`PREDIO: ${predioTipo}`);
    lines.push('');

    const partes = [];
    partes.push('AL MOMENTO DE LA INSPECCIÓN');
    partes.push(`SE ENCONTRÓ MEDIDOR EN ${medidorPosicion}`);
    if (lecturaM3) partes.push(`CON LECTURA ${lecturaM3} M3`);

    const LIU = parseNullableNumber(calculo?.liu);
    const LFU = parseNullableNumber(calculo?.lfu);
    if (LIU !== null) partes.push(`LITRO DE INICIO ${formatNumber(LIU, 2)}`);
    if (LFU !== null) partes.push(`LITRO FINAL ${formatNumber(LFU, 2)}`);

    if (predioPlantas) partes.push(`PREDIO DE ${predioPlantas}`);
    if (color) partes.push(`COLOR ${color}`);
    if (material) partes.push(material);

    if (cajetinAccion === 'MANTENIMIENTO_SIN_FUGA') {
      partes.push('SE REALIZO MANTENIMIENTO AL CAJETÍN DEJANDO CAJETÍN LIMPIO Y SIN FUGA');
    } else if (cajetinAccion === 'CON_FUGA') {
      partes.push(`SE DETECTÓ FUGA${fugaDetalle ? ` (${fugaDetalle})` : ''}`);
    } else if (cajetinAccion === 'SIN_INTERVENCION') {
      partes.push('NO SE REALIZÓ INTERVENCIÓN AL CAJETÍN');
    }

    const margen = errorUsuario !== null ? `${formatSignedPercent(errorUsuario, 2)} %` : '';
    if (margen) {
      partes.push(
        `SE REALIZO PRUEBA DE EXACTITUD AL MEDIDOR Y MEDIDOR ${
          cumpleNorma ? 'SI CUMPLE' : 'NO CUMPLE'
        } CON LAS NORMA DE SU CLASE CON UN MARGEN DE ERROR DE ${margen}`
      );
    } else {
      partes.push('SE REALIZO PRUEBA DE EXACTITUD AL MEDIDOR');
    }

    if (llaveCorte) partes.push(`SE ENCONTRÓ LLAVE DE CORTE ${llaveCorte}`);
    if (requiereOrden === 'SI') partes.push('SE SOLICITA GENERAR ORDEN DE MANTENIMIENTO');
    if (caudalIngreso === 'NO_REGISTRA') partes.push('MEDIDOR NO REGISTRA CAUDAL DE INGRESO');
    if (pernoCajetin === 'SI') partes.push('SE ENCONTRÓ PERNO EN EL CAJETÍN');
    if (guiaEstado) partes.push(`GUIA ${guiaEstado}`);
    if (observacionFinal) partes.push(observacionFinal);

    lines.push(partes.join(' ').replace(/\s+/g, ' ').trim());
    lines.push('');
    if (obrero) lines.push(`AYUDANTE: ${obrero}`);
    if (supervisor) lines.push(`SUP: ${supervisor}`);
    if (!obrero || !supervisor) {
      // Mantener el bloque final ordenado aunque falten campos
      if (!obrero) lines.push('AYUDANTE:');
      if (!supervisor) lines.push('SUP:');
    }
    lines.push('');
    if (cliente) lines.push(`CLIENTE: ${cliente}`);
    lines.push('');
    if (calculoConsumo) {
      lines.push(`CONSUMO DEL MES: ${formatNumber(calculoConsumo.consumoTotal, 1)} M3`);
      lines.push(`PROYECTADO DEL MES: ${calculoConsumo.consumoProyectado} M3`);
    } else {
      lines.push(`CONSUMO DEL MES: 0 M3`);
      lines.push(`PROYECTADO DEL MES: 0 M3`);
    }
    if (horaLlegada) lines.push(`HORA DE LLEGADA: ${horaLlegada}`);
    if (horaSalida) lines.push(`HORA DE SALIDA: ${horaSalida}`);

    setComentario(lines.join('\n'));
    setTimeout(() => {
      commentOutputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const r = resultadosDerivados;
  const puedeGenerarComentario = Boolean(r);

  return (
    <>
      <div className="formulario active">
        <div style={{ marginBottom: '8px' }}>
          <Link to="/" className="btn-volver" style={{ position: 'static' }}>
            ← Volver al Menú Principal
          </Link>
        </div>

        <form onSubmit={onCalcular}>
          <div className="form-section pre-wrapper">
            <div className="pre-bar">Calculo Prueba de Exactitud</div>
            <div className="pre-title">CALCULO PRE</div>

          {/* Entradas */}
          <FormGroup className="pre-row">
            <Input
              type="number"
              step="any"
              name="lip"
              placeholder="Lectura Inicial Piloto"
              value={inputs.lip}
              onChange={handleInputChange}
            />
          </FormGroup>

          <FormGroup className="pre-row">
            <Input
              type="number"
              step="any"
              name="lfp"
              placeholder="Lectura Final Piloto"
              value={inputs.lfp}
              onChange={handleInputChange}
            />
          </FormGroup>

          <FormGroup className="pre-row">
            <Input
              type="number"
              step="any"
              name="liu"
              placeholder="Lectura Inicial Usuario"
              value={inputs.liu}
              onChange={handleInputChange}
            />
          </FormGroup>

          <FormGroup className="pre-row">
            <Input
              type="number"
              step="any"
              name="lfu"
              placeholder="Lectura Final Usuario"
              value={inputs.lfu}
              onChange={handleInputChange}
            />
          </FormGroup>

          <FormGroup className="pre-row" label="Tiempo de Ensayo (HH:MM:SS)">
            <Input
              type="text"
              inputMode="numeric"
              pattern="[0-9:]*"
              name="tiempo"
              value={inputs.tiempo}
              onChange={handleTiempoChange}
              placeholder="00:00:00"
              maxLength="8"
            />
          </FormGroup>

          {/* Resultados intermedios */}
          <FormGroup className="pre-row">
            <Input
              type="number"
              step="any"
              name="errorPiloto"
              placeholder="Error Medidor Piloto"
              value={inputs.errorPiloto}
              onChange={handleInputChange}
              onFocus={handleErrorPilotoFocus}
            />
          </FormGroup>

          <div className="pre-buttons">
            <button type="submit" className="btn-calc-large">CALCULAR</button>
            <div className="pre-buttons-row">
              <Link to="/" className="btn-menu" style={{ textDecoration: 'none' }}>MENU</Link>
              <button
                type="button"
                className="btn-limpiar"
                onClick={onLimpiar}
              >
                LIMPIAR
              </button>
            </div>
          </div>

          {calculo && (
            <div style={{ marginTop: '24px' }}>
              <div className="resumen-pre-line">
                VOLUMEN PILOTO: <span>{formatNumber(r?.volumenPiloto, 2)}</span>
              </div>
              <div className="resumen-pre-line">
                VOLUMEN USUARIO: <span>{formatNumber(r?.volumenUsuario, 2)}</span>
              </div>
              <div className="resumen-pre-line">
                CAUDAL: <span>{formatNumber(r?.caudal, 2)} litros por segundo</span>
              </div>
              <div className="resumen-pre-line">
                ERROR RELATIVO: <span>{formatSignedPercent(r?.errorRelativo, 2)}</span>
              </div>
              <div className="resumen-pre-line">
                VOLUMEN CORREGIDO PILOTO: <span>{formatNumber(r?.volumenCorregidoPiloto, 2)}</span>
              </div>
              <div className="resumen-pre-line">
                ERROR MEDIDOR DE USUARIO: <span>{formatSignedPercent(r?.errorUsuario, 2)}</span>
              </div>
              <div
                className={`norma-pill ${
                  r?.cumpleNorma === null || r?.cumpleNorma === undefined
                    ? ''
                    : r?.cumpleNorma
                    ? 'pass'
                    : 'fail'
                }`}
                style={{ marginTop: '8px' }}
              >
                {r?.cumpleNorma === null || r?.cumpleNorma === undefined
                  ? ''
                  : r?.cumpleNorma
                  ? 'SI CUMPLE'
                  : 'NO CUMPLE'}
              </div>
            </div>
          )}

          
        </div>
      </form>

      {/* NUEVA SECCIÓN DE CÁLCULO DE CONSUMO PROYECTADO */}
      <div className="form-section pre-wrapper" style={{ marginTop: '24px' }}>
        <div className="pre-title" style={{ fontSize: '1rem', color: '#0084c8', marginBottom: '16px' }}>CALCULO DE CONSUMO PROYECTADO</div>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <svg style={{ width: '80px', height: '80px', color: '#025880' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
        </div>

        <form onSubmit={onCalcularConsumo}>
          <FormGroup className="pre-row" label="Fecha Actual (YY/MM/DD):">
            <Input
              type="date"
              name="fechaActual"
              value={consumoInputs.fechaActual}
              onChange={handleConsumoChange}
            />
          </FormGroup>

          <FormGroup className="pre-row" label="Lectura Actual (m³):">
            <Input
              type="number"
              step="any"
              name="lecturaActual"
              value={consumoInputs.lecturaActual}
              onChange={handleConsumoChange}
            />
          </FormGroup>

          <FormGroup className="pre-row" label="Fecha Anterior (YY/MM/DD):">
            <Input
              type="date"
              name="fechaAnterior"
              value={consumoInputs.fechaAnterior}
              onChange={handleConsumoChange}
            />
          </FormGroup>

          <FormGroup className="pre-row" label="Lectura Anterior (m³):">
            <Input
              type="number"
              step="any"
              name="lecturaAnterior"
              value={consumoInputs.lecturaAnterior}
              onChange={handleConsumoChange}
            />
          </FormGroup>

          <div style={{ marginTop: '24px' }}>
            <button type="submit" className="btn-calc-large">CALCULAR</button>
          </div>
        </form>

        {calculoConsumo && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>Días Transcurridos:</div>
            <div style={{ fontSize: '1rem', color: '#0000ff', fontWeight: 'bold', marginBottom: '12px' }}>{calculoConsumo.diasTranscurridos}</div>

            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>Consumo Total (m³):</div>
            <div style={{ fontSize: '1rem', color: '#0000ff', fontWeight: 'bold', marginBottom: '12px' }}>{calculoConsumo.consumoTotal.toFixed(1)}</div>

            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '4px' }}>Consumo Proyectado (m³):</div>
            <div style={{ fontSize: '1rem', color: '#0000ff', fontWeight: 'bold' }}>{calculoConsumo.consumoProyectado}</div>
          </div>
        )}
      </div>

      {puedeGenerarComentario && (
        <div className="form-section">
          <h2>Comentario</h2>

          {!mostrarGeneradorComentario ? (
            <button
              type="button"
              className="btn-submit"
              onClick={() => setMostrarGeneradorComentario(true)}
              style={{ background: 'var(--c-mustard)' }}
            >
              Desplegar generador de comentario
            </button>
          ) : (
            <>
              <div className="form-section" style={{ padding: '18px', marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '10px' }}>Datos básicos</h3>

                <FormGroup label="Contrato">
                  <Input type="number" name="contrato" value={comentarioData.contrato} onChange={(e) => setComentarioData((p) => ({ ...p, contrato: e.target.value }))} />
                </FormGroup>

                <FormGroup label="Orden">
                  <Input type="number" name="orden" value={comentarioData.orden} onChange={(e) => setComentarioData((p) => ({ ...p, orden: e.target.value }))} />
                </FormGroup>

                <FormGroup label="Medidor">
                  <Input name="medidor" value={comentarioData.medidor} onChange={(e) => setComentarioData((p) => ({ ...p, medidor: e.target.value }))} />
                </FormGroup>

                <FormGroup label="Lectura (M3)">
                  <Input
                    type="number"
                    step="any"
                    name="lecturaM3"
                    value={comentarioData.lecturaM3}
                    onChange={(e) => setComentarioData((p) => ({ ...p, lecturaM3: e.target.value }))}
                  />
                </FormGroup>

                <FormGroup label="Tipo de predio">
                  <Select
                    value={comentarioData.predioTipo}
                    onChange={(e) => setComentarioData((p) => ({ ...p, predioTipo: e.target.value }))}
                    options={['RESIDENCIAL', 'COMERCIAL', 'OTRO']}
                  />
                </FormGroup>

                <FormGroup label="Predio (plantas)">
                  <Select
                    value={comentarioData.predioPlantas}
                    onChange={(e) => setComentarioData((p) => ({ ...p, predioPlantas: e.target.value }))}
                    options={['1 PLANTA', '2 PLANTA', '3 PLANTA', '4 PLANTA', 'DEPARTAMENTO']}
                    placeholder="Seleccione una opción"
                  />
                </FormGroup>

                <FormGroup label="Color">
                  <Input name="color" value={comentarioData.color} onChange={(e) => setComentarioData((p) => ({ ...p, color: e.target.value }))} />
                </FormGroup>

                <FormGroup label="Material (opcional)">
                  <Input
                    name="material"
                    value={comentarioData.material}
                    onChange={(e) => setComentarioData((p) => ({ ...p, material: e.target.value }))}
                  />
                </FormGroup>

                <FormGroup label="Cliente">
                  <RadioGroup
                    name="cliente"
                    options={['USUARIO AUSENTE', 'USUARIO PRESENTE']}
                    value={comentarioData.cliente}
                    onChange={(e) => setComentarioData((p) => ({ ...p, cliente: e.target.value }))}
                  />
                </FormGroup>
              </div>

              <div className="form-section" style={{ padding: '18px', marginBottom: '16px' }}>
                <h3 style={{ marginBottom: '10px' }}>Opciones (marcar según aplique)</h3>

                <FormGroup label="Hallazgo">
                  <RadioGroup
                    name="hallazgo"
                    options={['NO SE ENCONTRÓ NINGUNA ANOMALÍA', 'SE ENCONTRÓ ANOMALÍA']}
                    value={comentarioData.hallazgo === 'NO_ANOMALIA' ? 'NO SE ENCONTRÓ NINGUNA ANOMALÍA' : 'SE ENCONTRÓ ANOMALÍA'}
                    onChange={(e) =>
                      setComentarioData((p) => ({
                        ...p,
                        hallazgo: e.target.value === 'SE ENCONTRÓ ANOMALÍA' ? 'ANOMALIA' : 'NO_ANOMALIA',
                      }))
                    }
                  />
                </FormGroup>

                {comentarioData.hallazgo === 'ANOMALIA' && (
                  <FormGroup label="Detalle de anomalía (texto libre)">
                    <textarea
                      value={comentarioData.hallazgoDetalle}
                      onChange={(e) => setComentarioData((p) => ({ ...p, hallazgoDetalle: e.target.value }))}
                      rows="2"
                    />
                  </FormGroup>
                )}

                <FormGroup label="Posición del medidor">
                  <RadioGroup
                    name="medidorPosicion"
                    options={['CORRECTA POSICIÓN', 'INCORRECTA POSICIÓN']}
                    value={comentarioData.medidorPosicion}
                    onChange={(e) => setComentarioData((p) => ({ ...p, medidorPosicion: e.target.value }))}
                  />
                </FormGroup>

                <FormGroup label="Cajetín / Fuga">
                  <RadioGroup
                    name="cajetinAccion"
                    options={['MANTENIMIENTO Y SIN FUGA', 'CON FUGA', 'SIN INTERVENCIÓN']}
                    value={
                      comentarioData.cajetinAccion === 'MANTENIMIENTO_SIN_FUGA'
                        ? 'MANTENIMIENTO Y SIN FUGA'
                        : comentarioData.cajetinAccion === 'CON_FUGA'
                          ? 'CON FUGA'
                          : 'SIN INTERVENCIÓN'
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      setComentarioData((p) => ({
                        ...p,
                        cajetinAccion:
                          v === 'CON FUGA'
                            ? 'CON_FUGA'
                            : v === 'SIN INTERVENCIÓN'
                              ? 'SIN_INTERVENCION'
                              : 'MANTENIMIENTO_SIN_FUGA',
                      }));
                    }}
                  />
                </FormGroup>

                {comentarioData.cajetinAccion === 'CON_FUGA' && (
                  <FormGroup label="Detalle de fuga (opcional)">
                    <Input
                      value={comentarioData.fugaDetalle}
                      onChange={(e) => setComentarioData((p) => ({ ...p, fugaDetalle: e.target.value }))}
                    />
                  </FormGroup>
                )}

                <FormGroup label="Llave de corte">
                  <RadioGroup
                    name="llaveCorte"
                    options={['BUEN ESTADO', 'MAL ESTADO', 'NO TIENE', 'NO EVALUADO']}
                    value={comentarioData.llaveCorte || 'NO EVALUADO'}
                    onChange={(e) => setComentarioData((p) => ({ ...p, llaveCorte: e.target.value === 'NO EVALUADO' ? '' : e.target.value }))}
                  />
                </FormGroup>

                <FormGroup label="¿Solicitar orden de mantenimiento?">
                  <RadioGroup
                    name="requiereOrden"
                    options={['NO', 'SI']}
                    value={comentarioData.requiereOrden}
                    onChange={(e) => setComentarioData((p) => ({ ...p, requiereOrden: e.target.value }))}
                  />
                </FormGroup>

                <FormGroup label="Caudal de ingreso">
                  <RadioGroup
                    name="caudalIngreso"
                    options={['REGISTRA', 'NO REGISTRA', 'NO EVALUADO']}
                    value={
                      comentarioData.caudalIngreso === 'NO_REGISTRA'
                        ? 'NO REGISTRA'
                        : comentarioData.caudalIngreso === 'REGISTRA'
                          ? 'REGISTRA'
                          : 'NO EVALUADO'
                    }
                    onChange={(e) => {
                      const v = e.target.value;
                      setComentarioData((p) => ({
                        ...p,
                        caudalIngreso: v === 'NO REGISTRA' ? 'NO_REGISTRA' : v === 'REGISTRA' ? 'REGISTRA' : '',
                      }));
                    }}
                  />
                </FormGroup>

                <FormGroup label="¿Perno en cajetín?">
                  <RadioGroup
                    name="pernoCajetin"
                    options={['SI', 'NO', 'NO EVALUADO']}
                    value={comentarioData.pernoCajetin || 'NO EVALUADO'}
                    onChange={(e) => setComentarioData((p) => ({ ...p, pernoCajetin: e.target.value === 'NO EVALUADO' ? '' : e.target.value }))}
                  />
                </FormGroup>

                <FormGroup label="Guía">
                  <RadioGroup
                    name="guiaEstado"
                    options={['EN BUEN ESTADO', 'EN MAL ESTADO', 'NO APLICA']}
                    value={comentarioData.guiaEstado || 'NO APLICA'}
                    onChange={(e) => setComentarioData((p) => ({ ...p, guiaEstado: e.target.value === 'NO APLICA' ? '' : e.target.value }))}
                  />
                </FormGroup>

                <FormGroup label="Observación final (opcional)">
                  <textarea
                    value={comentarioData.observacionFinal}
                    onChange={(e) => setComentarioData((p) => ({ ...p, observacionFinal: e.target.value }))}
                    rows="2"
                  />
                </FormGroup>
              </div>

              <div className="form-section" style={{ padding: '18px' }}>
                <h3 style={{ marginBottom: '10px' }}>Cuadrilla y tiempos</h3>

                <PersonalSelect
                  supervisor={comentarioData.supervisor}
                  obrero={comentarioData.obrero}
                  onSupervisorChange={(e) => setComentarioData((p) => ({ ...p, supervisor: e.target.value }))}
                  onObreroChange={(e) => setComentarioData((p) => ({ ...p, obrero: e.target.value }))}
                />



                <FormGroup label="Hora de llegada (HH:MM)">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9:]*"
                    maxLength="5"
                    value={comentarioData.horaLlegada}
                    onChange={(e) => setComentarioData((p) => ({ ...p, horaLlegada: formatHoraInput(e.target.value) }))}
                    placeholder="00:00"
                  />
                </FormGroup>

                <FormGroup label="Hora de salida (HH:MM)">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9:]*"
                    maxLength="5"
                    value={comentarioData.horaSalida}
                    onChange={(e) => setComentarioData((p) => ({ ...p, horaSalida: formatHoraInput(e.target.value) }))}
                    placeholder="00:00"
                  />
                </FormGroup>

                <div className="buttons">
                  <button type="button" className="btn-submit" onClick={generarComentario}>
                    Generar comentario
                  </button>
                </div>
              </div>

              {comentario && (
                <div ref={commentOutputRef} className="resumen" style={{ marginTop: '16px' }}>
                  <div className="success-message">
                    <h2>Comentario generado</h2>
                    <p>Revísalo y copia el texto</p>
                  </div>
                  <div className="resumen-content">{comentario}</div>
                  <CopyButton text={comentario} label="Copiar comentario" />
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
    
    {showModal && (
        <div className="modal-overlay">
          <div className="modal-content" ref={modalRef}>
            <h2 className="modal-title">Caudal Calculado</h2>
            <p className="modal-text">El caudal calculado es: <strong>{formatNumber(caudalTemp, 2)}</strong> litros por segundo</p>
            <div className="modal-actions">
              <button 
                type="button" 
                className="btn-modal-accept"
                onClick={closeModal}
              >
                ACEPTAR
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: #fff;
          padding: 24px;
          border-radius: 8px;
          width: 90%;
          max-width: 400px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .modal-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 12px;
          border-bottom: none;
          padding-bottom: 0;
        }

        .modal-text {
          font-size: 1rem;
          color: #4b5563;
          margin-bottom: 24px;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
        }

        .btn-modal-accept {
          background-color: transparent;
          color: #ec4899;
          border: none;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          padding: 8px 16px;
        }

        .btn-modal-accept:hover {
          background-color: #fdf2f8;
          border-radius: 4px;
        }
      `}</style>
    </>
  );
};

export default CalculoPREPage;

