/**
 * Almacenamiento en memoria para los archivos JSON generados
 * En producción, esto podría ser reemplazado por almacenamiento persistente (S3, base de datos, etc.)
 */

// Almacenamiento en memoria
const dataStore = new Map();

/**
 * Guarda datos JSON en memoria
 */
export function saveJSON(fileName, data) {
  dataStore.set(fileName, {
    data,
    fileName,
    recordCount: Array.isArray(data) ? data.length : 0,
    lastModified: new Date().toISOString()
  });
  console.log(`✓ JSON guardado en memoria: ${fileName} (${Array.isArray(data) ? data.length : 0} registros)`);
}

/**
 * Obtiene datos JSON de memoria
 */
export function getJSON(fileName) {
  const stored = dataStore.get(fileName);
  return stored ? stored.data : null;
}

/**
 * Obtiene información sobre un archivo JSON
 */
export function getJSONInfo(fileName) {
  const stored = dataStore.get(fileName);
  if (!stored) return null;
  
  return {
    name: stored.fileName,
    recordCount: stored.recordCount,
    lastModified: stored.lastModified,
    size: JSON.stringify(stored.data).length
  };
}

/**
 * Lista todos los archivos JSON almacenados
 */
export function listAllJSON() {
  const files = [];
  for (const [fileName, stored] of dataStore.entries()) {
    files.push({
      name: stored.fileName,
      recordCount: stored.recordCount,
      lastModified: stored.lastModified,
      size: JSON.stringify(stored.data).length
    });
  }
  return files;
}

/**
 * Elimina un archivo JSON de memoria
 */
export function deleteJSON(fileName) {
  return dataStore.delete(fileName);
}

/**
 * Limpia todo el almacenamiento
 */
export function clearAll() {
  dataStore.clear();
  console.log('✓ Almacenamiento en memoria limpiado');
}

/**
 * Obtiene el tamaño total del almacenamiento
 */
export function getStorageSize() {
  let totalSize = 0;
  for (const stored of dataStore.values()) {
    totalSize += JSON.stringify(stored.data).length;
  }
  return totalSize;
}

