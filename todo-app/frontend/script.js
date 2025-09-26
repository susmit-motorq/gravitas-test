// API Configuration
const API_BASE_URL = 'http://localhost:3000/api';

// DOM Elements
const todoForm = document.getElementById('add-todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const loading = document.getElementById('loading');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');
const closeError = document.getElementById('close-error');

// Stats elements
const totalCount = document.getElementById('total-count');
const completedCount = document.getElementById('completed-count');
const remainingCount = document.getElementById('remaining-count');

// Application state
let todos = [];
let isLoading = false;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// Initialize application
async function initializeApp() {
    setupEventListeners();
    await loadTodos();
}

// Setup event listeners
function setupEventListeners() {
    // Form submission
    todoForm.addEventListener('submit', handleAddTodo);
    
    // Close error message
    closeError.addEventListener('click', hideError);
    
    // Auto-hide error after 5 seconds
    let errorTimeout;
    const showErrorWithTimeout = (message) => {
        showError(message);
        clearTimeout(errorTimeout);
        errorTimeout = setTimeout(hideError, 5000);
    };
    
    // Override showError to use timeout
    window.showErrorWithTimeout = showErrorWithTimeout;
}

// API Functions
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Load todos from API
async function loadTodos() {
    if (isLoading) return;
    
    try {
        showLoading();
        isLoading = true;
        
        todos = await apiRequest('/todos');
        renderTodos();
        updateStats();
        
    } catch (error) {
        showErrorWithTimeout('Failed to load todos. Please check if the server is running.');
        console.error('Error loading todos:', error);
    } finally {
        hideLoading();
        isLoading = false;
    }
}

