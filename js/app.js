/**
 * Aplicación Verificador de Indexación Scopus
 * Lógica principal de búsqueda y presentación de resultados
 */

// Variables globales para almacenar los datos cargados
let sourcesData = [];
let discontinuedData = [];
let dataLoaded = false;

/**
 * Normaliza un texto para búsqueda (trim, lowercase, elimina espacios extra)
 */
function normalizeSearchTerm(term) {
    return term.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Busca un término en los datos de Sources
 * Busca en: Source Title, ISSN, EISSN
 */
function searchInSources(searchTerm) {
    const normalized = normalizeSearchTerm(searchTerm);
    
    return sourcesData.find(record => {
        const title = normalizeSearchTerm(record['Source Title'] || '');
        const issn = normalizeSearchTerm(record['ISSN'] || '');
        const eissn = normalizeSearchTerm(record['E-ISSN'] || '');
        
        // Búsqueda exacta para ISSN/EISSN, parcial para títulos
        return title.includes(normalized) || 
               issn === normalized || 
               eissn === normalized ||
               issn.replace(/-/g, '') === normalized.replace(/-/g, '') ||
               eissn.replace(/-/g, '') === normalized.replace(/-/g, '');
    });
}

/**
 * Busca un registro en los datos de Discontinued usando Sourcerecord ID o ISSN
 */
function searchInDiscontinued(sourceRecord) {
    const sourceId = sourceRecord['Sourcerecord ID'];
    const issn = sourceRecord['ISSN'] || '';
    const eissn = sourceRecord['E-ISSN'] || '';
    
    return discontinuedData.find(record => {
        const recordId = record['Sourcerecord ID'];
        const recordIssn = normalizeSearchTerm(record['ISSN'] || '');
        const recordEissn = normalizeSearchTerm(record['E-ISSN'] || '');
        const normalizedIssn = normalizeSearchTerm(issn);
        const normalizedEissn = normalizeSearchTerm(eissn);
        
        return recordId === sourceId ||
               recordIssn === normalizedIssn ||
               recordEissn === normalizedEissn ||
               recordIssn.replace(/-/g, '') === normalizedIssn.replace(/-/g, '') ||
               recordEissn.replace(/-/g, '') === normalizedEissn.replace(/-/g, '');
    });
}

/**
 * Crea el HTML para mostrar un resultado ACTIVA
 */
function createActiveResult(record) {
    return `
        <div class="bg-green-50 border-2 border-green-500 rounded-lg p-6">
            <div class="flex items-center mb-4">
                <span class="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-lg mr-3">
                    ACTIVA
                </span>
            </div>
            <div class="space-y-2 text-gray-800">
                <p><span class="font-semibold">Título:</span> ${escapeHtml(record['Source Title'] || 'N/A')}</p>
                <p><span class="font-semibold">ISSN:</span> ${escapeHtml(record['ISSN'] || 'N/A')}</p>
                <p><span class="font-semibold">E-ISSN:</span> ${escapeHtml(record['E-ISSN'] || 'N/A')}</p>
            </div>
        </div>
    `;
}

/**
 * Crea el HTML para mostrar un resultado DESCONTINUADA
 */
function createDiscontinuedResult(sourceRecord, discontinuedRecord) {
    return `
        <div class="bg-red-50 border-2 border-red-500 rounded-lg p-6">
            <div class="flex items-center mb-4">
                <span class="bg-red-600 text-white px-4 py-2 rounded-lg font-bold text-lg mr-3">
                    DESCONTINUADA
                </span>
            </div>
            <div class="space-y-2 text-gray-800">
                <p><span class="font-semibold">Título:</span> ${escapeHtml(sourceRecord['Source Title'] || 'N/A')}</p>
                <p><span class="font-semibold">Razón de Re-evaluación:</span> ${escapeHtml(discontinuedRecord['Reason for Re-evaluation'] || 'N/A')}</p>
                <p><span class="font-semibold">Última Cobertura Scopus:</span> 
                    Año: ${escapeHtml(discontinuedRecord['Year'] || 'N/A')}, 
                    Vol: ${escapeHtml(discontinuedRecord['Volume'] || 'N/A')}, 
                    Issue: ${escapeHtml(discontinuedRecord['Issue'] || 'N/A')}
                </p>
                <p><span class="font-semibold">ISSN:</span> ${escapeHtml(sourceRecord['ISSN'] || 'N/A')}</p>
                <p><span class="font-semibold">E-ISSN:</span> ${escapeHtml(sourceRecord['E-ISSN'] || 'N/A')}</p>
            </div>
        </div>
    `;
}

/**
 * Crea el HTML para mostrar un resultado INACTIVA
 */
function createInactiveResult(record) {
    return `
        <div class="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-6">
            <div class="flex items-center mb-4">
                <span class="bg-yellow-600 text-white px-4 py-2 rounded-lg font-bold text-lg mr-3">
                    INACTIVA
                </span>
            </div>
            <div class="mb-3 p-3 bg-yellow-100 rounded border-l-4 border-yellow-600">
                <p class="text-sm text-gray-700 italic">
                    Esta revista ya no está siendo indexada por Scopus, pero no fue eliminada por re-evaluación de calidad (ej. cambió de nombre o simplemente cesó su publicación).
                </p>
            </div>
            <div class="space-y-2 text-gray-800">
                <p><span class="font-semibold">Título:</span> ${escapeHtml(record['Source Title'] || 'N/A')}</p>
                <p><span class="font-semibold">ISSN:</span> ${escapeHtml(record['ISSN'] || 'N/A')}</p>
                <p><span class="font-semibold">E-ISSN:</span> ${escapeHtml(record['E-ISSN'] || 'N/A')}</p>
            </div>
        </div>
    `;
}

/**
 * Crea el HTML para mostrar resultado NO ENCONTRADA
 */
function createNotFoundResult() {
    return `
        <div class="bg-gray-100 border-2 border-gray-400 rounded-lg p-6">
            <div class="flex items-center mb-4">
                <span class="bg-gray-600 text-white px-4 py-2 rounded-lg font-bold text-lg mr-3">
                    NO ENCONTRADA
                </span>
            </div>
            <div class="p-3 bg-gray-200 rounded">
                <p class="text-gray-700">
                    El término de búsqueda no arrojó resultados en la base de datos de Scopus.
                </p>
            </div>
        </div>
    `;
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Muestra un error al usuario
 */
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 5000);
}

