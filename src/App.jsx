import React, { useState } from 'react';

function App() {
  const [tasks, setTasks] = useState([]); // Estado que guarda la lista de tareas
  const [newTask, setNewTask] = useState(''); // Estado para la tarea que vamos a agregar

  // Función para agregar tarea
  const handleAddTask = () => {
    if (newTask.trim() !== '')  {
      setTasks([...tasks, { id: Date.now(), description: newTask, completed: false }]);
      setNewTask('');
    }
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
    </div>
  );
}

export default App;

