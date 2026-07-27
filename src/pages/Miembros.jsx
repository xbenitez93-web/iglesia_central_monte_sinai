import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc, getDoc } from 'firebase/firestore';

export default function Miembros({ usuarioActualId }) {
  const [usuarios, setUsuarios] = useState([]);
  const [ministerios, setMinisterios] = useState([]);
  const [nuevoMinisterio, setNuevoMinisterio] = useState('');
  const [cargando, setCargando] = useState(true);
  const [subPestana, setSubPestana] = useState('usuarios');

  // --- ESTADOS PARA VERSIÓN Y NOTIFICACIONES DE NUEVOS CAMBIOS ---
  const VERSION_ACTUAL = "1.0.0";
  const [tieneActualizacionApp, setTieneActualizacionApp] = useState(false);
  const [nuevaVersionInfo, setNuevaVersionInfo] = useState("");
  const [pendientes, setPendientes] = useState({ usuarios: 0, ministerios: 0 });

  // --- ESTADOS PARA PERSONALIZACIÓN ---
  const [moduloSeleccionado, setModuloSeleccionado] = useState('dashboard');
  
  const [configModulos, setConfigModulos] = useState(() => {
    const guardado = localStorage.getItem('congregacion360_estilos');
    return guardado ? JSON.parse(guardado) : {
      dashboard: { boton: '#3182ce', fondo: '#1a202c', tipografia: 'Inter, sans-serif', encabezadoColor: '#ffffff', encabezadoTamano: '24px', encabezadoNegrita: true, encabezadoCursiva: false, subtituloColor: '#a0aec0', subtituloTamano: '14px', subtituloNegrita: false, subtituloCursiva: false },
      directorio: { boton: '#3182ce', fondo: '#1a202c', tipografia: 'Inter, sans-serif', encabezadoColor: '#ffffff', encabezadoTamano: '24px', encabezadoNegrita: true, encabezadoCursiva: false, subtituloColor: '#a0aec0', subtituloTamano: '14px', subtituloNegrita: false, subtituloCursiva: false },
      agenda: { boton: '#d69e2e', fondo: '#1a202c', tipografia: 'Roboto, sans-serif', encabezadoColor: '#ffffff', encabezadoTamano: '24px', encabezadoNegrita: true, encabezadoCursiva: false, subtituloColor: '#a0aec0', subtituloTamano: '14px', subtituloNegrita: false, subtituloCursiva: false },
      cooperativa: { boton: '#38a169', fondo: '#1a202c', tipografia: 'Inter, sans-serif', encabezadoColor: '#ffffff', encabezadoTamano: '24px', encabezadoNegrita: true, encabezadoCursiva: false, subtituloColor: '#a0aec0', subtituloTamano: '14px', subtituloNegrita: false, subtituloCursiva: false },
      finanzas: { boton: '#e53e3e', fondo: '#1a202c', tipografia: 'Inter, sans-serif', encabezadoColor: '#ffffff', encabezadoTamano: '24px', encabezadoNegrita: true, encabezadoCursiva: false, subtituloColor: '#a0aec0', subtituloTamano: '14px', subtituloNegrita: false, subtituloCursiva: false },
      login: { boton: '#3182ce', fondo: '#1a202c', tipografia: 'Inter, sans-serif', encabezadoColor: '#ffffff', encabezadoTamano: '24px', encabezadoNegrita: true, encabezadoCursiva: false, subtituloColor: '#a0aec0', subtituloTamano: '14px', subtituloNegrita: false, subtituloCursiva: false }
    };
  });

  useEffect(() => {
    // 1. Cargar Usuarios
    const unsubUsuarios = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      const listaUsuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(listaUsuarios);
      setCargando(false);
    }, (error) => {
      console.error("Error al cargar usuarios:", error);
      setCargando(false);
    });

    // 2. Cargar Ministerios
    const unsubMinisterios = onSnapshot(collection(db, "ministerios"), (snapshot) => {
      const listaMin = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMinisterios(listaMin);
    }, (error) => {
      console.error("Error al cargar ministerios:", error);
    });

    // 3. Simulación de revisión de nueva versión de la app
    const verificarActualizacionApp = () => {
      const versionRemota = "1.0.0"; 
      if (versionRemota !== VERSION_ACTUAL) {
        setTieneActualizacionApp(true);
        setNuevaVersionInfo(versionRemota);
      }
    };
    verificarActualizacionApp();

    return () => {
      unsubUsuarios();
      unsubMinisterios();
    };
  }, []);

  // Efecto para calcular elementos nuevos (badge rojo) basados en la última visita del usuario
  useEffect(() => {
    if (!usuarioActualId) return;

    const usuarioRef = doc(db, "usuarios", usuarioActualId);
    const unsubscribeVisitas = onSnapshot(usuarioRef, (docSnap) => {
      if (docSnap.exists()) {
        const datos = docSnap.data();
        const ultimasVisitas = datos.ultimasVisitas || {};

        // Contar usuarios nuevos no vistos
        let countUsuarios = 0;
        const ultimaVisitaUsuarios = ultimasVisitas.usuarios ? new Date(ultimasVisitas.usuarios.seconds * 1000) : new Date(0);
        usuarios.forEach(u => {
          const fCreacion = u.creadoEn ? new Date(u.creadoEn.seconds * 1000) : new Date();
          if (fCreacion > ultimaVisitaUsuarios) countUsuarios++;
        });

        // Contar ministerios nuevos no vistos
        let countMin = 0;
        const ultimaVisitaMin = ultimasVisitas.ministerios ? new Date(ultimasVisitas.ministerios.seconds * 1000) : new Date(0);
        ministerios.forEach(m => {
          const fCreacion = m.creadoEn ? new Date(m.creadoEn.seconds * 1000) : new Date();
          if (fCreacion > ultimaVisitaMin) countMin++;
        });

        setPendientes({ usuarios: countUsuarios, ministerios: countMin });
      }
    });

    return () => unsubscribeVisitas();
  }, [usuarioActualId, usuarios, ministerios]);

  // Función para marcar una sección como vista (limpia el numerito rojo de esa sección)
  const marcarComoVisto = async (seccion) => {
    setSubPestana(seccion);
    if (!usuarioActualId) return;
    try {
      const usuarioRef = doc(db, "usuarios", usuarioActualId);
      const usuarioSnap = await getDoc(usuarioRef);
      const visitasActuales = usuarioSnap.exists() ? usuarioSnap.data().ultimasVisitas || {} : {};

      await updateDoc(usuarioRef, {
        ultimasVisitas: {
          ...visitasActuales,
          [seccion]: new Date()
        }
      });
    } catch (error) {
      console.error("Error al actualizar última visita:", error);
    }
  };

  const cambiarRol = async (idUsuario, nuevoRol) => {
    try {
      const usuarioRef = doc(db, "usuarios", idUsuario);
      await updateDoc(usuarioRef, { rol: nuevoRol });
      alert("¡Rol actualizado con éxito!");
    } catch (error) {
      console.error("Error al actualizar el rol:", error);
    }
  };

  const actualizarPermisoModulo = async (idUsuario, modulo, estadoActual) => {
    try {
      const usuarioRef = doc(db, "usuarios", idUsuario);
      const usuarioObj = usuarios.find(u => u.id === idUsuario);
      const permisosActuales = usuarioObj.permisosModulos || { directorio: true, finanzas: true, eventos: true, administracion: true, cooperativa: true };
      const nuevosPermisos = { ...permisosActuales, [modulo]: !estadoActual };
      await updateDoc(usuarioRef, { permisosModulos: nuevosPermisos });
    } catch (error) {
      console.error("Error al actualizar permisos:", error);
    }
  };

  const eliminarUsuario = async (idUsuario, nombreUsuario) => {
    if (window.confirm(`¿Estás seguro de eliminar el acceso de "${nombreUsuario}"?`)) {
      try {
        await deleteDoc(doc(db, "usuarios", idUsuario));
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
      }
    }
  };

  const agregarMinisterio = async (e) => {
    e.preventDefault();
    if (!nuevoMinisterio.trim()) return;
    try {
      await addDoc(collection(db, "ministerios"), { 
        nombre: nuevoMinisterio.trim(),
        creadoEn: new Date()
      });
      setNuevoMinisterio('');
    } catch (error) {
      console.error("Error al agregar ministerio:", error);
    }
  };

  const eliminarMinisterio = async (idMin) => {
    if (window.confirm("¿Estás seguro de eliminar este ministerio?")) {
      try {
        await deleteDoc(doc(db, "ministerios", idMin));
      } catch (error) {
        console.error("Error al eliminar ministerio:", error);
      }
    }
  };

  const descargarBackup = () => {
    const datosBackup = { usuarios, ministerios, fechaRespaldo: new Date().toISOString() };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datosBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `respaldo_congregacion360_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const guardarPersonalizacion = () => {
    localStorage.setItem('congregacion360_estilos', JSON.stringify(configModulos));
    window.dispatchEvent(new Event('estilosActualizados'));
    alert(`¡Estilos del módulo "${moduloSeleccionado.toUpperCase()}" guardados con éxito!`);
  };

  const actualizarApp = () => {
    window.location.reload(true);
  };

  if (cargando) {
    return <div style={{ padding: '20px', color: '#fff' }}>Cargando panel de administración...</div>;
  }

  const estiloActual = configModulos[moduloSeleccionado] || {};

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', color: '#fff' }}>
      <h2>Panel de Configuración y Administración</h2>
      <p style={{ color: '#a0aec0', marginBottom: '20px', fontSize: '14px' }}>
        Gestiona accesos, permisos granulares por módulos, ministerios globales y respaldos del sistema.
      </p>

      {/* Submenú de pestañas con Badges Rojos de Nuevos Cambios */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', borderBottom: '1px solid #4a5568', paddingBottom: '10px', flexWrap: 'wrap' }}>
        
        <button onClick={() => marcarComoVisto('usuarios')} style={{ position: 'relative', padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'usuarios' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
          👥 Accesos y Roles
          {pendientes.usuarios > 0 && (
            <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e53e3e', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', border: '2px solid #1a202c' }}>
              {pendientes.usuarios}
            </span>
          )}
        </button>

        <button onClick={() => setSubPestana('permisos')} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'permisos' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
          🔒 Permisos por Módulos
        </button>

        <button onClick={() => marcarComoVisto('ministerios')} style={{ position: 'relative', padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'ministerios' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
          ⛪ Gestión de Ministerios
          {pendientes.ministerios > 0 && (
            <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e53e3e', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', border: '2px solid #1a202c' }}>
              {pendientes.ministerios}
            </span>
          )}
        </button>

        <button onClick={() => setSubPestana('sistema')} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'sistema' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
          💾 Respaldo y Datos
        </button>

        <button onClick={() => setSubPestana('personalizacion')} style={{ position: 'relative', padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'personalizacion' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
          🎨 Personalización
          {tieneActualizacionApp && (
            <span 
              onClick={actualizarApp}
              title={`Nueva versión ${nuevaVersionInfo} disponible`}
              style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#e53e3e', color: '#fff', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', border: '2px solid #1a202c', animation: 'pulse 1.5s infinite', cursor: 'pointer' }}
            >
              1
            </span>
          )}
        </button>
      </div>

      {/* BLOQUE DE VERSIÓN DE LA APP INTEGRADO DEBAJO DE LAS PESTAÑAS */}
      <div style={{ marginBottom: '20px', paddingLeft: '5px' }}>
        <span style={{ fontSize: '12px', color: '#a0aec0' }}>
          Versión de la App: <strong>{VERSION_ACTUAL}</strong>
        </span>
        {tieneActualizacionApp && (
          <div style={{ fontSize: '11px', color: '#e53e3e', marginTop: '2px', cursor: 'pointer' }} onClick={actualizarApp}>
            🔴 ¡Nueva versión ({nuevaVersionInfo}) disponible! Haz clic para actualizar.
          </div>
        )}
      </div>

      {/* PESTAÑA 1: USUARIOS */}
      {subPestana === 'usuarios' && (
        <div style={{ background: '#2d3748', borderRadius: '8px', overflow: 'hidden', marginTop: '15px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#1a202c', color: '#cbd5e0', borderBottom: '1px solid #4a5568' }}>
                <th style={{ padding: '12px 15px' }}>Nombre</th>
                <th style={{ padding: '12px 15px' }}>Usuario</th>
                <th style={{ padding: '12px 15px' }}>Rol Actual</th>
                <th style={{ padding: '12px 15px', textAlign: 'center' }}>Cambiar Rol</th>
                <th style={{ padding: '12px 15px', textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid #4a5568' }}>
                  <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{u.nombre || 'Sin nombre'}</td>
                  <td style={{ padding: '12px 15px', color: '#90cdf4' }}>{u.usuario}</td>
                  <td style={{ padding: '12px 15px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', background: u.rol === 'admin' ? '#2b6cb0' : (u.rol === 'pastor' ? '#805ad5' : '#3182ce'), color: '#fff' }}>
                      {u.rol || 'miembro'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                    <select value={u.rol || 'miembro'} onChange={(e) => cambiarRol(u.id, e.target.value)} style={{ padding: '6px', borderRadius: '4px', background: '#1a202c', color: '#fff', border: '1px solid #4a5568' }}>
                      <option value="miembro">Miembro</option>
                      <option value="lider">Líder</option>
                      <option value="tesorero">Tesorero</option>
                      <option value="pastor">Pastor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                  <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                    <button onClick={() => eliminarUsuario(u.id, u.nombre || u.usuario)} style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PESTAÑA 2: PERMISOS */}
      {subPestana === 'permisos' && (
        <div style={{ background: '#2d3748', borderRadius: '8px', padding: '20px', marginTop: '15px' }}>
          <h3>Control Granular de Módulos</h3>
          <p style={{ color: '#a0aec0', fontSize: '13px', marginBottom: '20px' }}>Habilita o deshabilita el acceso de cada usuario a los módulos específicos.</p>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#1a202c', color: '#cbd5e0', borderBottom: '1px solid #4a5568' }}>
                <th style={{ padding: '12px 15px' }}>Usuario</th>
                <th style={{ padding: '12px 15px', textAlign: 'center' }}>Directorio</th>
                <th style={{ padding: '12px 15px', textAlign: 'center' }}>Finanzas</th>
                <th style={{ padding: '12px 15px', textAlign: 'center' }}>Eventos</th>
                <th style={{ padding: '12px 15px', textAlign: 'center' }}>Administración</th>
                <th style={{ padding: '12px 15px', textAlign: 'center' }}>Cooperativa</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => {
                const permisos = u.permisosModulos || { directorio: true, finanzas: true, eventos: true, administracion: true, cooperativa: true };
                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid #4a5568' }}>
                    <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{u.nombre || u.usuario}</td>
                    {['directorio', 'finanzas', 'eventos', 'administracion', 'cooperativa'].map((mod) => (
                      <td key={mod} style={{ padding: '12px 15px', textAlign: 'center' }}>
                        <input type="checkbox" checked={permisos[mod] ?? true} onChange={() => actualizarPermisoModulo(u.id, mod, permisos[mod] ?? true)} style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* PESTAÑA 3: MINISTERIOS */}
      {subPestana === 'ministerios' && (
        <div style={{ background: '#2d3748', padding: '20px', borderRadius: '8px', marginTop: '15px' }}>
          <h3>Catálogo de Ministerios</h3>
          <form onSubmit={agregarMinisterio} style={{ display: 'flex', gap: '10px', marginBottom: '20px', marginTop: '15px' }}>
            <input type="text" placeholder="Nombre del nuevo ministerio..." value={nuevoMinisterio} onChange={(e) => setNuevoMinisterio(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #4a5568', background: '#1a202c', color: '#fff' }} />
            <button type="submit" style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Agregar</button>
          </form>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ministerios.map((min) => (
              <li key={min.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a202c', padding: '10px 15px', borderRadius: '6px', border: '1px solid #4a5568' }}>
                <span>{min.nombre}</span>
                <button onClick={() => eliminarMinisterio(min.id)} style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Eliminar</button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* PESTAÑA 4: RESPALDO */}
      {subPestana === 'sistema' && (
        <div style={{ background: '#2d3748', padding: '20px', borderRadius: '8px', textAlign: 'center', marginTop: '15px' }}>
          <h3>Copia de Seguridad (Backup)</h3>
          <button onClick={descargarBackup} style={{ background: '#38a169', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: '15px' }}>📥 Descargar Respaldo General</button>
        </div>
      )}

      {/* PESTAÑA 5: PERSONALIZACIÓN */}
      {subPestana === 'personalizacion' && (
        <div style={{ background: '#2d3748', padding: '20px', borderRadius: '8px', fontFamily: estiloActual.tipografia, marginTop: '15px' }}>
          <h3>Personalización Avanzada de Apariencia</h3>
          <p style={{ color: '#a0aec0', fontSize: '13px', marginBottom: '20px' }}>Ajusta títulos, subtítulos, botones, fondos y tipografías por sección.</p>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold', color: '#90cdf4' }}>Página / Módulo a configurar:</label>
            <select value={moduloSeleccionado} onChange={(e) => setModuloSeleccionado(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1a202c', color: '#fff', border: '1px solid #4a5568', fontSize: '15px' }}>
              <option value="dashboard">Panel Principal (Dashboard)</option>
              <option value="login">Pantalla de Inicio de Sesión (Login)</option>
              <option value="directorio">Directorio de Miembros</option>
              <option value="agenda">Agenda y Calendario</option>
              <option value="cooperativa">Mini Cooperativa</option>
              <option value="finanzas">Finanzas</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            <div style={{ background: '#1a202c', padding: '15px', borderRadius: '6px', border: '1px solid #4a5568' }}>
              <h4 style={{ marginBottom: '15px', color: '#90cdf4' }}>General y Botones</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                  Color de Botones:
                  <input type="color" value={estiloActual.boton || '#3182ce'} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, boton: e.target.value } })} style={{ cursor: 'pointer', border: 'none', background: 'none' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                  Color de Fondo:
                  <input type="color" value={estiloActual.fondo || '#1a202c'} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, fondo: e.target.value } })} style={{ cursor: 'pointer', border: 'none', background: 'none' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', gap: '5px' }}>
                  Tipografía General:
                  <select value={estiloActual.tipografia || 'Inter, sans-serif'} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, tipografia: e.target.value } })} style={{ padding: '8px', borderRadius: '4px', background: '#2d3748', color: '#fff', border: '1px solid #4a5568' }}>
                    <option value="Inter, sans-serif">Inter (Moderna)</option>
                    <option value="Roboto, sans-serif">Roboto (Limpia)</option>
                    <option value="'Courier New', monospace">Courier New (Consola)</option>
                    <option value="Georgia, serif">Georgia (Elegante)</option>
                  </select>
                </label>
              </div>
            </div>

            <div style={{ background: '#1a202c', padding: '15px', borderRadius: '6px', border: '1px solid #4a5568' }}>
              <h4 style={{ marginBottom: '15px', color: '#90cdf4' }}>Título Principal (H1)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                  Color del Título:
                  <input type="color" value={estiloActual.encabezadoColor || '#ffffff'} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, encabezadoColor: e.target.value } })} style={{ cursor: 'pointer', border: 'none', background: 'none' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                  Tamaño:
                  <select value={estiloActual.encabezadoTamano || '24px'} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, encabezadoTamano: e.target.value } })} style={{ padding: '6px', borderRadius: '4px', background: '#2d3748', color: '#fff', border: '1px solid #4a5568' }}>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                    <option value="30px">30px</option>
                    <option value="36px">36px</option>
                  </select>
                </label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={!!estiloActual.encabezadoNegrita} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, encabezadoNegrita: e.target.checked } })} /> Negrita
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={!!estiloActual.encabezadoCursiva} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, encabezadoCursiva: e.target.checked } })} /> Cursiva
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <button onClick={guardarPersonalizacion} style={{ background: '#38a169', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
              💾 Guardar Cambios para "{moduloSeleccionado.toUpperCase()}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}