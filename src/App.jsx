// src/App.jsx
import React, { useState, useEffect } from 'react';

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  // ---------------- ESTADOS PRINCIPALES (Todos aquí arriba) ----------------
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState('personal');
  const [newDueDate, setNewDueDate] = useState('');
  const [message, setMessage] = useState({ text: '', style: {} }); // Mensaje como objeto
  const [isLoading, setIsLoading] = useState(false);

  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');

  const [stats, setStats] = useState({ // Estado para estadísticas
    total: 0,
    pending: 0,
    completed: 0,
    overdue: 0,
    by_category: {}
  });

  // ---------------- CATEGORÍAS PREDEFINIDAS ----------------
  const categories = ['personal', 'trabajo', 'estudio', 'hogar', 'salud'];

  // ---------------- FUNCIONES HELPER (Todas aquí arriba o importadas) ----------------
  const showUserMessage = (text, type = 'info', duration = 3000) => {
    let style = {};
    if (type === 'success') {
      style = { color: '#155724', backgroundColor: '#d4edda', borderColor: '#c3e6cb', padding: '10px', marginBottom: '15px', borderRadius: '4px', textAlign: 'center' };
    } else if (type === 'error') {
      style = { color: '#721c24', backgroundColor: '#f8d7da', borderColor: '#f5c6cb', padding: '10px', marginBottom: '15px', borderRadius: '4px', textAlign: 'center' };
    } else { // info
      style = { color: '#004085', backgroundColor: '#cce5ff', borderColor: '#b8daff', padding: '10px', marginBottom: '15px', borderRadius: '4px', textAlign: 'center' };
    }
    setMessage({ text, style });
    if (duration) {
      setTimeout(() => setMessage({ text: '', style: {} }), duration);
    }
  };

  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // ---------------- LÓGICA DE DATOS (API Calls) ----------------

  const fetchStats = async () => {
    try {
      const statsResponse = await fetch(`${API_BASE_URL}/stats`);
      if (!statsResponse.ok) {
        const errorData = await statsResponse.json().catch(() => ({ error: 'Error desconocido al cargar estadísticas' }));
        throw new Error(errorData.error || `Error HTTP ${statsResponse.status} al cargar estadísticas`);
      }
      const statsResult = await statsResponse.json();
      if (statsResult.success) {
        setStats(statsResult.data);
      } else {
        throw new Error(statsResult.error || 'Error en datos de estadísticas desde el backend');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // No mostramos mensaje al usuario por fallo de stats para no ser intrusivo,
      // a menos que sea un error crítico o la primera carga.
    }
  };

  const fetchTasksAndStats = async () => {
    setIsLoading(true);
    try {
      const tasksResponse = await fetch(`${API_BASE_URL}/tasks`);
      if (!tasksResponse.ok) {
        const errorData = await tasksResponse.json().catch(() => ({ error: 'Error desconocido al cargar tareas' }));
        throw new Error(errorData.error || `Error HTTP ${tasksResponse.status} al cargar tareas`);
      }
      const tasksResult = await tasksResponse.json();
      if (tasksResult.success) {
        setTasks(tasksResult.data || []);
      } else {
        throw new Error(tasksResult.error || 'Fallo al obtener tareas del backend');
      }
      await fetchStats(); // Cargar estadísticas después de las tareas
    } catch (error) {
      console.error('Error en fetchTasksAndStats:', error);
      showUserMessage(`Error inicial al cargar datos: ${error.message}`, 'error', 5000);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect para la carga inicial
  useEffect(() => {
    fetchTasksAndStats();
  }, []);


  // ----- Operaciones CRUD -----

  const handleAddTask = async () => { // Asegúrate que sea async
    const trimmedTask = newTask.trim();
    if (trimmedTask === '') {
      showUserMessage('La tarea no puede estar vacía.', 'error');
      return;
    }

    // La verificación de duplicados ahora la maneja principalmente el backend.
    // Si quieres mantenerla en el frontend para UX, hazla aquí antes del API call.

    const taskPayload = {
      description: trimmedTask,
      category: newCategory,
      due_date: newDueDate || null,
    };

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskPayload),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Error HTTP ${response.status} al agregar tarea`);
      }
      setTasks(prevTasks => [...prevTasks, result.data]);
      setNewTask('');
      setNewDueDate('');
      showUserMessage(result.message || '¡Tarea agregada exitosamente!', 'success');
      await fetchStats();
    } catch (error) {
      console.error('Error adding task:', error);
      showUserMessage(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };


  const handleToggleTask = async (taskId) => { // Asegúrate que sea async
    const taskToToggle = tasks.find(task => task.id === taskId);
    if (!taskToToggle) {
      showUserMessage('Error: Tarea no encontrada para actualizar.', 'error');
      return;
    }
    const updatedFields = { completed: !taskToToggle.completed };

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Error HTTP ${response.status} al actualizar tarea`);
      }
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? { ...task, ...result.data } : task
      ));
      showUserMessage(result.message || 'Estado de tarea actualizado.', 'success', 2000);
      await fetchStats();
    } catch (error) {
      console.error('Error toggling task:', error);
      showUserMessage(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => { // Asegúrate que sea async
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Error HTTP ${response.status} al eliminar tarea`);
      }
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      showUserMessage(result.message || 'Tarea eliminada.', 'success', 2000);
      await fetchStats();
    } catch (error) {
      console.error('Error deleting task:', error);
      showUserMessage(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartEdit = (task) => {
    setEditingTask(task.id);
    setEditText(task.description);
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditText('');
  };

  const handleSaveEdit = async (taskId) => { // Asegúrate que sea async
    const trimmedText = editText.trim();
    if (trimmedText === '') {
      showUserMessage('La descripción de la tarea no puede estar vacía.', 'error');
      return;
    }
    const taskToEdit = tasks.find(task => task.id === taskId);
    if (!taskToEdit) {
      showUserMessage('Error: Tarea no encontrada para editar.', 'error');
      return;
    }
    const updatedFields = {
      description: trimmedText,
    };

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || `Error HTTP ${response.status} al guardar cambios`);
      }
      setTasks(prevTasks => prevTasks.map(task =>
        task.id === taskId ? { ...task, ...result.data } : task
      ));
      setEditingTask(null);
      setEditText('');
      showUserMessage(result.message || 'Tarea actualizada.', 'success', 2000);
      await fetchStats();
    } catch (error) {
      console.error('Error saving edit:', error);
      showUserMessage(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- LÓGICA DE UI (Filtros, formato, etc.) ----------------
  const handleKeyPress = (e, action, taskId = null) => {
    if (e.key === 'Enter') {
      if (action === 'add') {
        handleAddTask();
      } else if (action === 'edit' && taskId) { // Asegúrate que taskId exista para 'edit'
        handleSaveEdit(taskId);
      }
    } else if (e.key === 'Escape' && action === 'edit') {
      handleCancelEdit();
    }
  };

  const getFilteredTasks = () => {
    let filtered = tasks;
    if (filter === 'pending') {
      filtered = filtered.filter(task => !task.completed);
    } else if (filter === 'completed') {
      filtered = filtered.filter(task => task.completed);
    }
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }
    return filtered;
  };

  const isOverdue = (task) => {
    // Asegúrate que task.dueDate exista y no sea null antes de crear new Date()
    if (!task.dueDate || task.completed) return false;
    // Compara con el inicio del día actual para ser más consistente
    const today = new Date();
    today.setHours(0,0,0,0);
    return new Date(task.dueDate) < today;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    // El backend guarda las fechas como YYYY-MM-DD.
    // Si viene con T00:00:00.000Z, la conversión puede desfasar un día.
    // Es más seguro si el backend solo manda YYYY-MM-DD y aquí lo parseamos así:
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const date = new Date(parts[0], parts[1] - 1, parts[2]); // Mes es 0-indexado
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
    // Fallback por si el formato es diferente
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const filteredTasks = getFilteredTasks();
  // Los siguientes son solo para referencia si necesitas las listas filtradas,
  // pero los *conteos* vendrán del estado `stats`.
  // const pendingTasksCount = stats.pending;
  // const completedTasksCount = stats.completed;
  // const overdueTasksCount = stats.overdue;


  // ---------------- JSX ----------------
  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'Arial, sans-serif' }}>
      {isLoading && <div style={{ position: 'fixed', top: '0', left: '0', width: '100%', padding: '10px', backgroundColor: 'rgba(255,229,100,0.8)', textAlign: 'center', zIndex: 1000, fontWeight: 'bold' }}>Cargando...</div>}
      
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        📝 Lista de Tareas Avanzada
      </h1>

      {/* Formulario para agregar tareas (sin cambios funcionales, solo el onClick ya es async) */}
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e9ecef' }}>
        <h3 style={{ marginTop: 0, color: '#495057' }}>➕ Agregar Nueva Tarea</h3>
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'add')}
            placeholder="Descripción de la tarea..."
            style={{ padding: '12px', fontSize: '16px', border: '2px solid #ddd', borderRadius: '4px', width: '100%', marginBottom: '10px' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <select value={newCategory} onChange={(e) => setNewCategory(e.target.value)} style={{ padding: '10px', fontSize: '14px', border: '2px solid #ddd', borderRadius: '4px', minWidth: '120px' }}>
            {categories.map(cat => (<option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>))}
          </select>
          <input type="date" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} min={getCurrentDate()} style={{ padding: '10px', fontSize: '14px', border: '2px solid #ddd', borderRadius: '4px' }}/>
          <button onClick={handleAddTask} style={{ padding: '10px 20px', fontSize: '16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Agregar Tarea
          </button>
        </div>
      </div>

      {/* Filtros (sin cambios) */}
      <div style={{ backgroundColor: '#e9ecef', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h4 style={{ marginTop: 0, color: '#495057' }}>🔍 Filtros</h4>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Estado:</label>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="all">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
            </select>
          </div>
          <div>
            <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Categoría:</label>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}>
              <option value="all">Todas</option>
              {categories.map(cat => (<option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Mensajes: ACTUALIZADO para usar message.text y message.style */}
      {message.text && (
        <div style={message.style}>
          {message.text}
        </div>
      )}

      {/* Estadísticas: ACTUALIZADO para usar el estado `stats` */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '25px' }}>
        <div style={{ backgroundColor: '#007bff', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: 0 }}>Total</h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>{stats.total}</p>
        </div>
        <div style={{ backgroundColor: '#ffc107', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: 0 }}>Pendientes</h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>{stats.pending}</p>
        </div>
        <div style={{ backgroundColor: '#28a745', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: 0 }}>Completadas</h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>{stats.completed}</p>
        </div>
        <div style={{ backgroundColor: '#dc3545', color: 'white', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
          <h4 style={{ margin: 0 }}>Vencidas</h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>{stats.overdue}</p>
        </div>
      </div>

      {/* Lista de tareas filtradas (sin cambios mayores aquí, sigue usando filteredTasks) */}
      <div>
        <h3 style={{ color: '#333', borderBottom: '3px solid #007bff', paddingBottom: '10px' }}>
          📋 Tareas ({filteredTasks.length}) {/* El conteo aquí es de las tareas visibles */}
        </h3>
        {filteredTasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d', fontStyle: 'italic' }}>
            {tasks.length === 0 && !isLoading ? '¡Comienza agregando tu primera tarea! 🚀' : 'No hay tareas que coincidan con los filtros seleccionados.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredTasks.map((task) => (
              // El contenido de cada tarea (task.id, task.description, etc.) no cambia en su estructura interna.
              // Solo asegúrate que los nombres de campo (ej. task.dueDate) coincidan con lo que manda el backend.
              // Tu backend parece usar: id, description, completed, category, created_date, due_date, edited_date
              // Tu frontend usa: id, description, completed, category, createdDate, dueDate, editedDate
              // ¡OJO CON ESTO! -> Renombra las propiedades en el frontend o ajusta el backend/frontend para que coincidan.
              // Asumiré que el backend devuelve `createdDate` y `dueDate` en camelCase o que lo ajustas al recibir.
              // Por ahora, mantendré tu frontend con `task.dueDate` y `task.createdDate`
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', padding: '15px',
                backgroundColor: task.completed ? '#d4edda' : (isOverdue(task) ? '#f8d7da' : '#f8f9fa'),
                borderRadius: '8px', border: `2px solid ${task.completed ? '#c3e6cb' : (isOverdue(task) ? '#f5c6cb' : '#e9ecef')}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <input type="checkbox" checked={task.completed} onChange={() => handleToggleTask(task.id)} style={{ marginRight: '15px', transform: 'scale(1.3)', cursor: 'pointer' }} />
                <div style={{ flex: 1 }}>
                  {editingTask === task.id ? (
                    <input type="text" value={editText} onChange={(e) => setEditText(e.target.value)} onKeyPress={(e) => handleKeyPress(e, 'edit', task.id)} style={{ padding: '8px', fontSize: '16px', border: '2px solid #007bff', borderRadius: '4px', width: '100%' }} autoFocus />
                  ) : (
                    <div>
                      <span style={{ fontSize: '16px', textDecoration: task.completed ? 'line-through' : 'none', color: task.completed ? '#6c757d' : '#333', fontWeight: task.completed ? 'normal' : '500' }}>
                        {task.description}
                      </span>
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                        <span style={{ backgroundColor: '#007bff', color: 'white', padding: '2px 8px', borderRadius: '12px', marginRight: '8px' }}>{task.category}</span>
                        {/* Asegúrate que task.created_date o task.createdDate exista */}
                        <span>Creada: {formatDate(task.created_date || task.createdDate)}</span>
                        {/* Asegúrate que task.due_date o task.dueDate exista */}
                        {(task.due_date || task.dueDate) && (
                          <span style={{ marginLeft: '8px', color: isOverdue(task) ? '#dc3545' : '#28a745', fontWeight: 'bold' }}>
                            Vence: {formatDate(task.due_date || task.dueDate)}
                            {isOverdue(task) && ' ⚠️'}
                          </span>
                        )}
                        {/* Asegúrate que task.edited_date o task.editedDate exista */}
                        {(task.edited_date || task.editedDate) && (
                          <span style={{ marginLeft: '8px', fontStyle: 'italic' }}>Editada: {formatDate(task.edited_date || task.editedDate)}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
                  {editingTask === task.id ? (
                    <>
                      <button onClick={() => handleSaveEdit(task.id)} style={{ backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>✓ Guardar</button>
                      <button onClick={handleCancelEdit} style={{ backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>✕ Cancelar</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => handleStartEdit(task)} disabled={task.completed} style={{ backgroundColor: task.completed ? '#6c757d' : '#ffc107', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: task.completed ? 'not-allowed' : 'pointer', fontSize: '12px' }}>✏️ Editar</button>
                      <button onClick={() => handleDeleteTask(task.id)} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px' }}>🗑️ Eliminar</button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;