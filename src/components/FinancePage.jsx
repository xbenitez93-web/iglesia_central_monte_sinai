import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';

function FinancePage() {
  const [transacciones, setTransacciones] = useState([]);
  const [miembrosDirectorio, setMiembrosDirectorio] = useState([]);

  const [tipoSeleccionado, setTipoSeleccionado] = useState('Diezmo');
  const [miembroInput, setMiembroInput] = useState('');
  const [montoInput, setMontoInput] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');

  // 1. Cargar Transacciones y Miembros desde Firebase en tiempo real
  useEffect(() => {
    // Escuchar finanzas desde Firebase
    const unsubFinanzas = onSnapshot(collection(db, 'finanzas'), (snapshot) => {
      const listaTx = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setTransacciones(listaTx);
    });

    // Escuchar miembros desde Firebase (para el selector)
    const unsubMiembros = onSnapshot(collection(db, 'miembros'), (snapshot) => {
      const listaMiembros = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        nombre: docSnap.data().nombre || docSnap.data().email || 'Sin nombre'
      }));
      setMiembrosDirectorio(listaMiembros);
    });

    return () => {
      unsubFinanzas();
      unsubMiembros();
    };
  }, []);

  const abrirModalCrear = () => {
    setIdEditando(null);
    setTipoSeleccionado('Diezmo');
    setMiembroInput('');
    setMontoInput('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (tx) => {
    setIdEditando(tx.id);
    setTipoSeleccionado(tx.tipo);
    setMiembroInput(tx.miembro === 'Anónimo' ? '' : tx.miembro);
    setMontoInput(tx.monto);
    setMostrarModal(true);
  };

  const guardarTransaccion = async (e) => {
    e.preventDefault();
    const monto = parseFloat(montoInput);
    if (!monto || monto <= 0) return;

    const nombreFinal = miembroInput.trim() === '' ? 'Anónimo' : miembroInput.trim();

    try {
      if (idEditando !== null) {
        // Actualizar documento existente en Firestore
        const docRef = doc(db, 'finanzas', idEditando);
        await updateDoc(docRef, {
          tipo: tipoSeleccionado,
          miembro: nombreFinal,
          monto: monto,
        });
      } else {
        // Crear nuevo documento en Firestore
        await addDoc(collection(db, 'finanzas'), {
          tipo: tipoSeleccionado,
          miembro: nombreFinal,
          monto: monto,
          cantidad: monto, // Guardamos ambos por compatibilidad con el dashboard
          fecha: new Date().toLocaleDateString('es-ES'),
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error("Error al guardar la transacción en Firebase:", error);
    }

    setMostrarModal(false);
    setIdEditando(null);
    setMiembroInput('');
    setMontoInput('');
  };

  const eliminarTransaccion = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este registro financiero?")) {
      try {
        await deleteDoc(doc(db, 'finanzas', id));
      } catch (error) {
        console.error("Error al eliminar el registro:", error);
      }
    }
  };

  const transaccionesFiltradas = filtroCategoria === 'Todos' 
    ? transacciones 
    : transacciones.filter(tx => tx.tipo === filtroCategoria);

  const totalIngresos = transaccionesFiltradas.reduce((sum, item) => sum + Number(item.monto || item.cantidad || 0), 0);

  const categorias = [
    'Todos',
    'Diezmo',
    'Ofrenda',
    'Consagración de ofrendas',
    'Ofrenda especial',
    'Diezmo de diezmo'
  ];

  return (
    <div style={{ padding: '40px', backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      {/* SECCIÓN MODIFICADA: Título centrado y más grande */}
      <header style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px', textAlign: 'center', width: '100%' }}>
        <h1 style={{ color: '#0c0d0e', fontSize: '4.5rem', margin: '0 0 10px 0' }}>Finanzas y Mayordomía</h1>
        <p style={{ color: '#718096', margin: 0, fontSize: '1.rem' }}>Control de diezmos, ofrendas, consagraciones y aportes especiales.</p>
        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end', marginTop: '-40px' }}>
          <button 
            onClick={abrirModalCrear}
            style={{ background: '#319795', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + Registrar Ingreso
          </button>
        </div>
      </header>
      {/* FIN DE SECCIÓN MODIFICADA */}

      {/* Pestañas de Filtro por Categoría */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '15px' }}>
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltroCategoria(cat)}
            style={{
              background: filtroCategoria === cat ? '#319795' : '#fff',
              color: filtroCategoria === cat ? '#fff' : '#0c0c0c',
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
            {cat}
          </button>
        ))}
      </div>

      {/* Tarjeta de Resumen Financiero */}
      <div style={{ background: '#e6fffa', border: '1px solid #b2f5ea', padding: '20px', borderRadius: '8px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div>
          <span style={{ color: '#718096', fontSize: '0.9rem' }}>Total en: <strong>{filtroCategoria}</strong></span>
          <h3 style={{ margin: '4px 0 0 0', color: '#234e52', fontSize: '1.2rem' }}>Balance Recaudado</h3>
        </div>
        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#2b6cb0' }}>
          Lps {totalIngresos.toFixed(2)}
        </div>
      </div>

      {/* Lista de Transacciones */}
      <div style={{ background: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid #edf2f7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#2d3748' }}>Historial ({filtroCategoria})</h3>
          <span style={{ fontSize: '0.85rem', color: '#718096' }}>{transaccionesFiltradas.length} registros encontrados</span>
        </div>
        {transaccionesFiltradas.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#a0aec0' }}>No hay transacciones registradas en esta categoría.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {transaccionesFiltradas.map((tx) => (
              <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #edf2f7' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ background: '#e6fffa', color: '#319795', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.2rem' }}>
                    💰
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', color: '#2d3748' }}>{tx.miembro}</h4>
                    <span style={{ fontSize: '0.85rem', color: '#718096', background: '#edf2f7', padding: '2px 8px', borderRadius: '4px' }}>{tx.tipo}</span>
                    <span style={{ fontSize: '0.85rem', color: '#a0aec0', marginLeft: '10px' }}>{tx.fecha}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#38a169' }}>
                    + Lps {Number(tx.monto || tx.cantidad || 0).toFixed(2)}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => abrirModalEditar(tx)}
                      style={{ background: '#ebf8ff', color: '#3182ce', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                    >
                      Editar
                    </button>
                    <button 
                      onClick={() => eliminarTransaccion(tx.id)}
                      style={{ background: '#fff5f5', color: '#e53e3e', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold' }}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para Registrar / Editar Ingreso */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <form onSubmit={guardarTransaccion} style={{ background: '#fff', width: '100%', maxWidth: '450px', borderRadius: '10px', padding: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#2d3748', fontSize: '1.3rem' }}>
                {idEditando !== null ? 'Editar Ingreso' : 'Registrar Nuevo Ingreso'}
              </h2>
              <button type="button" onClick={() => setMostrarModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Categoría / Tipo de Ingreso</label>
                <select 
                  value={tipoSeleccionado} 
                  onChange={(e) => setTipoSeleccionado(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff' }}
                >
                  <option value="Diezmo">Diezmo</option>
                  <option value="Ofrenda">Ofrenda</option>
                  <option value="Consagración de ofrendas">Consagración de ofrendas</option>
                  <option value="Ofrenda especial">Ofrenda especial</option>
                  <option value="Diezmo de diezmo">Diezmo de diezmo</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Miembro Aportante</label>
                <select 
                  value={miembroInput}
                  onChange={(e) => setMiembroInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff' }}
                >
                  <option value="">Anónimo (Sin miembro asignado)</option>
                  {miembrosDirectorio.map((m) => (
                    <option key={m.id} value={m.nombre}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Monto (Lps) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={montoInput}
                  onChange={(e) => setMontoInput(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  required
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
                {idEditando !== null ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default FinancePage;