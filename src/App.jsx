import React, { useState, useEffect } from 'react';

function App() {
  // Estados principales
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [newCategory, setNewCategory] = useState('personal');
  const [newDueDate, setNewDueDate] = useState('');
  const [message, setMessage] = useState('');
  
  // Estados para filtros
  const [filter, setFilter] = useState('all'); // all, pending, completed
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  // Estados para edición
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');

  // Categorías predefinidas
  const categories = ['personal', 'trabajo', 'estudio', 'hogar', 'salud'];

  // PERSISTENCIA: Cargar tareas desde localStorage al inicio
  useEffect(() => {
    const savedTasks = localStorage.getItem('todoTasks');
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        setTasks(parsedTasks);
      } catch (error) {
        console.error('Error al cargar tareas:', error);
        setTasks([]);
      }
    }
  }, []);

  // PERSISTENCIA: Guardar tareas en localStorage cada vez que cambien
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('todoTasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  // Función para obtener fecha actual en formato YYYY-MM-DD
  const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  // Función para agregar tarea (MEJORADA con categorías y fechas)
  const handleAddTask = () => {
    const trimmedTask = newTask.trim();

    if (trimmedTask === '') {
      setMessage('La tarea no puede estar vacía.');
      return;
    }

    // Verificar duplicados en la misma categoría
    const existe = tasks.some(
      (task) => 
        task.description.toLowerCase() === trimmedTask.toLowerCase() && 
        !task.completed &&
        task.category === newCategory
    );

    if (existe) {
      setMessage(`¡Esta tarea ya existe en la categoría "${newCategory}"!`);
      return;
    }

    // Crear nueva tarea con todas las propiedades
    const nuevaTarea = {
      id: Date.now(),
      description: trimmedTask,
      completed: false,
      category: newCategory,
      createdDate: getCurrentDate(),
      dueDate: newDueDate || null,
      editedDate: null
    };

    setTasks([...tasks, nuevaTarea]);
    setNewTask('');
    setNewDueDate('');
    setMessage('¡Tarea agregada exitosamente!');
    
    // Limpiar mensaje después de 3 segundos
    setTimeout(() => setMessage(''), 3000);
  };

  // Función para alternar completado
  const handleToggleTask = (taskId) => {
    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { ...task, completed: !task.completed }
        : task
    ));
  };

  // Función para eliminar tarea
  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    setMessage('Tarea eliminada.');
    setTimeout(() => setMessage(''), 2000);
  };

  // EDICIÓN: Iniciar edición
  const handleStartEdit = (task) => {
    setEditingTask(task.id);
    setEditText(task.description);
  };

  // EDICIÓN: Guardar cambios
  const handleSaveEdit = (taskId) => {
    const trimmedText = editText.trim();
    
    if (trimmedText === '') {
      setMessage('La tarea no puede estar vacía.');
      return;
    }

    setTasks(tasks.map(task => 
      task.id === taskId 
        ? { 
            ...task, 
            description: trimmedText,
            editedDate: getCurrentDate()
          }
        : task
    ));

    setEditingTask(null);
    setEditText('');
    setMessage('Tarea actualizada.');
    setTimeout(() => setMessage(''), 2000);
  };

  // EDICIÓN: Cancelar edición
  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditText('');
  };

  // Función para manejar Enter
  const handleKeyPress = (e, action, taskId = null) => {
    if (e.key === 'Enter') {
      if (action === 'add') {
        handleAddTask();
      } else if (action === 'edit') {
        handleSaveEdit(taskId);
      }
    } else if (e.key === 'Escape' && action === 'edit') {
      handleCancelEdit();
    }
  };

  // FILTROS: Función para filtrar tareas
  const getFilteredTasks = () => {
    let filtered = tasks;

    // Filtro por estado (completado/pendiente)
    if (filter === 'pending') {
      filtered = filtered.filter(task => !task.completed);
    } else if (filter === 'completed') {
      filtered = filtered.filter(task => task.completed);
    }

    // Filtro por categoría
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(task => task.category === categoryFilter);
    }

    return filtered;
  };

  // Función para verificar si una tarea está vencida
  const isOverdue = (task) => {
    if (!task.dueDate || task.completed) return false;
    return new Date(task.dueDate) < new Date();
  };

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
  };

  const filteredTasks = getFilteredTasks();
  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);
  const overdueTasks = tasks.filter(task => isOverdue(task));

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '800px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        📝 Lista de Tareas Avanzada
      </h1>

      {/* Formulario para agregar tareas */}
      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ marginTop: 0, color: '#495057' }}>➕ Agregar Nueva Tarea</h3>
        
        <div style={{ marginBottom: '15px' }}>
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => handleKeyPress(e, 'add')}
            placeholder="Descripción de la tarea..."
            style={{
              padding: '12px',
              fontSize: '16px',
              border: '2px solid #ddd',
              borderRadius: '4px',
              width: '100%',
              marginBottom: '10px'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            style={{
              padding: '10px',
              fontSize: '14px',
              border: '2px solid #ddd',
              borderRadius: '4px',
              minWidth: '120px'
            }}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            min={getCurrentDate()}
            style={{
              padding: '10px',
              fontSize: '14px',
              border: '2px solid #ddd',
              borderRadius: '4px'
            }}
          />

          <button 
            onClick={handleAddTask}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Agregar Tarea
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{
        backgroundColor: '#e9ecef',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h4 style={{ marginTop: 0, color: '#495057' }}>🔍 Filtros</h4>
        
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
          <div>
            <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Estado:</label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="all">Todas</option>
              <option value="pending">Pendientes</option>
              <option value="completed">Completadas</option>
            </select>
          </div>

          <div>
            <label style={{ marginRight: '8px', fontWeight: 'bold' }}>Categoría:</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="all">Todas</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mensajes */}
      {message && (
        <div style={{ 
          color: message.includes('exitosamente') || message.includes('actualizada') ? '#28a745' : '#dc3545',
          backgroundColor: message.includes('exitosamente') || message.includes('actualizada') ? '#d4edda' : '#f8d7da',
          padding: '12px', 
          borderRadius: '4px',
          marginBottom: '20px',
          border: `1px solid ${message.includes('exitosamente') || message.includes('actualizada') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}

      {/* Estadísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '15px',
        marginBottom: '25px'
      }}>
        <div style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0 }}>Total</h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
            {tasks.length}
          </p>
        </div>
        
        <div style={{
          backgroundColor: '#ffc107',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0 }}>Pendientes</h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
            {pendingTasks.length}
          </p>
        </div>
        
        <div style={{
          backgroundColor: '#28a745',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0 }}>Completadas</h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
            {completedTasks.length}
          </p>
        </div>
        
        <div style={{
          backgroundColor: '#dc3545',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: 0 }}>Vencidas</h4>
          <p style={{ margin: '5px 0 0 0', fontSize: '24px', fontWeight: 'bold' }}>
            {overdueTasks.length}
          </p>
        </div>
      </div>

      {/* Lista de tareas filtradas */}
      <div>
        <h3 style={{ 
          color: '#333', 
          borderBottom: '3px solid #007bff',
          paddingBottom: '10px'
        }}>
          📋 Tareas ({filteredTasks.length})
        </h3>

        {filteredTasks.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: '#6c757d',
            fontStyle: 'italic'
          }}>
            {tasks.length === 0 
              ? '¡Comienza agregando tu primera tarea! 🚀'
              : 'No hay tareas que coincidan con los filtros seleccionados.'
            }
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredTasks.map((task) => (
              <div key={task.id} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '15px',
                backgroundColor: task.completed ? '#d4edda' : (isOverdue(task) ? '#f8d7da' : '#f8f9fa'),
                borderRadius: '8px',
                border: `2px solid ${task.completed ? '#c3e6cb' : (isOverdue(task) ? '#f5c6cb' : '#e9ecef')}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task.id)}
                  style={{ 
                    marginRight: '15px', 
                    transform: 'scale(1.3)',
                    cursor: 'pointer'
                  }}
                />

                <div style={{ flex: 1 }}>
                  {editingTask === task.id ? (
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyPress={(e) => handleKeyPress(e, 'edit', task.id)}
                      style={{
                        padding: '8px',
                        fontSize: '16px',
                        border: '2px solid #007bff',
                        borderRadius: '4px',
                        width: '100%'
                      }}
                      autoFocus
                    />
                  ) : (
                    <div>
                      <span style={{ 
                        fontSize: '16px',
                        textDecoration: task.completed ? 'line-through' : 'none',
                        color: task.completed ? '#6c757d' : '#333',
                        fontWeight: task.completed ? 'normal' : '500'
                      }}>
                        {task.description}
                      </span>
                      
                      <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                        <span style={{
                          backgroundColor: '#007bff',
                          color: 'white',
                          padding: '2px 8px',
                          borderRadius: '12px',
                          marginRight: '8px'
                        }}>
                          {task.category}
                        </span>
                        
                        <span>Creada: {formatDate(task.createdDate)}</span>
                        
                        {task.dueDate && (
                          <span style={{ 
                            marginLeft: '8px',
                            color: isOverdue(task) ? '#dc3545' : '#28a745',
                            fontWeight: 'bold'
                          }}>
                            Vence: {formatDate(task.dueDate)}
                            {isOverdue(task) && ' ⚠️'}
                          </span>
                        )}
                        
                        {task.editedDate && (
                          <span style={{ marginLeft: '8px', fontStyle: 'italic' }}>
                            Editada: {formatDate(task.editedDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginLeft: '10px' }}>
                  {editingTask === task.id ? (
                    <>
                      <button
                        onClick={() => handleSaveEdit(task.id)}
                        style={{
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✓ Guardar
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        style={{
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✕ Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleStartEdit(task)}
                        disabled={task.completed}
                        style={{
                          backgroundColor: task.completed ? '#6c757d' : '#ffc107',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: task.completed ? 'not-allowed' : 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        style={{
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 12px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        🗑️ Eliminar
                      </button>
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