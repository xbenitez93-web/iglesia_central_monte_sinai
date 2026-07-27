import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

export default function Dashboard() {
  const [ministerios, setMinisterios] = useState([]);
  const [mostrarMinisterios, setMostrarMinisterios] = useState(false);
  const [cargandoMin, setCargandoMin] = useState(true);

  // --- ESTILOS DE PERSONALIZACIÓN ---
  const [estilos, setEstilos] = useState(() => {
    const guardado = localStorage.getItem('congregacion360_estilos');
    if (guardado) {
      const parsed = JSON.parse(guardado);
      return parsed.directorio || {}; 
    }
    return {
      boton: '#3182ce',
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
    };
  });

  useEffect(() => {
    const actualizarEstilosLocales = () => {
      const guardado = localStorage.getItem('congregacion360_estilos');
      if (guardado) {
        const parsed = JSON.parse(guardado);
        if (parsed.directorio) setEstilos(parsed.directorio);
      }
    };

    window.addEventListener('estilosActualizados', actualizarEstilosLocales);

    const unsubscribe = onSnapshot(collection(db, "ministerios"), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMinisterios(lista);
      setCargandoMin(false);
    }, (error) => {
      console.error("Error al cargar ministerios:", error);
      setCargandoMin(false);
    });

    return () => {
      window.removeEventListener('estilosActualizados', actualizarEstilosLocales);
      unsubscribe();
    };
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto', background: estilos.fondo || '#1a202c', minHeight: '80vh', fontFamily: estilos.tipografia || 'Inter, sans-serif', color: '#fff', borderRadius: '8px' }}>
      
      <h1 style={{ 
        color: estilos.encabezadoColor || '#ffffff', 
        fontSize: estilos.encabezadoTamano || '24px', 
        fontWeight: estilos.encabezadoNegrita ? 'bold' : 'normal', 
        fontStyle: estilos.encabezadoCursiva ? 'italic' : 'normal',
        marginBottom: '5px' 
      }}>
        Bienvenido a Congregación 360
      </h1>

      <p style={{ 
        color: estilos.subtituloColor || '#a0aec0', 
        fontSize: estilos.subtituloTamano || '14px', 
        fontWeight: estilos.subtituloNegrita ? 'bold' : 'normal',
        fontStyle: estilos.subtituloCursiva ? 'italic' : 'normal',
        marginBottom: '25px' 
      }}>
        Panel principal de control y resumen general de la congregación.
      </p>

      {/* SECCIÓN INTERACTIVA: MINISTERIOS ACTIVOS */}
      <div 
        onClick={() => setMostrarMinisterios(!mostrarMinisterios)}
        style={{ 
          background: '#2d3748', 
          padding: '20px', 
          borderRadius: '8px', 
          cursor: 'pointer', 
          border: `1px solid ${estilos.boton || '#3182ce'}`,
          transition: 'all 0.3s ease',
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>⛪ Ministerios Activos</h3>
            <p style={{ margin: '5px 0 0 0', color: '#a0aec0', fontSize: '13px' }}>
              {cargandoMin ? 'Cargando ministerios...' : `Total registrados: ${ministerios.length} (Haz clic para ${mostrarMinisterios ? 'ocultar' : 'ver'} detalles)`}
            </p>
          </div>
          <span style={{ fontSize: '20px', color: estilos.boton || '#3182ce', fontWeight: 'bold' }}>
            {mostrarMinisterios ? '▲' : '▼'}
          </span>
        </div>

        {mostrarMinisterios && (
          <div style={{ marginTop: '15px', borderTop: '1px solid #4a5568', paddingTop: '15px' }} onClick={(e) => e.stopPropagation()}>
            {ministerios.length === 0 ? (
              <p style={{ color: '#a0aec0', fontSize: '14px', fontStyle: 'italic' }}>No hay ministerios registrados aún.</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                {ministerios.map((min) => (
                  <li key={min.id} style={{ background: '#1a202c', padding: '10px 15px', borderRadius: '6px', border: '1px solid #4a5568', fontSize: '14px', color: '#cbd5e0' }}>
                    ✨ {min.nombre}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <div style={{ marginTop: '30px' }}>
        <button style={{ background: estilos.boton || '#3182ce', color: '#fff', border: 'none', padding: '12px 25px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
          Acción Rápida del Sistema
        </button>
      </div>

    </div>
  );
}