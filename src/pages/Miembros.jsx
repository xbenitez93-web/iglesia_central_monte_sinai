import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';

export default function Miembros() {
  const [usuarios, setUsuarios] = useState([]);
  const [ministerios, setMinisterios] = useState([]);
  const [nuevoMinisterio, setNuevoMinisterio] = useState('');
  const [cargando, setCargando] = useState(true);
  const [subPestana, setSubPestana] = useState('usuarios'); // 'usuarios' | 'permisos' | 'ministerios' | 'sistema'

  useEffect(() => {
    // 1. Escuchar usuarios en tiempo real
    const unsubUsuarios = onSnapshot(collection(db, "usuarios"), (snapshot) => {
      const listaUsuarios = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsuarios(listaUsuarios);
      setCargando(false);
    }, (error) => {
      console.error("Error al cargar usuarios:", error);
      setCargando(false);
    });

    // 2. Escuchar ministerios en tiempo real
    const unsubMinisterios = onSnapshot(collection(db, "ministerios"), (snapshot) => {
      const listaMin = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
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
      alert("Hubo un error al actualizar el rol.");
    }
  };

  const actualizarPermisoModulo = async (idUsuario, modulo, estadoActual) => {
    try {
      const usuarioRef = doc(db, "usuarios", idUsuario);
      const usuarioObj = usuarios.find(u => u.id === idUsuario);
      const permisosActuales = usuarioObj.permisosModulos || { directorio: true, finanzas: true, eventos: true, administracion: true, cooperativa: true };
      
      const nuevosPermisos = {
        ...permisosActuales,
        [modulo]: !estadoActual
      };

      await updateDoc(usuarioRef, { permisosModulos: nuevosPermisos });
    } catch (error) {
      console.error("Error al actualizar permisos:", error);
      alert("No se pudo actualizar el permiso.");
    }
  };

  const eliminarUsuario = async (idUsuario, nombreUsuario) => {
    if (window.confirm(`¿Estás seguro de eliminar el acceso de "${nombreUsuario}"?`)) {
      try {
        await deleteDoc(doc(db, "usuarios", idUsuario));
        alert("Usuario eliminado de la lista de accesos.");
      } catch (error) {
        console.error("Error al eliminar usuario:", error);
        alert("No se pudo eliminar el usuario.");
      }
    }
  };

  const agregarMinisterio = async (e) => {
    e.preventDefault();
    if (!nuevoMinisterio.trim()) return;
    try {
      await addDoc(collection(db, "ministerios"), { nombre: nuevoMinisterio.trim() });
      setNuevoMinisterio('');
      alert("¡Ministerio agregado con éxito!");
    } catch (error) {
      console.error("Error al agregar ministerio:", error);
      alert("No se pudo guardar el ministerio.");
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
    const datosBackup = {
      usuarios,
      ministerios,
      fechaRespaldo: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datosBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `respaldo_congregacion360_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  if (cargando) {
    return <div style={{ padding: '20px', color: '#fff' }}>Cargando panel de administración...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', color: '#fff' }}>
      <h2>Panel de Configuración y Administración</h2>
      <p style={{ color: '#a0aec0', marginBottom: '20px', fontSize: '14px' }}>
        Gestiona accesos, permisos granulares por módulos, ministerios globales y respaldos del sistema.
      </p>

      {/* Submenú de pestañas */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #4a5568', paddingBottom: '10px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setSubPestana('usuarios')}
          style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'usuarios' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
        >
          👥 Accesos y Roles
        </button>
        <button 
          onClick={() => setSubPestana('permisos')}
          style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'permisos' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🔒 Permisos por Módulos
        </button>
        <button 
          onClick={() => setSubPestana('ministerios')}
          style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'ministerios' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ⛪ Gestión de Ministerios
        </button>
        <button 
          onClick={() => setSubPestana('sistema')}
          style={{ padding: '8px 16px', borderRadius: '4px', border: 'none', background: subPestana === 'sistema' ? '#3182ce' : '#2d3748', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
        >
          💾 Respaldo y Datos
        </button>
      </div>

      {/* PESTAÑA 1: USUARIOS Y ROLES */}
      {subPestana === 'usuarios' && (
        <div style={{ background: '#2d3748', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
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
              {usuarios.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#a0aec0' }}>
                    No hay usuarios registrados todavía.
                  </td>
                </tr>
              ) : (
                usuarios.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #4a5568' }}>
                    <td style={{ padding: '12px 15px', fontWeight: 'bold' }}>{u.nombre || 'Sin nombre'}</td>
                    <td style={{ padding: '12px 15px', color: '#90cdf4' }}>{u.usuario}</td>
                    <td style={{ padding: '12px 15px' }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        borderRadius: '4px', 
                        fontSize: '12px', 
                        fontWeight: 'bold',
                        background: u.rol === 'admin' ? '#2b6cb0' : (u.rol === 'tesorero' ? '#276749' : '#4a5568'),
                        color: '#fff'
                      }}>
                        {u.rol || 'miembro'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                      <select 
                        value={u.rol || 'miembro'} 
                        onChange={(e) => cambiarRol(u.id, e.target.value)}
                        style={{ padding: '6px', borderRadius: '4px', background: '#1a202c', color: '#fff', border: '1px solid #4a5568' }}
                      >
                        <option value="miembro">Miembro</option>
                        <option value="tesorero">Tesorero</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </td>
                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                      <button 
                        onClick={() => eliminarUsuario(u.id, u.nombre || u.usuario)}
                        style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PESTAÑA 2: PERMISOS POR MÓDULOS */}
      {subPestana === 'permisos' && (
        <div style={{ background: '#2d3748', borderRadius: '8px', padding: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
          <h3>Control Granular de Módulos</h3>
          <p style={{ color: '#a0aec0', fontSize: '13px', marginBottom: '20px' }}>
            Habilita o deshabilita el acceso de cada usuario a los módulos específicos del sistema.
          </p>
          <div style={{ overflowX: 'auto' }}>
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
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={permisos.directorio ?? true} 
                          onChange={() => actualizarPermisoModulo(u.id, 'directorio', permisos.directorio ?? true)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={permisos.finanzas ?? true} 
                          onChange={() => actualizarPermisoModulo(u.id, 'finanzas', permisos.finanzas ?? true)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={permisos.eventos ?? true} 
                          onChange={() => actualizarPermisoModulo(u.id, 'eventos', permisos.eventos ?? true)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={permisos.administracion ?? true} 
                          onChange={() => actualizarPermisoModulo(u.id, 'administracion', permisos.administracion ?? true)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={permisos.cooperativa ?? true} 
                          onChange={() => actualizarPermisoModulo(u.id, 'cooperativa', permisos.cooperativa ?? true)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PESTAÑA 3: GESTIÓN DE MINISTERIOS */}
      {subPestana === 'ministerios' && (
        <div style={{ background: '#2d3748', padding: '20px', borderRadius: '8px' }}>
          <h3>Catálogo de Ministerios</h3>
          <p style={{ color: '#a0aec0', fontSize: '13px', marginBottom: '15px' }}>Agrega o elimina los ministerios disponibles para clasificar a los miembros.</p>
          
          <form onSubmit={agregarMinisterio} style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
            <input 
              type="text" 
              placeholder="Nombre del nuevo ministerio..."
              value={nuevoMinisterio}
              onChange={(e) => setNuevoMinisterio(e.target.value)}
              style={{ flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #4a5568', background: '#1a202c', color: '#fff' }}
            />
            <button type="submit" style={{ background: '#3182ce', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
              Agregar
            </button>
          </form>

          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ministerios.map((min) => (
              <li key={min.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1a202c', padding: '10px 15px', borderRadius: '6px', border: '1px solid #4a5568' }}>
                <span>{min.nombre}</span>
                <button 
                  onClick={() => eliminarMinisterio(min.id)}
                  style={{ background: '#e53e3e', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                >
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* PESTAÑA 4: RESPALDO Y DATOS */}
      {subPestana === 'sistema' && (
        <div style={{ background: '#2d3748', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <h3>Copia de Seguridad (Backup)</h3>
          <p style={{ color: '#a0aec0', fontSize: '14px', maxWidth: '600px', margin: '10px auto 20px auto' }}>
            Puedes descargar un archivo de respaldo local con la información actual de usuarios y configuraciones del sistema en formato JSON.
          </p>
          <button 
            onClick={descargarBackup}
            style={{ background: '#38a169', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}
          >
            📥 Descargar Respaldo General
          </button>
        </div>
      )}
    </div>
  );
}