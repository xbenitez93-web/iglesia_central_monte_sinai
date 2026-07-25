import React, { useState } from 'react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function Login({ onLoginSuccess }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    const emailFicticio = `${usuario.trim().toLowerCase()}@sinai.central`;

    try {
      if (isRegistering) {
        // 1. Verificar si ya existe algún usuario registrado en la colección "usuarios"
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        const esElPrimerUsuario = querySnapshot.empty; // True si está vacío

        // 2. Si es el primero, su rol será 'admin'. Si ya hay gente, será 'miembro'.
        const rolAsignado = esElPrimerUsuario ? 'admin' : 'miembro';

        let user;
        try {
          // 3. Intentar crear usuario en Firebase Auth
          const userCredential = await createUserWithEmailAndPassword(auth, emailFicticio, password);
          user = userCredential.user;
        } catch (authError) {
          // Si el correo ya existe en Auth, intentamos iniciar sesión automáticamente
          if (authError.code === 'auth/email-already-in-use') {
            const loginCredential = await signInWithEmailAndPassword(auth, emailFicticio, password);
            user = loginCredential.user;
          } else {
            throw authError;
          }
        }

        // 4. Guardar en la colección "usuarios" en Firestore con el rol correspondiente
        await setDoc(doc(db, "usuarios", user.uid), {
          nombre: nombre,
          usuario: usuario.trim().toLowerCase(),
          rol: rolAsignado,
          createdAt: new Date()
        }, { merge: true });

        if (esElPrimerUsuario) {
          alert("¡Cuenta configurada con éxito! Al ser el primer usuario, se te ha asignado el rol de Administrador.");
        } else {
          alert("¡Cuenta creada con éxito!");
        }

        onLoginSuccess(user);
      } else {
        // Iniciar sesión normal
        const userCredential = await signInWithEmailAndPassword(auth, emailFicticio, password);
        onLoginSuccess(userCredential.user);
      }
    } catch (err) {
      console.error("Error de autenticación:", err);
      let mensajeAmigable = "Revisa tus datos.";
      
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        mensajeAmigable = "Contraseña incorrecta o usuario no encontrado.";
      } else if (err.code === 'auth/weak-password') {
        mensajeAmigable = "La contraseña debe tener al menos 6 caracteres.";
      }

      setError(mensajeAmigable);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1a202c', padding: '20px' }}>
      <form onSubmit={handleSubmit} style={{ background: '#2d3748', padding: '30px', borderRadius: '10px', width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
        
        {/* LOGOTIPO DE LA IGLESIA */}
        <img 
          src="/sinai_app.png" 
          alt="Iglesia Central Monte Sinai" 
          style={{ width: '130px', height: '130px', objectFit: 'contain', marginBottom: '5px' }} 
        />

        <h2 style={{ color: '#fff', textAlign: 'center', marginBottom: '0' }}>
          {isRegistering ? 'Nuevo Registro' : 'Iglesia Central Monte Sinai'}
        </h2>
        <p style={{ color: '#a0aec0', fontSize: '13px', textAlign: 'center', marginBottom: '5px' }}>
          {isRegistering ? 'El primer usuario registrado será Administrador' : 'Ingresa con tu usuario'}
        </p>

        {error && <p style={{ color: '#fc8181', fontSize: '14px', textAlign: 'center', margin: 0 }}>{error}</p>}

        {isRegistering && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
            <label style={{ color: '#cbd5e0', fontSize: '14px' }}>Nombre completo</label>
            <input 
              type="text" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)} 
              required 
              style={{ padding: '10px', borderRadius: '6px', border: '1px solid #4a5568', background: '#1a202c', color: '#fff', width: '100%', boxSizing: 'border-box' }}
            />
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
          <label style={{ color: '#cbd5e0', fontSize: '14px' }}>Nombre de usuario</label>
          <input 
            type="text" 
            placeholder="ej. pastor"
            value={usuario} 
            onChange={(e) => setUsuario(e.target.value)} 
            required 
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #4a5568', background: '#1a202c', color: '#fff', width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '100%' }}>
          <label style={{ color: '#cbd5e0', fontSize: '14px' }}>Contraseña (mínimo 6 caracteres)</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            style={{ padding: '10px', borderRadius: '6px', border: '1px solid #4a5568', background: '#1a202c', color: '#fff', width: '100%', boxSizing: 'border-box' }}
          />
        </div>

        <button 
          type="submit" 
          disabled={cargando}
          style={{ background: '#3182ce', color: '#fff', padding: '12px', borderRadius: '6px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', width: '100%' }}
        >
          {cargando ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Entrar')}
        </button>

        <button 
          type="button" 
          onClick={() => setIsRegistering(!isRegistering)}
          style={{ background: 'transparent', color: '#63b3ed', border: 'none', cursor: 'pointer', fontSize: '14px', marginTop: '5px' }}
        >
          {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </form>
    </div>
  );
}