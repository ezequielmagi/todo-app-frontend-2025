import React, { useState } from 'react';

function App() {
  const [tasks, setTasks] = useState([]); // Estado que guarda la lista de tareas
  const [newTask, setNewTask] = useState(''); // Estado para la tarea que vamos a agregar
  const [message, setMessage] = useState(''); // Estado para mensajes de error o éxito


  // Función para agregar tarea
const handleAddTask = () => {
  const trimmedTask = newTask.trim();

  if (trimmedTask === '') {
    // No agregar si está vacío
    setMessage('La tarea no puede estar vacía.');
    return;
  }

  // Verificar si la tarea ya existe en tareas activas (no completadas)
  const existe = tasks.some(
    (task) => task.description.toLowerCase() === trimmedTask.toLowerCase() && !task.completed
  );

  if (existe) {
    setMessage('¡Esta tarea ya existe!');
    return;
  }

  // Si pasa la validación, agregar
  setTasks([...tasks, { id: Date.now(), description: trimmedTask, completed: false }]);
  setNewTask('');
  setMessage(''); // Limpiar mensaje si todo OK
};


  return (
    <div style={{ padding: '20px' }}>
      <h1>Lista de Tareas</h1>
      <input
        type="text"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        placeholder="Nueva tarea..."
      />
      <button onClick={handleAddTask}>Agregar</button>
      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.description}</li>
        ))}
      </ul>
      
      {message && <p style={{ color: 'red' }}>{message}</p>}

    </div>
  );
}

export default App;

