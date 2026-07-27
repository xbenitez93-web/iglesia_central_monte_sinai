import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, getDoc, setDoc } from 'firebase/firestore';

export default function Dashboard() {
  const [ministerios, setMinisterios] = useState([]);
  const [abiertoMinisterios, setAbiertoMinisterios] = useState(false);
  const [notificacionMinisterios, setNotificacionMinisterios] = useState(0);

  // Cargar ministerios en tiempo real desde Firestore
  useEffect(() => {
    const unsubscribeMin = onSnapshot(collection(db, "ministerios"), async (snapshot) => {
      const listaMin = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMinisterios(listaMin);

      try {
        const docRef = doc(db, "config_cooperativas", "ultimasVisitas");
        const docSnap = await getDoc(docRef);
        const ultimaVisitaMin = docSnap.exists() ? docSnap.data().ministerios?.toDate() || new Date(0) : new Date(0);

        const nuevosCount = listaMin.filter(min => min.creadoEn && min.creadoEn.toDate() > ultimaVisitaMin).length;
        setNotificacionMinisterios(nuevosCount);
      } catch (e) {
        console.error("Error al calcular notificaciones:", e);
      }
    }, (error) => {
      console.error("Error al conectar con ministerios:", error);
    });

    return () => unsubscribeMin();
  }, []);

  const manejarClickMinisterios = async () => {
    setAbiertoMinisterios(!abiertoMinisterios);
    if (!abiertoMinisterios && notificacionMinisterios > 0) {
      setNotificacionMinisterios(0);
      try {
        const docRef = doc(db, "config_cooperativas", "ultimasVisitas");
        await setDoc(docRef, { ministerios: new Date() }, { merge: true });
      } catch (e) {
        console.error("Error al actualizar última visita:", e);
      }
    }
  };

  return (
    <div style={{ padding: '30px', fontFamily: 'Inter, sans-serif', background: '#0f172a', minHeight: '100vh', color: '#fff' }}>
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 'bold', margin: 0 }}>Dashboard Principal (Versión 1.0.1)</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '5px' }}>Bienvenido al panel de control de tu congregación.</p>
      </div>

      {/* Contenedor del Botón Desplegable */}
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button 
          onClick={manejarClickMinisterios}
          style={{
            background: '#1e293b',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            border: '1px solid #334155',
            cursor: 'pointer',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '15px'
          }}
        >
          <span>⛪ Ministerios</span>
          
          {notificacionMinisterios > 0 && (
            <span style={{ background: '#ef4444', color: '#fff', borderRadius: '50%', padding: '2px 7px', fontSize: '11px', fontWeight: 'bold' }}>
              {notificacionMinisterios}
            </span>
          )}

          <span style={{ fontSize: '12px', color: '#94a3b8' }}>{abiertoMinisterios ? '▲' : '▼'}</span>
        </button>

        {/* Menú Desplegable Flotante */}
        {abiertoMinisterios && (
          <div style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.4)',
            minWidth: '240px',
            zIndex: 100,
            overflow: 'hidden'
          }}>
            <div style={{ padding: '10px 15px', borderBottom: '1px solid #334155', fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>
              LISTA DE MINISTERIOS ({ministerios.length})
            </div>

            {ministerios.length > 0 ? (
              ministerios.map((min) => (
                <div 
                  key={min.id}
                  style={{
                    padding: '12px 15px',
                    color: '#f8fafc',
                    borderBottom: '1px solid #273548',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#334155'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => {
                    alert(`Seleccionaste el ministerio: ${min.nombre}`);
                    setAbiertoMinisterios(false);
                  }}
                >
                  {min.nombre}
                </div>
              ))
            ) : (
              <div style={{ padding: '15px', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                No hay ministerios registrados
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}