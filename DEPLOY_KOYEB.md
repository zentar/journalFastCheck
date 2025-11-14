# Guía de Despliegue en Koyeb

Esta guía te ayudará a desplegar el proyecto Verificador de Indexación Scopus en Koyeb.

## Requisitos Previos

1. Cuenta en [Koyeb](https://www.koyeb.com) (gratuita disponible)
2. Repositorio en GitHub (ya configurado: https://github.com/zentar/journalFastCheck.git)
3. Acceso a tu cuenta de GitHub

## Opción 1: Despliegue desde GitHub (Recomendado)

### Paso 1: Preparar el Repositorio

Asegúrate de que todos los cambios estén en GitHub:

```bash
git add .
git commit -m "Preparado para despliegue en Koyeb"
git push origin main
```

### Paso 2: Conectar con Koyeb

1. Ve a [Koyeb Dashboard](https://app.koyeb.com)
2. Haz clic en **"Create App"** o **"New App"**
3. Selecciona **"GitHub"** como fuente
4. Autoriza a Koyeb a acceder a tu cuenta de GitHub si es necesario
5. Selecciona el repositorio: `zentar/journalFastCheck`

### Paso 3: Configurar la Aplicación

#### Configuración Básica:
- **Name**: `scopus-check` (o el nombre que prefieras)
- **Region**: Elige la región más cercana a tus usuarios
- **Buildpack**: Koyeb detectará automáticamente Node.js

#### Configuración de Build:
- **Root Directory**: Dejar vacío (raíz del proyecto)
- **Build Command**: `cd server && npm install`
- **Run Command**: `cd server && npm start`

**IMPORTANTE**: El proyecto incluye un `Procfile` que Koyeb detectará automáticamente. Si no se detecta, configura manualmente:
- **Run Command**: `cd server && npm start`

O si prefieres usar el Dockerfile:
- **Dockerfile Path**: `server/Dockerfile`

### Paso 4: Variables de Entorno

En la sección **"Environment Variables"**, agrega:

```
NODE_ENV=production
PORT=8080
JWT_SECRET=tu_secret_key_super_segura_aqui_cambiar
DEFAULT_USER=admin
DEFAULT_PASSWORD=admin123
DATA_DIR=./data
```

⚠️ **Importante**: 
- Cambia `JWT_SECRET` por una clave secreta fuerte y única
- Cambia `DEFAULT_PASSWORD` por una contraseña segura
- Estas variables son sensibles, no las compartas

### Paso 5: Desplegar

1. Haz clic en **"Deploy"**
2. Koyeb comenzará a construir y desplegar tu aplicación
3. El proceso tomará unos minutos

### Paso 6: Acceder a la Aplicación

Una vez desplegado, Koyeb te proporcionará una URL como:
```
https://scopus-check-xxxxx.koyeb.app
```

## Opción 2: Despliegue con Dockerfile

Si prefieres usar Docker:

1. En Koyeb, selecciona **"Docker"** como tipo de aplicación
2. Especifica el Dockerfile: `server/Dockerfile`
3. Sigue los pasos 4-6 de la Opción 1

## Configuración Adicional

### Dominio Personalizado

1. Ve a **Settings** > **Domains**
2. Agrega tu dominio personalizado
3. Configura los registros DNS según las instrucciones de Koyeb

### Escalado Automático

Koyeb escala automáticamente según la demanda. Puedes configurar:
- **Min instances**: 1 (mínimo)
- **Max instances**: Según tus necesidades

### Logs y Monitoreo

- Ve a **Logs** para ver los logs en tiempo real
- Usa **Metrics** para monitorear el rendimiento

## Consideraciones Importantes

### Archivos JSON

Los archivos JSON generados se guardan en `./data` dentro del contenedor. Esto significa que:
- ⚠️ Los archivos se perderán si el contenedor se reinicia
- ✅ Para persistencia, considera usar:
  - Volúmenes de Koyeb (si están disponibles)
  - Almacenamiento en la nube (S3, Google Cloud Storage, etc.)
  - Base de datos (MongoDB, PostgreSQL, etc.)

### Límites de Memoria

Koyeb tiene límites de memoria según el plan:
- **Free tier**: Limitado
- **Starter**: Más memoria disponible

Si procesas archivos Excel muy grandes, considera:
- Procesar en chunks
- Usar streaming
- Aumentar el plan de Koyeb

### Variables de Entorno Sensibles

Nunca subas archivos `.env` al repositorio. Usa siempre las variables de entorno de Koyeb.

## Solución de Problemas

### Error: "no command to run your application"
- **Solución**: El proyecto incluye un `Procfile` en la raíz. Si Koyeb no lo detecta:
  1. Ve a **Settings** > **Service**
  2. En **Run Command**, ingresa: `cd server && npm start`
  3. Guarda y redespliega

### Error: "Cannot find module"
- Verifica que `cd server && npm install` se ejecute correctamente
- Asegúrate de que `package.json` esté en la carpeta `server/`
- Verifica que el **Build Command** sea: `cd server && npm install`

### Error: "Port already in use"
- Koyeb asigna el puerto automáticamente a través de `PORT`
- Asegúrate de que el servidor use `process.env.PORT || 3000`
- No necesitas configurar PORT manualmente, Koyeb lo hace automáticamente

### Error: "Build failed"
- Revisa los logs de build en Koyeb
- Verifica que todas las dependencias estén en `package.json` dentro de `server/`
- Asegúrate de que Node.js 18+ esté disponible
- Verifica que el **Build Command** sea correcto: `cd server && npm install`

## Actualizar la Aplicación

Para actualizar la aplicación después de hacer cambios:

```bash
git add .
git commit -m "Actualización"
git push origin main
```

Koyeb detectará automáticamente los cambios y desplegará una nueva versión.

## Recursos

- [Documentación de Koyeb](https://www.koyeb.com/docs)
- [Guía de Node.js en Koyeb](https://www.koyeb.com/docs/languages/nodejs)
- [Variables de Entorno en Koyeb](https://www.koyeb.com/docs/apps/environment-variables)

