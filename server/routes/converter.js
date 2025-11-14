/**
 * Rutas para el convertidor de Excel
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { convertExcelToJSON, getExcelInfo } from '../services/excelConverter.js';
import { authenticateToken } from '../middleware/auth.js';
import { listAllJSON, getJSON, getJSONInfo } from '../services/dataStorage.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configurar multer para subir archivos
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'excel-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = ['.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
    }
  }
});

/**
 * POST /api/converter/upload
 * Sube y convierte un archivo Excel
 */
router.post('/upload', authenticateToken, upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const excelPath = req.file.path;
    const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
    
    console.log(`\n📤 Procesando archivo: ${req.file.originalname}`);
    console.log(`   Tamaño: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    
    // Convertir Excel a JSON
    const results = convertExcelToJSON(excelPath, dataDir);
    
    // Limpiar archivo temporal
    fs.unlinkSync(excelPath);
    
    res.json({
      message: 'Archivo procesado exitosamente',
      originalName: req.file.originalname,
      results: {
        totalSheets: results.totalSheets,
        processedSheets: results.processedSheets,
        files: results.files.map(f => ({
          sheetName: f.sheetName,
          fileName: f.fileName,
          recordCount: f.recordCount
        })),
        errors: results.errors
      }
    });
  } catch (error) {
    // Limpiar archivo temporal en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error en conversión:', error);
    res.status(500).json({ 
      error: 'Error al procesar el archivo Excel',
      details: error.message 
    });
  }
});

/**
 * POST /api/converter/preview
 * Obtiene información sobre las pestañas de un archivo Excel sin procesarlo
 */
router.post('/preview', authenticateToken, upload.single('excelFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    const excelPath = req.file.path;
    
    // Obtener información del Excel
    const info = getExcelInfo(excelPath);
    
    // Limpiar archivo temporal
    fs.unlinkSync(excelPath);
    
    res.json({
      message: 'Información del archivo Excel',
      originalName: req.file.originalname,
      info
    });
  } catch (error) {
    // Limpiar archivo temporal en caso de error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    console.error('Error al obtener información:', error);
    res.status(500).json({ 
      error: 'Error al leer el archivo Excel',
      details: error.message 
    });
  }
});

/**
 * GET /api/converter/files
 * Lista los archivos JSON generados (desde memoria y disco)
 */
router.get('/files', authenticateToken, (req, res) => {
  try {
    // Obtener archivos de memoria
    const memoryFiles = listAllJSON();
    
    // Intentar obtener archivos de disco también (si es posible)
    const diskFiles = [];
    try {
      const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
      if (fs.existsSync(dataDir)) {
        const diskFileList = fs.readdirSync(dataDir)
          .filter(file => file.endsWith('.json'))
          .map(file => {
            const filePath = path.join(dataDir, file);
            const stats = fs.statSync(filePath);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            
            return {
              name: file,
              size: stats.size,
              recordCount: Array.isArray(content) ? content.length : 0,
              lastModified: stats.mtime.toISOString(),
              source: 'disk'
            };
          });
        diskFiles.push(...diskFileList);
      }
    } catch (diskError) {
      // Ignorar errores de disco
      console.log('No se pudo leer archivos de disco:', diskError.message);
    }
    
    // Combinar y deduplicar (priorizar memoria)
    const fileMap = new Map();
    
    // Primero agregar archivos de disco
    diskFiles.forEach(file => {
      fileMap.set(file.name, { ...file, source: 'disk' });
    });
    
    // Luego agregar/sobrescribir con archivos de memoria
    memoryFiles.forEach(file => {
      fileMap.set(file.name, { ...file, source: 'memory' });
    });
    
    const files = Array.from(fileMap.values());
    
    res.json({ files });
  } catch (error) {
    console.error('Error al listar archivos:', error);
    res.status(500).json({ error: 'Error al listar archivos' });
  }
});

/**
 * GET /api/converter/files/:fileName
 * Descarga un archivo JSON específico
 */
router.get('/files/:fileName', authenticateToken, (req, res) => {
  try {
    const fileName = req.params.fileName;
    
    // Intentar obtener de memoria primero
    const memoryData = getJSON(fileName);
    if (memoryData) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.json(memoryData);
    }
    
    // Si no está en memoria, intentar desde disco
    try {
      const dataDir = process.env.DATA_DIR || path.join(__dirname, '../../data');
      const filePath = path.join(dataDir, fileName);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        return res.send(content);
      }
    } catch (diskError) {
      // Ignorar errores de disco
    }
    
    res.status(404).json({ error: 'Archivo no encontrado' });
  } catch (error) {
    console.error('Error al obtener archivo:', error);
    res.status(500).json({ error: 'Error al obtener archivo' });
  }
});

export default router;

