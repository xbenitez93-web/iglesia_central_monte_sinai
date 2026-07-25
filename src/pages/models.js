// ==========================================
// 1. MODELO Y DATOS DE DIRECTORIO (MIEMBROS)
// ==========================================
export const miembroInicial = {
  id: '',
  nombre: '',
  telefono: '',
  email: '',
  fechaNacimiento: '',
  compromisos: [],
  ministerios: []
};

export const miembrosEjemplo = [
  {
    id: '1',
    nombre: 'Carlos Gómez',
    telefono: '5550192',
    email: 'carlos@mail.com',
    fechaNacimiento: '1990-07-22',
    compromisos: ['Miembro Activo', 'Bautizado', 'Servidor'],
    ministerios: ['Alabanza']
  },
  {
    id: '2',
    nombre: 'Ana Martínez',
    telefono: '5551234',
    email: 'ana@mail.com',
    fechaNacimiento: '1985-04-12',
    compromisos: ['Miembro Activo', 'Bautizado'],
    ministerios: ['Ujieres', 'Teatro']
  }
];

// ==========================================
// 2. MODELO DE FINANZAS Y MAYORDOMÍA
// ==========================================
export const transaccionInicial = {
  id: '',
  tipo: 'Ingreso', // 'Ingreso' o 'Egreso'
  categoria: 'Diezmo',
  monto: 0,
  fecha: new Date().toISOString().split('T')[0]
};

// ==========================================
// 3. MODELO DE EVENTOS Y CALENDARIO
// ==========================================
export const eventoInicial = {
  id: '',
  titulo: '',
  descripcion: '',
  fecha: '',
  hora: ''
};

// ==========================================
// 4. FUNCHELPER PARA SUPABASE / LOCALSTORAGE
// ==========================================
export const obtenerDatosLocalesOStorage = (clave, valorPorDefecto) => {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado ? JSON.parse(guardado) : valorPorDefecto;
  } catch (e) {
    console.error("Error al cargar de localStorage:", e);
    return valorPorDefecto;
  }
};

export const guardarDatosEnStorage = (clave, datos) => {
  try {
    localStorage.setItem(clave, JSON.stringify(datos));
  } catch (e) {
    console.error("Error al guardar en localStorage:", e);
  }
};