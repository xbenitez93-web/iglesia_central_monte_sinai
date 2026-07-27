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

  // Estados del formulario y modales
  const [naturalezaMovimiento, setNaturalezaMovimiento] = useState('Ingreso'); // 'Ingreso' o 'Egreso'
  const [tipoSeleccionado, setTipoSeleccionado] = useState('Diezmo');
  const [miembroInput, setMiembroInput] = useState('');
  const [montoInput, setMontoInput] = useState('');
  const [mostrarModal, setMostrarModal] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [filtroCategoria, setFiltroCategoria] = useState('Todos');

  // 1. Cargar Transacciones y Miembros desde Firebase en tiempo real
  useEffect(() => {
    const unsubFinanzas = onSnapshot(collection(db, 'finanzas'), (snapshot) => {
      const listaTx = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      setTransacciones(listaTx);
    });

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
    setNaturalezaMovimiento('Ingreso');
    setTipoSeleccionado('Diezmo');
    setMiembroInput('');
    setMontoInput('');
    setMostrarModal(true);
  };

  const abrirModalEditar = (tx) => {
    setIdEditando(tx.id);
    const esEgreso = tx.naturaleza === 'Egreso' || tx.tipo === 'Egreso' || ['Servicios Básicos', 'Mantenimiento', 'Ayuda Social', 'Insumos / Suministros', 'Eventos y Alabanza', 'Otros Gastos'].includes(tx.tipo);
    
    setNaturalezaMovimiento(esEgreso ? 'Egreso' : 'Ingreso');
    setTipoSeleccionado(tx.tipo || (esEgreso ? 'Servicios Básicos' : 'Diezmo'));
    setMiembroInput(tx.miembro === 'Anónimo' || !tx.miembro ? '' : tx.miembro);
    setMontoInput(tx.monto || tx.cantidad || '');
    setMostrarModal(true);
  };

  const guardarTransaccion = async (e) => {
    e.preventDefault();
    const monto = parseFloat(montoInput);
    if (!monto || monto <= 0) return;

    const nombreFinal = naturalezaMovimiento === 'Egreso' 
      ? (miembroInput.trim() === '' ? 'General / Caja' : miembroInput.trim())
      : (miembroInput.trim() === '' ? 'Anónimo' : miembroInput.trim());

    try {
      if (idEditando !== null) {
        const docRef = doc(db, 'finanzas', idEditando);
        await updateDoc(docRef, {
          naturaleza: naturalezaMovimiento,
          tipo: tipoSeleccionado,
          miembro: nombreFinal,
          monto: monto,
          cantidad: monto
        });
      } else {
        await addDoc(collection(db, 'finanzas'), {
          naturaleza: naturalezaMovimiento,
          tipo: tipoSeleccionado,
          miembro: nombreFinal,
          monto: monto,
          cantidad: monto,
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

  // Función para exportar las transacciones filtradas a Excel (CSV)
  const exportarAExcel = () => {
    if (transaccionesFiltradas.length === 0) {
      alert("No hay registros para exportar.");
      return;
    }

    let csvContent = "\uFEFFID,Naturaleza,Categoria,Miembro / Proveedor,Monto (Lps),Fecha\n";

    transaccionesFiltradas.forEach(tx => {
      const esEgresoTx = tx.naturaleza === 'Egreso' || ['Servicios Básicos', 'Mantenimiento', 'Ayuda Social', 'Insumos / Suministros', 'Eventos y Alabanza', 'Otros Gastos'].includes(tx.tipo);
      const naturaleza = esEgresoTx ? 'Egreso' : 'Ingreso';
      const monto = Number(tx.monto || tx.cantidad || 0).toFixed(2);
      const miembroLimpio = `"${(tx.miembro || '').replace(/"/g, '""')}"`;
      const categoriaLimpia = `"${(tx.tipo || '').replace(/"/g, '""')}"`;
      const fecha = `"${(tx.fecha || '').replace(/"/g, '""')}"`;

      csvContent += `${tx.id},${naturaleza},${categoriaLimpia},${miembroLimpio},${monto},${fecha}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Reporte_Financiero_${filtroCategoria.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtrado de transacciones
  const transaccionesFiltradas = filtroCategoria === 'Todos' 
    ? transacciones 
    : transacciones.filter(tx => tx.tipo === filtroCategoria || (filtroCategoria === 'Egresos' && (tx.naturaleza === 'Egreso' || ['Servicios Básicos', 'Mantenimiento', 'Ayuda Social', 'Insumos / Suministros', 'Eventos y Alabanza', 'Otros Gastos'].includes(tx.tipo))));

  // Cálculos financieros
  const totalIngresos = transacciones
    .filter(tx => tx.naturaleza !== 'Egreso' && !['Servicios Básicos', 'Mantenimiento', 'Ayuda Social', 'Insumos / Suministros', 'Eventos y Alabanza', 'Otros Gastos'].includes(tx.tipo))
    .reduce((sum, item) => sum + Number(item.monto || item.cantidad || 0), 0);

  const totalEgresos = transacciones
    .filter(tx => tx.naturaleza === 'Egreso' || ['Servicios Básicos', 'Mantenimiento', 'Ayuda Social', 'Insumos / Suministros', 'Eventos y Alabanza', 'Otros Gastos'].includes(tx.tipo))
    .reduce((sum, item) => sum + Number(item.monto || item.cantidad || 0), 0);

  const balanceGeneral = totalIngresos - totalEgresos;

  const categoriasFiltro = [
    'Todos',
    'Diezmo',
    'Ofrenda',
    'Consagración de ofrendas',
    'Ofrenda especial',
    'Diezmo de diezmo',
    'Egresos'
  ];

  const categoriasIngreso = [
    'Diezmo',
    'Ofrenda',
    'Consagración de ofrendas',
    'Ofrenda especial',
    'Diezmo de diezmo'
  ];

  const categoriasEgreso = [
    'Servicios Básicos',
    'Mantenimiento',
    'Ayuda Social',
    'Insumos / Suministros',
    'Eventos y Alabanza',
    'Otros Gastos'
  ];

  return (
    <div style={{ padding: '40px', backgroundColor: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Cabecera Responsiva Corregida */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        flexWrap: 'wrap', 
        gap: '20px', 
        marginBottom: '30px', 
        width: '100%' 
      }}>
        {/* Títulos a la izquierda */}
        <div style={{ flex: '2', minWidth: '290px', textAlign: 'left' }}>
          <h1 style={{ color: '#0c0d0e', fontSize: '4rem', margin: '0 0 9px 0', lineHeight: '0.7' }}>Finanzas y Mayordomía</h1>
          <p style={{ color: '#718096', margin: 0, fontSize: '1rem' }}>Control de ingresos, salidas, diezmos y gastos de la iglesia.</p>
        </div>
        
        {/* Botones de Acción a la derecha */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button 
            onClick={exportarAExcel}
            style={{ background: '#2b6cb0', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📊 Exportar a Excel
          </button>
          <button 
            onClick={abrirModalCrear}
            style={{ background: '#319795', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            + Registrar Movimiento
          </button>
        </div>
      </header>

      {/* Pestañas de Filtro */}
      <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '15px' }}>
        {categoriasFiltro.map((cat) => (
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

      {/* Tarjetas de Resumen Financiero */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ background: '#e6fffa', border: '1px solid #b2f5ea', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <span style={{ color: '#718096', fontSize: '0.9rem' }}>Total Ingresos</span>
          <h3 style={{ margin: '4px 0 0 0', color: '#234e52', fontSize: '1.5rem' }}>Lps {totalIngresos.toFixed(2)}</h3>
        </div>
        <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <span style={{ color: '#718096', fontSize: '0.9rem' }}>Total Salidas (Egresos)</span>
          <h3 style={{ margin: '4px 0 0 0', color: '#9b2c2c', fontSize: '1.5rem' }}>Lps {totalEgresos.toFixed(2)}</h3>
        </div>
        <div style={{ background: '#ebf8ff', border: '1px solid #bee3f8', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          <span style={{ color: '#718096', fontSize: '0.9rem' }}>Balance General en Caja</span>
          <h3 style={{ margin: '4px 0 0 0', color: '#2b6cb0', fontSize: '1.5rem' }}>Lps {balanceGeneral.toFixed(2)}</h3>
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
            {transaccionesFiltradas.map((tx) => {
              const esEgresoTx = tx.naturaleza === 'Egreso' || ['Servicios Básicos', 'Mantenimiento', 'Ayuda Social', 'Insumos / Suministros', 'Eventos y Alabanza', 'Otros Gastos'].includes(tx.tipo);
              return (
                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', borderBottom: '1px solid #edf2f7' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ 
                      background: esEgresoTx ? '#fff5f5' : '#e6fffa', 
                      color: esEgresoTx ? '#e53e3e' : '#319795', 
                      width: '40px', height: '40px', borderRadius: '50%', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold', fontSize: '1.2rem' 
                    }}>
                      {esEgresoTx ? '📤' : '📥'}
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', color: '#2d3748' }}>{tx.miembro}</h4>
                      <span style={{ fontSize: '0.85rem', color: '#718096', background: '#edf2f7', padding: '2px 8px', borderRadius: '4px' }}>{tx.tipo}</span>
                      <span style={{ fontSize: '0.85rem', color: '#a0aec0', marginLeft: '10px' }}>{tx.fecha}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ fontSize: '1rem', fontWeight: 'bold', color: esEgresoTx ? '#e53e3e' : '#38a169' }}>
                      {esEgresoTx ? '-' : '+'} Lps {Number(tx.monto || tx.cantidad || 0).toFixed(2)}
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
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Registrar / Editar Movimiento */}
      {mostrarModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px' }}>
          <form onSubmit={guardarTransaccion} style={{ background: '#fff', width: '100%', maxWidth: '450px', borderRadius: '10px', padding: '25px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#2d3748', fontSize: '1.3rem' }}>
                {idEditando !== null ? 'Editar Movimiento' : 'Registrar Nuevo Movimiento'}
              </h2>
              <button type="button" onClick={() => setMostrarModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              
              {/* Selector de Naturaleza: Ingreso o Egreso */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Tipo de Movimiento</label>
                <select 
                  value={naturalezaMovimiento} 
                  onChange={(e) => {
                    const nat = e.target.value;
                    setNaturalezaMovimiento(nat);
                    setTipoSeleccionado(nat === 'Ingreso' ? categoriasIngreso[0] : categoriasEgreso[0]);
                  }}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff', fontWeight: 'bold' }}
                >
                  <option value="Ingreso">🟢 Ingreso (Entrada de dinero)</option>
                  <option value="Egreso">🔴 Salida / Gasto (Egreso)</option>
                </select>
              </div>

              {/* Selector de Categoría dependiente de la Naturaleza */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>Categoría</label>
                <select 
                  value={tipoSeleccionado} 
                  onChange={(e) => setTipoSeleccionado(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff' }}
                >
                  {naturalezaMovimiento === 'Ingreso' ? (
                    categoriasIngreso.map(cat => <option key={cat} value={cat}>{cat}</option>)
                  ) : (
                    categoriasEgreso.map(cat => <option key={cat} value={cat}>{cat}</option>)
                  )}
                </select>
              </div>

              {/* Miembro o Proveedor */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#4a5568', marginBottom: '5px' }}>
                  {naturalezaMovimiento === 'Ingreso' ? 'Miembro Aportante' : 'Beneficiario / Proveedor / Detalle'}
                </label>
                {naturalezaMovimiento === 'Ingreso' ? (
                  <select 
                    value={miembroInput}
                    onChange={(e) => setMiembroInput(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', background: '#fff' }}
                  >
                    <option value="">Anónimo (Sin miembro asignado)</option>
                    {miembrosDirectorio.map((m) => (
                      <option key={m.id} value={m.nombre}>{m.nombre}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text"
                    placeholder="Ej. Empresa de Energía, Compra de materiales..."
                    value={miembroInput}
                    onChange={(e) => setMiembroInput(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e0', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              {/* Monto */}
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