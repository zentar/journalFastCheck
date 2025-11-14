/**
 * Script para convertir archivos CSV o Excel de Scopus a JSON
 * 
 * Uso: node scripts/convert-csv.js
 * 
 * Requiere que los archivos estén en la raíz del proyecto:
 * - "Scopus Sources Oct. 2025.csv" o ".xlsx" (o nombre similar)
 * - "Discontinued Titles Oct. 2025.csv" o ".xlsx" (o nombre similar)
 * 
 * También puede recibir un archivo Excel completo con múltiples pestañas
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const XLSX = require('xlsx');

// Configuración
const DATA_DIR = path.join(__dirname, '..', 'data');
const SOURCES_OUTPUT = path.join(DATA_DIR, 'sources.json');
const DISCONTINUED_OUTPUT = path.join(DATA_DIR, 'discontinued.json');

// Nombres de pestañas comunes en archivos Excel de Scopus
const SOURCES_SHEET_NAMES = ['Scopus Sources', 'Sources', 'Source List', 'All Sources'];
const DISCONTINUED_SHEET_NAMES = ['Discontinued Titles', 'Discontinued', 'Removed Titles'];

/**
 * Encuentra archivos CSV o Excel que coincidan con el patrón
 */
function findFile(pattern, extensions = ['.csv', '.xlsx', '.xls']) {
  const rootDir = path.join(__dirname, '..');
  const files = fs.readdirSync(rootDir);
  
  // Buscar archivo que contenga el patrón
  const found = files.find(file => {
    const lowerFile = file.toLowerCase();
    const lowerPattern = pattern.toLowerCase();
    const hasPattern = lowerFile.includes(lowerPattern);
    const hasExtension = extensions.some(ext => file.toLowerCase().endsWith(ext.toLowerCase()));
    return hasPattern && hasExtension;
  });
  
  if (!found) {
    throw new Error(`No se encontró archivo que coincida con: ${pattern} (buscando: ${extensions.join(', ')})`);
  }
  
  return path.join(rootDir, found);
}

/**
 * Convierte CSV a JSON
 */
function convertCSVToJSON(csvPath, outputPath) {
  console.log(`Leyendo CSV: ${csvPath}`);
  
  const csvContent = fs.readFileSync(csvPath, { encoding: 'utf-8' });
  
  const records = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true
  });
  
  console.log(`Procesados ${records.length} registros`);
  
  fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), 'utf-8');
  console.log(`Guardado en: ${outputPath}`);
  
  return records.length;
}

/**
 * Convierte Excel a JSON
 * Si el archivo tiene múltiples pestañas, busca las pestañas correctas
 */
function convertExcelToJSON(excelPath, outputPath, sheetNames, description) {
  console.log(`Leyendo Excel: ${excelPath}`);
  
  const workbook = XLSX.readFile(excelPath);
  const sheetList = workbook.SheetNames;
  
  console.log(`Pestañas encontradas: ${sheetList.join(', ')}`);
  
  // Buscar la pestaña correcta
  let sheetName = null;
  for (const name of sheetNames) {
    const found = sheetList.find(s => 
      s.toLowerCase().includes(name.toLowerCase())
    );
    if (found) {
      sheetName = found;
      break;
    }
  }
  
  // Si no se encuentra, usar la primera pestaña o la que coincida parcialmente
  if (!sheetName) {
    if (sheetList.length === 1) {
      sheetName = sheetList[0];
      console.log(`Usando única pestaña disponible: ${sheetName}`);
    } else {
      // Intentar buscar por descripción
      const descLower = description.toLowerCase();
      const found = sheetList.find(s => 
        s.toLowerCase().includes(descLower) || 
        descLower.includes(s.toLowerCase())
      );
      sheetName = found || sheetList[0];
      console.log(`⚠️  No se encontró pestaña específica, usando: ${sheetName}`);
      console.log(`   Pestañas disponibles: ${sheetList.join(', ')}`);
    }
  } else {
    console.log(`✓ Pestaña encontrada: ${sheetName}`);
  }
  
  const worksheet = workbook.Sheets[sheetName];
  const records = XLSX.utils.sheet_to_json(worksheet, {
    defval: '', // Valor por defecto para celdas vacías
    raw: false, // Convertir valores a strings
    dateNF: 'yyyy-mm-dd'
  });
  
  // Limpiar registros vacíos
  const cleanedRecords = records.filter(record => {
    return Object.values(record).some(val => val && val.toString().trim() !== '');
  });
  
  console.log(`Procesados ${cleanedRecords.length} registros`);
  
  fs.writeFileSync(outputPath, JSON.stringify(cleanedRecords, null, 2), 'utf-8');
  console.log(`Guardado en: ${outputPath}`);
  
  return cleanedRecords.length;
}

/**
 * Detecta el tipo de archivo y lo convierte
 */
function convertFileToJSON(filePath, outputPath, sheetNames, description) {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.csv') {
    return convertCSVToJSON(filePath, outputPath);
  } else if (ext === '.xlsx' || ext === '.xls') {
    return convertExcelToJSON(filePath, outputPath, sheetNames, description);
  } else {
    throw new Error(`Formato de archivo no soportado: ${ext}`);
  }
}

/**
 * Función principal
 */
function main() {
  try {
    // Crear directorio data si no existe
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
      console.log(`Directorio creado: ${DATA_DIR}`);
    }
    
    // Buscar y convertir archivo de Sources
    console.log('\n=== Procesando Scopus Sources ===');
    let sourcesFile;
    try {
      sourcesFile = findFile('scopus sources');
    } catch (e) {
      // Intentar buscar solo "sources"
      sourcesFile = findFile('sources');
    }
    const sourcesCount = convertFileToJSON(
      sourcesFile, 
      SOURCES_OUTPUT, 
      SOURCES_SHEET_NAMES,
      'sources'
    );
    
    // Buscar y convertir archivo de Discontinued
    console.log('\n=== Procesando Discontinued Titles ===');
    let discontinuedFile;
    try {
      discontinuedFile = findFile('discontinued');
    } catch (e) {
      // Intentar buscar "removed" o "titles"
      try {
        discontinuedFile = findFile('removed');
      } catch (e2) {
        discontinuedFile = findFile('titles');
      }
    }
    const discontinuedCount = convertFileToJSON(
      discontinuedFile, 
      DISCONTINUED_OUTPUT, 
      DISCONTINUED_SHEET_NAMES,
      'discontinued'
    );
    
    console.log('\n=== Conversión completada ===');
    console.log(`Sources: ${sourcesCount} registros`);
    console.log(`Discontinued: ${discontinuedCount} registros`);
    console.log('\nLos archivos JSON están listos en la carpeta /data/');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\nAsegúrate de que los archivos CSV o Excel estén en la raíz del proyecto.');
    console.error('Formatos soportados: .csv, .xlsx, .xls');
    process.exit(1);
  }
}

// Ejecutar
main();
