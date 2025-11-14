/**
 * Sistema de almacenamiento simple en archivos JSON
 * En producción, esto podría ser reemplazado por una base de datos real
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const USERS_FILE = path.join(__dirname, '../data/users.json');

/**
 * Inicializa el archivo de usuarios si no existe
 */
export function initDatabase() {
  const dataDir = path.dirname(USERS_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(USERS_FILE)) {
    // Crear usuario por defecto
    const defaultUser = {
      id: 1,
      username: process.env.DEFAULT_USER || 'admin',
      password: process.env.DEFAULT_PASSWORD || 'admin123', // Se hasheará en el primer login
      createdAt: new Date().toISOString()
    };
    
    fs.writeFileSync(USERS_FILE, JSON.stringify([defaultUser], null, 2));
    console.log('✓ Base de datos de usuarios inicializada');
  }
}

/**
 * Obtiene todos los usuarios
 */
export function getUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    initDatabase();
  }
  
  const data = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(data);
}

/**
 * Guarda los usuarios
 */
export function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/**
 * Busca un usuario por username
 */
export function findUserByUsername(username) {
  const users = getUsers();
  return users.find(u => u.username === username);
}

/**
 * Busca un usuario por ID
 */
export function findUserById(id) {
  const users = getUsers();
  return users.find(u => u.id === parseInt(id));
}

/**
 * Crea un nuevo usuario
 */
export function createUser(username, hashedPassword) {
  const users = getUsers();
  const newUser = {
    id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
    username,
    password: hashedPassword,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  saveUsers(users);
  return newUser;
}

/**
 * Actualiza la contraseña de un usuario
 */
export function updateUserPassword(userId, hashedPassword) {
  const users = getUsers();
  const userIndex = users.findIndex(u => u.id === parseInt(userId));
  
  if (userIndex === -1) {
    return null;
  }
  
  users[userIndex].password = hashedPassword;
  saveUsers(users);
  return users[userIndex];
}

