/**
 * Script del panel de administración
 */

const API_URL = 'http://localhost:3000/api';
let authToken = null;

// Elementos del DOM
const loginContainer = document.getElementById('loginContainer');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const uploadForm = document.getElementById('uploadForm');
const previewBtn = document.getElementById('previewBtn');
const convertBtn = document.getElementById('convertBtn');
const excelFileInput = document.getElementById('excelFile');
const progressIndicator = document.getElementById('progressIndicator');
const resultsContainer = document.getElementById('resultsContainer');
const resultsContent = document.getElementById('resultsContent');
const previewContainer = document.getElementById('previewContainer');
const previewContent = document.getElementById('previewContent');
const filesList = document.getElementById('filesList');
const refreshFilesBtn = document.getElementById('refreshFilesBtn');
const userInfo = document.getElementById('userInfo');
const loginError = document.getElementById('loginError');

/**
 * Verifica si hay un token guardado
 */
function checkAuth() {
  const token = localStorage.getItem('authToken');
  if (token) {
    authToken = token;
    verifyToken();
  }
}

/**
 * Verifica si el token es válido
 */
async function verifyToken() {
  try {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      showAdminPanel(data.user);
    } else {
      localStorage.removeItem('authToken');
      authToken = null;
    }
  } catch (error) {
    console.error('Error verificando token:', error);
    localStorage.removeItem('authToken');
    authToken = null;
  }
}

/**
 * Muestra el panel de administración
 */
function showAdminPanel(user) {
  loginContainer.classList.add('hidden');
  adminPanel.classList.remove('hidden');
  userInfo.textContent = `Usuario: ${user.username}`;
  loadFiles();
}

/**
 * Muestra el formulario de login
 */
function showLogin() {
  adminPanel.classList.add('hidden');
  loginContainer.classList.remove('hidden');
  authToken = null;
  localStorage.removeItem('authToken');
}

/**
 * Muestra un error
 */
function showError(message) {
  const errorDiv = document.getElementById('errorMessage');
  const errorText = document.getElementById('errorText');
  errorText.textContent = message;
  errorDiv.classList.remove('hidden');
  
  setTimeout(() => {
    errorDiv.classList.add('hidden');
  }, 5000);
}

/**
 * Login
 */
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  loginError.classList.add('hidden');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      authToken = data.token;
      localStorage.setItem('authToken', authToken);
      showAdminPanel(data.user);
    } else {
      loginError.textContent = data.error || 'Error al iniciar sesión';
      loginError.classList.remove('hidden');
    }
  } catch (error) {
    console.error('Error en login:', error);
    loginError.textContent = 'Error de conexión con el servidor';
    loginError.classList.remove('hidden');
  }
});

/**
 * Logout
 */
logoutBtn.addEventListener('click', () => {
  showLogin();
});

/**
 * Vista Previa del Excel
 */
previewBtn.addEventListener('click', async () => {
  const file = excelFileInput.files[0];
  if (!file) {
    showError('Por favor, selecciona un archivo');
    return;
  }
  
  const formData = new FormData();
  formData.append('excelFile', file);
  
  previewContainer.classList.add('hidden');
  progressIndicator.classList.remove('hidden');
  
  try {
    const response = await fetch(`${API_URL}/converter/preview`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      displayPreview(data.info);
    } else {
      showError(data.error || 'Error al obtener vista previa');
    }
  } catch (error) {
    console.error('Error en vista previa:', error);
    showError('Error de conexión con el servidor');
  } finally {
    progressIndicator.classList.add('hidden');
  }
});

/**
 * Muestra la vista previa
 */
function displayPreview(info) {
  previewContent.innerHTML = `
    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <p class="font-semibold text-blue-800 mb-2">
        Archivo: ${info.totalSheets} pestaña(s) encontrada(s)
      </p>
      <div class="space-y-2">
        ${info.sheets.map(sheet => `
          <div class="bg-white rounded p-3 border border-blue-100">
            <p class="font-semibold">${sheet.name}</p>
            <p class="text-sm text-gray-600">
              ${sheet.recordCount} registros → ${sheet.outputFile}
            </p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
  previewContainer.classList.remove('hidden');
}

/**
 * Convertir Excel
 */
uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const file = excelFileInput.files[0];
  if (!file) {
    showError('Por favor, selecciona un archivo');
    return;
  }
  
  const formData = new FormData();
  formData.append('excelFile', file);
  
  resultsContainer.classList.add('hidden');
  previewContainer.classList.add('hidden');
  progressIndicator.classList.remove('hidden');
  convertBtn.disabled = true;
  
  try {
    const response = await fetch(`${API_URL}/converter/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      displayResults(data.results);
      loadFiles(); // Recargar lista de archivos
    } else {
      showError(data.error || 'Error al procesar el archivo');
    }
  } catch (error) {
    console.error('Error en conversión:', error);
    showError('Error de conexión con el servidor');
  } finally {
    progressIndicator.classList.add('hidden');
    convertBtn.disabled = false;
  }
});

/**
 * Muestra los resultados de la conversión
 */
function displayResults(results) {
  resultsContent.innerHTML = `
    <div class="bg-green-50 border border-green-200 rounded-lg p-4 mb-3">
      <p class="font-semibold text-green-800">
        ✓ Conversión completada: ${results.processedSheets}/${results.totalSheets} pestañas procesadas
      </p>
    </div>
    <div class="space-y-2">
      ${results.files.map(file => `
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p class="font-semibold text-gray-800">${file.sheetName}</p>
          <p class="text-sm text-gray-600">
            → ${file.fileName} (${file.recordCount} registros)
          </p>
        </div>
      `).join('')}
    </div>
    ${results.errors.length > 0 ? `
      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
        <p class="font-semibold text-yellow-800 mb-2">Advertencias:</p>
        ${results.errors.map(err => `
          <p class="text-sm text-yellow-700">${err.sheet}: ${err.error}</p>
        `).join('')}
      </div>
    ` : ''}
  `;
  resultsContainer.classList.remove('hidden');
}

/**
 * Carga la lista de archivos JSON
 */
async function loadFiles() {
  try {
    const response = await fetch(`${API_URL}/converter/files`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      displayFiles(data.files);
    } else {
      filesList.innerHTML = '<p class="text-red-600">Error al cargar archivos</p>';
    }
  } catch (error) {
    console.error('Error cargando archivos:', error);
    filesList.innerHTML = '<p class="text-red-600">Error de conexión</p>';
  }
}

/**
 * Muestra la lista de archivos
 */
function displayFiles(files) {
  if (files.length === 0) {
    filesList.innerHTML = '<p class="text-gray-500 text-center py-4">No hay archivos generados aún</p>';
    return;
  }
  
  filesList.innerHTML = files.map(file => `
    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4 flex justify-between items-center">
      <div>
        <p class="font-semibold text-gray-800">${file.name}</p>
        <p class="text-sm text-gray-600">
          ${file.recordCount} registros • ${(file.size / 1024).toFixed(2)} KB
        </p>
        <p class="text-xs text-gray-500">
          Última modificación: ${new Date(file.lastModified).toLocaleString('es-ES')}
        </p>
      </div>
    </div>
  `).join('');
}

/**
 * Actualizar lista de archivos
 */
refreshFilesBtn.addEventListener('click', () => {
  loadFiles();
});

// Inicializar
checkAuth();

