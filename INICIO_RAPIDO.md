# Inicio Rápido - Verificador Scopus

## Backend con Login y Conversión

### 1. Instalar y Configurar el Backend

```bash
cd server
npm install
cp .env.example .env
```

Edita `.env` si necesitas cambiar la configuración (por defecto funciona con los valores del ejemplo).

### 2. Iniciar el Servidor

```bash
npm start
```

El servidor estará disponible en `http://localhost:3000`

### 3. Acceder al Panel de Administración

Abre en tu navegador:
```
admin/index.html
```

O si usas un servidor local:
```bash
# Desde la raíz del proyecto
python3 -m http.server 8080
# Luego visita: http://localhost:8080/admin/
```

### 4. Credenciales por Defecto

- **Usuario**: `admin`
- **Contraseña**: `admin123`

⚠️ **Importante**: Cambia estas credenciales en producción.

### 5. Usar el Convertidor

1. Inicia sesión en el panel de administración
2. Haz clic en "Vista Previa" para ver las pestañas del Excel
3. Haz clic en "Convertir a JSON" para procesar el archivo
4. Los archivos JSON se generarán automáticamente en la carpeta `data/`

## Frontend de Búsqueda (Original)

El frontend original sigue funcionando. Solo necesitas los archivos JSON en `data/`:

```bash
# Abrir index.html directamente o con servidor
python3 -m http.server 8000
# Visita: http://localhost:8000
```

## Estructura Completa

```
scopus-check/
├── server/              # Backend con API
│   ├── server.js
│   ├── routes/
│   ├── services/
│   └── ...
├── admin/              # Panel de administración
│   ├── index.html
│   └── js/admin.js
├── data/               # Archivos JSON generados
├── index.html          # Frontend de búsqueda original
└── ...
```

