import React, { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, collection, onSnapshot } from "firebase/firestore";
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
  const [pestanaActiva, setPestanaActiva] = useState('dashboard');
  const [menuAbierto, setMenuAbierto] = useState(false);
  
  // Estados para las estadísticas del Dashboard en tiempo real
  const [totalMiembros, setTotalMiembros] = useState(0);
  const [totalOfrendas, setTotalOfrendas] = useState(0);
  const [totalEventos, setTotalEventos] = useState(0);
  const [totalMinisterios, setTotalMinisterios] = useState(0);

  // Escuchar el estado de autenticación y datos en tiempo real con onSnapshot
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const docRef = doc(db, "usuarios", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setRolUsuario(docSnap.data().rol || 'miembro');
          }
        } catch (error) {
          console.error("Error al obtener el rol:", error);
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

    // 3. Escuchar Eventos en tiempo real
    const unsubEventos = onSnapshot(collection(db, "eventos"), (snapshot) => {
      setTotalEventos(snapshot.size);
    });

    // 4. Escuchar Ministerios en tiempo real
    const unsubMinisterios = onSnapshot(collection(db, "ministerios"), (snapshot) => {
      setTotalMinisterios(snapshot.size > 0 ? snapshot.size : 4);
    });

    return () => {
      unsubscribeAuth();
      unsubMiembros();
      unsubFinanzas();
      unsubEventos();
      unsubMinisterios();
    };
  }, []);

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
          {pestanaActiva === 'eventos' && 'Eventos y Calendario'}
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
          
          <button 
            className={pestanaActiva === 'directorio' ? 'drawer-item active' : 'drawer-item'}
            onClick={() => cambiarSeccion('directorio')}
          >
            <span className="icon">👥</span> Directorio
          </button>
          
          {(rolUsuario === 'admin' || rolUsuario === 'tesorero') && (
            <button 
              className={pestanaActiva === 'finanzas' ? 'drawer-item active' : 'drawer-item'}
              onClick={() => cambiarSeccion('finanzas')}
            >
              <span className="icon">💰</span> Finanzas
            </button>
          )}

          {/* Módulo de Mini Cooperativa (Visible para admin y tesorero) */}
          {(rolUsuario === 'admin' || rolUsuario === 'tesorero') && (
            <button 
              className={pestanaActiva === 'cooperativa' ? 'drawer-item active' : 'drawer-item'}
              onClick={() => cambiarSeccion('cooperativa')}
            >
              <span className="icon">🤝</span> Mini Cooperativa
            </button>
          )}
          
          <button 
            className={pestanaActiva === 'eventos' ? 'drawer-item active' : 'drawer-item'}
            onClick={() => cambiarSeccion('eventos')}
          >
            <span className="icon">📅</span> Eventos y Calendario
          </button>

          {rolUsuario === 'admin' && (
            <button 
              className={pestanaActiva === 'roles' ? 'drawer-item active' : 'drawer-item'}
              onClick={() => cambiarSeccion('roles')}
            >
              <span className="icon">🛡️</span> Configuración de Roles
            </button>
          )}
        </div>

        <div className="drawer-footer">
          <button className="drawer-item logout" onClick={() => signOut(auth)}>
            <span className="icon">🚪</span> Cerrar Sesión
          </button>
        </div>
      </nav>

      <main className="main-content">
        {pestanaActiva === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            {/* Tarjeta de Bienvenida Centrada con Logo */}
            <div className="dashboard-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '25px', background: '#2d3748', borderRadius: '8px', color: '#fff' }}>
              <img 
                src="/sinai_app.png" 
                alt="Iglesia Central Monte Sinai" 
                style={{ width: '150px', height: '150px', objectFit: 'contain', marginBottom: '12px' }} 
              />
              <div className="card-info">
                <span className="card-label" style={{ fontSize: '35px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px' }}>Bienvenido</span>
                <div className="card-value" style={{ fontSize: '18px', color: '#63b3ed', fontWeight: 'bold', marginTop: '4px' }}>{user.email}</div>
              </div>
            </div>

            <h2 style={{ color: '#2d3748', fontSize: '1.4rem', margin: '0 0 5px 0' }}>Resumen General</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', width: '100%' }}>
              
              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #3182ce' }}>
                <p style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '14px', fontWeight: '600' }}>Total Miembros</p>
                <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.8rem' }}>{totalMiembros}</h3>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #38a169' }}>
                <p style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '14px', fontWeight: '600' }}>Total Ofrendas</p>
                <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.8rem' }}>${totalOfrendas.toLocaleString()}</h3>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #d69e2e' }}>
                <p style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '14px', fontWeight: '600' }}>Agenda / Eventos</p>
                <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.8rem' }}>{totalEventos}</h3>
              </div>

              <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #805ad5' }}>
                <p style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '14px', fontWeight: '600' }}>Ministerios Activos</p>
                <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.8rem' }}>{totalMinisterios}</h3>
              </div>

            </div>
          </div>
        )}

        {pestanaActiva === 'directorio' && <Directorio />}
        {pestanaActiva === 'finanzas' && <FinancePage />}
        {pestanaActiva === 'cooperativa' && <CooperativaPage />}
        {pestanaActiva === 'eventos' && <EventosPage />}
        {pestanaActiva === 'roles' && <Miembros />}
      </main>
    </div>
  );
}