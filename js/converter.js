/**
 * Convertidor de Excel/CSV a JSON en el navegador
 * Usa la librería XLSX para procesar archivos Excel
 */

// Nombres de pestañas comunes
const SOURCES_SHEET_NAMES = ['Scopus Sources', 'Sources', 'Source List', 'All Sources'];
const DISCONTINUED_SHEET_NAMES = ['Discontinued Titles', 'Discontinued', 'Removed Titles'];

let sourcesData = null;
let discontinuedData = null;

/**
 * Encuentra la pestaña correcta en un workbook
 */
function findSheet(workbook, sheetNames, description) {
    const sheetList = workbook.SheetNames;
    
    // Buscar la pestaña correcta
    for (const name of sheetNames) {
        const found = sheetList.find(s => 
            s.toLowerCase().includes(name.toLowerCase())
        );
        if (found) {
            return found;
        }
    }
    
    // Si no se encuentra, usar la primera o buscar por descripción
    if (sheetList.length === 1) {
        return sheetList[0];
    }
    
    const descLower = description.toLowerCase();
    const found = sheetList.find(s => 
        s.toLowerCase().includes(descLower) || 
        descLower.includes(s.toLowerCase())
    );
    
    return found || sheetList[0];
}

/**
 * Convierte un archivo Excel a JSON
 */
function convertExcelToJSON(file, sheetNames, description) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                const sheetName = findSheet(workbook, sheetNames, description);
                console.log(`Usando pestaña: ${sheetName}`);
                
                const worksheet = workbook.Sheets[sheetName];
                const records = XLSX.utils.sheet_to_json(worksheet, {
                    defval: '',
                    raw: false,
                    dateNF: 'yyyy-mm-dd'
                });
                
                // Limpiar registros vacíos
                const cleanedRecords = records.filter(record => {
                    return Object.values(record).some(val => val && val.toString().trim() !== '');
                });
                
                resolve(cleanedRecords);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Error al leer el archivo'));
        };
        
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Convierte un archivo CSV a JSON
 */
function convertCSVToJSON(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const text = e.target.result;
                const lines = text.split('\n').filter(line => line.trim());
                
                if (lines.length === 0) {
                    reject(new Error('El archivo CSV está vacío'));
                    return;
                }
                
                // Parsear CSV manualmente (simple)
                const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
                const records = [];
                
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    if (values.some(v => v !== '')) {
                        const record = {};
                        headers.forEach((header, index) => {
                            record[header] = values[index] || '';
                        });
                        records.push(record);
                    }
                }
                
                resolve(records);
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Error al leer el archivo'));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Detecta el tipo de archivo y lo convierte
 */
function convertFileToJSON(file, sheetNames, description) {
    const ext = file.name.split('.').pop().toLowerCase();
    
    if (ext === 'csv') {
        return convertCSVToJSON(file);
    } else if (ext === 'xlsx' || ext === 'xls') {
        return convertExcelToJSON(file, sheetNames, description);
    } else {
        throw new Error(`Formato no soportado: ${ext}`);
    }
}

/**
 * Descarga un archivo JSON
 */
function downloadJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
 * Oculta el error
 */
function hideError() {
    document.getElementById('errorMessage').classList.add('hidden');
}

/**
 * Inicialización
 */
document.addEventListener('DOMContentLoaded', () => {
    const convertBtn = document.getElementById('convertBtn');
    const sourcesFileInput = document.getElementById('sourcesFile');
    const discontinuedFileInput = document.getElementById('discontinuedFile');
    const progressIndicator = document.getElementById('progressIndicator');
    const resultsContainer = document.getElementById('resultsContainer');
    
    convertBtn.addEventListener('click', async () => {
        hideError();
        
        const sourcesFile = sourcesFileInput.files[0];
        const discontinuedFile = discontinuedFileInput.files[0];
        
        if (!sourcesFile && !discontinuedFile) {
            showError('Por favor, selecciona al menos un archivo');
            return;
        }
        
        progressIndicator.classList.remove('hidden');
        resultsContainer.classList.add('hidden');
        convertBtn.disabled = true;
        
        try {
            // Procesar Sources
            if (sourcesFile) {
                sourcesData = await convertFileToJSON(
                    sourcesFile, 
                    SOURCES_SHEET_NAMES, 
                    'sources'
                );
                console.log(`Sources procesados: ${sourcesData.length} registros`);
            }
            
            // Procesar Discontinued
            if (discontinuedFile) {
                discontinuedData = await convertFileToJSON(
                    discontinuedFile, 
                    DISCONTINUED_SHEET_NAMES, 
                    'discontinued'
                );
                console.log(`Discontinued procesados: ${discontinuedData.length} registros`);
            }
            
            // Mostrar resultados
            if (sourcesData) {
                document.getElementById('sourcesInfo').textContent = 
                    `${sourcesData.length} registros procesados`;
                document.getElementById('sourcesResult').classList.remove('hidden');
            } else {
                document.getElementById('sourcesResult').classList.add('hidden');
            }
            
            if (discontinuedData) {
                document.getElementById('discontinuedInfo').textContent = 
                    `${discontinuedData.length} registros procesados`;
                document.getElementById('discontinuedResult').classList.remove('hidden');
            } else {
                document.getElementById('discontinuedResult').classList.add('hidden');
            }
            
            resultsContainer.classList.remove('hidden');
            
        } catch (error) {
            console.error('Error:', error);
            showError(`Error al procesar archivos: ${error.message}`);
        } finally {
            progressIndicator.classList.add('hidden');
            convertBtn.disabled = false;
        }
    });
    
    // Botones de descarga
    document.getElementById('downloadSources').addEventListener('click', () => {
        if (sourcesData) {
            downloadJSON(sourcesData, 'sources.json');
        }
    });
    
    document.getElementById('downloadDiscontinued').addEventListener('click', () => {
        if (discontinuedData) {
            downloadJSON(discontinuedData, 'discontinued.json');
        }
    });
});