/**
 * Oculta el mensaje de error
 */
function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

/**
 * Realiza la búsqueda y muestra los resultados
 */
function performSearch(searchTerm) {
    if (!searchTerm || !searchTerm.trim()) {
        showError('Por favor, ingrese un término de búsqueda.');
        return;
    }

    hideError();
    
    // Paso A: Buscar en Sources
    const sourceRecord = searchInSources(searchTerm);
    
    if (!sourceRecord) {
        // NO ENCONTRADA
        document.getElementById('resultsContainer').innerHTML = createNotFoundResult();
        document.getElementById('resultsContainer').classList.remove('hidden');
        return;
    }
    
    // Paso B: Verificar estado Active or Inactive
    const status = (sourceRecord['Active or Inactive'] || '').trim();
    
    if (status.toLowerCase() === 'active') {
        // ACTIVA
        document.getElementById('resultsContainer').innerHTML = createActiveResult(sourceRecord);
        document.getElementById('resultsContainer').classList.remove('hidden');
        return;
    }
    
    // Paso C: Si es Inactive, buscar en Discontinued
    if (status.toLowerCase() === 'inactive') {
        const discontinuedRecord = searchInDiscontinued(sourceRecord);
        
        if (discontinuedRecord) {
            // DESCONTINUADA
            document.getElementById('resultsContainer').innerHTML = createDiscontinuedResult(sourceRecord, discontinuedRecord);
        } else {
            // INACTIVA (pero no descontinuada)
            document.getElementById('resultsContainer').innerHTML = createInactiveResult(sourceRecord);
        }
        
        document.getElementById('resultsContainer').classList.remove('hidden');
        return;
    }
    
    // Caso especial: estado desconocido
    showError('El registro encontrado tiene un estado desconocido.');
}

/**
 * Carga los archivos JSON
 * Intenta cargar desde la API primero, luego desde archivos estáticos
 */
async function loadData() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.classList.remove('hidden');
    
    try {
        // Intentar cargar desde la API (si está disponible)
        const apiBase = window.location.origin;
        
        try {
            // Cargar Sources desde API
            const sourcesApiResponse = await fetch(`${apiBase}/api/converter/files/sources.json`);
            if (sourcesApiResponse.ok) {
                sourcesData = await sourcesApiResponse.json();
                console.log('✓ Sources cargados desde API');
            } else {
                throw new Error('No disponible en API');
            }
        } catch (apiError) {
            // Si falla la API, intentar desde archivos estáticos
            console.log('Intentando cargar desde archivos estáticos...');
            const sourcesResponse = await fetch('data/sources.json');
            if (sourcesResponse.ok) {
                sourcesData = await sourcesResponse.json();
                console.log('✓ Sources cargados desde archivos estáticos');
            } else {
                throw new Error('No se pudo cargar sources.json');
            }
        }
        
        try {
            // Cargar Discontinued desde API
            const discontinuedApiResponse = await fetch(`${apiBase}/api/converter/files/discontinued.json`);
            if (discontinuedApiResponse.ok) {
                discontinuedData = await discontinuedApiResponse.json();
                console.log('✓ Discontinued cargados desde API');
            } else {
                throw new Error('No disponible en API');
            }
        } catch (apiError) {
            // Si falla la API, intentar desde archivos estáticos
            const discontinuedResponse = await fetch('data/discontinued.json');
            if (discontinuedResponse.ok) {
                discontinuedData = await discontinuedResponse.json();
                console.log('✓ Discontinued cargados desde archivos estáticos');
            } else {
                // Discontinued es opcional, continuar sin él
                discontinuedData = [];
                console.log('⚠️  Discontinued no disponible, continuando sin él');
            }
        }
        
        dataLoaded = true;
        console.log(`✅ Datos cargados: ${sourcesData.length} sources, ${discontinuedData.length} discontinued`);
        
    } catch (error) {
        console.error('Error cargando datos:', error);
        showError('Error al cargar los datos. Asegúrese de que los archivos JSON estén disponibles o suba un archivo Excel para generarlos.');
    } finally {
        loadingIndicator.classList.add('hidden');
    }
}

/**
 * Inicialización de la aplicación
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar datos al iniciar
    await loadData();
    
    // Configurar formulario de búsqueda
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!dataLoaded) {
            showError('Los datos aún se están cargando. Por favor, espere.');
            return;
        }
        
        const searchTerm = searchInput.value;
        if (searchTerm.trim()) {
            performSearch(searchTerm);
            // Mantener el foco en el input para permitir búsquedas rápidas
            searchInput.focus();
        }
    });
});


