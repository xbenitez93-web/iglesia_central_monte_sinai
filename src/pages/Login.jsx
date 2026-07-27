import React, { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, getDocs, setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase'; // Ajusta la ruta si es necesario

export default function Login() {
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [esRegistro, setEsRegistro] = useState(false);

  // Cargar estilos personalizados con respaldo seguro
  const guardarEstilos = JSON.parse(localStorage.getItem('congregacion360_estilos')) || {};
  const estiloLogin = guardarEstilos.login || {
    fondo: '#1a202c',
    boton: '#3182ce',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let emailParaFirebase = identificador.trim().toLowerCase();

    // Si no incluye '@', le agregamos el dominio interno por defecto
    if (!emailParaFirebase.includes('@')) {
      emailParaFirebase = `${emailParaFirebase}@sinai.central`;
    }

    if (esRegistro) {
      // --- LÓGICA DE REGISTRO ---
      try {
        // Verificar si ya existen usuarios en la colección para saber si este será el admin
        const usuariosSnapshot = await getDocs(collection(db, "usuarios"));
        const esPrimerUsuario = usuariosSnapshot.empty;
        const rolAsignado = esPrimerUsuario ? 'admin' : 'miembro';

        // Crear usuario en Firebase Auth
        const credencial = await createUserWithEmailAndPassword(auth, emailParaFirebase, password);
        const uid = credencial.user.uid;

        // Crear documento del usuario en Firestore
        await setDoc(doc(db, "usuarios", uid), {
          nombre: nombre.trim() || identificador.trim(),
          usuario: identificador.trim().toLowerCase(),
          email: emailParaFirebase,
          rol: rolAsignado,
          permisosModulos: {
            directorio: true,
            finanzas: true,
            eventos: true,
            administracion: true,
            cooperativa: true
          },
          fechaCreacion: new Date().toISOString()
        });

        alert(esPrimerUsuario 
          ? "¡Registro exitoso! Como eres el primer usuario, se te ha asignado el rol de Administrador." 
          : "¡Registro exitoso! Tu cuenta ha sido creada correctamente."
        );
      } catch (err) {
        console.error("Error en registro:", err);
        if (err.code === 'auth/email-already-in-use') {
          setError("Este nombre de usuario o correo ya está registrado.");
        } else if (err.code === 'auth/weak-password') {
          setError("La contraseña debe tener al menos 6 caracteres.");
        } else {
          setError("Error al registrar el usuario. Inténtalo de nuevo.");
        }
      }
    } else {
      // --- LÓGICA DE INICIO DE SESIÓN ---
      try {
        await signInWithEmailAndPassword(auth, emailParaFirebase, password);
      } catch (err) {
        console.error("Error en login:", err);
        setError("Usuario o contraseña incorrectos.");
      }
    }
  };

  return (
    <div style={{ 
      background: estiloLogin.fondo, 
      fontFamily: estiloLogin.tipografia, 
      minHeight: '100vh', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      padding: '20px' 
    }}>
      <div style={{ maxWidth: '400px', width: '100%', padding: '30px', background: '#2d3748', borderRadius: '8px', boxSizing: 'border-box' }}>
        
        {/* Contenedor del Logo */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <img 
            src="/sinai_app.png" 
            alt="Iglesia Central Monte Sinai" 
            style={{ width: '80px', height: '80px', objectFit: 'contain', margin: '0 auto' }}
            onError={(e) => { e.target.style.display = 'none'; }} 
          />
        </div>

        <h1 style={{ 
          color: estiloLogin.encabezadoColor, 
          fontSize: estiloLogin.encabezadoTamano, 
          fontWeight: estiloLogin.encabezadoNegrita ? 'bold' : 'normal',
          fontStyle: estiloLogin.encabezadoCursiva ? 'italic' : 'normal',
          textAlign: 'center',
          marginBottom: '10px'
        }}>
          Iglesia Central Monte Sinai
        </h1>

        <p style={{ 
          color: estiloLogin.subtituloColor, 
          fontSize: estiloLogin.subtituloTamano, 
          fontWeight: estiloLogin.subtituloNegrita ? 'bold' : 'normal',
          fontStyle: estiloLogin.subtituloCursiva ? 'italic' : 'normal',
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          {esRegistro ? 'Crea tu cuenta de acceso' : 'Inicia sesión con tu usuario'}
        </p>

        {error && (
          <p style={{ color: '#e53e3e', fontSize: '13px', textAlign: 'center', marginBottom: '15px' }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          
          {esRegistro && (
            <div>
              <label style={{ display: 'block', color: '#cbd5e0', fontSize: '14px', marginBottom: '5px' }}>
                Nombre Completo
              </label>
              <input 
                type="text" 
                placeholder="Ej. Juan Pérez"
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                required={esRegistro}
                style={{ 
                  width: '100%', 
                  padding: '10px', 
                  borderRadius: '6px', 
                  border: '1px solid #4a5568', 
                  background: '#1a202c', 
                  color: '#fff', 
                  boxSizing: 'border-box',
                  outline: 'none'
                }}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', color: '#cbd5e0', fontSize: '14px', marginBottom: '5px' }}>
              Usuario
            </label>
            <input 
              type="text" 
              placeholder="Ej. pastor"
              value={identificador} 
              onChange={(e) => setIdentificador(e.target.value)} 
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid #4a5568', 
                background: '#1a202c', 
                color: '#fff', 
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', color: '#cbd5e0', fontSize: '14px', marginBottom: '5px' }}>
              Contraseña
            </label>
            <input 
              type="password" 
              placeholder="••••••••"
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required
              style={{ 
                width: '100%', 
                padding: '10px', 
                borderRadius: '6px', 
                border: '1px solid #4a5568', 
                background: '#1a202c', 
                color: '#fff', 
                boxSizing: 'border-box',
                outline: 'none'
              }}
            />
          </div>

          <button 
            type="submit" 
            style={{ 
              background: estiloLogin.boton, 
              color: '#fff', 
              border: 'none', 
              padding: '12px', 
              borderRadius: '6px', 
              fontWeight: 'bold', 
              cursor: 'pointer',
              marginTop: '10px' 
            }}
          >
            {esRegistro ? 'Registrarse' : 'Iniciar Sesión'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={() => { setEsRegistro(!esRegistro); setError(''); }}
            style={{ background: 'none', border: 'none', color: '#90cdf4', cursor: 'pointer', fontSize: '13px', textDecoration: 'underline' }}
          >
            {esRegistro ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>

      </div>
    </div>
  );
}