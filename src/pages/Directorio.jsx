import React, { useState, useEffect } from 'react';
// Importa aquí tu instancia o configuración de Firebase según corresponda
// import { db } from '../firebaseConfig'; 
// import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export default function Directorio() {
  // Estados de Personalización (Ajustes de Admin)
  const [estilos, setEstilos] = useState({
    boton: '#3182ce',
    fondo: '#f0f2f5',
    tipografia: 'sans-serif',
    encabezadoColor: '#2d3748',
    encabezadoTamano: '24px',
    encabezadoNegrita: true,
    encabezadoCursiva: false,
    subtituloColor: '#4a5568',
    subtituloTamano: '14px',
    subtituloNegrita: false,
    subtituloCursiva: false
  });

  const cargarEstilos = () => {
    const guardado = localStorage.getItem('congregacion360_estilos');
    if (guardado) {
      const parsed = JSON.parse(guardado);
      if (parsed.directorio) {
        setEstilos(parsed.directorio);
      }
    }
  };

  useEffect(() => {
    cargarEstilos(); // Cargar al abrir la página
    window.addEventListener('estilosActualizados', cargarEstilos);
    return () => {
      window.removeEventListener('estilosActualizados', cargarEstilos);
    };
  }, []);

  // Estado de Navegación Principal (Vistas)
  const [vistaActiva, setVistaActiva] = useState('directorio');

  // Estados principales de datos
  const [miembros, setMiembros] = useState([]);
  const [cargandoDB, setCargandoDB] = useState(true);

  // Estados del formulario
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [direccion, setDireccion] = useState('');
  const [nacimiento, setNacimiento] = useState('');
  const [conversion, setConversion] = useState('');

  // Estados de selección múltiple (Niveles y Ministerios)
  const [nivelesSeleccionados, setNivelesSeleccionados] = useState({});
  const [ministeriosSeleccionados, setMinisteriosSeleccionados] = useState({});

  // Filtros y Paginación
  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('Todos');
  const [paginaActual, setPaginaActual] = useState(1);
  const elementosPorPagina = 6;

  // Modal de Detalle / Notas Pastorales
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [nuevaNota, setNuevaNota] = useState('');

  // Estados específicos para Células y Asistencias
  const [celulas, setCelulas] = useState([
    { id: '1', nombre: 'Célula Central', lider: 'Carlos Gómez', dia: 'Miércoles', hora: '19:00', miembrosAsignados: [] },
    { id: '2', nombre: 'Célula Norte', lider: 'María Rodríguez', dia: 'Jueves', hora: '18:30', miembrosAsignados: [] }
  ]);
  const [nombreNuevaCelula, setNombreNuevaCelula] = useState('');
  const [liderNuevaCelula, setLiderNuevaCelula] = useState('');
  const [diaCelula, setDiaCelula] = useState('Miércoles');

  // Estados específicos para Ajustes (Catálogos)
  const [listaNivelesCat, setListaNivelesCat] = useState(['Bautizado', 'Líder', 'Discipulado', 'Miembro Activo']);
  const [listaMinisteriosCat, setListaMinisteriosCat] = useState(['Alabanza', 'Ujieres', 'Escuela Dominical', 'Jóvenes', 'Intercesión', 'Diaconado']);
  const [nuevoNivelCat, setNuevoNivelCat] = useState('');
  const [nuevoMinisterioCat, setNuevoMinisterioCat] = useState('');
  const [configFirebase, setConfigFirebase] = useState({ apiKey: '***', projectId: 'mi-iglesia-app' });

  // Estados específicos para Exportar
  const [formatoExportacion, setFormatoExportacion] = useState('csv');
  const [incluirNotasPastorales, setIncluirNotasPastorales] = useState(true);

  const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  // Simulación de carga inicial desde Firebase
  useEffect(() => {
    setCargandoDB(false);
  }, []);

  const handleCheckboxNivel = (niv) => {
    setNivelesSeleccionados(prev => ({ ...prev, [niv]: !prev[niv] }));
  };

  const handleCheckboxMinisterio = (min) => {
    setMinisteriosSeleccionados(prev => ({ ...prev, [min]: !prev[min] }));
  };

  const limpiarFormulario = () => {
    setEditandoId(null);
    setNombre('');
    setTelefono('');
    setEmail('');
    setDireccion('');
    setNacimiento('');
    setConversion('');
    setNivelesSeleccionados({});
    setMinisteriosSeleccionados({});
  };

  const guardarMiembro = (e) => {
    e.preventDefault();
    const nivelesArr = Object.keys(nivelesSeleccionados).filter(k => nivelesSeleccionados[k]);
    const ministeriosArr = Object.keys(ministeriosSeleccionados).filter(k => ministeriosSeleccionados[k]);

    const nuevoRegistro = {
      id: editandoId !== null ? editandoId : Date.now().toString(),
      nombre,
      telefono,
      email,
      direccion,
      nacimiento,
      conversion,
      niveles: nivelesArr,
      ministerios: ministeriosArr,
      notasPastorales: editandoId !== null ? (miembros.find(m => m.id === editandoId)?.notasPastorales || []) : []
    };

    if (editandoId !== null) {
      setMiembros(miembros.map(m => m.id === editandoId ? nuevoRegistro : m));
    } else {
      setMiembros([nuevoRegistro, ...miembros]);
    }
    limpiarFormulario();
    setVistaActiva('directorio');
  };

  const prepararEdicion = (m, e) => {
    e.stopPropagation();
    setEditandoId(m.id);
    setNombre(m.nombre || '');
    setTelefono(m.telefono || '');
    setEmail(m.email || '');
    setDireccion(m.direccion || '');
    setNacimiento(m.nacimiento || '');
    setConversion(m.conversion || '');

    const nivObj = {};
    (m.niveles || []).forEach(n => nivObj[n] = true);
    setNivelesSeleccionados(nivObj);

    const minObj = {};
    (m.ministerios || []).forEach(min => minObj[min] = true);
    setMinisteriosSeleccionados(minObj);

    setVistaActiva('nuevo');
  };

  const eliminarMiembro = (id, e) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de eliminar este miembro?')) {
      setMiembros(miembros.filter(m => m.id !== id));
      if (miembroSeleccionado?.id === id) setMiembroSeleccionado(null);
    }
  };

  const agregarNotaPastoral = (e) => {
    e.preventDefault();
    if (!nuevaNota.trim() || !miembroSeleccionado) return;

    const notasActualizadas = [nuevaNota, ...(miembroSeleccionado.notasPastorales || [])];
    const miembroActualizado = { ...miembroSeleccionado, notasPastorales: notasActualizadas };

    setMiembros(miembros.map(m => m.id === miembroActualizado.id ? miembroActualizado : m));
    setMiembroSeleccionado(miembroActualizado);
    setNuevaNota('');
  };

  // Funciones de Células
  const agregarCelula = (e) => {
    e.preventDefault();
    if (!nombreNuevaCelula.trim()) return;
    const nueva = {
      id: Date.now().toString(),
      nombre: nombreNuevaCelula,
      lider: liderNuevaCelula,
      dia: diaCelula,
      miembrosAsignados: []
    };
    setCelulas([...celulas, nueva]);
    setNombreNuevaCelula('');
    setLiderNuevaCelula('');
  };

  // Funciones de Ajustes (Catálogos)
  const agregarNivelCat = (e) => {
    e.preventDefault();
    if (nuevoNivelCat.trim() && !listaNivelesCat.includes(nuevoNivelCat)) {
      setListaNivelesCat([...listaNivelesCat, nuevoNivelCat.trim()]);
      setNuevoNivelCat('');
    }
  };

  const agregarMinisterioCat = (e) => {
    e.preventDefault();
    if (nuevoMinisterioCat.trim() && !listaMinisteriosCat.includes(nuevoMinisterioCat)) {
      setListaMinisteriosCat([...listaMinisteriosCat, nuevoMinisterioCat.trim()]);
      setNuevoMinisterioCat('');
    }
  };

  // Función para Exportar Datos
  const ejecutarExportacion = () => {
    if (miembros.length === 0) {
      alert('No hay miembros registrados para exportar.');
      return;
    }

    if (formatoExportacion === 'csv') {
      let csvContent = 'data:text/csv;charset=utf-8,';
      csvContent += 'Nombre,Telefono,Email,Direccion,Nacimiento,Conversion,Niveles,Ministerios' + (incluirNotasPastorales ? ',NotasPastorales' : '') + '\r\n';

      miembros.forEach(m => {
        const nivelesStr = `"${(m.niveles || []).join(' - ')}"`;
        const ministeriosStr = `"${(m.ministerios || []).join(' - ')}"`;
        const notasStr = incluirNotasPastorales ? `"${(m.notasPastorales || []).join(' | ')}"` : '';

        const row = [
          `"${m.nombre || ''}"`,
          `"${m.telefono || ''}"`,
          `"${m.email || ''}"`,
          `"${m.direccion || ''}"`,
          `"${m.nacimiento || ''}"`,
          `"${m.conversion || ''}"`,
          nivelesStr,
          ministeriosStr,
          ...(incluirNotasPastorales ? [notasStr] : [])
        ].join(',');

        csvContent += row + '\r\n';
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'directorio_miembros.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(miembros, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", "directorio_miembros.json");
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  };

  // Filtrado y Paginación
  const miembrosFiltrados = miembros.filter(m => {
    const textoBusqueda = busqueda.toLowerCase();
    const coincideTexto = 
      (m.nombre?.toLowerCase() || '').includes(textoBusqueda) ||
      (m.direccion?.toLowerCase() || '').includes(textoBusqueda) ||
      (m.ministerios || []).some(min => min.toLowerCase().includes(textoBusqueda));

    const coincideNivel = filtroNivel === 'Todos' || (m.niveles || []).includes(filtroNivel);

    return coincideTexto && coincideNivel;
  });

  const totalPaginas = Math.ceil(miembrosFiltrados.length / elementosPorPagina) || 1;
  const indexUltimo = paginaActual * elementosPorPagina;
  const indexPrimero = indexUltimo - elementosPorPagina;
  const miembrosPaginados = miembrosFiltrados.slice(indexPrimero, indexUltimo);

  return (
    <div style={{ background: estilos.fondo, fontFamily: estilos.tipografia, padding: '20px', minHeight: '100vh' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Título y Subtítulo dinámicos vinculados a la personalización */}
        <h1 style={{ 
          color: estilos.encabezadoColor, 
          fontSize: estilos.encabezadoTamano, 
          fontWeight: estilos.encabezadoNegrita ? 'bold' : 'normal',
          fontStyle: estilos.encabezadoCursiva ? 'italic' : 'normal',
          marginBottom: '5px'
        }}>
          Directorio de Miembros
        </h1>
        <p style={{ 
          color: estilos.subtituloColor, 
          fontSize: estilos.subtituloTamano, 
          fontWeight: estilos.subtituloNegrita ? 'bold' : 'normal',
          fontStyle: estilos.subtituloCursiva ? 'italic' : 'normal',
          marginBottom: '20px'
        }}>
          Visualiza y administra los datos de toda la congregación.
        </p>

        {/* Los 4 Botones de Navegación con Color Dinámico de Personalización */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '25px' }}>
          <button 
            onClick={() => setVistaActiva('celulas')}
            style={{ padding: '14px 20px', background: vistaActiva === 'celulas' ? '#1a365d' : estilos.boton, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'background 0.2s' }}
          >
            Gestionar Celulas y Asistencias
          </button>

          <button 
            onClick={() => { limpiarFormulario(); setVistaActiva('nuevo'); }}
            style={{ padding: '14px 20px', background: vistaActiva === 'nuevo' ? '#1a365d' : estilos.boton, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'background 0.2s' }}
          >
            +Nueva Ficha del Miembro
          </button>

          <button 
            onClick={() => setVistaActiva('exportar')}
            style={{ padding: '14px 20px', background: vistaActiva === 'exportar' ? '#1a365d' : estilos.boton, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'background 0.2s' }}
          >
            Exportar a Excel
          </button>

          <button 
            onClick={() => setVistaActiva('ajustes')}
            style={{ padding: '14px 20px', background: vistaActiva === 'ajustes' ? '#1a365d' : estilos.boton, color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', transition: 'background 0.2s' }}
          >
            Ajustes
          </button>
        </div>

        {/* SECCIÓN 1: VISTA DIRECTORIO */}
        {vistaActiva === 'directorio' && (
          <>
            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: '1', minWidth: '250px' }}>
                <input 
                  type="text" 
                  placeholder="Buscar por nombre, dirección o ministerio..." 
                  value={busqueda} 
                  onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }} 
                  style={inputStyle} 
                />
              </div>
              <div>
                <select 
                  value={filtroNivel} 
                  onChange={(e) => { setFiltroNivel(e.target.value); setPaginaActual(1); }} 
                  style={{ ...inputStyle, padding: '10px' }}
                >
                  <input
                  type="text" 
                  placeholder="Filtrar por Nivel..." 
                  ></input>
                  <option value="Todos">Filtrar por Nivel: Todos</option>
                  {listaNivelesCat.map(niv => (
                    <option key={niv} value={niv}>{niv}</option>
                  ))}
                </select>
              </div>
            </div>

            {cargandoDB ? (
              <p style={{ textAlign: 'center', color: '#718096', padding: '40px' }}>Cargando directorio desde Firebase...</p>
            ) : miembrosFiltrados.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#718096', padding: '40px' }}>No se encontraron registros en la colección <code>miembros</code>.</p>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                  {miembrosPaginados.map((m) => (
                    <div 
                      key={m.id} 
                      onClick={() => setMiembroSeleccionado(m)}
                      style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: `4px solid ${estilos.boton}`, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h3 style={{ margin: '0 0 5px 0', color: '#2d3748', fontSize: '1.1rem' }}>{m.nombre}</h3>
                        <div style={{ display: 'flex', gap: '5px' }} onClick={(e) => e.stopPropagation()}>
                          <button onClick={(e) => prepararEdicion(m, e)} title="Editar" style={{ background: '#ebf8ff', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}>✏️</button>
                          <button onClick={(e) => eliminarMiembro(m.id, e)} title="Eliminar" style={{ background: '#fff5f5', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}>🗑️</button>
                        </div>
                      </div>
                      <p style={{ margin: '0', fontSize: '0.85rem', color: '#4a5568' }}>📞 <strong>Teléfono:</strong> {m.telefono}</p>
                      <p style={{ margin: '0', fontSize: '0.85rem', color: '#4a5568' }}>✉️ <strong>Email:</strong> {m.email}</p>
                      <p style={{ margin: '0', fontSize: '0.85rem', color: '#4a5568' }}>📍 <strong>Dirección:</strong> {m.direccion}</p>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {(m.niveles || []).map((niv, i) => (
                          <span key={i} style={{ background: '#e6fffa', color: '#234e52', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>{niv}</span>
                        ))}
                        {(m.ministerios || []).map((min, i) => (
                          <span key={i} style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '2px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>{min}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {totalPaginas > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}>
                    <button 
                      disabled={paginaActual === 1}
                      onClick={() => setPaginaActual(prev => Math.max(prev - 1, 1))}
                      style={{ padding: '8px 12px', background: paginaActual === 1 ? '#edf2f7' : '#fff', border: '1px solid #cbd5e0', borderRadius: '4px', cursor: paginaActual === 1 ? 'not-allowed' : 'pointer' }}
                    >
                      Anterior
                    </button>
                    <span style={{ fontSize: '0.9rem', color: '#4a5568' }}>Página {paginaActual} de {totalPaginas}</span>
                    <button 
                      disabled={paginaActual === totalPaginas}
                      onClick={() => setPaginaActual(prev => Math.min(prev + 1, totalPaginas))}
                      style={{ padding: '8px 12px', background: paginaActual === totalPaginas ? '#edf2f7' : '#fff', border: '1px solid #cbd5e0', borderRadius: '4px', cursor: paginaActual === totalPaginas ? 'not-allowed' : 'pointer' }}
                    >
                      Siguiente
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* SECCIÓN 2: FORMULARIO NUEVA FICHA / EDICIÓN */}
        {vistaActiva === 'nuevo' && (
          <form onSubmit={guardarMiembro} style={{ background: '#fff', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.2rem' }}>
                {editandoId !== null ? '✏️ Actualizar Ficha de Miembro' : '➕ Registrar Nueva Ficha del Miembro'}
              </h3>
              <button 
                type="button" 
                onClick={() => { limpiarFormulario(); setVistaActiva('directorio'); }}
                style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: '#718096' }}
              >
                ✕ Volver al Directorio
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Nombre completo</label>
                <input type="text" placeholder="Ej. Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Teléfono</label>
                <input type="text" placeholder="Ej. +504 0000-0000" value={telefono} onChange={(e) => setTelefono(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Correo Electrónico</label>
                <input type="email" placeholder="correo@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Dirección</label>
                <input type="text" placeholder="Colonia, calle, casa" value={direccion} onChange={(e) => setDireccion(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Fecha de Nacimiento</label>
                <input type="text" placeholder="DD/MM/AAAA" value={nacimiento} onChange={(e) => setNacimiento(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Fecha de Conversión</label>
                <input type="text" placeholder="DD/MM/AAAA" value={conversion} onChange={(e) => setConversion(e.target.value)} style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
              <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '6px' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#2d3748' }}>Niveles / Compromisos</h4>
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" style={{ background: estilos.boton, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                {editandoId !== null ? 'Actualizar Ficha' : 'Guardar Miembro'}
              </button>
              <button type="button" onClick={() => { limpiarFormulario(); setVistaActiva('directorio'); }} style={{ background: '#e2e8f0', color: '#4a5568', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* SECCIÓN 3: GESTIONAR CÉLULAS Y ASISTENCIAS */}
        {vistaActiva === 'celulas' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#2d3748' }}>🏡 Gestión de Células y Asistencias</h3>
              <button 
                onClick={() => setVistaActiva('directorio')}
                style={{ background: '#e2e8f0', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#4a5568' }}
              >
                Volver al Directorio
              </button>
            </div>
            
            <p style={{ color: '#4a5568', fontSize: '0.95rem', marginBottom: '20px' }}>
              Aquí puedes registrar grupos celulares y llevar el control de asistencias semanales.
            </p>

            <form onSubmit={agregarCelula} style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', marginBottom: '25px', display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Nombre de Célula</label>
                <input type="text" placeholder="Ej. Célula El Redentor" value={nombreNuevaCelula} onChange={(e) => setNombreNuevaCelula(e.target.value)} required style={inputStyle} />
              </div>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Líder Encargado</label>
                <input type="text" placeholder="Nombre del líder" value={liderNuevaCelula} onChange={(e) => setLiderNuevaCelula(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Día de Reunión</label>
                <select value={diaCelula} onChange={(e) => setDiaCelula(e.target.value)} style={{ ...inputStyle, padding: '10px' }}>
                  <option value="Lunes">Lunes</option>
                  <option value="Martes">Martes</option>
                  <option value="Miércoles">Miércoles</option>
                  <option value="Jueves">Jueves</option>
                  <option value="Viernes">Viernes</option>
                  <option value="Sábado">Sábado</option>
                  <option value="Domingo">Domingo</option>
                </select>
              </div>
              <button type="submit" style={{ background: estilos.boton, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '41px' }}>
                + Agregar Célula
              </button>
            </form>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '15px' }}>
              {celulas.map((c) => (
                <div key={c.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#2d3748' }}>{c.nombre}</h4>
                  <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#4a5568' }}>👤 <strong>Líder:</strong> {c.lider || 'No asignado'}</p>
                  <p style={{ margin: '0 0 15px 0', fontSize: '0.85rem', color: '#4a5568' }}>📅 <strong>Día:</strong> {c.dia}</p>
                  <button 
                    onClick={() => alert(`Abriendo control de asistencia para: ${c.nombre}`)}
                    style={{ width: '100%', background: '#edf2f7', border: '1px solid #cbd5e0', color: '#2d3748', padding: '8px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}
                  >
                    📋 Pasar Asistencia
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN 4: EXPORTAR A EXCEL */}
        {vistaActiva === 'exportar' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#2d3748' }}>📊 Exportar Datos del Directorio</h3>
              <button 
                onClick={() => setVistaActiva('directorio')}
                style={{ background: '#e2e8f0', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#4a5568' }}
              >
                Volver al Directorio
              </button>
            </div>

            <p style={{ color: '#4a5568', fontSize: '0.95rem', marginBottom: '20px' }}>
              Selecciona el formato de exportación para descargar la base de datos completa de los miembros registrados.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>Formato de Archivo</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#4a5568', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="formato" 
                      checked={formatoExportacion === 'csv'} 
                      onChange={() => setFormatoExportacion('csv')} 
                    />
                    CSV / Excel (.csv)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#4a5568', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="formato" 
                      checked={formatoExportacion === 'json'} 
                      onChange={() => setFormatoExportacion('json')} 
                    />
                    Respaldo Completo (.json)
                  </label>
                </div>
              </div>

              <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>Opciones Adicionales</h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#4a5568', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={incluirNotasPastorales} 
                    onChange={(e) => setIncluirNotasPastorales(e.target.checked)} 
                  />
                  Incluir notas pastorales en el reporte
                </label>
              </div>
            </div>

            <button 
              onClick={ejecutarExportacion} 
              style={{ background: '#276749', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1rem' }}
            >
              📥 Descargar Reporte de Miembros
            </button>
          </div>
        )}

        {/* SECCIÓN 5: AJUSTES */}
        {vistaActiva === 'ajustes' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#2d3748' }}>⚙️ Ajustes del Sistema y Catálogos</h3>
              <button 
                onClick={() => setVistaActiva('directorio')}
                style={{ background: '#e2e8f0', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#4a5568' }}
              >
                Volver al Directorio
              </button>
            </div>

            <p style={{ color: '#4a5568', fontSize: '0.95rem', marginBottom: '20px' }}>
              Administra los niveles de compromiso y los ministerios disponibles en los formularios de registro de miembros.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              
              {/* Catálogo de Niveles */}
              <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>Niveles / Compromisos</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '15px' }}>
                  {listaNivelesCat.map((niv, i) => (
                    <span key={i} style={{ background: '#e6fffa', color: '#234e52', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{niv}</span>
                  ))}
                </div>
                <form onSubmit={agregarNivelCat} style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Nuevo nivel..." value={nuevoNivelCat} onChange={(e) => setNuevoNivelCat(e.target.value)} style={inputStyle} />
                  <button type="submit" style={{ background: estilos.boton, color: '#fff', border: 'none', padding: '0 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                </form>
              </div>

              {/* Catálogo de Ministerios */}
              <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>Ministerios</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '15px' }}>
                  {listaMinisteriosCat.map((min, i) => (
                    <span key={i} style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>{min}</span>
                  ))}
                </div>
                <form onSubmit={agregarMinisterioCat} style={{ display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Nuevo ministerio..." value={nuevoMinisterioCat} onChange={(e) => setNuevoMinisterioCat(e.target.value)} style={inputStyle} />
                  <button type="submit" style={{ background: estilos.boton, color: '#fff', border: 'none', padding: '0 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                </form>
              </div>

            </div>

            <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>Configuración de Base de Datos (Firebase)</h4>
              <p style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#718096' }}>Proyecto conectado actualmente: <strong>{configFirebase.projectId}</strong></p>
              <button onClick={() => alert('Parámetros de conexión actualizados')} style={{ background: estilos.boton, color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem' }}>
                Ver Parámetros de Conexión
              </button>
            </div>
          </div>
        )}

        {/* Modal de Ficha de Vida y Notas Pastorales */}
        {miembroSeleccionado && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '10px', padding: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #edf2f7', paddingBottom: '12px', marginBottom: '15px' }}>
                <h2 style={{ margin: 0, color: '#2d3748' }}>Ficha de Vida: {miembroSeleccionado.nombre}</h2>
                <button onClick={() => setMiembroSeleccionado(null)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px', fontSize: '0.9rem', color: '#4a5568' }}>
                <p style={{ margin: 0 }}>📞 <strong>Teléfono:</strong> {miembroSeleccionado.telefono}</p>
                <p style={{ margin: 0 }}>✉️ <strong>Email:</strong> {miembroSeleccionado.email}</p>
                <p style={{ margin: 0 }}>🎂 <strong>Nacimiento:</strong> {miembroSeleccionado.nacimiento}</p>
                <p style={{ margin: 0 }}>✝️ <strong>Conversión:</strong> {miembroSeleccionado.conversion}</p>
                <p style={{ margin: 0, gridColumn: 'span 2' }}>📍 <strong>Dirección:</strong> {miembroSeleccionado.direccion}</p>
              </div>

              <h3 style={{ color: '#2d3748', fontSize: '1rem', marginBottom: '10px' }}>📝 Notas Pastorales</h3>
              <form onSubmit={agregarNotaPastoral} style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                <input 
                  type="text" 
                  placeholder="Escribir nueva nota pastoral..." 
                  value={nuevaNota} 
                  onChange={(e) => setNuevaNota(e.target.value)} 
                  style={inputStyle} 
                />
                <button type="submit" style={{ background: estilos.boton, color: '#fff', border: 'none', padding: '0 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Agregar</button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {(!miembroSeleccionado.notasPastorales || miembroSeleccionado.notasPastorales.length === 0) ? (
                  <p style={{ color: '#a0aec0', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No hay notas pastorales registradas para este miembro.</p>
                ) : (
                  miembroSeleccionado.notasPastorales.map((nota, index) => (
                    <div key={index} style={{ background: '#f7fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '0.85rem', color: '#2d3748' }}>
                      {nota}
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
