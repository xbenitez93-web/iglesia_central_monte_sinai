import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase'; // Importa la base de datos desde tu archivo firebase.js

export default function Directorio() {
  const [vistaActiva, setVistaActiva] = useState('directorio');
  const [busqueda, setBusqueda] = useState('');
  const [filtroNivel, setFiltroNivel] = useState('Todos');
  const [filtroMinisterio, setFiltroMinisterio] = useState('Todos');
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [nuevaNota, setNuevaNota] = useState('');
  
  const [modalNuevoMiembroAbierto, setModalNuevoMiembroAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [idMiembroEditando, setIdMiembroEditando] = useState(null);

  const [nuevoMiembroForm, setNuevoMiembroForm] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
    nacimiento: '',
    conversion: '',
    niveles: [],
    ministerios: []
  });

  const [temaPersonalizado, setTemaPersonalizado] = useState({
    primario: '#1a365d',
    secundario: '#2b6cb0',
    fondo: '#f0f4f8',
    boton: '#3182ce',
    tipografia: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    tituloColor: '#ffffff',
    tituloTamano: '1.8rem',
    subtituloColor: 'rgba(255,255,255,0.8)',
    subtituloTamano: '0.9rem',
    orientacionEncabezado: 'izquierda'
  });

  const [listaNivelesCat, setListaNivelesCat] = useState([
    'Bautizado',
    'En Discipulado',
    'Líder de Célula',
    'Miembro Nuevo'
  ]);
  const [listaMinisteriosCat, setListaMinisteriosCat] = useState([
    'Alabanza',
    'Jóvenes',
    'Escuela Dominical',
    'Diaconado'
  ]);

  const [nuevoNivelCat, setNuevoNivelCat] = useState('');
  const [nuevoMinisterioCat, setNuevoMinisterioCat] = useState('');

  const [editandoNivelIndex, setEditandoNivelIndex] = useState(null);
  const [valorEditNivel, setValorEditNivel] = useState('');

  const [editandoMinisterioIndex, setEditandoMinisterioIndex] = useState(null);
  const [valorEditMinisterio, setValorEditMinisterio] = useState('');

  const [formatoExport, setFormatoExport] = useState('excel');
  const [incluirNotasExport, setIncluirNotasExport] = useState(false);

  const [celulas, setCelulas] = useState([]);
  const [nuevaCelula, setNuevaCelula] = useState({ nombre: '', lider: '', dia: 'Miércoles' });
  const [asistenciaRegistrada, setAsistenciaRegistrada] = useState({});

  const [miembros, setMiembros] = useState([]);

  useEffect(() => {
    obtenerDatosDesdeFirebase();
  }, []);

  const obtenerDatosDesdeFirebase = async () => {
    try {
      // 1. Cargar miembros
      const querySnapshot = await getDocs(collection(db, 'miembros'));
      const listaMiembros = querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setMiembros(listaMiembros);

      // 2. Cargar células
      const celulasSnapshot = await getDocs(collection(db, 'celulas'));
      const listaCelulas = celulasSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      if (listaCelulas.length > 0) {
        setCelulas(listaCelulas);
      } else {
        // Datos iniciales por defecto si está vacío
        setCelulas([
          { id: '1', nombre: 'Célula Central', lider: 'Carlos Gómez', dia: 'Miércoles', miembrosCount: 8 },
          { id: '2', nombre: 'Célula Juvenil Norte', lider: 'María Pérez', dia: 'Viernes', miembrosCount: 12 }
        ]);
      }

      // 3. Cargar catálogos (Niveles y Ministerios) desde un documento de configuración en Firestore
      const configDocRef = doc(db, 'configuracion', 'catalogos');
      const configSnap = await getDoc(configDocRef);
      if (configSnap.exists()) {
        const data = configSnap.data();
        if (data.niveles) setListaNivelesCat(data.niveles);
        if (data.ministerios) setListaMinisteriosCat(data.ministerios);
      } else {
        // Crear documento inicial si no existe
        await setDoc(configDocRef, {
          niveles: listaNivelesCat,
          ministerios: listaMinisteriosCat
        });
      }

    } catch (error) {
      console.error("Error al cargar los datos de Firebase:", error);
    }
  };

  // Función auxiliar para actualizar catálogos en Firebase
  const guardarCatalogosEnFirebase = async (nuevosNiveles, nuevosMinisterios) => {
    try {
      const configDocRef = doc(db, 'configuracion', 'catalogos');
      await setDoc(configDocRef, {
        niveles: nuevosNiveles,
        ministerios: nuevosMinisterios
      }, { merge: true });
    } catch (error) {
      console.error("Error al guardar catálogos en Firebase:", error);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e0',
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box'
  };

  const miembrosFiltrados = miembros.filter(m => {
    const coincideBusqueda = (m.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) || 
                            (m.email || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                            (m.telefono || '').includes(busqueda);
    
    const nivelesMiembro = m.niveles || (m.nivel ? [m.nivel] : []);
    const ministeriosMiembro = m.ministerios || (m.ministerio ? [m.ministerio] : []);

    const coincideNivel = filtroNivel === 'Todos' || nivelesMiembro.includes(filtroNivel);
    const coincideMinisterio = filtroMinisterio === 'Todos' || ministeriosMiembro.includes(filtroMinisterio);
    
    return coincideBusqueda && coincideNivel && coincideMinisterio;
  });

  const obtenerCumpleañerosMes = () => {
    const mesActual = new Date().getMonth() + 1;
    return membrosFiltradosPorMes => miembros.filter(m => {
      if (!m.nacimiento) return false;
      const partes = m.nacimiento.split('-');
      const mesNacimiento = parseInt(partes[1], 10);
      return mesNacimiento === mesActual;
    });
  };

  const enviarFelicitacionWhatsApp = (nombre, telefono) => {
    const telefonoLimpio = (telefono || '').replace(/\D/g, '');
    const mensaje = encodeURIComponent(`¡Hola ${nombre}! 🎂 De parte de la pastoral queremos desearte un muy feliz cumpleaños. Que Dios te bendiga grandemente en este nuevo año de vida.`);
    const urlWhatsApp = `https://wa.me/${telefonoLimpio}?text=${mensaje}`;
    window.open(urlWhatsApp, '_blank');
  };

  // --- GESTIÓN DE NIVELES (CATÁLOGO) ---
  const agregarNivelCat = async (e) => {
    e.preventDefault();
    if (nuevoNivelCat.trim() && !listaNivelesCat.includes(nuevoNivelCat.trim())) {
      const nuevaLista = [...listaNivelesCat, nuevoNivelCat.trim()];
      setListaNivelesCat(nuevaLista);
      await guardarCatalogosEnFirebase(nuevaLista, listaMinisteriosCat);
      setNuevoNivelCat('');
    }
  };

  const eliminarNivelCat = async (nivelAEliminar) => {
    if (window.confirm(`¿Deseas eliminar el nivel "${nivelAEliminar}"?`)) {
      const nuevaLista = listaNivelesCat.filter(n => n !== nivelAEliminar);
      setListaNivelesCat(nuevaLista);
      await guardarCatalogosEnFirebase(nuevaLista, listaMinisteriosCat);
    }
  };

  const guardarEdicionNivel = async (indexOriginal) => {
    if (!valorEditNivel.trim()) return;
    const nuevaLista = [...listaNivelesCat];
    nuevaLista[indexOriginal] = valorEditNivel.trim();
    setListaNivelesCat(nuevaLista);
    setEditandoNivelIndex(null);
    setValorEditNivel('');
    await guardarCatalogosEnFirebase(nuevaLista, listaMinisteriosCat);
  };

  // --- GESTIÓN DE MINISTERIOS (CATÁLOGO) ---
  const agregarMinisterioCat = async (e) => {
    e.preventDefault();
    if (nuevoMinisterioCat.trim() && !listaMinisteriosCat.includes(nuevoMinisterioCat.trim())) {
      const nuevaLista = [...listaMinisteriosCat, nuevoMinisterioCat.trim()];
      setListaMinisteriosCat(nuevaLista);
      await guardarCatalogosEnFirebase(listaNivelesCat, nuevaLista);
      setNuevoMinisterioCat('');
    }
  };

  const eliminarMinisterioCat = async (ministerioAEliminar) => {
    if (window.confirm(`¿Deseas eliminar el ministerio "${ministerioAEliminar}"?`)) {
      const nuevaLista = listaMinisteriosCat.filter(m => m !== ministerioAEliminar);
      setListaMinisteriosCat(nuevaLista);
      await guardarCatalogosEnFirebase(listaNivelesCat, nuevaLista);
    }
  };

  const guardarEdicionMinisterio = async (indexOriginal) => {
    if (!valorEditMinisterio.trim()) return;
    const nuevaLista = [...listaMinisteriosCat];
    nuevaLista[indexOriginal] = valorEditMinisterio.trim();
    setListaMinisteriosCat(nuevaLista);
    setEditandoMinisterioIndex(null);
    setValorEditMinisterio('');
    await guardarCatalogosEnFirebase(listaNivelesCat, nuevaLista);
  };

  // --- GESTIÓN DE CÉLULAS EN FIREBASE ---
  const agregarCelula = async (e) => {
    e.preventDefault();
    if (nuevaCelula.nombre.trim() && nuevaCelula.lider.trim()) {
      try {
        const celulaObj = { ...nuevaCelula, miembrosCount: 0 };
        const docRef = await addDoc(collection(db, 'celulas'), celulaObj);
        setCelulas([...celulas, { id: docRef.id, ...celulaObj }]);
        setNuevaCelula({ nombre: '', lider: '', dia: 'Miércoles' });
      } catch (error) {
        console.error("Error al agregar célula:", error);
      }
    }
  };

  const eliminarCelula = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta célula?')) {
      try {
        await deleteDoc(doc(db, 'celulas', id));
        setCelulas(celulas.filter(c => c.id !== id));
      } catch (error) {
        console.error("Error al eliminar célula:", error);
      }
    }
  };

  const agregarNotaPastoral = async (e) => {
    e.preventDefault();
    if (!nuevaNota.trim() || !miembroSeleccionado) return;

    const notasActualizadas = [nuevaNota.trim(), ...(miembroSeleccionado.notasPastorales || [])];
    
    try {
      const miembroRef = doc(db, 'miembros', miembroSeleccionado.id);
      await updateDoc(miembroRef, { notasPastorales: notasActualizadas });

      const miembrosActualizados = miembros.map(m => {
        if (m.id === miembroSeleccionado.id) {
          return { ...m, notasPastorales: notasActualizadas };
        }
        return m;
      });

      setMiembros(miembrosActualizados);
      setMiembroSeleccionado({ ...miembroSeleccionado, notasPastorales: notasActualizadas });
      setNuevaNota('');
    } catch (error) {
      console.error("Error al guardar la nota pastoral en Firebase:", error);
    }
  };

  const handleCheckboxChange = (campo, valor) => {
    const seleccionActual = nuevoMiembroForm[campo] || [];
    if (seleccionActual.includes(valor)) {
      setNuevoMiembroForm({
        ...nuevoMiembroForm,
        [campo]: seleccionActual.filter(item => item !== valor)
      });
    } else {
      setNuevoMiembroForm({
        ...nuevoMiembroForm,
        [campo]: [...seleccionActual, valor]
      });
    }
  };

  const guardarNuevoMiembro = async (e) => {
    e.preventDefault();
    if (!nuevoMiembroForm.nombre.trim()) {
      alert('El nombre del miembro es obligatorio.');
      return;
    }

    try {
      if (modoEdicion) {
        const miembroRef = doc(db, 'miembros', idMiembroEditando);
        await updateDoc(miembroRef, nuevoMiembroForm);

        setMiembros(miembros.map(m => m.id === idMiembroEditando ? { ...m, ...nuevoMiembroForm } : m));
        alert('¡Ficha actualizada exitosamente en Firebase!');
      } else {
        const nuevoMiembroObjeto = {
          nombre: nuevoMiembroForm.nombre,
          telefono: nuevoMiembroForm.telefono,
          email: nuevoMiembroForm.email,
          direccion: nuevoMiembroForm.direccion,
          nacimiento: nuevoMiembroForm.nacimiento || null,
          conversion: nuevoMiembroForm.conversion || null,
          niveles: nuevoMiembroForm.niveles,
          ministerios: nuevoMiembroForm.ministerios,
          notasPastorales: []
        };

        const docRef = await addDoc(collection(db, 'miembros'), nuevoMiembroObjeto);
        const miembroConId = { id: docRef.id, ...nuevoMiembroObjeto };
        setMiembros([miembroConId, ...miembros]);

        alert('¡Ficha guardada exitosamente en Firebase!');
      }

      cerrarModalMiembro();
    } catch (error) {
      console.error("Error al guardar en Firebase: ", error);
      alert("Hubo un error al guardar en la base de datos: " + error.message);
    }
  };

  const abrirModalEdicion = (miembro) => {
    setModoEdicion(true);
    setIdMiembroEditando(miembro.id);
    setNuevoMiembroForm({
      nombre: miembro.nombre || '',
      telefono: miembro.telefono || '',
      email: miembro.email || '',
      direccion: miembro.direccion || '',
      nacimiento: miembro.nacimiento || '',
      conversion: miembro.conversion || '',
      niveles: miembro.niveles || (miembro.nivel ? [miembro.nivel] : []),
      ministerios: miembro.ministerios || (miembro.ministerio ? [miembro.ministerio] : [])
    });
    setModalNuevoMiembroAbierto(true);
  };

  const eliminarMiembro = async (id) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta ficha de miembro?')) {
      try {
        await deleteDoc(doc(db, 'miembros', id));
        setMiembros(miembros.filter(m => m.id !== id));
        if (miembroSeleccionado && miembroSeleccionado.id === id) {
          setMiembroSeleccionado(null);
        }
      } catch (error) {
        console.error("Error al eliminar el miembro de Firebase:", error);
        alert("No se pudo eliminar el registro: " + error.message);
      }
    }
  };

  const cerrarModalMiembro = () => {
    setModalNuevoMiembroAbierto(false);
    setModoEdicion(false);
    setIdMiembroEditando(null);
    setNuevoMiembroForm({
      nombre: '',
      telefono: '',
      email: '',
      direccion: '',
      nacimiento: '',
      conversion: '',
      niveles: [],
      ministerios: []
    });
  };

  const registrarAsistenciaCelula = (celulaId, estado) => {
    setAsistenciaRegistrada({ ...asistenciaRegistrada, [celulaId]: estado });
  };

  const ejecutarExportacion = () => {
    alert(`Exportando datos en formato ${formatoExport.toUpperCase()} ${incluirNotasExport ? 'con notas pastorales' : 'sin notas pastorales'}.`);
  };

  return (
    <div style={{ fontFamily: temaPersonalizado.tipografia, background: temaPersonalizado.fondo, minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* ENCABEZADO Y MENÚ DE NAVEGACIÓN */}
        <header style={{ 
          background: temaPersonalizado.primario, 
          color: '#fff', 
          padding: '20px 30px', 
          borderRadius: '8px', 
          marginBottom: '20px', 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: temaPersonalizado.orientacionEncabezado === 'centro' ? 'center' : temaPersonalizado.orientacionEncabezado === 'derecha' ? 'flex-end' : 'flex-start',
          textAlign: temaPersonalizado.orientacionEncabezado,
          gap: '15px' 
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: temaPersonalizado.tituloTamano, color: temaPersonalizado.tituloColor }}>⛪ Congregación 360</h1>
            <p style={{ margin: '5px 0 0 0', fontSize: temaPersonalizado.subtituloTamano, color: temaPersonalizado.subtituloColor }}>Gestión de miembros y comunidad eclesiástica</p>
          </div>
          <nav style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: temaPersonalizado.orientacionEncabezado === 'centro' ? 'center' : temaPersonalizado.orientacionEncabezado === 'derecha' ? 'flex-end' : 'flex-start', width: '100%' }}>
            <button 
              onClick={() => setVistaActiva('directorio')}
              style={{ background: vistaActiva === 'directorio' ? temaPersonalizado.secundario : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Directorio
            </button>
            <button 
              onClick={() => setVistaActiva('celulas')}
              style={{ background: vistaActiva === 'celulas' ? temaPersonalizado.secundario : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Células y Asistencias
            </button>
            <button 
              onClick={() => setVistaActiva('cumpleanos')}
              style={{ background: vistaActiva === 'cumpleanos' ? temaPersonalizado.secundario : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              🎂 Cumpleaños
            </button>
            <button 
              onClick={() => setVistaActiva('estadisticas')}
              style={{ background: vistaActiva === 'estadisticas' ? temaPersonalizado.secundario : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Estadísticas
            </button>
            <button 
              onClick={() => setVistaActiva('exportar')}
              style={{ background: vistaActiva === 'exportar' ? temaPersonalizado.secundario : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Exportar
            </button>
            <button 
              onClick={() => setVistaActiva('ajustes')}
              style={{ background: vistaActiva === 'ajustes' ? temaPersonalizado.secundario : 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.3)', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              ⚙️ Ajustes
            </button>
          </nav>
        </header>

        {/* SECCIÓN 1: VISTA DE DIRECTORIO Y BÚSQUEDA */}
        {vistaActiva === 'directorio' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
              <div style={{ flex: 1, minWidth: '280px' }}>
                <input 
                  type="text" 
                  placeholder="Buscar miembro por nombre, teléfono o email..." 
                  value={busqueda} 
                  onChange={(e) => setBusqueda(e.target.value)} 
                  style={{ ...inputStyle, background: '#fff' }} 
                />
              </div>
              <button 
                onClick={() => { setModoEdicion(false); setModalNuevoMiembroAbierto(true); }}
                style={{ background: temaPersonalizado.boton, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
              >
                ➕ Agregar Nueva Ficha
              </button>
            </div>

            <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '5px' }}>Filtrar por Nivel</label>
                <select value={filtroNivel} onChange={(e) => setFiltroNivel(e.target.value)} style={inputStyle}>
                  <option value="Todos">Todos los niveles</option>
                  {listaNivelesCat.map((niv, i) => <option key={i} value={niv}>{niv}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '5px' }}>Filtrar por Ministerio</label>
                <select value={filtroMinisterio} onChange={(e) => setFiltroMinisterio(e.target.value)} style={inputStyle}>
                  <option value="Todos">Todos los ministerios</option>
                  {listaMinisteriosCat.map((min, i) => <option key={i} value={min}>{min}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {miembrosFiltrados.length === 0 ? (
                <div style={{ background: '#fff', padding: '40px', borderRadius: '8px', textAlign: 'center', gridColumn: '1 / -1', color: '#718096' }}>
                  No se encontraron miembros registrados en Firebase con los filtros actuales.
                </div>
              ) : (
                miembrosFiltrados.map((m) => {
                  const nivelesArr = m.niveles || (m.nivel ? [m.nivel] : []);
                  const ministeriosArr = m.ministerios || (m.ministerio ? [m.ministerio] : []);

                  return (
                    <div key={m.id} style={{ background: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: `4px solid ${temaPersonalizado.secundario}` }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                          <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.2rem' }}>{m.nombre}</h3>
                        </div>
                        <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#4a5568' }}>📞 {m.telefono || 'Sin teléfono'}</p>
                        <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#4a5568' }}>✉️ {m.email || 'Sin email'}</p>
                        
                        <div style={{ margin: '8px 0 4px 0' }}>
                          <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block', marginBottom: '2px' }}>Niveles:</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {nivelesArr.length === 0 ? <span style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Ninguno</span> : 
                              nivelesArr.map((n, idx) => (
                                <span key={idx} style={{ background: '#ebf8ff', color: '#2b6cb0', padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  {n}
                                </span>
                              ))
                            }
                          </div>
                        </div>

                        <div style={{ margin: '8px 0' }}>
                          <span style={{ fontSize: '0.75rem', color: '#718096', display: 'block', marginBottom: '2px' }}>Ministerios:</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {ministeriosArr.length === 0 ? <span style={{ fontSize: '0.8rem', color: '#a0aec0' }}>Ninguno</span> : 
                              ministeriosArr.map((min, idx) => (
                                <span key={idx} style={{ background: '#f0fff4', color: '#22543d', padding: '2px 6px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                  {min}
                                </span>
                              ))
                            }
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <button 
                          onClick={() => setMiembroSeleccionado(m)}
                          style={{ background: '#edf2f7', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', color: '#2d3748' }}
                        >
                          📝 Notas ({m.notasPastorales ? m.notasPastorales.length : 0})
                        </button>
                        
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => abrirModalEdicion(m)}
                            style={{ background: '#feebc8', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', color: '#744210' }}
                            title="Editar ficha"
                          >
                            ✏️ Editar
                          </button>
                          <button 
                            onClick={() => eliminarMiembro(m.id)}
                            style={{ background: '#fed7d7', border: 'none', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem', color: '#9b2c2c' }}
                            title="Eliminar ficha"
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* SECCIÓN: GESTIONAR CÉLULAS Y ASISTENCIAS */}
        {vistaActiva === 'celulas' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>🌱 Registrar Nueva Célula</h3>
              <form onSubmit={agregarCelula} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', alignItems: 'flex-end' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Nombre de Célula</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Célula Esperanza" 
                    value={nuevaCelula.nombre} 
                    onChange={(e) => setNuevaCelula({ ...nuevaCelula, nombre: e.target.value })} 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Líder Encargado</label>
                  <input 
                    type="text" 
                    placeholder="Nombre del líder" 
                    value={nuevaCelula.lider} 
                    onChange={(e) => setNuevaCelula({ ...nuevaCelula, lider: e.target.value })} 
                    style={inputStyle} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Día de Reunión</label>
                  <select 
                    value={nuevaCelula.dia} 
                    onChange={(e) => setNuevaCelula({ ...nuevaCelula, dia: e.target.value })} 
                    style={inputStyle}
                  >
                    <option value="Lunes">Lunes</option>
                    <option value="Martes">Martes</option>
                    <option value="Miércoles">Miércoles</option>
                    <option value="Jueves">Jueves</option>
                    <option value="Viernes">Viernes</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Domingo">Domingo</option>
                  </select>
                </div>
                <button type="submit" style={{ background: temaPersonalizado.boton, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', height: '42px' }}>
                  Crear Célula
                </button>
              </form>
            </div>

            <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>📋 Listado de Células y Control de Asistencia</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {celulas.map((cel) => (
                  <div key={cel.id} style={{ background: '#f7fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <h4 style={{ margin: '0 0 5px 0', color: '#2d3748', fontSize: '1.1rem' }}>{cel.nombre}</h4>
                        <button 
                          onClick={() => eliminarCelula(cel.id)}
                          style={{ background: '#fed7d7', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', color: '#9b2c2c', fontWeight: 'bold' }}
                          title="Eliminar célula"
                        >
                          🗑️
                        </button>
                      </div>
                      <p style={{ margin: '3px 0', fontSize: '0.85rem', color: '#4a5568' }}>👤 Líder: <strong>{cel.lider}</strong></p>
                      <p style={{ margin: '3px 0', fontSize: '0.85rem', color: '#4a5568' }}>📅 Reunión: <strong>{cel.dia}</strong></p>
                      <p style={{ margin: '3px 0 15px 0', fontSize: '0.85rem', color: '#4a5568' }}>👥 Miembros habituales: <strong>{cel.miembrosCount}</strong></p>
                    </div>

                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '15px' }}>
                      <p style={{ margin: '0 0 8px 0', fontSize: '0.8rem', fontWeight: 'bold', color: '#718096' }}>Estado de Asistencia (Semana Actual):</p>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          onClick={() => registrarAsistenciaCelula(cel.id, 'Reportada')}
                          style={{ flex: 1, background: asistenciaRegistrada[cel.id] === 'Reportada' ? '#38a169' : '#e2e8f0', color: asistenciaRegistrada[cel.id] === 'Reportada' ? '#fff' : '#4a5568', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                          ✓ Reportada
                        </button>
                        <button 
                          onClick={() => registrarAsistenciaCelula(cel.id, 'Pendiente')}
                          style={{ flex: 1, background: asistenciaRegistrada[cel.id] === 'Pendiente' ? '#e53e3e' : '#e2e8f0', color: asistenciaRegistrada[cel.id] === 'Pendiente' ? '#fff' : '#4a5568', border: 'none', padding: '8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                        >
                          ⚠ Pendiente
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN: CUMPLEAÑEROS CON WHATSAPP */}
        {vistaActiva === 'cumpleanos' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>🎂 Cumpleañeros del Mes</h3>
            <p style={{ margin: '0 0 25px 0', fontSize: '0.9rem', color: '#718096' }}>Miembros de la congregación que celebran su cumpleaños durante el mes actual.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {obtenerCumpleañerosMes().length === 0 ? (
                <div style={{ background: '#f7fafc', padding: '30px', borderRadius: '8px', textAlign: 'center', gridColumn: '1 / -1', color: '#718096', border: '1px solid #e2e8f0' }}>
                  No hay registros de cumpleaños para este mes específico.
                </div>
              ) : (
                obtenerCumpleañerosMes().map((m) => (
                  <div key={m.id} style={{ background: '#fffaf0', border: '1px solid #feebc8', borderRadius: '8px', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, color: '#744210', fontSize: '1.1rem' }}>{m.nombre}</h4>
                        <span style={{ background: '#feebc8', color: '#975a16', padding: '3px 8px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                          🎁 {m.nacimiento}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0', fontSize: '0.85rem', color: '#718096' }}>📞 Teléfono: {m.telefono}</p>
                    </div>
                    <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #feebc8' }}>
                      <button 
                        onClick={() => enviarFelicitacionWhatsApp(m.nombre, m.telefono)}
                        style={{ width: '100%', background: '#25D366', color: '#fff', border: 'none', padding: '10px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        💬 Enviar por WhatsApp
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* SECCIÓN 2: ESTADÍSTICAS */}
        {vistaActiva === 'estadisticas' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>📊 Resumen Estadístico de la Iglesia</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#718096', fontSize: '0.9rem' }}>Total de Miembros</h4>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: temaPersonalizado.primario }}>{miembros.length}</p>
              </div>
              <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#718096', fontSize: '0.9rem' }}>Células Activas</h4>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: temaPersonalizado.secundario }}>{celulas.length}</p>
              </div>
              <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#718096', fontSize: '0.9rem' }}>Cumpleañeros del Mes</h4>
                <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: '#dd6b20' }}>{obtenerCumpleañerosMes().length}</p>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 3: EXPORTAR */}
        {vistaActiva === 'exportar' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#2d3748' }}>📥 Exportar Base de Datos</h3>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '8px', color: '#4a5568' }}>Seleccione el formato:</label>
              <select value={formatoExport} onChange={(e) => setFormatoExport(e.target.value)} style={{ ...inputStyle, maxWidth: '300px' }}>
                <option value="excel">Excel (.xlsx)</option>
                <option value="csv">CSV (.csv)</option>
                <option value="pdf">Documento PDF (.pdf)</option>
              </select>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#4a5568', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={incluirNotasExport} 
                  onChange={(e) => setIncluirNotasExport(e.target.checked)} 
                  style={{ width: '16px', height: '16px' }}
                />
                Incluir notas pastorales en la exportación
              </label>
            </div>

            <button 
              onClick={ejecutarExportacion}
              style={{ background: temaPersonalizado.boton, color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.95rem' }}
            >
              Descargar Archivo
            </button>
          </div>
        )}

        {/* SECCIÓN: AJUSTES Y CATÁLOGOS CON EDICIÓN Y ELIMINACIÓN */}
        {vistaActiva === 'ajustes' && (
          <div style={{ background: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, color: '#2d3748' }}>⚙️ Ajustes, Personalización y Catálogos</h3>
              <button 
                onClick={() => setVistaActiva('directorio')}
                style={{ background: '#e2e8f0', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#4a5568' }}
              >
                Volver al Directorio
              </button>
            </div>

            <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#2d3748' }}>🎨 Personalización de Apariencia (Tema)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Color Primario (Encabezados)</label>
                  <input 
                    type="color" 
                    value={temaPersonalizado.primario} 
                    onChange={(e) => setTemaPersonalizado({ ...temaPersonalizado, primario: e.target.value })} 
                    style={{ width: '100%', height: '38px', border: '1px solid #cbd5e0', borderRadius: '6px', cursor: 'pointer', background: '#fff' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Color Secundario / Acentos</label>
                  <input 
                    type="color" 
                    value={temaPersonalizado.secundario} 
                    onChange={(e) => setTemaPersonalizado({ ...temaPersonalizado, secundario: e.target.value })} 
                    style={{ width: '100%', height: '38px', border: '1px solid #cbd5e0', borderRadius: '6px', cursor: 'pointer', background: '#fff' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Color de Botones</label>
                  <input 
                    type="color" 
                    value={temaPersonalizado.boton} 
                    onChange={(e) => setTemaPersonalizado({ ...temaPersonalizado, boton: e.target.value })} 
                    style={{ width: '100%', height: '38px', border: '1px solid #cbd5e0', borderRadius: '6px', cursor: 'pointer', background: '#fff' }} 
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '5px' }}>Fondo General</label>
                  <input 
                    type="color" 
                    value={temaPersonalizado.fondo} 
                    onChange={(e) => setTemaPersonalizado({ ...temaPersonalizado, fondo: e.target.value })} 
                    style={{ width: '100%', height: '38px', border: '1px solid #cbd5e0', borderRadius: '6px', cursor: 'pointer', background: '#fff' }} 
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              
              {/* GESTIÓN DE NIVELES */}
              <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>Niveles / Compromisos</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                  {listaNivelesCat.map((niv, i) => (
                    <div key={i} style={{ background: '#fff', padding: '8px 12px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {editandoNivelIndex === i ? (
                        <div style={{ display: 'flex', gap: '6px', width: '100%', marginRight: '8px' }}>
                          <input 
                            type="text" 
                            value={valorEditNivel} 
                            onChange={(e) => setValorEditNivel(e.target.value)} 
                            style={{ ...inputStyle, padding: '4px 8px' }} 
                          />
                          <button onClick={() => guardarEdicionNivel(i)} style={{ background: '#38a169', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>✓</button>
                          <button onClick={() => setEditandoNivelIndex(null)} style={{ background: '#cbd5e0', color: '#2d3748', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>✕</button>
                        </div>
                      ) : (
                        <>
                          <span style={{ fontSize: '0.85rem', color: '#4a5568' }}>{niv}</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              onClick={() => { setEditandoNivelIndex(i); setValorEditNivel(niv); }}
                              style={{ background: '#feebc8', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', color: '#744210', fontWeight: 'bold' }}
                              title="Editar nivel"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => eliminarNivelCat(niv)}
                              style={{ background: '#fed7d7', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', color: '#9b2c2c', fontWeight: 'bold' }}
                              title="Eliminar nivel"
                            >
                              🗑️
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <form onSubmit={agregarNivelCat} style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Nuevo nivel..." 
                    value={nuevoNivelCat} 
                    onChange={(e) => setNuevoNivelCat(e.target.value)} 
                    style={inputStyle} 
                  />
                  <button type="submit" style={{ background: temaPersonalizado.boton, color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                </form>
              </div>

              {/* GESTIÓN DE MINISTERIOS */}
              <div style={{ background: '#f7fafc', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>Ministerios</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
                  {listaMinisteriosCat.map((min, i) => (
                    <div key={i} style={{ background: '#fff', padding: '8px 12px', borderRadius: '4px', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {editandoMinisterioIndex === i ? (
                        <div style={{ display: 'flex', gap: '6px', width: '100%', marginRight: '8px' }}>
                          <input 
                            type="text" 
                            value={valorEditMinisterio} 
                            onChange={(e) => setValorEditMinisterio(e.target.value)} 
                            style={{ ...inputStyle, padding: '4px 8px' }} 
                          />
                          <button onClick={() => guardarEdicionMinisterio(i)} style={{ background: '#38a169', color: '#fff', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>✓</button>
                          <button onClick={() => setEditandoMinisterioIndex(null)} style={{ background: '#cbd5e0', color: '#2d3748', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>✕</button>
                        </div>
                      ) : (
                        <>
                          <span style={{ fontSize: '0.85rem', color: '#4a5568' }}>{min}</span>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              onClick={() => { setEditandoMinisterioIndex(i); setValorEditMinisterio(min); }}
                              style={{ background: '#feebc8', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', color: '#744210', fontWeight: 'bold' }}
                              title="Editar ministerio"
                            >
                              ✏️
                            </button>
                            <button 
                              onClick={() => eliminarMinisterioCat(min)}
                              style={{ background: '#fed7d7', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', color: '#9b2c2c', fontWeight: 'bold' }}
                              title="Eliminar ministerio"
                            >
                              🗑️
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <form onSubmit={agregarMinisterioCat} style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Nuevo ministerio..." 
                    value={nuevoMinisterioCat} 
                    onChange={(e) => setNuevoMinisterioCat(e.target.value)} 
                    style={inputStyle} 
                  />
                  <button type="submit" style={{ background: temaPersonalizado.boton, color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>+</button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* MODAL / DETALLE DE NOTAS PASTORALES */}
        {miembroSeleccionado && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '8px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#2d3748', fontSize: '1.3rem' }}>{miembroSeleccionado.nombre}</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#718096' }}>Ficha de Miembro y Notas Pastorales</p>
                </div>
                <button 
                  onClick={() => setMiembroSeleccionado(null)}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#718096' }}
                >
                  ✕
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', background: '#f7fafc', padding: '15px', borderRadius: '6px', marginBottom: '20px', fontSize: '0.9rem' }}>
                <div>📞 <strong>Teléfono:</strong> {miembroSeleccionado.telefono || 'No registrado'}</div>
                <div>✉️ <strong>Email:</strong> {miembroSeleccionado.email || 'No registrado'}</div>
                <div>📍 <strong>Dirección:</strong> {miembroSeleccionado.direccion || 'No registrada'}</div>
                <div>🎂 <strong>Nacimiento:</strong> {miembroSeleccionado.nacimiento || 'No registrada'}</div>
                <div>🕊️ <strong>Conversión:</strong> {miembroSeleccionado.conversion || 'No registrada'}</div>
              </div>

              <h4 style={{ margin: '0 0 10px 0', color: '#2d3748' }}>Notas Pastorales</h4>
              
              <form onSubmit={agregarNotaPastoral} style={{ marginBottom: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <textarea 
                  rows="3" 
                  placeholder="Escribe una nueva nota pastoral..." 
                  value={nuevaNota} 
                  onChange={(e) => setNuevaNota(e.target.value)} 
                  style={{ ...inputStyle, resize: 'vertical' }}
                />
                <button type="submit" style={{ background: temaPersonalizado.boton, color: '#fff', border: 'none', padding: '8px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', alignSelf: 'flex-end' }}>
                  Agregar Nota
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                {(!miembroSeleccionado.notasPastorales || miembroSeleccionado.notasPastorales.length === 0) ? (
                  <p style={{ fontSize: '0.85rem', color: '#718096', textAlign: 'center', margin: '10px 0' }}>No hay notas pastorales registradas para este miembro.</p>
                ) : (
                  miembroSeleccionado.notasPastorales.map((nota, i) => (
                    <div key={i} style={{ background: '#fffaf0', border: '1px solid #feebc8', padding: '10px', borderRadius: '6px', fontSize: '0.85rem', color: '#744210' }}>
                      {nota}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* MODAL PARA AGREGAR O EDITAR FICHA DE MIEMBRO */}
        {modalNuevoMiembroAbierto && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
            <div style={{ background: '#fff', width: '100%', maxWidth: '600px', borderRadius: '8px', padding: '25px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', color: '#2d3748', fontSize: '1.3rem' }}>
                    {modoEdicion ? '✏️ Editar Ficha de Miembro' : '➕ Agregar Nueva Ficha de Miembro'}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#718096' }}>
                    {modoEdicion ? 'Modifica los datos necesarios del miembro.' : 'Ingresa los datos generales para registrarlo en Firebase.'}
                  </p>
                </div>
                <button 
                  onClick={cerrarModalMiembro}
                  style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#718096' }}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={guardarNuevoMiembro} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '5px' }}>Nombre completo *</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Ana Sofía Martínez" 
                    value={nuevoMiembroForm.nombre} 
                    onChange={(e) => setNuevoMiembroForm({ ...nuevoMiembroForm, nombre: e.target.value })} 
                    style={inputStyle} 
                    required 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '5px' }}>Teléfono</label>
                    <input 
                      type="text" 
                      placeholder="Ej. 55512345" 
                      value={nuevoMiembroForm.telefono} 
                      onChange={(e) => setNuevoMiembroForm({ ...nuevoMiembroForm, telefono: e.target.value })} 
                      style={inputStyle} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '5px' }}>Correo Electrónico</label>
                    <input 
                      type="email" 
                      placeholder="Ej. ana@email.com" 
                      value={nuevoMiembroForm.email} 
                      onChange={(e) => setNuevoMiembroForm({ ...nuevoMiembroForm, email: e.target.value })} 
                      style={inputStyle} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '5px' }}>Dirección</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Col. Las Acacias #45" 
                    value={nuevoMiembroForm.direccion} 
                    onChange={(e) => setNuevoMiembroForm({ ...nuevoMiembroForm, direccion: e.target.value })} 
                    style={inputStyle} 
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '5px' }}>Fecha de Nacimiento</label>
                    <input 
                      type="date" 
                      value={nuevoMiembroForm.nacimiento} 
                      onChange={(e) => setNuevoMiembroForm({ ...nuevoMiembroForm, nacimiento: e.target.value })} 
                      style={inputStyle} 
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '5px' }}>Fecha de Conversión</label>
                    <input 
                      type="date" 
                      value={nuevoMiembroForm.conversion} 
                      onChange={(e) => setNuevoMiembroForm({ ...nuevoMiembroForm, conversion: e.target.value })} 
                      style={inputStyle} 
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '8px' }}>Niveles / Compromisos (Selecciona uno o más)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', background: '#f7fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    {listaNivelesCat.map((niv, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#4a5568', cursor: 'pointer' }}>
                        <input 
                          type="checkbox"
                          checked={(nuevoMiembroForm.niveles || []).includes(niv)}
                          onChange={() => handleCheckboxChange('niveles', niv)}
                          style={{ width: '15px', height: '15px' }}
                        />
                        {niv}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 'bold', color: '#2d3748', marginBottom: '8px' }}>Ministerios (Selecciona uno o más)</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '8px', background: '#f7fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                    {listaMinisteriosCat.map((min, i) => (
                      <label key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#4a5568', cursor: 'pointer' }}>
                        <input 
                          type="checkbox"
                          checked={(nuevoMiembroForm.ministerios || []).includes(min)}
                          onChange={() => handleCheckboxChange('ministerios', min)}
                          style={{ width: '15px', height: '15px' }}
                        />
                        {min}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' }}>
                  <button 
                    type="button" 
                    onClick={cerrarModalMiembro}
                    style={{ background: '#e2e8f0', color: '#4a5568', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit" 
                    style={{ background: temaPersonalizado.boton, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    {modoEdicion ? 'Guardar Cambios' : 'Guardar Ficha'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}