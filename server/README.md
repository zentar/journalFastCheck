# Backend - Verificador de Indexación Scopus

Backend con autenticación y sistema de conversión de Excel a JSON.

## Características

- ✅ Sistema de autenticación con JWT
- ✅ Login y registro de usuarios
- ✅ Conversión de archivos Excel a JSON
- ✅ Detección automática de todas las pestañas (Sources, Accepted, Discontinued, etc.)
- ✅ Generación de múltiples archivos JSON según las pestañas encontradas
- ✅ API RESTful

## Instalación

1. Instalar dependencias:
```bash
cd server
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
```

Edita `.env` y configura:
- `PORT`: Puerto del servidor (default: 3000)
- `JWT_SECRET`: Clave secreta para JWT (cambiar en producción)
- `DEFAULT_USER`: Usuario por defecto
- `DEFAULT_PASSWORD`: Contraseña por defecto
- `DATA_DIR`: Directorio donde se guardan los JSON

3. Iniciar el servidor:
```bash
npm start
```

O en modo desarrollo (con auto-reload):
```bash
npm run dev
```

## Endpoints de la API

### Autenticación

- `POST /api/auth/login` - Iniciar sesión
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```

- `POST /api/auth/register` - Registrar nuevo usuario
  ```json
  {
    "username": "nuevo_usuario",
    "password": "contraseña123"
  }
  ```

- `GET /api/auth/me` - Obtener información del usuario actual (requiere token)

### Convertidor

- `POST /api/converter/upload` - Subir y convertir archivo Excel (requiere token)
  - Form-data: `excelFile` (archivo .xlsx o .xls)
  - Genera automáticamente todos los JSON según las pestañas encontradas

- `POST /api/converter/preview` - Vista previa del archivo Excel (requiere token)
  - Form-data: `excelFile` (archivo .xlsx o .xls)
  - Muestra información sobre las pestañas sin procesar

- `GET /api/converter/files` - Listar archivos JSON generados (requiere token)

### Otros

- `GET /api/health` - Estado del servidor

## Uso del Token

Todas las rutas protegidas requieren un token JWT en el header:
```
Authorization: Bearer <token>
```

El token se obtiene al hacer login y expira en 24 horas.

## Pestañas Soportadas

El sistema detecta automáticamente las siguientes pestañas y genera los JSON correspondientes:

- **Sources**: `sources.json`
  - "Scopus Sources", "Sources", "Source List", "All Sources"

- **Accepted**: `accepted.json`
  - "Accepted", "Accepted Titles", "Newly Accepted"

- **Discontinued**: `discontinued.json`
  - "Discontinued", "Discontinued Titles", "Removed Titles", "Removed"

- **Otras**: Se generan archivos JSON con nombres basados en el nombre de la pestaña

## Estructura del Proyecto

```
server/
├── config/
│   └── database.js          # Sistema de almacenamiento de usuarios
├── middleware/
│   └── auth.js              # Middleware de autenticación JWT
├── routes/
│   ├── auth.js              # Rutas de autenticación
│   └── converter.js         # Rutas del convertidor
├── services/
│   └── excelConverter.js   # Lógica de conversión Excel → JSON
├── uploads/                 # Archivos temporales (gitignored)
├── data/                    # Archivos JSON generados y usuarios
├── server.js                # Servidor principal
└── package.json
```

## Frontend

El frontend de administración está en `/admin/index.html`. Abre este archivo en el navegador después de iniciar el servidor.

## Notas de Seguridad

- ⚠️ Cambiar `JWT_SECRET` en producción
- ⚠️ Cambiar credenciales por defecto en producción
- ⚠️ En producción, usar HTTPS
- ⚠️ Considerar implementar rate limiting
- ⚠️ Validar y sanitizar todas las entradas

