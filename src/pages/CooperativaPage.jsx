import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

export default function CooperativaPage() {
  const [movimientos, setMovimientos] = useState([]);
  const [capitalTotal, setCapitalTotal] = useState(0);

  // Lista de eventos/cooperativas con metas y etiquetas de categoría personalizables
  const [eventosCoop, setEventosCoop] = useState([
    { 
      id: 'campamento_2026', 
      nombre: 'Campamento Anual 2026', 
      etiquetasEdad: {
        cat1: 'Menor de 9 años',
        cat2: 'Mayor de 10 años',
        cat3: 'Tercera Edad'
      },
      metasEdad: { cat1: 800, cat2: 1200, cat3: 900 } 
    }
  ]);

  // Estados para el formulario de Crear o Editar Evento/Cooperativa y sus etiquetas
  const [modoEdicionEvento, setModoEdicionEvento] = useState(false);
  const [eventoIdEditando, setEventoIdEditando] = useState(null);
  const [mostrarFormEvento, setMostrarFormEvento] = useState(false);
  const [nombreEvento, setNombreEvento] = useState("");
  
  // Nombres personalizados de las etiquetas
  const [labelCat1, setLabelCat1] = useState("Menor de 9 años");
  const [labelCat2, setLabelCat2] = useState("Mayor de 10 años");
  const [labelCat3, setLabelCat3] = useState("Tercera Edad");

  // Montos de las metas
  const [metaCat1, setMetaCat1] = useState("");
  const [metaCat2, setMetaCat2] = useState("");
  const [metaCat3, setMetaCat3] = useState("");

  // Estados para el formulario de nuevo aporte / abono adicional
  const [modoAbonoAdicional, setModoAbonoAdicional] = useState(false);
  const [nombreSocio, setNombreSocio] = useState("");
  const [eventoSeleccionado, setEventoSeleccionado] = useState('campamento_2026');
  const [categoriaEdad, setCategoriaEdad] = useState('cat2'); 
  const [tipo, setTipo] = useState("ahorro");
  const [monto, setMonto] = useState("");
  const [observacion, setObservacion] = useState("");
  const [cargando, setCargando] = useState(false);

  // Escuchar transacciones de la cooperativa en tiempo real
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "coop_transacciones"), (snapshot) => {
      let lista = [];
      let sumaTotal = 0;
      
      snapshot.forEach((docItem) => {
        const data = docItem.data();
        lista.push({ id: docItem.id, ...data });
        
        const valor = Number(data.monto || 0);
        if (data.tipo === "ahorro" || data.tipo === "abono") {
          sumaTotal += valor;
        } else if (data.tipo === "retiro" || data.tipo === "prestamo") {
          sumaTotal -= valor;
        }
      });
      
      lista.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));

      setMovimientos(lista);
      setCapitalTotal(sumaTotal);
    });

    return () => unsubscribe();
  }, []);

  // Calcular el total abonado por un miembro específico en un evento específico
  const calcularAbonoMiembro = (socio, eventoId) => {
    return movimientos
      .filter((m) => m.socio?.toLowerCase() === socio?.toLowerCase() && m.evento === eventoId && (m.tipo === "ahorro" || m.tipo === "abono"))
      .reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
  };

  // --- GESTIÓN DE EVENTOS / TIPOS Y ETIQUETAS ---
  const abrirCrearEvento = () => {
    setModoEdicionEvento(false);
    setEventoIdEditando(null);
    setNombreEvento("");
    setLabelCat1("Menor de 9 años");
    setLabelCat2("Mayor de 10 años");
    setLabelCat3("Tercera Edad");
    setMetaCat1("");
    setMetaCat2("");
    setMetaCat3("");
    setMostrarFormEvento(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirEditarEvento = (ev) => {
    setModoEdicionEvento(true);
    setEventoIdEditando(ev.id);
    setNombreEvento(ev.nombre);
    setLabelCat1(ev.etiquetasEdad?.cat1 || "Menor de 9 años");
    setLabelCat2(ev.etiquetasEdad?.cat2 || "Mayor de 10 años");
    setLabelCat3(ev.etiquetasEdad?.cat3 || "Tercera Edad");
    setMetaCat1(ev.metasEdad?.cat1 ?? "");
    setMetaCat2(ev.metasEdad?.cat2 ?? "");
    setMetaCat3(ev.metasEdad?.cat3 ?? "");
    setMostrarFormEvento(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGuardarEvento = (e) => {
    e.preventDefault();
    if (!nombreEvento) return;

    const nuevasEtiquetas = {
      cat1: labelCat1.trim() || "Categoría 1",
      cat2: labelCat2.trim() || "Categoría 2",
      cat3: labelCat3.trim() || "Categoría 3"
    };

    const nuevasMetas = {
      cat1: Number(metaCat1) || 0,
      cat2: Number(metaCat2) || 0,
      cat3: Number(metaCat3) || 0
    };

    if (modoEdicionEvento) {
      setEventosCoop(eventosCoop.map(ev => {
        if (ev.id === eventoIdEditando) {
          return {
            ...ev,
            nombre: nombreEvento.trim(),
            etiquetasEdad: nuevasEtiquetas,
            metasEdad: nuevasMetas
          };
        }
        return ev;
      }));
      alert("¡Cooperativa y etiquetas actualizadas con éxito!");
    } else {
      const nuevoId = nombreEvento.toLowerCase().replace(/\s+/g, '_') + '_' + Date.now();
      const nuevoEventoObj = {
        id: nuevoId,
        nombre: nombreEvento.trim(),
        etiquetasEdad: nuevasEtiquetas,
        metasEdad: nuevasMetas
      };
      setEventosCoop([...eventosCoop, nuevoEventoObj]);
      setEventoSeleccionado(nuevoId);
      alert("¡Nueva cooperativa creada con éxito!");
    }

    setMostrarFormEvento(false);
  };

  const handleEliminarEvento = (id) => {
    if (eventosCoop.length <= 1) {
      alert("Debes mantener al menos un tipo de cooperativa activo.");
      return;
    }
    if (window.confirm("¿Estás seguro de eliminar este tipo de cooperativa?")) {
      const filtrados = eventosCoop.filter(ev => ev.id !== id);
      setEventosCoop(filtrados);
      if (eventoSeleccionado === id) {
        setEventoSeleccionado(filtrados[0].id);
      }
    }
  };

  // --- EXPORTAR A EXCEL (CSV) ---
  const exportarAExcel = () => {
    if (movimientos.length === 0) {
      alert("No hay movimientos registrados para exportar.");
      return;
    }

    // Cabeceras del archivo CSV (compatibles con Excel)
    let csvContent = "\uFEFF"; // BOM para asegurar caracteres UTF-8 (acentos y eñes en Excel)
    csvContent += "Socio,Cooperativa / Evento,Categoría,Meta Asignada (Lps),Total Abonado (Lps),Tipo Movimiento,Monto Movimiento (Lps),Observación,Fecha\n";

    movimientos.forEach((m) => {
      const evObj = eventosCoop.find(ev => ev.id === m.evento);
      const nombreCoop = evObj ? evObj.nombre : 'Cooperativa';
      
      // Obtener nombre de la etiqueta y meta correspondiente
      const catKey = m.categoriaEdad || 'cat1';
      const etiquetaCat = evObj?.etiquetasEdad?.[catKey] || 'Categoría';
      const metaCat = evObj?.metasEdad?.[catKey] || 0;
      
      // Total general acumulado por el socio en ese evento
      const totalAbonadoSocio = calcularAbonoMiembro(m.socio, m.evento);
      
      const fechaFormateada = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : 'Reciente';

      // Limpiar comillas en los textos para evitar romper columnas
      const socioLim = `"${(m.socio || '').replace(/"/g, '""')}"`;
      const coopLim = `"${nombreCoop.replace(/"/g, '""')}"`;
      const catLim = `"${etiquetaCat.replace(/"/g, '""')}"`;
      const obsLim = `"${(m.observacion || '').replace(/"/g, '""')}"`;
      const fechaLim = `"${fechaFormateada}"`;

      const fila = [
        socioLim,
        coopLim,
        catLim,
        metaCat,
        totalAbonadoSocio,
        m.tipo,
        m.monto,
        obsLim,
        fechaLim
      ].join(",");

      csvContent += fila + "\n";
    });

    // Crear archivo descargable y activar descarga automática
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_cooperativa_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- GESTIÓN DE MOVIMIENTOS / APORTES ---
  const handleSubmitAporte = async (e) => {
    e.preventDefault();
    if (!nombreSocio || !monto) return;

    setCargando(true);
    try {
      await addDoc(collection(db, "coop_transacciones"), {
        socio: nombreSocio.trim(),
        evento: eventoSeleccionado,
        categoriaEdad: categoriaEdad,
        tipo: tipo,
        monto: Number(monto),
        observacion: observacion.trim() || (modoAbonoAdicional ? "Nuevo abono adicional" : "Aporte inicial"),
        createdAt: serverTimestamp()
      });

      alert(modoAbonoAdicional ? "¡Abono adicional agregado con éxito!" : "Aporte registrado con éxito.");
      
      setNombreSocio("");
      setMonto("");
      setObservacion("");
      setModoAbonoAdicional(false);
    } catch (error) {
      console.error("Error al registrar movimiento:", error);
      alert("Hubo un error al registrar el abono.");
    } finally {
      setCargando(false);
    }
  };

  const abrirAbonoAdicional = (m) => {
    setModoAbonoAdicional(true);
    setNombreSocio(m.socio || "");
    setEventoSeleccionado(m.evento || eventosCoop[0].id);
    setCategoriaEdad(m.categoriaEdad || "cat2");
    setTipo("ahorro"); 
    setMonto(""); 
    setObservacion("Abono extra / Adicional");
    window.scrollTo({ top: 350, behavior: 'smooth' }); 
  };

  const cancelarAbonoAdicional = () => {
    setModoAbonoAdicional(false);
    setNombreSocio("");
    setMonto("");
    setObservacion("");
  };

  const handleEliminarMovimiento = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este aporte/movimiento específico?")) {
      try {
        await deleteDoc(doc(db, "coop_transacciones", id));
        alert("Movimiento eliminado correctamente.");
      } catch (error) {
        console.error("Error al eliminar movimiento:", error);
        alert("No se pudo eliminar el registro.");
      }
    }
  };

  const eventoActualObj = eventosCoop.find(e => e.id === eventoSeleccionado) || eventosCoop[0];
  const etiquetasActuales = eventoActualObj?.etiquetasEdad || { cat1: 'Menor de 9 años', cat2: 'Mayor de 10 años', cat3: 'Tercera Edad' };
  const metasActuales = eventoActualObj?.metasEdad || { cat1: 0, cat2: 0, cat3: 0 };

  const metaPersonalMeta = metasActuales[categoriaEdad] || 0;
  const abonadoActualMiembro = nombreSocio ? calcularAbonoMiembro(nombreSocio, eventoSeleccionado) : 0;
  const porcentajePersonal = metaPersonalMeta > 0 ? Math.min(Math.round((abonadoActualMiembro / metaPersonalMeta) * 100), 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '900px', margin: '0 auto', color: '#fff' }}>
      
      {/* Encabezado y Capital Total */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ color: '#2d3748', fontSize: '1.4rem', margin: '0 0 5px 0' }}>Mini Cooperativa y Tipos de Ahorro</h2>
          <p style={{ color: '#718096', fontSize: '13px', margin: 0 }}>Gestiona múltiples fondos, etiquetas personalizadas y aportes individuales.</p>
        </div>
        <button 
          onClick={abrirCrearEvento}
          style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '10px 15px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Crear Tipo de Cooperativa
        </button>
      </div>

      <div style={{ background: '#2d3748', padding: '25px', borderRadius: '8px', borderLeft: '4px solid #38a169', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <p style={{ margin: '0 0 8px 0', color: '#a0aec0', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>Capital Total Acumulado en la Cooperativa</p>
        <h3 style={{ margin: 0, fontSize: '2.5rem', color: '#fff' }}>${capitalTotal.toLocaleString()} Lps</h3>
      </div>

      {/* Listado de Tipos de Cooperativas Activos y sus Etiquetas/Metas */}
      <div style={{ background: '#2d3748', padding: '20px', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', color: '#63b3ed' }}>Tipos de Cooperativa / Fondos Activos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '15px' }}>
          {eventosCoop.map((ev) => (
            <div key={ev.id} style={{ background: '#1a202c', padding: '15px', borderRadius: '6px', border: '1px solid #4a5568', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '10px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#fff', fontSize: '1rem' }}>{ev.nombre}</h4>
                <div style={{ fontSize: '12px', color: '#a0aec0', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span>• {ev.etiquetasEdad.cat1}: <strong style={{ color: '#68d391' }}>{ev.metasEdad.cat1} Lps</strong></span>
                  <span>• {ev.etiquetasEdad.cat2}: <strong style={{ color: '#68d391' }}>{ev.metasEdad.cat2} Lps</strong></span>
                  <span>• {ev.etiquetasEdad.cat3}: <strong style={{ color: '#68d391' }}>{ev.metasEdad.cat3} Lps</strong></span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                <button 
                  onClick={() => abrirEditarEvento(ev)}
                  style={{ background: '#d69e2e', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}
                >
                  Editar Etiquetas / Metas
                </button>
                <button 
                  onClick={() => handleEliminarEvento(ev.id)}
                  style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario Dinámico para Crear o Editar Cooperativa, Nombres de Etiquetas y Metas */}
      {mostrarFormEvento && (
        <div style={{ background: '#2d3748', padding: '20px', borderRadius: '8px', border: '2px solid #3182ce' }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#63b3ed', fontSize: '1.1rem' }}>
            {modoEdicionEvento ? '⚙️ Editar Nombre, Etiquetas y Metas de la Cooperativa' : '✨ Crear Nuevo Tipo de Cooperativa y sus Etiquetas'}
          </h3>
          <form onSubmit={handleGuardarEvento} style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <label style={{ fontSize: '13px', color: '#cbd5e0' }}>Nombre del Tipo de Cooperativa / Evento</label>
              <input 
                type="text" 
                placeholder="Ej. Campamento Juvenil 2026, Fondo Navideño" 
                value={nombreEvento} 
                onChange={(e) => setNombreEvento(e.target.value)} 
                required 
                style={{ padding: '10px', borderRadius: '6px', border: '1px solid #4a5568', background: '#1a202c', color: '#fff' }}
              />
            </div>

            {/* Fila Categoría 1 */}
            <div style={{ background: '#1a202c', padding: '12px', borderRadius: '6px', border: '1px solid #4a5568', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#a0aec0' }}>Nombre de Etiqueta 1</label>
                <input 
                  type="text" 
                  value={labelCat1} 
                  onChange={(e) => setLabelCat1(e.target.value)} 
                  placeholder="Ej. Menor de 9 años"
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #4a5568', background: '#2d3748', color: '#fff' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#a0aec0' }}>Meta 1 (Lps)</label>
                <input 
                  type="number" 
                  value={metaCat1} 
                  onChange={(e) => setMetaCat1(e.target.value)} 
                  placeholder="Ej. 800"
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #4a5568', background: '#2d3748', color: '#fff' }} 
                />
              </div>
            </div>

            {/* Fila Categoría 2 */}
            <div style={{ background: '#1a202c', padding: '12px', borderRadius: '6px', border: '1px solid #4a5568', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#a0aec0' }}>Nombre de Etiqueta 2</label>
                <input 
                  type="text" 
                  value={labelCat2} 
                  onChange={(e) => setLabelCat2(e.target.value)} 
                  placeholder="Ej. Mayor de 10 años"
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #4a5568', background: '#2d3748', color: '#fff' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#a0aec0' }}>Meta 2 (Lps)</label>
                <input 
                  type="number" 
                  value={metaCat2} 
                  onChange={(e) => setMetaCat2(e.target.value)} 
                  placeholder="Ej. 1200"
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #4a5568', background: '#2d3748', color: '#fff' }} 
                />
              </div>
            </div>

            {/* Fila Categoría 3 */}
            <div style={{ background: '#1a202c', padding: '12px', borderRadius: '6px', border: '1px solid #4a5568', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#a0aec0' }}>Nombre de Etiqueta 3</label>
                <input 
                  type="text" 
                  value={labelCat3} 
                  onChange={(e) => setLabelCat3(e.target.value)} 
                  placeholder="Ej. Tercera Edad"
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #4a5568', background: '#2d3748', color: '#fff' }} 
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <label style={{ fontSize: '12px', color: '#a0aec0' }}>Meta 3 (Lps)</label>
                <input 
                  type="number" 
                  value={metaCat3} 
                  onChange={(e) => setMetaCat3(e.target.value)} 
                  placeholder="Ej. 900"
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #4a5568', background: '#2d3748', color: '#fff' }} 
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <button type="submit" style={{ background: '#38a169', color: '#fff', padding: '12px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', flex: 1 }}>
                {modoEdicionEvento ? 'Actualizar Cooperativa y Etiquetas' : 'Guardar Nueva Cooperativa'}
              </button>
              <button type="button" onClick={() => setMostrarFormEvento(false)} style={{ background: '#4a5568', color: '#fff', padding: '12px 20px', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario para Registrar / Agregar Abono Adicional a Miembro */}
      <div style={{ background: '#2d3748', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: modoAbonoAdicional ? '2px solid #38a169' : 'none' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: modoAbonoAdicional ? '#68d391' : '#63b3ed' }}>
            {modoAbonoAdicional ? `➕ Agregando Nuevo Abono para: ${nombreSocio}` : 'Registrar Aporte de Miembro'}
          </h3>
          {modoAbonoAdicional && (
            <button onClick={cancelarAbonoAdicional} style={{ background: '#4a5568', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
              Cancelar Modo Adicional
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmitAporte} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '13px', color: '#cbd5e0' }}>Seleccionar Cooperativa / Evento</label>
            <select 
              value={eventoSeleccionado} 
              onChange={(e) => setEventoSeleccionado(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #4a5568', background: '#1a202c', color: '#fff' }}
            >
              {eventosCoop.map((ev) => (
                <option key={ev.id} value={ev.id}>{ev.nombre}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '13px', color: '#cbd5e0' }}>Categoría / Etiqueta (Define la Meta)</label>
            <select 
              value={categoriaEdad} 
              onChange={(e) => setCategoriaEdad(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #4a5568', background: '#1a202c', color: '#fff' }}
            >
              <option value="cat1">{etiquetasActuales.cat1} (Meta: {metasActuales.cat1} Lps)</option>
              <option value="cat2">{etiquetasActuales.cat2} (Meta: {metasActuales.cat2} Lps)</option>
              <option value="cat3">{etiquetasActuales.cat3} (Meta: {metasActuales.cat3} Lps)</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '13px', color: '#cbd5e0' }}>Nombre del Miembro</label>
            <input 
              type="text" 
              placeholder="Ej. Carlos Mendoza" 
              value={nombreSocio} 
              onChange={(e) => setNombreSocio(e.target.value)} 
              required 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #4a5568', background: '#1a202c', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '13px', color: '#cbd5e0' }}>Tipo de Movimiento</label>
            <select 
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)}
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #4a5568', background: '#1a202c', color: '#fff' }}
            >
              <option value="ahorro">Aporte / Abono (+) [Sumar]</option>
              <option value="retiro">Retiro / Reembolso (-) [Restar]</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '13px', color: '#cbd5e0' }}>{modoAbonoAdicional ? 'Monto del Nuevo Abono (Lps)' : 'Monto a Abonar (Lps)'}</label>
            <input 
              type="number" 
              placeholder="0.00" 
              value={monto} 
              onChange={(e) => setMonto(e.target.value)} 
              required 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #4a5568', background: '#1a202c', color: '#fff' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', gridColumn: '1 / -1' }}>
            <label style={{ fontSize: '13px', color: '#cbd5e0' }}>Observación / Comentario del Abono</label>
            <input 
              type="text" 
              placeholder="Ej. Segundo pago semanal, cuota extra" 
              value={observacion} 
              onChange={(e) => setObservacion(e.target.value)} 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #4a5568', background: '#1a202c', color: '#fff' }}
            />
          </div>

          {/* Tarjeta de Progreso en Vivo del Miembro */}
          {nombreSocio && (
            <div style={{ gridColumn: '1 / -1', background: '#1a202c', padding: '15px', borderRadius: '6px', border: '1px solid #4a5568' }}>
              <p style={{ margin: '0 0 5px 0', fontSize: '13px', color: '#a0aec0' }}>Estado total acumulado para <strong>{nombreSocio}</strong> en <em>{eventoActualObj?.nombre}</em>:</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '8px', flexWrap: 'wrap', gap: '5px' }}>
                <span>Total Abonado: <strong style={{ color: '#68d391' }}>Lps {abonadoActualMiembro.toLocaleString()}</strong></span>
                <span>Meta requerida ({etiquetasActuales[categoriaEdad]}): <strong style={{ color: '#63b3ed' }}>Lps {metaPersonalMeta.toLocaleString()}</strong></span>
                <span>Faltante: <strong style={{ color: '#fc8181' }}>Lps {Math.max(metaPersonalMeta - abonadoActualMiembro, 0).toLocaleString()}</strong></span>
              </div>
              <div style={{ width: '100%', background: '#2d3748', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ width: `${porcentajePersonal}%`, background: '#38a169', height: '100%', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>
          )}

          <div style={{ gridColumn: '1 / -1', marginTop: '5px' }}>
            <button 
              type="submit" 
              disabled={cargando}
              style={{ background: modoAbonoAdicional ? '#38a169' : '#3182ce', color: '#fff', padding: '12px 20px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', width: '100%' }}
            >
              {cargando ? 'Guardando...' : (modoAbonoAdicional ? '➕ Guardar Abono Adicional' : 'Registrar Aporte del Miembro')}
            </button>
          </div>

        </form>
      </div>

      {/* Historial de Movimientos y Botón de Exportar a Excel */}
      <div style={{ background: '#2d3748', padding: '25px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>Historial General de Movimientos</h3>
          <button 
            onClick={exportarAExcel}
            style={{ background: '#38a169', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            📥 Exportar Lista a Excel (CSV)
          </button>
        </div>
        
        {movimientos.length === 0 ? (
          <p style={{ color: '#a0aec0', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>No hay movimientos registrados todavía.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {movimientos.map((m) => {
              const esPositivo = m.tipo === 'ahorro' || m.tipo === 'abono';
              const evObj = eventosCoop.find(ev => ev.id === m.evento);
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 15px', background: '#1a202c', borderRadius: '6px', borderLeft: `4px solid ${esPositivo ? '#38a169' : '#e53e3e'}`, flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <strong style={{ color: '#fff', display: 'block' }}>{m.socio}</strong>
                    <span style={{ fontSize: '12px', color: '#a0aec0', textTransform: 'capitalize' }}>
                      {evObj ? evObj.nombre : 'Cooperativa'} • {m.tipo} {m.observacion ? `- ${m.observacion}` : ''}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: esPositivo ? '#68d391' : '#fc8181' }}>
                      {esPositivo ? '+' : '-'}{Number(m.monto).toLocaleString()} Lps
                    </span>
                    
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        onClick={() => abrirAbonoAdicional(m)}
                        title="Agregar otro abono a este socio"
                        style={{ background: '#38a169', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        + Abono
                      </button>
                      <button 
                        onClick={() => handleEliminarMovimiento(m.id)}
                        title="Eliminar este movimiento específico"
                        style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}