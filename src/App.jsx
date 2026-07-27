import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot, setDoc } from "firebase/firestore";
import Login from "./pages/Login";
import Directorio from "./pages/Directorio";
import FinancePage from "./components/FinancePage";
import EventosPage from "./pages/EventosPage";
import Miembros from "./pages/Miembros";
import CooperativaPage from "./pages/CooperativaPage";
import "./App.css";

export default function App() {
  const [user, setUser] = useState(null);
  const [cargandoAuth, setCargandoAuth] = useState(true);
  const [rolUsuario, setRolUsuario] = useState('miembro'); 
  const [permisosModulos, setPermisosModulos] = useState({
    directorio: false,
    finanzas: false,
    eventos: false,
    administracion: false,
    cooperativa: false
  });
  const [pestanaActiva, setPestanaActiva] = useState('dashboard');
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  // Estados para las estadísticas del Dashboard en tiempo real
  const [totalMiembros, setTotalMiembros] = useState(0);
  const [totalOfrendas, setTotalOfrendas] = useState(0);
  const [totalEventos, setTotalEventos] = useState(0);
  const [totalMinisterios, setTotalMinisterios] = useState(0);

  // Estados específicos para el Desplegable de Ministerios y Notificaciones
  const [listaMinisteriosDocs, setListaMinisteriosDocs] = useState([]);
  const [abiertoMinisterios, setAbiertoMinisterios] = useState(false);
  const [notificacionMinisterios, setNotificacionMinisterios] = useState(0);

  // Escuchar el estado de autenticación y datos en tiempo real con onSnapshot
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const dataUser = docSnap.data();
            setRolUsuario(dataUser.rol || 'miembro');
            if (dataUser.permisosModulos) {
              setPermisosModulos(dataUser.permisosModulos);
            }
          }
        } catch (error) {
          console.error("Error al obtener el rol y permisos:", error);
        }
      }
      setCargandoAuth(false);
    });

    // 1. Escuchar Miembros en tiempo real
    const unsubMiembros = onSnapshot(collection(db, "miembros"), (snapshot) => {
      setTotalMiembros(snapshot.size);
    });

    // 2. Escuchar Finanzas en tiempo real y sumar todo automáticamente
    const unsubFinanzas = onSnapshot(collection(db, "finanzas"), (snapshot) => {
      let sumaFinanzas = 0;
      snapshot.forEach((docItem) => {
        const data = docItem.data();
        const montoExtraido = 
          Number(data.monto) || 
          Number(data.cantidad) || 
          Number(data.valor) || 
          Number(data.ofrenda) || 
          Number(data.total) || 
          Object.values(data).find(val => typeof val === 'number') || 
          0;
        sumaFinanzas += Number(montoExtraido);
      });
      setTotalOfrendas(sumaFinanzas);
    });

    // 3. Escuchar Eventos / Agenda en tiempo real
    const unsubEventos = onSnapshot(collection(db, "eventos"), (snapshot) => {
      setTotalEventos(snapshot.size);
    });

    // 4. Escuchar Ministerios en tiempo real, guardar lista y calcular notificaciones
    const unsubMinisterios = onSnapshot(collection(db, "ministerios"), async (snapshot) => {
      const listaMin = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setListaMinisteriosDocs(listaMin);
      setTotalMinisterios(listaMin.length > 0 ? listaMin.length : 4);

      // Calcular notificaciones rojas basadas en la última visita
      try {
        const docRef = doc(db, "config_cooperativas", "ultimasVisitas");
        const docSnap = await getDoc(docRef);
        const ultimaVisitaMin = docSnap.exists() ? docSnap.data().ministerios?.toDate() || new Date(0) : new Date(0);

        const nuevosCount = listaMin.filter(min => min.creadoEn && min.creadoEn.toDate() > ultimaVisitaMin).length;
        setNotificacionMinisterios(nuevosCount);
      } catch (e) {
        console.error("Error al calcular notificaciones de ministerios:", e);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubMiembros();
      unsubFinanzas();
      unsubEventos();
      unsubMinisterios();
    };
  }, []);

  // Función al hacer clic en el desplegable de ministerios para limpiar notificación
  const manejarClickMinisterios = () => {
    setAbiertoMinisterios(!abiertoMinisterios);
    if (!abiertoMinisterios && notificacionMinisterios > 0) {
      setNotificacionMinisterios(0);
      try {
        const docRef = doc(db, "config_cooperativas", "ultimasVisitas");
        setDoc(docRef, { ministerios: new Date() }, { merge: true });
      } catch (e) {
        console.error("Error al actualizar última visita:", e);
      }
    }
  };

  if (cargandoAuth) {
    return (
      <div style={{
        fontSize: '2.5rem', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        background: '#1a202c', 
        color: '#fff',
        textAlign: 'center',
        padding: '20px'
      }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>Iglesia Central</p>
        <p style={{ margin: 0, color: '#63b3ed', fontWeight: 'bold' }}>Monte Sinai</p>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginSuccess={(u) => setUser(u)} />;
  }

  const cambiarSeccion = (seccion) => {
    setPestanaActiva(seccion);
    setMenuAbierto(false);
  };

  // --- VALIDACIÓN DE PERMISOS GRANULARES ESTRICTA ---
  const esAdmin = rolUsuario === 'admin';

  const verDirectorio = esAdmin || (permisosModulos.directorio === true);
  const verFinanzas = esAdmin || (permisosModulos.finanzas === true);
  const verCooperativa = esAdmin || (permisosModulos.cooperativa === true);
  const verEventos = esAdmin || (permisosModulos.eventos === true);
  const verRolesConfig = esAdmin || (permisosModulos.administracion === true);

  return (
    <div className="app-layout">
      <header className="mobile-header">
        <div className="hamburger-icon" onClick={() => setMenuAbierto(!menuAbierto)}>
          ☰
        </div>
        <div className="mobile-header-title">
          {pestanaActiva === 'dashboard' && 'Portada'}
          {pestanaActiva === 'directorio' && 'Directorio'}
          {pestanaActiva === 'finanzas' && 'Finanzas'}
          {pestanaActiva === 'cooperativa' && 'Mini Cooperativa'}
          {pestanaActiva === 'eventos' && 'Agenda / Calendario'}
          {pestanaActiva === 'roles' && 'Configuración y Roles'}
        </div>
      </header>

      {menuAbierto && (
        <div className="menu-overlay" onClick={() => setMenuAbierto(false)} />
      )}

      <nav className={`side-drawer ${menuAbierto ? 'open' : ''}`}>
        <div className="drawer-header" style={{ textAlign: 'center', padding: '20px 15px', borderBottom: '1px solid #2d3748' }}>
          <img 
            src="/sinai_app.png" 
            alt="Iglesia Central Monte Sinai" 
            style={{ width: '110px', height: '110px', objectFit: 'contain', marginBottom: '10px' }} 
          />
          <h3 style={{ fontSize: '13px', margin: 0, color: '#fff', letterSpacing: '0.5px', lineHeight: '1.4' }}>
            IGLESIA CENTRAL<br />MONTE SINAI
          </h3>
        </div>

        <div className="drawer-options">
          <button 
            className={pestanaActiva === 'dashboard' ? 'drawer-item active' : 'drawer-item'}
            onClick={() => cambiarSeccion('dashboard')}
          >
            <span className="icon">📊</span> Portada
          </button>
          
          {verDirectorio && (
            <button 
              className={pestanaActiva === 'directorio' ? 'drawer-item active' : 'drawer-item'}
              onClick={() => cambiarSeccion('directorio')}
            >
              <span className="icon">👥</span> Directorio
            </button>
          )}
          
          {verFinanzas && (
            <button 
              className={pestanaActiva === 'finanzas' ? 'drawer-item active' : 'drawer-item'}
              onClick={() => cambiarSeccion('finanzas')}
            >
              <span className="icon">💰</span> Finanzas
            </button>
          )}

          {verCooperativa && (
            <button 
              className={pestanaActiva === 'cooperativa' ? 'drawer-item active' : 'drawer-item'}
              onClick={() => cambiarSeccion('cooperativa')}
            >
              <span className="icon">🤝</span> Mini Cooperativa
            </button>
          )}
          
          {verEventos && (
            <button 
              className={pestanaActiva === 'eventos' ? 'drawer-item active' : 'drawer-item'}
              onClick={() => cambiarSeccion('eventos')}
            >
              <span className="icon">📅</span> Agenda / Calendario
            </button>
          )}

          {verRolesConfig && (
            <button 
              className={pestanaActiva === 'roles' ? 'drawer-item active' : 'drawer-item'}
              onClick={() => cambiarSeccion('roles')}
            >
              <span className="icon">🛡️</span> Configuración de Roles
            </button>
          )}
        </div>

        <div className="drawer-footer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button 
            className="drawer-item logout" 
            onClick={() => signOut(auth)}
            style={{ width: '90%', justifyContent: 'center' }}
          >
            <span className="icon">🚪</span> Cerrar Sesión
          </button>
          
          <div style={{ marginTop: '10px', textAlign: 'center', width: '100%' }}>
            <span style={{ fontSize: '12px', color: '#a0aec0' }}>
              Versión de la App: <strong>1.0.1</strong>
            </span>
          </div>
        </div>
      </nav>

      <main className="main-content">
        {pestanaActiva === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '25px', background: '#2d3748', borderRadius: '8px', color: '#fff' }}>
              <img 
                src="/sinai_app.png" 
                alt="Iglesia Central Monte Sinai" 
                style={{ width: '150px', height: '150px', objectFit: 'contain', marginBottom: '12px' }} 
              />
              <div className="card-info">
                <span className="card-label" style={{ fontSize: '35px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px' }}>Bienvenido</span>
                <div className="card-value" style={{ fontSize: '18px', color: '#63b3ed', fontWeight: 'bold', marginTop: '4px' }}>{user.email} (Rol: {rolUsuario})</div>
              </div>
            </div>

            <h2 style={{ color: '#2d3748', fontSize: '1.4rem', margin: '0 0 5px 0' }}>Resumen General</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', width: '100%' }}>
              
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #3182ce' }}>
                <p style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '14px', fontWeight: '600' }}>Total Miembros</p>
                <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.8rem' }}>{totalMiembros}</h3>
              </div>

              {verFinanzas && (
                <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #38a169' }}>
                  <p style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '14px', fontWeight: '600' }}>Total Ofrendas</p>
                  <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.8rem' }}>${totalOfrendas.toLocaleString()}</h3>
                </div>
              )}

              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #d69e2e' }}>
                <p style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '14px', fontWeight: '600' }}>Agenda / Eventos</p>
                <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.8rem' }}>{totalEventos}</h3>
              </div>

              {/* TARJETA DE MINISTERIOS CON EL BOTÓN Y MENÚ DESPLEGABLE */}
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #805ad5', position: 'relative', overflow: 'visible' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '14px', fontWeight: '600' }}>Ministerios Activos</p>
                    <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.8rem' }}>{totalMinisterios}</h3>
                  </div>

                  <button 
                    onClick={manejarClickMinisterios}
                    style={{
                      background: '#805ad5',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <span>Ver lista</span>
                    {notificacionMinisterios > 0 && (
                      <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '1px 6px', fontSize: '10px' }}>
                        {notificacionMinisterios}
                      </span>
                    )}
                    <span>{abiertoMinisterios ? '▲' : '▼'}</span>
                  </button>
                </div>

                {/* MENÚ DESPLEGABLE FLOTANTE */}
                {abiertoMinisterios && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 5px)',
                    left: '20px',
                    right: '20px',
                    background: '#1a202c',
                    border: '1px solid #4a5568',
                    borderRadius: '8px',
                    boxShadow: '0 10px 25px -3px rgba(0,0,0,0.5)',
                    zIndex: 9999,
                    maxHeight: '220px',
                    overflowY: 'auto'
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #4a5568', fontSize: '11px', color: '#a0aec0', fontWeight: 'bold' }}>
                      LISTADO DE MINISTERIOS ({listaMinisteriosDocs.length})
                    </div>
                    {listaMinisteriosDocs.length > 0 ? (
                      listaMinisteriosDocs.map((min) => (
                        <div 
                          key={min.id}
                          style={{
                            padding: '12px 15px',
                            color: '#ffffff',
                            borderBottom: '1px solid #2d3748',
                            fontSize: '14px',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#2d3748'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                          onClick={() => {
                            alert(`Ministerio seleccionado: ${min.nombre || min.id}`);
                            setAbiertoMinisterios(false);
                          }}
                        >
                          {min.nombre ? min.nombre : `Ministerio sin nombre (ID: ${min.id})`}
                        </div>
                      ))
                    ) : (
                      <div style={{ padding: '15px', color: '#a0aec0', fontSize: '13px', textAlign: 'center' }}>
                        No hay ministerios registrados en Firestore
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {pestanaActiva === 'directorio' && verDirectorio && <Directorio />}
        {pestanaActiva === 'finanzas' && verFinanzas && <FinancePage />}
        {pestanaActiva === 'cooperativa' && verCooperativa && <CooperativaPage />}
        {pestanaActiva === 'eventos' && verEventos && <EventosPage />}
        {pestanaActiva === 'roles' && verRolesConfig && <Miembros />}
      </main>
    </div>
  );
}