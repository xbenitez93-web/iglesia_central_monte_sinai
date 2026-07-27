import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';

export default function Miembros() {
  const [usuarios, setUsuarios] = useState([]);
  const [ministerios, setMinisterios] = useState([]);
  const [nuevoMinisterio, setNuevoMinisterio] = useState('');
  const [cargando, setCargando] = useState(true);
  const [subPestana, setSubPestana] = useState('usuarios');

  // --- ESTADOS PARA PERSONALIZACIÓN (TÍTULOS, SUBTÍTULOS, BOTONES, FONDOS, TIPOGRAFÍA) ---
  const [moduloSeleccionado, setModuloSeleccionado] = useState('directorio');
  
  const [configModulos, setConfigModulos] = useState(() => {
    const guardado = localStorage.getItem('congregacion360_estilos');
    return guardado ? JSON.parse(guardado) : {
      directorio: { 
        boton: '#3182ce', 
        fondo: '#1a202c', 
        tipografia: 'Inter, sans-serif',
        // Título principal
        encabezadoColor: '#ffffff',
        encabezadoTamano: '24px',
        encabezadoNegrita: true,
        encabezadoCursiva: false,
        // Subtítulo
        subtituloColor: '#a0aec0',
        subtituloTamano: '14px',
        subtituloNegrita: false,
        subtituloCursiva: false
      },
      agenda: { 
        boton: '#d69e2e', 
        fondo: '#1a202c', 
        tipografia: 'Roboto, sans-serif',
        encabezadoColor: '#ffffff',
        encabezadoTamano: '24px',
        encabezadoNegrita: true,
        encabezadoCursiva: false,
        subtituloColor: '#a0aec0',
        subtituloTamano: '14px',
        subtituloNegrita: false,
        subtituloCursiva: false
      },
      cooperativa: { 
        boton: '#38a169', 
        fondo: '#1a202c', 
        tipografia: 'Inter, sans-serif',
        encabezadoColor: '#ffffff',
        encabezadoTamano: '24px',
        encabezadoNegrita: true,
        encabezadoCursiva: false,
        subtituloColor: '#a0aec0',
        subtituloTamano: '14px',
        subtituloNegrita: false,
        subtituloCursiva: false
      },
      finanzas: { 
        boton: '#e53e3e', 
        fondo: '#1a202c', 
        tipografia: 'Inter, sans-serif',
        encabezadoColor: '#ffffff',
        encabezadoTamano: '24px',
        encabezadoNegrita: true,
        encabezadoCursiva: false,
        subtituloColor: '#a0aec0',
        subtituloTamano: '14px',
        subtituloNegrita: false,
        subtituloCursiva: false
      }
    };
  });

  useEffect(() => {
    const unsubUsuarios = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      const listaUsuarios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsuarios(listaUsuarios);
      setCargando(false);
    }, (error) => {
      console.error("Error al cargar usuarios:", error);
      setCargando(false);
    });

    const unsubMinisterios = onSnapshot(collection(db, "ministerios"), (snapshot) => {
      const listaMin = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMinisterios(listaMin);
    }, (error) => {
      console.error("Error al cargar ministerios:", error);
    });

    return () => {
      unsubUsuarios();
      unsubMinisterios();
    };
  }, []);

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
      await addDoc(collection(db, "ministerios"), { nombre: nuevoMinisterio.trim() });
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

  // Función de guardado con notificación global para que las páginas se actualicen al instante
  const guardarPersonalizacion = () => {
    localStorage.setItem('congregacion360_estilos', JSON.stringify(configModulos));
    
    // Disparamos un evento personalizado para avisar a las demás páginas abiertas en la app
    window.dispatchEvent(new Event('estilosActualizados'));

    alert(`¡Estilos del módulo "${moduloSeleccionado.toUpperCase()}" guardados con éxito!`);
  };

  if (cargando) {
    return <div style={{ padding: '20px', color: '#fff' }}>Cargando panel de administración...</div>;
  }

  const estiloActual = configModulos[moduloSeleccionado];

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', color: '#fff' }}>
      <h2>Panel de Configuración y Administración</h2>
      <p style={{ color: '#a0aec0', marginBottom: '20px', fontSize: '14px' }}>
        Gestiona accesos, permisos granulares por módulos, ministerios globales y respaldos del sistema.
      </p>

      {/* Submenú de pestañas */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #4a5568', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button onClick={() => setSubPestana('usuarios')} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'usuarios' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>👥 Accesos y Roles</button>
        <button onClick={() => setSubPestana('permisos')} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'permisos' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>🔒 Permisos por Módulos</button>
        <button onClick={() => setSubPestana('ministerios')} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'ministerios' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>⛪ Gestión de Ministerios</button>
        <button onClick={() => setSubPestana('sistema')} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'sistema' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>💾 Respaldo y Datos</button>
        <button onClick={() => setSubPestana('personalizacion')} style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'personalizacion' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>🎨 Personalización</button>
      </div>

      {/* PESTAÑA 1: USUARIOS */}
      {subPestana === 'usuarios' && (
        <div style={{ background: '#2d3748', borderRadius: '8px', overflow: 'hidden' }}>
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
        <div style={{ background: '#2d3748', borderRadius: '8px', padding: '20px' }}>
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
        <div style={{ background: '#2d3748', padding: '20px', borderRadius: '8px' }}>
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
        <div style={{ background: '#2d3748', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3>Copia de Seguridad (Backup)</h3>
          <button onClick={descargarBackup} style={{ background: '#38a169', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px', marginTop: '15px' }}>📥 Descargar Respaldo General</button>
        </div>
      )}

      {/* PESTAÑA 5: PERSONALIZACIÓN CON TÍTULO, SUBTÍTULO, BOTONES Y FONDOS */}
      {subPestana === 'personalizacion' && (
        <div style={{ background: '#2d3748', padding: '20px', borderRadius: '8px', fontFamily: estiloActual.tipografia }}>
          <h3>Personalización Avanzada de Apariencia</h3>
          <p style={{ color: '#a0aec0', fontSize: '13px', marginBottom: '20px' }}>Ajusta títulos, subtítulos, botones, fondos y tipografías por sección.</p>

          {/* Selector de Módulo */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', fontWeight: 'bold', color: '#90cdf4' }}>Página / Módulo a configurar:</label>
            <select value={moduloSeleccionado} onChange={(e) => setModuloSeleccionado(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: '#1a202c', color: '#fff', border: '1px solid #4a5568', fontSize: '15px' }}>
              <option value="directorio">Directorio de Miembros</option>
              <option value="agenda">Agenda y Calendario</option>
              <option value="cooperativa">Mini Cooperativa</option>
              <option value="finanzas">Finanzas</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '25px' }}>
            
            {/* Colores Generales y Tipografía */}
            <div style={{ background: '#1a202c', padding: '15px', borderRadius: '6px', border: '1px solid #4a5568' }}>
              <h4 style={{ marginBottom: '15px', color: '#90cdf4' }}>General y Botones</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                  Color de Botones:
                  <input type="color" value={estiloActual.boton} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, boton: e.target.value } })} style={{ cursor: 'pointer', border: 'none', background: 'none' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                  Color de Fondo:
                  <input type="color" value={estiloActual.fondo} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, fondo: e.target.value } })} style={{ cursor: 'pointer', border: 'none', background: 'none' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', fontSize: '14px', gap: '5px' }}>
                  Tipografía General:
                  <select value={estiloActual.tipografia} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, tipografia: e.target.value } })} style={{ padding: '8px', borderRadius: '4px', background: '#2d3748', color: '#fff', border: '1px solid #4a5568' }}>
                    <option value="Inter, sans-serif">Inter (Moderna)</option>
                    <option value="Roboto, sans-serif">Roboto (Limpia)</option>
                    <option value="'Courier New', monospace">Courier New (Consola)</option>
                    <option value="Georgia, serif">Georgia (Elegante)</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Estilos del Título Principal */}
            <div style={{ background: '#1a202c', padding: '15px', borderRadius: '6px', border: '1px solid #4a5568' }}>
              <h4 style={{ marginBottom: '15px', color: '#90cdf4' }}>Título Principal (H1)</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                  Color del Título:
                  <input type="color" value={estiloActual.encabezadoColor} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, encabezadoColor: e.target.value } })} style={{ cursor: 'pointer', border: 'none', background: 'none' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                  Tamaño:
                  <select value={estiloActual.encabezadoTamano} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, encabezadoTamano: e.target.value } })} style={{ padding: '6px', borderRadius: '4px', background: '#2d3748', color: '#fff', border: '1px solid #4a5568' }}>
                    <option value="20px">20px</option>
                    <option value="24px">24px</option>
                    <option value="30px">30px</option>
                    <option value="36px">36px</option>
                  </select>
                </label>
                <div style={{ display: 'flex', gap: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={estiloActual.encabezadoNegrita} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, encabezadoNegrita: e.target.checked } })} /> Negrita
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={estiloActual.encabezadoCursiva} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, encabezadoCursiva: e.target.checked } })} /> Cursiva
                  </label>
                </div>
              </div>
            </div>

            {/* Estilos del Subtítulo */}
            <div style={{ background: '#1a202c', padding: '15px', borderRadius: '6px', border: '1px solid #4a5568', gridColumn: '1 / -1' }}>
              <h4 style={{ marginBottom: '15px', color: '#90cdf4' }}>Subtítulo o Descripción</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                  Color del Subtítulo:
                  <input type="color" value={estiloActual.subtituloColor} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, subtituloColor: e.target.value } })} style={{ cursor: 'pointer', border: 'none', background: 'none' }} />
                </label>
                <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', alignItems: 'center' }}>
                  Tamaño:
                  <select value={estiloActual.subtituloTamano} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, subtituloTamano: e.target.value } })} style={{ padding: '6px', borderRadius: '4px', background: '#2d3748', color: '#fff', border: '1px solid #4a5568' }}>
                    <option value="12px">12px</option>
                    <option value="14px">14px</option>
                    <option value="16px">16px</option>
                    <option value="18px">18px</option>
                  </select>
                </label>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={estiloActual.subtituloNegrita} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, subtituloNegrita: e.target.checked } })} /> Negrita
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '13px' }}>
                    <input type="checkbox" checked={estiloActual.subtituloCursiva} onChange={(e) => setConfigModulos({ ...configModulos, [moduloSeleccionado]: { ...estiloActual, subtituloCursiva: e.target.checked } })} /> Cursiva
                  </label>
                </div>
              </div>
            </div>

          </div>

          {/* Vista Previa Interactiva */}
          <div style={{ background: estiloActual.fondo, padding: '20px', borderRadius: '6px', border: '1px dashed #4a5568', textAlign: 'center' }}>
            <h2 style={{ 
              color: estiloActual.encabezadoColor, 
              fontSize: estiloActual.encabezadoTamano, 
              fontWeight: estiloActual.encabezadoNegrita ? 'bold' : 'normal', 
              fontStyle: estiloActual.encabezadoCursiva ? 'italic' : 'normal',
              marginBottom: '5px' 
            }}>
              Título de Prueba ({moduloSeleccionado.toUpperCase()})
            </h2>
            <p style={{ 
              color: estiloActual.subtituloColor, 
              fontSize: estiloActual.subtituloTamano, 
              fontWeight: estiloActual.subtituloNegrita ? 'bold' : 'normal',
              fontStyle: estiloActual.subtituloCursiva ? 'italic' : 'normal',
              marginBottom: '15px' 
            }}>
              Este es el subtítulo o descripción de la página de prueba.
            </p>
            <button style={{ background: estiloActual.boton, color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Botón de Acción
            </button>
          </div>

          <div style={{ marginTop: '20px', textAlign: 'right' }}>
            <button onClick={guardarPersonalizacion} style={{ background: '#38a169', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
              💾 Guardar Cambios para "{moduloSeleccionado.toUpperCase()}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}