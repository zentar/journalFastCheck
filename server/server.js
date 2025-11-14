/**
 * Servidor principal del backend
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import { initDatabase } from './config/database.js';
import { authenticateToken } from './middleware/auth.js';

// Importar rutas
import authRoutes from './routes/auth.js';
import converterRoutes from './routes/converter.js';

// Configurar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del panel de administración
const adminPath = path.join(__dirname, '../admin');
app.use('/admin', express.static(adminPath, { index: 'index.html' }));

// Servir archivos estáticos del frontend principal
const publicPath = path.join(__dirname, '..');
app.use(express.static(publicPath));

// Inicializar base de datos
initDatabase();

// Rutas públicas
app.use('/api/auth', authRoutes);

// Ruta protegida para verificar token
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener información del usuario' });
  }
});

// Rutas protegidas
app.use('/api/converter', converterRoutes);

// Ruta de salud
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Servidor funcionando correctamente',
    timestamp: new Date().toISOString()
  });
});

// Ruta para el panel de administración
app.get('/admin', (req, res) => {
  res.sendFile(path.join(adminPath, 'index.html'));
});

app.get('/admin/', (req, res) => {
  res.sendFile(path.join(adminPath, 'index.html'));
});

// Ruta raíz - redirigir al panel de administración
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Manejar errores de Multer
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'El archivo es demasiado grande (máximo 100MB)' });
  }
  
  if (err.message && err.message.includes('Excel')) {
    return res.status(400).json({ error: err.message });
  }
  
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n🚀 Servidor iniciado');
  console.log(`   Puerto: ${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   API: http://localhost:${PORT}/api`);
  console.log(`\n📋 Endpoints disponibles:`);
  console.log(`   POST /api/auth/login - Iniciar sesión`);
  console.log(`   POST /api/auth/register - Registrar usuario`);
  console.log(`   GET  /api/auth/me - Información del usuario`);
  console.log(`   POST /api/converter/upload - Subir y convertir Excel`);
  console.log(`   POST /api/converter/preview - Vista previa del Excel`);
  console.log(`   GET  /api/converter/files - Listar archivos JSON`);
  console.log(`\n`);
});

