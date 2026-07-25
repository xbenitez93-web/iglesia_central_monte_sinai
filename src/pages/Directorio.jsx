import React, { useState, useEffect } from 'react';
import { db } from '../firebase'; 
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

function Directorio() {
  const [miembros, setMiembros] = useState([]);
  const [usuariosApp, setUsuariosApp] = useState([]);
  const [cargandoDB, setCargandoDB] = useState(true);

  const [listaMinisteriosCat, setListaMinisteriosCat] = useState([
    'Alabanza', 'Ujieres', 'Escuela Dominical', 'Multimedia', 'Teatro', 'Grupo de crecimiento'
  ]);

  const [listaNivelesCat, setListaNivelesCat] = useState([
    'Asistente', 'Miembro Activo', 'Bautizado', 'Servidor', 'Pastores'
  ]);

  const [grupos, setGrupos] = useState([
    {
      id: 1,
      nombre: 'Célula Esperanza',
      lider: 'Carlos Gómez',
      ubicacion: 'Col. Las Acacias, Casa #12',
      dia: 'Miércoles 7:00 PM',
      asistencias: []
    }
  ]);

  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('Todos');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarAdminCatalogos, setMostrarAdminCatalogos] = useState(false);
  
  const [mostrarSeccionCelulas, setMostrarSeccionCelulas] = useState(false);
  const [nuevoNombreGrupo, setNuevoNombreGrupo] = useState('');
  const [nuevoLiderGrupo, setNuevoLiderGrupo] = useState('');
  const [nuevaUbicacionGrupo, setNuevaUbicacionGrupo] = useState('');
  const [nuevoDiaGrupo, setNuevoDiaGrupo] = useState('');
  
  const [grupoSeleccionadoReporte, setGrupoSeleccionadoReporte] = useState(null);
  const [fechaReunion, setFechaReunion] = useState('');
  const [cantidadAsistentes, setCantidadAsistentes] = useState('');
  const [notaReunion, setNotaReunion] = useState('');

  const [nuevoMinCat, setNuevoMinCat] = useState('');
  const [nuevoNivelCat, setNuevoNivelCat] = useState('');

  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 6;

  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [nuevaNota, setNuevaNota] = useState('');

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevaFechaNacimiento, setNuevaFechaNacimiento] = useState('');
  const [nuevaFechaConversion, setNuevaFechaConversion] = useState('');
  const [nuevaDireccion, setNuevaDireccion] = useState('');

  const [nivelesSeleccionados, setNivelesSeleccionados] = useState({});
  const [ministeriosSeleccionados, setMinisteriosSeleccionados] = useState({});

  const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    backgroundColor: '#ffffff',
    color: '#2d3748',
    boxSizing: 'border-box'
  };

  // ==========================================
  // SINCRONIZACIÓN CON FIREBASE (FIRESTORE)
  // ==========================================
  useEffect(() => {
    const obtenerDatosDeFirebase = async () => {
      try {
        // Cargar colección "miembros"
        const queryMiembros = await getDocs(collection(db, "miembros"));
        const listaMiembros = queryMiembros.docs.map(docu => ({ id: docu.id, ...docu.data() }));
        setMiembros(listaMiembros);

        setCargandoDB(false);
      } catch (error) {
        console.error("Error al cargar datos de Firebase:", error);
        setCargandoDB(false);
      }
    };

    obtenerDatosDeFirebase();
  }, []);

  const inicializarSelecciones = (nivelesActuales = [], minActuales = []) => {
    const objNiv = {};
    listaNivelesCat.forEach(n => { objNiv[n] = nivelesActuales.includes(n); });
    setNivelesSeleccionados(objNiv);

    const objMin = {};
    listaMinisteriosCat.forEach(m => { objMin[m] = minActuales.includes(m); });
    setMinisteriosSeleccionados(objMin);
  };

  const handleCheckboxNivel = (nivel) => {
    setNivelesSeleccionados({ ...nivelesSeleccionados, [nivel]: !nivelesSeleccionados[nivel] });
  };

  const handleCheckboxMinisterio = (min) => {
    setMinisteriosSeleccionados({ ...ministeriosSeleccionados, [min]: !ministeriosSeleccionados[min] });
  };

  const limpiarFormulario = () => {
    setNuevoNombre('');
    setNuevoTelefono('');
    setNuevoEmail('');
    setNuevaFechaNacimiento('');
    setNuevaFechaConversion('');
    setNuevaDireccion('');
    setEditandoId(null);
    setMostrarFormulario(false);
  };

  const guardarMiembro = async (e) => {
    e.preventDefault();
    if (nuevoNombre.trim() === '') return;

    const listaNiveles = Object.keys(nivelesSeleccionados).filter((k) => nivelesSeleccionados[k]);
    const listaMinisterios = Object.keys(ministeriosSeleccionados).filter((k) => ministeriosSeleccionados[k]);

    const datosMiembro = {
      nombre: nuevoNombre.trim(),
      niveles: listaNiveles.length > 0 ? listaNiveles : ['Asistente'],
      ministerios: listaMinisterios.length > 0 ? listaMinisterios : ['Ninguno'],
      telefono: nuevoTelefono.trim() || 'Sin teléfono',
      email: nuevoEmail.trim() || 'Sin correo',
      nacimiento: nuevaFechaNacimiento || 'No registrada',
      conversion: nuevaFechaConversion || 'No registrada',
      direccion: nuevaDireccion.trim() || 'No especificada',
      notasPastorales: editandoId !== null ? (miembros.find(m => m.id === editandoId)?.notasPastorales || []) : []
    };

    try {
      if (editandoId !== null) {
        const docRef = doc(db, "miembros", editandoId);
        await updateDoc(docRef, datosMiembro);
        setMiembros(miembros.map((m) => m.id === editandoId ? { ...m, ...datosMiembro } : m));
      } else {
        const docRef = await addDoc(collection(db, "miembros"), {
          ...datosMiembro,
          createdAt: serverTimestamp()
        });
        const nuevoRegistro = { id: docRef.id, ...datosMiembro };
        setMiembros([nuevoRegistro, ...miembros]);
      }

      limpiarFormulario();
    } catch (error) {
      console.error("Error al guardar en la colección miembros:", error);
      alert("Hubo un error al guardar el miembro en la base de datos.");
    }
  };

  const prepararEdicion = (m, e) => {
    e.stopPropagation();
    setEditandoId(m.id);
    setNuevoNombre(m.nombre || '');
    setNuevoTelefono(m.telefono === 'Sin teléfono' ? '' : m.telefono);
    setNuevoEmail(m.email === 'Sin correo' ? '' : m.email);
    setNuevaFechaNacimiento(m.nacimiento === 'No registrada' ? '' : m.nacimiento);
    setNuevaFechaConversion(m.conversion === 'No registrada' ? '' : m.conversion);
    setNuevaDireccion(m.direccion === 'No especificada' ? '' : m.direccion);

    inicializarSelecciones(m.niveles || [], m.ministerios || []);
    setMostrarFormulario(true);
  };

  const abrirNuevoMiembro = () => {
    limpiarFormulario();
    inicializarSelecciones([], []);
    setMostrarFormulario(true);
  };

  const eliminarMiembro = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de eliminar esta ficha de vida de la colección miembros?')) {
      try {
        await deleteDoc(doc(db, "miembros", id));
        setMiembros(miembros.filter(m => m.id !== id));
        if (miembroSeleccionado?.id === id) setMiembroSeleccionado(null);
      } catch (error) {
        console.error("Error al eliminar en Firebase:", error);
        alert("No se pudo eliminar el registro de la base de datos.");
      }
    }
  };

  const agregarNotaPastoral = async (e) => {
    e.preventDefault();
    if (!nuevaNota.trim() || !miembroSeleccionado) return;

    const notasActualizadas = [nuevaNota.trim(), ...(miembroSeleccionado.notasPastorales || [])];
    
    try {
      await updateDoc(doc(db, "miembros", miembroSeleccionado.id), { notasPastorales: notasActualizadas });
      const miembrosActualizados = miembros.map(m => m.id === miembroSeleccionado.id ? { ...m, notasPastorales: notasActualizadas } : m);
      
      setMiembros(miembrosActualizados);
      setMiembroSeleccionado({ ...miembroSeleccionado, notasPastorales: notasActualizadas });
      setNuevaNota('');
    } catch (error) {
      console.error("Error al guardar nota pastoral:", error);
    }
  };

  const agregarMinisterioCat = () => {
    if (nuevoMinCat.trim() && !listaMinisteriosCat.includes(nuevoMinCat.trim())) {
      setListaMinisteriosCat([...listaMinisteriosCat, nuevoMinCat.trim()]);
      setNuevoMinCat('');
    }
  };

  const eliminarMinisterioCat = (min) => {
    if (window.confirm(`¿Eliminar el ministerio "${min}" del catálogo?`)) {
      setListaMinisteriosCat(listaMinisteriosCat.filter(m => m !== min));
    }
  };

  const agregarNivelCat = () => {
    if (nuevoNivelCat.trim() && !listaNivelesCat.includes(nuevoNivelCat.trim())) {
      setListaNivelesCat([...listaNivelesCat, nuevoNivelCat.trim()]);
      setNuevoNivelCat('');
    }
  };

  const eliminarNivelCat = (niv) => {
    if (window.confirm(`¿Eliminar el nivel "${niv}" del catálogo?`)) {
      setListaNivelesCat(listaNivelesCat.filter(n => n !== niv));
    }
  };

  const crearGrupoCrecimiento = (e) => {
    e.preventDefault();
    if (!nuevoNombreGrupo.trim()) return;
    const nuevoGrupo = {
      id: Date.now(),
      nombre: nuevoNombreGrupo.trim(),
      lider: nuevoLiderGrupo.trim() || 'Por asignar',
      ubicacion: nuevaUbicacionGrupo.trim() || 'No especificada',
      dia: nuevoDiaGrupo.trim() || 'Por definir',
      asistencias: []
    };
    setGrupos([...grupos, nuevoGrupo]);
    setNuevoNombreGrupo('');
    setNuevoLiderGrupo('');
    setNuevaUbicacionGrupo('');
    setNuevoDiaGrupo('');
  };

  const eliminarGrupo = (id) => {
    if (window.confirm('¿Estás seguro de eliminar este grupo de crecimiento?')) {
      setGrupos(grupos.filter(g => g.id !== id));
      if (grupoSeleccionadoReporte?.id === id) setGrupoSeleccionadoReporte(null);
    }
  };

  const registrarAsistenciaCelula = (e) => {
    e.preventDefault();
    if (!grupoSeleccionadoReporte || !fechaReunion || !cantidadAsistentes) return;

    const nuevaAsistencia = {
      fecha: fechaReunion,
      asistentes: parseInt(cantidadAsistentes, 10) || 0,
      notas: notaReunion.trim() || 'Sin observaciones'
    };

    const gruposActualizados = grupos.map(g => {
      if (g.id === grupoSeleccionadoReporte.id) {
        const asisActualizadas = [nuevaAsistencia, ...(g.asistencias || [])];
        return { ...g, asistencias: asisActualizadas };
      }
      return g;
    });

    setGrupos(gruposActualizados);
    const grupoActualizado = gruposActualizados.find(g => g.id === grupoSeleccionadoReporte.id);
    setGrupoSeleccionadoReporte(grupoActualizado);

    setFechaReunion('');
    setCantidadAsistentes('');
    setNotaReunion('');
  };

  const exportarAExcel = () => {
    if (miembrosFiltrados.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }
    const encabezados = ['Nombre', 'Compromisos', 'Ministerios', 'Teléfono', 'Email', 'Nacimiento', 'Conversión', 'Dirección'];
    const filas = miembrosFiltrados.map(m => [
      `"${m.nombre || ''}"`, 
      `"${(m.niveles || []).join(', ')}"`, 
      `"${(m.ministerios || []).join(', ')}"`,
      `"${m.telefono || ''}"`, 
      `"${m.email || ''}"`, 
      `"${m.nacimiento || ''}"`, 
      `"${m.conversion || ''}"`, 
      `"${m.direccion || ''}"`
    ]);
    const contenidoCSV = [encabezados.join(','), ...filas.map(f => f.join(','))].join('\n');
    const blob = new Blob(["\ufeff" + contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.setAttribute('download', 'directorio_miembros.csv');
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
  };

  const miembrosFiltrados = miembros.filter((m) => {
    const nombreVal = m.nombre ? m.nombre.toLowerCase() : '';
    const dirVal = m.direccion ? m.direccion.toLowerCase() : '';
    const minVal = m.ministerios ? m.ministerios.some(min => min.toLowerCase().includes(busqueda.toLowerCase())) : false;

    const textoMatch = nombreVal.includes(busqueda.toLowerCase()) || dirVal.includes(busqueda.toLowerCase()) || minVal;
    const nivelMatch = filtroNivel === 'Todos' || (m.niveles && m.niveles.includes(filtroNivel));
    return textoMatch && nivelMatch;
  });

  const totalPaginas = Math.ceil(miembrosFiltrados.length / elementosPorPagina) || 1;
  const indexUltimo = paginaActual * elementosPorPagina;
  const indexPrimero = indexUltimo - elementosPorPagina;
  const miembrosPaginados = miembrosFiltrados.slice(indexPrimero, indexUltimo);

  const mesActual = new Date().getMonth() + 1;
  const cumpleañerosDelMes = miembros.filter(m => {
    if (!m.nacimiento || m.nacimiento === 'No registrada') return false;
    const partesFecha = m.nacimiento.split('-');
    return partesFecha.length === 3 && parseInt(partesFecha[1], 10) === mesActual;
  });

  return (
    <div style={{ padding: '40px', backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
          <div>
            <h1 style={{ color: '#0a0a0a', fontSize: '4.2rem', margin: '0 0 5px 0' }}>Directorio Inteligente & Células</h1>
            <p style={{ color: '#718096', margin: 0 }}>Colección Firestore activa: <code>miembros</code></p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              onClick={() => setMostrarSeccionCelulas(!mostrarSeccionCelulas)}
              style={{ background: '#2b6cb0', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {mostrarSeccionCelulas ? '🏠 Ver Directorio de Miembros' : '🌱 Gestionar Células y Asistencias'}
            </button>
            <button 
              onClick={() => setMostrarAdminCatalogos(!mostrarAdminCatalogos)}
              style={{ background: '#edf2f7', color: '#4a5568', border: '1px solid #cbd5e0', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {mostrarAdminCatalogos ? 'Ocultar Ajustes' : '⚙️ Ajustes'}
            </button>
            <button 
              onClick={exportarAExcel}
              style={{ background: '#319795', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              📊 Exportar a Excel
            </button>
            <button 
              onClick={() => { if (mostrarFormulario) limpiarFormulario(); else abrirNuevoMiembro(); }}
              style={{ background: mostrarFormulario ? '#e53e3e' : '#3182ce', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              {mostrarFormulario ? 'Cancelar' : '+ Nueva Ficha de Miembro'}
            </button>
          </div>
        </header>

        {mostrarSeccionCelulas && (
          <div style={{ marginBottom: '30px' }}>
            <div style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', borderLeft: '4px solid #319795' }}>
              <h2 style={{ margin: '0 0 15px 0', color: '#2d3748', fontSize: '1.4rem' }}>🌱 Registro y Alta de Nuevos Grupos de Crecimiento</h2>
              <form onSubmit={crearGrupoCrecimiento} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Nombre del Grupo *</label>
                  <input type="text" placeholder="Ej. Célula El Shaddai" value={nuevoNombreGrupo} onChange={(e) => setNuevoNombreGrupo(e.target.value)} style={inputStyle} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Líder / Anfitrión</label>
                  <input type="text" placeholder="Nombre del líder" value={nuevoLiderGrupo} onChange={(e) => setNuevoLiderGrupo(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Ubicación / Dirección</label>
                  <input type="text" placeholder="Dirección de la casa" value={nuevaUbicacionGrupo} onChange={(e) => setNuevaUbicacionGrupo(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Día y Hora</label>
                  <input type="text" placeholder="Ej. Jueves 7:00 PM" value={nuevoDiaGrupo} onChange={(e) => setNuevoDiaGrupo(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <button type="submit" style={{ width: '100%', background: '#319795', color: '#fff', border: 'none', padding: '11px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Crear Célula
                  </button>
                </div>
              </form>
            </div>

            <h3 style={{ color: '#2d3748', marginBottom: '15px' }}>Listado de Células Activas y Reportes Semanales</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
              {grupos.map((g) => (
                <div key={g.id} style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #319795', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <h3 style={{ margin: '0 0 5px 0', color: '#2d3748' }}>{g.nombre}</h3>
                    <button onClick={() => eliminarGrupo(g.id)} title="Eliminar grupo" style={{ background: '#fff5f5', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}>🗑️</button>
                  </div>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: '#4a5568' }}>👤 <strong>Líder:</strong> {g.lider}</p>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: '#4a5568' }}>📍 <strong>Ubicación:</strong> {g.ubicacion}</p>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: '#4a5568' }}>📅 <strong>Reunión:</strong> {g.dia}</p>
                  <p style={{ margin: '0', fontSize: '0.85rem', color: '#718096' }}>📊 <strong>Total reportes:</strong> {(g.asistencias || []).length}</p>
                  <button 
                    onClick={() => setGrupoSeleccionadoReporte(g)}
                    style={{ marginTop: '10px', background: '#e6fffa', color: '#234e52', border: '1px solid #b2f5ea', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                  >
                    📝 Ver Historial y Reportar Asistencia
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {grupoSeleccionadoReporte && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '650px', borderRadius: '10px', padding: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '12px', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, color: '#2d3748' }}>Reportes: {grupoSeleccionadoReporte.nombre}</h2>
                <button onClick={() => setGrupoSeleccionadoReporte(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
              </div>

              <form onSubmit={registrarAsistenciaCelula} style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h4 style={{ margin: '0 0 5px 0', color: '#2d3748' }}>Registrar Asistencia Semanal</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#4a5568', marginBottom: '4px' }}>Fecha de Reunión *</label>
                    <input type="date" value={fechaReunion} onChange={(e) => setFechaReunion(e.target.value)} style={inputStyle} required />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: '#4a5568', marginBottom: '4px' }}>Asistentes (Cantidad) *</label>
                    <input type="number" min="1" placeholder="Ej. 12" value={cantidadAsistentes} onChange={(e) => setCantidadAsistentes(e.target.value)} style={inputStyle} required />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#4a5568', marginBottom: '4px' }}>Notas o Comentarios</label>
                  <input type="text" placeholder="Ej. Buen tiempo de alabanza..." value={notaReunion} onChange={(e) => setNotaReunion(e.target.value)} style={inputStyle} />
                </div>
                <button type="submit" style={{ background: '#319795', color: '#fff', border: 'none', padding: '10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Guardar Reporte Semanal
                </button>
              </form>

              <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>📋 Historial de Asistencias</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {(!grupoSeleccionadoReporte.asistencias || grupoSeleccionadoReporte.asistencias.length === 0) ? (
                  <p style={{ color: '#a0aec0', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No hay reportes semanales registrados.</p>
                ) : (
                  grupoSeleccionadoReporte.asistencias.map((asis, idx) => (
                    <div key={idx} style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ fontWeight: 'bold', color: '#2d3748', fontSize: '0.9rem' }}>📅 {asis.fecha}</span>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#718096' }}>{asis.notas}</p>
                      </div>
                      <span style={{ background: '#e6fffa', color: '#234e52', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold', fontSize: '0.85rem' }}>
                        👥 {asis.asistentes} asistentes
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {mostrarAdminCatalogos && (
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '25px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', borderLeft: '4px solid #3182ce' }}>
            <div>
              <h3 style={{ margin: '0 0 10px 0', color: '#2d3748', fontSize: '1.1rem' }}>Catálogo de Ministerios</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input type="text" placeholder="Nuevo ministerio..." value={nuevoMinCat} onChange={(e) => setNuevoMinCat(e.target.value)} style={inputStyle} />
                <button onClick={agregarMinisterioCat} style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Agregar</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {listaMinisteriosCat.map((min) => (
                  <span key={min} style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '4px 10px', borderRadius: '15px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #bee3f8' }}>
                    {min}
                    <button onClick={() => eliminarMinisterioCat(min)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <h3 style={{ margin: '0 0 10px 0', color: '#2d3748', fontSize: '1.1rem' }}>Catálogo de Niveles</h3>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input type="text" placeholder="Nuevo nivel..." value={nuevoNivelCat} onChange={(e) => setNuevoNivelCat(e.target.value)} style={inputStyle} />
                <button onClick={agregarNivelCat} style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Agregar</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {listaNivelesCat.map((niv) => (
                  <span key={niv} style={{ background: '#e6fffa', color: '#234e52', padding: '4px 10px', borderRadius: '15px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid #b2f5ea' }}>
                    {niv}
                    <button onClick={() => eliminarNivelCat(niv)} style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}>×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #d53f8c', marginBottom: '25px' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2d3748', fontSize: '1.1rem' }}>🎂 Cumpleaños del Mes en Curso</h3>
          {cumpleañerosDelMes.length === 0 ? (
            <p style={{ margin: 0, color: '#718096', fontSize: '0.9rem' }}>No hay miembros registrados que cumplan años este mes.</p>
          ) : (
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop: '10px' }}>
              {cumpleañerosDelMes.map(c => {
                const telefonoLimpio = c.telefono ? c.telefono.replace(/\D/g, '') : '';
                const linkWhatsapp = telefonoLimpio.length >= 7 ? `https://wa.me/${telefonoLimpio}?text=${encodeURIComponent(`¡Hola ${c.nombre}! De parte de la iglesia te deseamos un muy feliz cumpleaños. ¡Bendiciones!`)}` : '#';
                return (
                  <div key={c.id} style={{ background: '#fff5f7', border: '1px solid #fed7e2', padding: '10px 14px', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
                    <span style={{ fontWeight: 'bold', color: '#97266d', fontSize: '0.9rem' }}>{c.nombre}</span>
                    <span style={{ color: '#718096', fontSize: '0.8rem' }}>📅 {c.nacimiento}</span>
                    {telefonoLimpio.length >= 7 && (
                      <a href={linkWhatsapp} target="_blank" rel="noopener noreferrer" style={{ background: '#25d366', color: '#fff', textDecoration: 'none', padding: '4px 8px', borderRadius: '4px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 'bold', marginTop: '4px' }}>
                        💬 WhatsApp
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {mostrarFormulario && (
          <form onSubmit={guardarMiembro} style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>{editandoId !== null ? 'Editar Ficha de Vida' : 'Crear Ficha de Vida (Colección: miembros)'}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Nombre completo *</label>
                <input type="text" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} style={inputStyle} required />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Teléfono</label>
                <input type="text" value={nuevoTelefono} onChange={(e) => setNuevoTelefono(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Correo electrónico</label>
                <input type="email" value={nuevoEmail} onChange={(e) => setNuevoEmail(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Fecha de Nacimiento</label>
                <input type="date" value={nuevaFechaNacimiento} onChange={(e) => setNuevaFechaNacimiento(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Fecha de Conversión</label>
                <input type="date" value={nuevaFechaConversion} onChange={(e) => setNuevaFechaConversion(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Dirección</label>
                <input type="text" value={nuevaDireccion} onChange={(e) => setNuevaDireccion(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#2d3748' }}>Niveles de Compromiso</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {listaNivelesCat.map((niv) => (
                    <label key={niv} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#4a5568', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={!!nivelesSeleccionados[niv]} 
                        onChange={() => handleCheckboxNivel(niv)} 
                      />
                      {niv}
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#2d3748' }}>Ministerios</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {listaMinisteriosCat.map((min) => (
                    <label key={min} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#4a5568', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={!!ministeriosSeleccionados[min]} 
                        onChange={() => handleCheckboxMinisterio(min)} 
                      />
                      {min}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={limpiarFormulario} style={{ background: '#edf2f7', color: '#4a5568', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancelar
              </button>
              <button type="submit" style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                {editandoId !== null ? 'Guardar Cambios' : 'Registrar Miembro'}
              </button>
            </div>
          </form>
        )}

        <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <input 
            type="text" 
            placeholder="🔍 Buscar por nombre, dirección o ministerio..." 
            value={busqueda} 
            onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }} 
            style={{ ...inputStyle, flex: '1', minWidth: '250px' }} 
          />
          <select 
            value={filtroNivel} 
            onChange={(e) => { setFiltroNivel(e.target.value); setPaginaActual(1); }} 
            style={{ ...inputStyle, width: '200px' }}
          >
            <option value="Todos">Todos los niveles</option>
            {listaNivelesCat.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: '#edf2f7', color: '#4a5568', borderBottom: '1px solid #cbd5e0' }}>
                  <th style={{ padding: '12px 15px' }}>Nombre</th>
                  <th style={{ padding: '12px 15px' }}>Niveles</th>
                  <th style={{ padding: '12px 15px' }}>Ministerios</th>
                  <th style={{ padding: '12px 15px' }}>Teléfono</th>
                  <th style={{ padding: '12px 15px' }}>Dirección</th>
                  <th style={{ padding: '12px 15px', textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargandoDB ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#718096' }}>Cargando registros de la base de datos...</td>
                  </tr>
                ) : miembrosPaginados.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#718096' }}>No se encontraron registros en la colección miembros.</td>
                  </tr>
                ) : (
                  miembrosPaginados.map((m) => (
                    <tr 
                      key={m.id} 
                      onClick={() => setMiembroSeleccionado(m)} 
                      style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f7fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <td style={{ padding: '12px 15px', fontWeight: 'bold', color: '#2d3748' }}>{m.nombre}</td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(m.niveles || []).map(niv => (
                            <span key={niv} style={{ background: '#e6fffa', color: '#234e52', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>{niv}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {(m.ministerios || []).map(min => (
                            <span key={min} style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem' }}>{min}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 15px', color: '#4a5568' }}>{m.telefono}</td>
                      <td style={{ padding: '12px 15px', color: '#4a5568' }}>{m.direccion}</td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button onClick={(e) => prepararEdicion(m, e)} title="Editar" style={{ background: '#ebf8ff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>✏️</button>
                          <button onClick={(e) => eliminarMiembro(m.id, e)} title="Eliminar" style={{ background: '#fff5f5', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer' }}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderTop: '1px solid #edf2f7' }}>
              <span style={{ fontSize: '0.85rem', color: '#718096' }}>Página {paginaActual} de {totalPaginas}</span>
              <div style={{ display: 'flex', gap: '5px' }}>
                <button 
                  onClick={() => setPaginaActual(p => Math.max(p - 1, 1))} 
                  disabled={paginaActual === 1}
                  style={{ background: '#edf2f7', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer', opacity: paginaActual === 1 ? 0.5 : 1 }}
                >
                  Anterior
                </button>
                <button 
                  onClick={() => setPaginaActual(p => Math.min(p + 1, totalPaginas))} 
                  disabled={paginaActual === totalPaginas}
                  style={{ background: '#edf2f7', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer', opacity: paginaActual === totalPaginas ? 0.5 : 1 }}
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>

        {miembroSeleccionado && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '10px', padding: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '12px', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, color: '#2d3748' }}>Ficha Pastoral: {miembroSeleccionado.nombre}</h2>
                <button onClick={() => setMiembroSeleccionado(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', fontSize: '0.9rem', color: '#4a5568', background: '#f7fafc', padding: '12px', borderRadius: '6px' }}>
                <div>📞 <strong>Teléfono:</strong> {miembroSeleccionado.telefono}</div>
                <div>📧 <strong>Email:</strong> {miembroSeleccionado.email}</div>
                <div>🎂 <strong>Nacimiento:</strong> {miembroSeleccionado.nacimiento}</div>
                <div>🕊️ <strong>Conversión:</strong> {miembroSeleccionado.conversion}</div>
                <div style={{ gridColumn: 'span 2' }}>📍 <strong>Dirección:</strong> {miembroSeleccionado.direccion}</div>
              </div>

              <form onSubmit={agregarNotaPastoral} style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>Agregar Nota Pastoral / Seguimiento</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Escribe una observación o nota pastoral..." 
                    value={nuevaNota} 
                    onChange={(e) => setNuevaNota(e.target.value)} 
                    style={inputStyle} 
                  />
                  <button type="submit" style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    Guardar
                  </button>
                </div>
              </form>

              <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>📝 Historial de Notas Pastorales</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                {(!miembroSeleccionado.notasPastorales || miembroSeleccionado.notasPastorales.length === 0) ? (
                  <p style={{ color: '#a0aec0', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No hay notas pastorales registradas para este miembro.</p>
                ) : (
                  miembroSeleccionado.notasPastorales.map((nota, idx) => (
                    <div key={idx} style={{ background: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.9rem', color: '#2d3748' }}>
                      • {nota}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default Directorio;