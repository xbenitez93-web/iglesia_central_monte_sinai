import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Dashboard({ user }) {
  const [totalMiembros, setTotalMiembros] = useState(0);
  const [totalEventos, setTotalEventos] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerEstadisticas = async () => {
      try {
        // 1. Obtener total de miembros
        const snapshotMiembros = await getDocs(collection(db, "miembros"));
        console.log("Miembros encontrados:", snapshotMiembros.size);
        setTotalMiembros(snapshotMiembros.size);

        // 2. Obtener total de eventos de la colección "eventos"
        const snapshotEventos = await getDocs(collection(db, "eventos"));
        console.log("Eventos encontrados en Firestore:", snapshotEventos.size);
        setTotalEventos(snapshotEventos.size);

      } catch (error) {
        console.error("Error al obtener estadísticas:", error);
      } finally {
        setCargando(false);
      }
    };
    obtenerEstadisticas();
  }, []);

  return (
    <div style={{ padding: '30px', backgroundColor: '#f4f7f6', minHeight: '100vh', width: '100%' }}>
      <header style={{ marginBottom: '25px' }}>
        <h1 style={{ color: '#2d3748', fontSize: '2rem', margin: '0 0 5px 0' }}>Sistema de Gestión Eclesiástica</h1>
        <p style={{ color: '#718096', margin: 0 }}>Bienvenido al centro de control ministerial.</p>
      </header>

      {/* Tarjeta de bienvenida del usuario */}
      {user && (
        <div style={{ background: '#2d3748', padding: '15px 20px', borderRadius: '8px', marginBottom: '25px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#a0aec0', textTransform: 'uppercase', letterSpacing: '1px' }}>Bienvenido</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', color: '#63b3ed' }}>{user.email || user.displayName || "Usuario del Sistema"}</h3>
          </div>
        </div>
      )}

      <main>
        <h2 style={{ marginBottom: '20px', color: '#2d3748', fontSize: '1.4rem' }}>Resumen General</h2>
        
        {/* Tarjetas de Estadísticas directas */}
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', minWidth: '200px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #3182ce' }}>
            <p style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '14px', fontWeight: '600' }}>Total Miembros</p>
            <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.8rem' }}>{cargando ? "..." : totalMiembros}</h3>
          </div>

          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', minWidth: '200px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #38a169' }}>
            <p style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '14px', fontWeight: '600' }}>Total Ofrendas</p>
            <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.8rem' }}>$0.00</h3>
          </div>

          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', minWidth: '200px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #d69e2e' }}>
            <p style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '14px', fontWeight: '600' }}>Agenda / Eventos</p>
            <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.8rem' }}>{cargando ? "..." : totalEventos}</h3>
          </div>

          <div style={{ background: '#fff', padding: '20px', borderRadius: '8px', minWidth: '200px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', borderLeft: '4px solid #805ad5' }}>
            <p style={{ margin: '0 0 8px 0', color: '#718096', fontSize: '14px', fontWeight: '600' }}>Ministerios Activos</p>
            <h3 style={{ margin: 0, color: '#2d3748', fontSize: '1.8rem' }}>4</h3>
          </div>
        </div>
      </main>
    </div>
  );
}