// Add new todo
async function addTodo(text) {
    try {
        showLoading();
        
        const newTodo = await apiRequest('/todos', {
            method: 'POST',
            body: JSON.stringify({ text }),
        });
        
        todos.push(newTodo);
        renderTodos();
        updateStats();
        
        return newTodo;
    } catch (error) {
        showErrorWithTimeout('Failed to add todo. Please try again.');
        console.error('Error adding todo:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Update todo
async function updateTodo(id, updates) {
    try {
        showLoading();
        
        const updatedTodo = await apiRequest(`/todos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(updates),
        });
        
        const index = todos.findIndex(todo => todo.id === id);
        if (index !== -1) {
            todos[index] = updatedTodo;
            renderTodos();
            updateStats();
        }
        
        return updatedTodo;
    } catch (error) {
        showErrorWithTimeout('Failed to update todo. Please try again.');
        console.error('Error updating todo:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Delete todo
async function deleteTodo(id) {
    try {
        showLoading();
        
        await apiRequest(`/todos/${id}`, {
            method: 'DELETE',
        });
        
        todos = todos.filter(todo => todo.id !== id);
        renderTodos();
        updateStats();
        
    } catch (error) {
        showErrorWithTimeout('Failed to delete todo. Please try again.');
        console.error('Error deleting todo:', error);
        throw error;
    } finally {
        hideLoading();
    }
}

// Event Handlers
async function handleAddTodo(event) {
    event.preventDefault();
    
    const text = todoInput.value.trim();
    if (!text) {
        showErrorWithTimeout('Please enter a todo text.');
        return;
    }
    
    try {
        await addTodo(text);
        todoInput.value = '';
        todoInput.focus();
    } catch (error) {
        // Error already handled in addTodo
    }
}

async function handleToggleComplete(id, completed) {
    try {
        await updateTodo(id, { completed });
    } catch (error) {
        // Error already handled in updateTodo
        // Revert the checkbox state
        const checkbox = document.querySelector(`[data-todo-id="${id}"] .todo-checkbox`);
        if (checkbox) {
            checkbox.checked = !completed;
        }
    }
}

async function handleDeleteTodo(id) {
    if (confirm('Are you sure you want to delete this todo?')) {
        try {
            await deleteTodo(id);
        } catch (error) {
            // Error already handled in deleteTodo
        }
    }
}

function handleEditTodo(id) {
    const todoItem = document.querySelector(`[data-todo-id="${id}"]`);
    const todoText = todoItem.querySelector('.todo-text');
    const editInput = todoItem.querySelector('.todo-edit-input');
    const normalActions = todoItem.querySelector('.normal-actions');
    const editActions = todoItem.querySelector('.edit-actions');
    
    // Switch to edit mode
    todoText.classList.add('editing');
    editInput.classList.add('active');
    editInput.value = todoText.textContent;
    normalActions.classList.add('hidden');
    editActions.classList.add('active');
    
    editInput.focus();
    editInput.select();
}

async function handleSaveEdit(id) {
    const todoItem = document.querySelector(`[data-todo-id="${id}"]`);
    const editInput = todoItem.querySelector('.todo-edit-input');
    const newText = editInput.value.trim();
    
    if (!newText) {
        showErrorWithTimeout('Todo text cannot be empty.');
        return;
    }
    
    try {
        await updateTodo(id, { text: newText });
        exitEditMode(todoItem);
    } catch (error) {
        // Error already handled in updateTodo
    }
}

function handleCancelEdit(id) {
    const todoItem = document.querySelector(`[data-todo-id="${id}"]`);
    exitEditMode(todoItem);
}

function exitEditMode(todoItem) {
    const todoText = todoItem.querySelector('.todo-text');
    const editInput = todoItem.querySelector('.todo-edit-input');
    const normalActions = todoItem.querySelector('.normal-actions');
    const editActions = todoItem.querySelector('.edit-actions');
    
    // Switch back to normal mode
    todoText.classList.remove('editing');
    editInput.classList.remove('active');
    normalActions.classList.remove('hidden');
    editActions.classList.remove('active');
}

// Render Functions
function renderTodos() {
    todoList.innerHTML = '';
    
    if (todos.length === 0) {
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    todos.forEach(todo => {
        const todoElement = createTodoElement(todo);
        todoList.appendChild(todoElement);
    });
}

function createTodoElement(todo) {
    const todoItem = document.createElement('div');
    todoItem.className = `todo-item ${todo.completed ? 'completed' : ''}`;
    todoItem.setAttribute('data-todo-id', todo.id);
    
    todoItem.innerHTML = `
        <input 
            type="checkbox" 
            class="todo-checkbox" 
            ${todo.completed ? 'checked' : ''}
            onchange="handleToggleComplete('${todo.id}', this.checked)"
        >
        <span class="todo-text">${escapeHtml(todo.text)}</span>
        <input 
            type="text" 
            class="todo-edit-input" 
            onkeydown="if(event.key==='Enter') handleSaveEdit('${todo.id}'); if(event.key==='Escape') handleCancelEdit('${todo.id}')"
        >
        <div class="todo-actions">
            <div class="normal-actions">
                <button class="edit-btn" onclick="handleEditTodo('${todo.id}')">Edit</button>
                <button class="delete-btn" onclick="handleDeleteTodo('${todo.id}')">Delete</button>
            </div>
            <div class="edit-actions">
                <button class="save-btn" onclick="handleSaveEdit('${todo.id}')">Save</button>
                <button class="cancel-btn" onclick="handleCancelEdit('${todo.id}')">Cancel</button>
            </div>
        </div>
    `;
    
    return todoItem;
}

function updateStats() {
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const remaining = total - completed;
    
    totalCount.textContent = total;
    completedCount.textContent = completed;
    remainingCount.textContent = remaining;
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showLoading() {
    loading.classList.remove('hidden');
}

function hideLoading() {
    loading.classList.add('hidden');
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
    // Focus input when pressing 'n' (new todo)
    if (event.key === 'n' && !event.ctrlKey && !event.metaKey && event.target.tagName !== 'INPUT') {
        event.preventDefault();
        todoInput.focus();
    }
    
    // Escape key to cancel any active edit
    if (event.key === 'Escape') {
        const activeEdit = document.querySelector('.edit-actions.active');
        if (activeEdit) {
            const todoItem = activeEdit.closest('.todo-item');
            const todoId = todoItem.getAttribute('data-todo-id');
            handleCancelEdit(todoId);
        }
    }
});

// Auto-refresh todos every 30 seconds to sync with other clients
setInterval(() => {
    if (!isLoading) {
        loadTodos();
    }
}, 30000);

// Handle online/offline status
window.addEventListener('online', () => {
    hideError();
    loadTodos();
});

window.addEventListener('offline', () => {
    showError('You are offline. Changes will not be saved until you reconnect.');
});
