/**
 * Rutas de autenticación
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import { findUserByUsername, createUser, updateUserPassword, initDatabase } from '../config/database.js';
import { generateToken } from '../middleware/auth.js';

const router = express.Router();

// Inicializar base de datos al cargar el módulo
initDatabase();

/**
 * POST /api/auth/login
 * Inicia sesión
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const user = findUserByUsername(username);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Si la contraseña no está hasheada (usuario por defecto), hashearla
    let passwordMatch = false;
    if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
      // Contraseña ya hasheada
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // Contraseña en texto plano (solo para migración)
      passwordMatch = user.password === password;
      if (passwordMatch) {
        // Hashear la contraseña para futuros logins
        const hashedPassword = await bcrypt.hash(password, 10);
        updateUserPassword(user.id, hashedPassword);
      }
    }

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = generateToken(user);

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * POST /api/auth/register
 * Registra un nuevo usuario (solo si no hay usuarios)
 */
router.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const existingUser = findUserByUsername(username);
    if (existingUser) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = createUser(username, hashedPassword);

    const token = generateToken(newUser);

    res.status(201).json({
      message: 'Usuario creado exitosamente',
      token,
      user: {
        id: newUser.id,
        username: newUser.username
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

/**
 * GET /api/auth/me
 * Obtiene información del usuario actual
 */
router.get('/me', async (req, res) => {
  try {
    // Este endpoint requiere autenticación, se maneja en server.js
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Token requerido' });
    }

    const jwt = await import('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'tu_secret_key_super_segura_aqui_cambiar_en_produccion';
    
    jwt.default.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Token inválido' });
      }
      
      res.json({
        user: {
          id: decoded.id,
          username: decoded.username
        }
      });
    });
  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;

