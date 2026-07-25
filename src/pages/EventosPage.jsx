import React, { useState, useEffect } from 'react';
import { db } from '../firebase.js'; // Asegúrate de que la ruta a tu archivo firebase.js sea correcta
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';

function EventosPage() {
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [tituloInput, setTituloInput] = useState('');
  const [tipoInput, setTipoInput] = useState('Culto');
  const [fechaInput, setFechaInput] = useState('');
  const [horaInput, setHoraInput] = useState('');
  const [lugarInput, setLugarInput] = useState('');
  const [descripcionInput, setDescripcionInput] = useState('');
  
  const [mostrarModal, setMostrarModal] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('Todos');

  // Cargar eventos desde Firebase al iniciar la página
  const cargarEventos = async () => {
    try {
      setCargando(true);
      const querySnapshot = await getDocs(collection(db, "eventos"));
      const listaEventos = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setEventos(listaEventos);
    } catch (error) {
      console.error("Error al cargar eventos de Firebase: ", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarEventos();
  }, []);

  const abrirModalCrear = () => {
    setIdEditando(null);
    setTituloInput('');
    setTipoInput('Culto');
    setFechaInput('');
    setHoraInput('');
    setLugarInput('');
    setDescripcionInput('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (ev) => {
    setIdEditando(ev.id);
    setTituloInput(ev.titulo);
    setTipoInput(ev.tipo);
    setFechaInput(ev.fecha);
    setHoraInput(ev.hora || '');
    setLugarInput(ev.lugar || '');
    setDescripcionInput(ev.descripcion || '');
    setMostrarModal(true);
  };

  const guardarEvento = async (e) => {
    e.preventDefault();
    if (!tituloInput.trim() || !fechaInput) return;

    const datosEvento = {
      titulo: tituloInput.trim(),
      tipo: tipoInput,
      fecha: fechaInput,
      hora: horaInput,
      lugar: lugarInput.trim(),
      descripcion: descripcionInput.trim()
    };

    try {
      if (idEditando !== null) {
        // Actualizar evento existente en Firebase
        const eventoRef = doc(db, "eventos", idEditando);
        await updateDoc(eventoRef, datosEvento);
      } else {
        // Crear nuevo evento en la colección raíz 'eventos' de Firebase
        await addDoc(collection(db, "eventos"), datosEvento);
      }

      // Recargar la lista de eventos desde Firebase
      await cargarEventos();
      setMostrarModal(false);
      setIdEditando(null);
    } catch (error) {
      console.error("Error al guardar el evento en Firebase: ", error);
      alert("Hubo un error al guardar el evento.");
    }
  };

  const eliminarEvento = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este evento de la base de datos?")) {
      try {
        await deleteDoc(doc(db, "eventos", id));
        // Actualizar la lista local filtrando el eliminado
        setEventos(eventos.filter(ev => ev.id !== id));
      } catch (error) {
        console.error("Error al eliminar el evento: ", error);
        alert("Hubo un error al eliminar el evento.");
      }
    }
  };

  const tiposEvento = ['Todos', 'Culto', 'Ensayo', 'Boda', 'Comunidad', 'Otro'];

  const eventosFiltrados = filtroTipo === 'Todos' 
    ? eventos 
    : eventos.filter(ev => ev.tipo === filtroTipo);

  return (
    <div style={{ padding: '40px', backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ color: '#2d3748', fontSize: '2rem', margin: '0 0 5px 0' }}>Calendario y Eventos</h1>
          <p style={{ color: '#718096', margin: 0 }}>Planificación de cultos especiales, ensayos, bodas y actividades de la comunidad.</p>
        </div>
        <button 
          onClick={abrirModalCrear}
          style={{ background: '#319795', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          + Programar Evento
        </button>
      </header>

      {/* Filtros por Categoría de Evento */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '20px' }}>
        {tiposEvento.map((tipo) => (
          <button
            key={tipo}
            onClick={() => setFiltroTipo(tipo)}
            style={{
              background: filtroTipo === tipo ? '#319795' : '#fff',
              color: filtroTipo === tipo ? '#fff' : '#0d0d0e',
              border: '1px solid #cbd5e0',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            {tipo}
          </button>
        ))}
      </div>

      {/* Lista / Tarjetas de Eventos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {cargando ? (
          <div style={{ gridColumn: '1 / -1', background: '#fff', padding: '40px', textAlign: 'center', borderRadius: '8px', color: '#718096' }}>
            Cargando eventos desde la base de datos...
          </div>
        ) : eventosFiltrados.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', background: '#fff', padding: '40px', textAlign: 'center', borderRadius: '8px', color: '#a0aec0' }}>
            No hay eventos programados en esta categoría.
          </div>
        ) : (
          eventosFiltrados.map((ev) => (
            <div key={ev.id} style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #319795' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'bold', background: '#e6fffa', color: '#319795', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    {ev.tipo}
                  </span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => abrirModalEditar(ev)}
                      style={{ background: '#ebf8ff', color: '#3182ce', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => eliminarEvento(ev.id)}
                      style={{ background: '#fff5f5', color: '#e53e3e', border: 'none', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>

                <h3 style={{ margin: '0 0 8px 0', color: '#2d3748', fontSize: '1.2rem' }}>{ev.titulo}</h3>
                <p style={{ color: '#4a5568', fontSize: '0.9rem', margin: '0 0 15px 0' }}>{ev.descripcion || 'Sin descripción adicional.'}</p>
              </div>

              <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '0.85rem', color: '#718096' }}>
                <div>📅 <strong>Fecha:</strong> {ev.fecha} {ev.hora ? `a las ${ev.hora}` : ''}</div>
                <div>📍 <strong>Lugar:</strong> {ev.lugar || 'Por definir'}</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal para Crear / Editar Evento */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <form onSubmit={guardarEvento} style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '10px', padding: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#2d3748', fontSize: '1.3rem' }}>
                {idEditando !== null ? 'Editar Evento' : 'Programar Nuevo Evento'}
              </h2>
              <button type="button" onClick={() => setMostrarModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Título del Evento *</label>
                <input 
                  type="text" 
                  placeholder="Ej. Culto especial de jóvenes" 
                  value={tituloInput}
                  onChange={(e) => setTituloInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Tipo de Evento</label>
                  <select 
                    value={tipoInput} 
                    onChange={(e) => setTipoInput(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff' }}
                  >
                    <option value="Culto">Culto</option>
                    <option value="Ensayo">Ensayo</option>
                    <option value="Boda">Boda</option>
                    <option value="Comunidad">Comunidad</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Hora</label>
                  <input 
                    type="time" 
                    value={horaInput}
                    onChange={(e) => setHoraInput(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Fecha *</label>
                <input 
                  type="date" 
                  value={fechaInput}
                  onChange={(e) => setFechaInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Lugar</label>
                <input 
                  type="text" 
                  placeholder="Ej. Templo Principal / Auditorio" 
                  value={lugarInput}
                  onChange={(e) => setLugarInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Descripción</label>
                <textarea 
                  rows="3"
                  placeholder="Detalles del evento..." 
                  value={descripcionInput}
                  onChange={(e) => setDescripcionInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box', resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button 
                type="button" 
                onClick={() => setMostrarModal(false)}
                style={{ background: '#edf2f7', border: 'none', padding: '10px 15px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', color: '#4a5568' }}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                style={{ background: '#319795', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {idEditando !== null ? 'Actualizar Evento' : 'Guardar Evento'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default EventosPage;