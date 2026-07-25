import { useState, useEffect } from 'react';

// Renombramos la función para que coincida con el nombre del componente
function TarjetaMinisterio({ titulo, cantidad }) {
  const [contador, setContador] = useState(() => {
    const guardado = localStorage.getItem(titulo);
    return guardado !== null ? parseInt(guardado) : cantidad;
  });

  useEffect(() => {
    localStorage.setItem(titulo, contador);
  }, [contador, titulo]);

  return (
    <div style={{ border: '1px solid #ccc', padding: '15px', margin: '10px', width: '200px' }}>
      <h3>{titulo}</h3>
      <p>Miembros: <strong>{contador}</strong></p>
      <button onClick={() => setContador(contador + 1)}>
        + Agregar miembro
      </button>
    </div>
  );
}

// Exportamos el componente correctamente
export default TarjetaMinisterio;