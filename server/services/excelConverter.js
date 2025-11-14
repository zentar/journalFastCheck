/**
 * Servicio para convertir archivos Excel de Scopus a JSON
 * Detecta automáticamente todas las pestañas relevantes
 */

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { saveJSON } from './dataStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeo de nombres de pestañas a nombres de archivos JSON
const SHEET_MAPPINGS = {
  // Sources
  'scopus sources': 'sources.json',
  'sources': 'sources.json',
  'source list': 'sources.json',
  'all sources': 'sources.json',
  
  // Accepted
  'accepted': 'accepted.json',
  'accepted titles': 'accepted.json',
  'newly accepted': 'accepted.json',
  
  // Discontinued
  'discontinued': 'discontinued.json',
  'discontinued titles': 'discontinued.json',
  'removed titles': 'discontinued.json',
  'removed': 'discontinued.json',
  
  // Otras posibles pestañas
  'pending': 'pending.json',
  'under review': 'under_review.json',
  'rejected': 'rejected.json',
};

/**
 * Normaliza el nombre de una pestaña para comparación
 */
function normalizeSheetName(name) {
  return name.toLowerCase().trim();
}

/**
 * Encuentra el nombre de archivo JSON correspondiente a una pestaña
 */
function getOutputFileName(sheetName) {
  const normalized = normalizeSheetName(sheetName);
  
  // Buscar coincidencia exacta o parcial
  for (const [key, fileName] of Object.entries(SHEET_MAPPINGS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return fileName;
    }
  }
  
  // Si no hay coincidencia, generar nombre basado en la pestaña
  const safeName = sheetName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  
  return `${safeName}.json`;
}

/**
 * Convierte una hoja de Excel a JSON
 */
function convertSheetToJSON(worksheet) {
  const records = XLSX.utils.sheet_to_json(worksheet, {
    defval: '', // Valor por defecto para celdas vacías
    raw: false, // Convertir valores a strings
    dateNF: 'yyyy-mm-dd'
  });
  
  // Limpiar registros completamente vacíos
  const cleanedRecords = records.filter(record => {
    return Object.values(record).some(val => {
      const str = val ? val.toString().trim() : '';
      return str !== '' && str !== 'null' && str !== 'undefined';
    });
  });
  
  return cleanedRecords;
}

/**
 * Procesa un archivo Excel y genera todos los archivos JSON correspondientes
 * @param {string} excelPath - Ruta al archivo Excel
 * @param {string} outputDir - Directorio donde guardar los JSON
 * @returns {Object} Información sobre los archivos generados
 */
export function convertExcelToJSON(excelPath, outputDir) {
  try {
    // Leer el archivo Excel
    const workbook = XLSX.readFile(excelPath);
    const sheetNames = workbook.SheetNames;
    
    console.log(`📊 Archivo Excel cargado: ${sheetNames.length} pestaña(s) encontrada(s)`);
    console.log(`   Pestañas: ${sheetNames.join(', ')}`);
    
    // Crear directorio de salida si no existe
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const results = {
      totalSheets: sheetNames.length,
      processedSheets: 0,
      files: [],
      errors: []
    };
    
    // Procesar cada pestaña
    for (const sheetName of sheetNames) {
      try {
        const worksheet = workbook.Sheets[sheetName];
        const records = convertSheetToJSON(worksheet);
        
        if (records.length === 0) {
          console.log(`⚠️  Pestaña "${sheetName}" está vacía, omitiendo...`);
          results.errors.push({
            sheet: sheetName,
            error: 'Pestaña vacía'
          });
          continue;
        }
        
        // Determinar nombre del archivo de salida
        const outputFileName = getOutputFileName(sheetName);
        
        // Guardar en memoria (almacenamiento persistente)
        saveJSON(outputFileName, records);
        
        // Intentar guardar en disco también (si es posible)
        try {
          const outputPath = path.join(outputDir, outputFileName);
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }
          fs.writeFileSync(outputPath, JSON.stringify(records, null, 2), 'utf-8');
          console.log(`✓ "${sheetName}" → ${outputFileName} (${records.length} registros) - Guardado en disco`);
        } catch (diskError) {
          // Si no se puede escribir en disco, solo se guarda en memoria
          console.log(`⚠️  No se pudo guardar en disco, solo en memoria: ${diskError.message}`);
        }
        
        console.log(`✓ "${sheetName}" → ${outputFileName} (${records.length} registros)`);
        
        results.files.push({
          sheetName,
          fileName: outputFileName,
          recordCount: records.length
        });
        
        results.processedSheets++;
      } catch (error) {
        console.error(`❌ Error procesando pestaña "${sheetName}":`, error.message);
        results.errors.push({
          sheet: sheetName,
          error: error.message
        });
      }
    }
    
    console.log(`\n✅ Conversión completada: ${results.processedSheets}/${results.totalSheets} pestañas procesadas`);
    
    return results;
  } catch (error) {
    console.error('❌ Error al procesar archivo Excel:', error);
    throw new Error(`Error al procesar Excel: ${error.message}`);
  }
}

/**
 * Obtiene información sobre las pestañas de un archivo Excel sin procesarlo
 */
export function getExcelInfo(excelPath) {
  try {
    const workbook = XLSX.readFile(excelPath);
    const sheetNames = workbook.SheetNames;
    
    const sheetsInfo = sheetNames.map(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const records = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });
      const cleanedRecords = records.filter(record => {
        return Object.values(record).some(val => {
          const str = val ? val.toString().trim() : '';
          return str !== '' && str !== 'null' && str !== 'undefined';
        });
      });
      
      return {
        name: sheetName,
        recordCount: cleanedRecords.length,
        outputFile: getOutputFileName(sheetName)
      };
    });
    
    return {
      totalSheets: sheetNames.length,
      sheets: sheetsInfo
    };
  } catch (error) {
    throw new Error(`Error al leer Excel: ${error.message}`);
  }
}

