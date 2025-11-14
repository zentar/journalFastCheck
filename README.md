# Verificador de Indexación Scopus - MVP

Aplicación web ligera que permite consultar el estado de indexación de una revista en Scopus (Activa, Inactiva o Descontinuada) de forma instantánea.

## Características

- Búsqueda rápida por nombre de revista, ISSN o E-ISSN
- Resultados claros con códigos de color:
  - 🟢 **Verde**: Revista ACTIVA
  - 🔴 **Rojo**: Revista DESCONTINUADA
  - 🟡 **Amarillo**: Revista INACTIVA
  - ⚪ **Gris**: NO ENCONTRADA
- Interfaz simple y responsive
- Funciona completamente offline una vez cargados los datos
- **Nuevo**: Conversión de archivos Excel (.xlsx) y CSV a JSON
- **Nuevo**: Interfaz web para subir y convertir archivos directamente en el navegador

## Requisitos Previos

- Node.js (v14 o superior) - Solo necesario para convertir CSV a JSON
- Navegador web moderno (Chrome, Firefox, Safari, Edge)

## Instalación y Configuración

### 1. Instalar Dependencias

```bash
npm install
```

**Nota**: La aplicación incluye archivos JSON de ejemplo con datos de prueba. Puedes probarla inmediatamente sin necesidad de archivos CSV. Ver `PRUEBA.md` para ejemplos de búsqueda.

### 2. Preparar Archivos (Opcional - para datos reales)

Tienes dos opciones para convertir tus archivos:

#### Opción A: Interfaz Web (Recomendado)

1. Abre `converter.html` en tu navegador
2. Sube los archivos Excel (.xlsx) o CSV de Scopus:
   - Archivo de Sources (pestaña "Scopus Sources" o similar)
   - Archivo de Discontinued Titles (pestaña "Discontinued Titles" o similar)
3. Haz clic en "Convertir a JSON"
4. Descarga los archivos JSON generados
5. Colócalos en la carpeta `data/`

#### Opción B: Script de Línea de Comandos

Coloca los archivos Excel o CSV de Scopus en la raíz del proyecto:
- `Scopus Sources Oct. 2025.xlsx` o `.csv` (o nombre similar que contenga "scopus sources")
- `Discontinued Titles Oct. 2025.xlsx` o `.csv` (o nombre similar que contenga "discontinued")

**Nota**: Los nombres de los archivos pueden variar, el script buscará automáticamente archivos que coincidan con estos patrones. Si el Excel tiene múltiples pestañas, se detectará automáticamente la correcta.

### 3. Convertir Archivos a JSON (Solo Opción B)

Ejecuta el script de conversión:

```bash
npm run convert
```

O directamente:

```bash
node scripts/convert-csv.js
```

Este script:
- Buscará automáticamente los archivos Excel o CSV en la raíz del proyecto
- Si es Excel, detectará automáticamente las pestañas correctas
- Los convertirá a formato JSON
- Los guardará en la carpeta `data/`:
  - `data/sources.json`
  - `data/discontinued.json`

### 4. Abrir la Aplicación

**Con datos de ejemplo**: Simplemente abre `index.html` en tu navegador o usa un servidor local:

**Con datos reales**: Después de convertir los CSV, abre el archivo `index.html` en tu navegador. Puedes usar un servidor local simple:

```bash
# Con Python 3
python3 -m http.server 8000

# Con Node.js (http-server)
npx http-server

# O simplemente abre index.html directamente en el navegador
```

Luego visita: `http://localhost:8000` (o el puerto que uses)

## Uso

1. Ingresa el nombre de la revista, ISSN o E-ISSN en el campo de búsqueda
2. Haz clic en "Consultar" o presiona Enter
3. El resultado se mostrará con el estado correspondiente y la información relevante

### Ejemplos de Búsqueda

- Nombre completo: "Journal of Science"
- Nombre parcial: "Science"
- ISSN: "1234-5678" o "12345678"
- E-ISSN: "9876-5432" o "98765432"

## Estructura del Proyecto

```
scopus-check/
├── index.html              # Página principal (búsqueda)
├── converter.html          # Interfaz de conversión Excel/CSV a JSON
├── js/
│   ├── app.js             # Lógica de búsqueda
│   └── converter.js        # Lógica de conversión en el navegador
├── css/
│   └── styles.css         # Estilos adicionales
├── data/
│   ├── sources.json       # Datos de todas las revistas (generado)
│   └── discontinued.json  # Datos de revistas descontinuadas (generado)
├── scripts/
│   └── convert-csv.js     # Script de conversión Excel/CSV a JSON (Node.js)
├── package.json           # Dependencias Node.js
└── README.md             # Este archivo
```

## Lógica de Búsqueda

La aplicación sigue estos pasos:

1. **Paso A**: Busca el término en la lista maestra de Sources
   - Si no se encuentra → **NO ENCONTRADA**
   - Si se encuentra → Continúa al Paso B

2. **Paso B**: Verifica el estado "Active or Inactive"
   - Si es "Active" → **ACTIVA**
   - Si es "Inactive" → Continúa al Paso C

3. **Paso C**: Busca en la lista de Discontinued
   - Si se encuentra → **DESCONTINUADA** (con razón de eliminación)
   - Si no se encuentra → **INACTIVA** (simplemente inactiva)

## Actualización de Datos

Para actualizar los datos con nuevas listas de Scopus:

### Método 1: Interfaz Web (Más Fácil)
1. Descarga los nuevos archivos Excel desde [Elsevier](https://www.elsevier.com/products/scopus/content#4-titles-on-scopus)
2. Abre `converter.html` en tu navegador
3. Sube los nuevos archivos Excel
4. Descarga los JSON generados y reemplázalos en `data/`

### Método 2: Script de Línea de Comandos
1. Descarga los nuevos archivos Excel o CSV desde [Elsevier](https://www.elsevier.com/products/scopus/content#4-titles-on-scopus)
2. Reemplaza los archivos en la raíz del proyecto
3. Ejecuta nuevamente: `npm run convert`
4. Los archivos JSON se actualizarán automáticamente

## Notas Técnicas

- Los archivos JSON se cargan una sola vez al iniciar la aplicación
- La búsqueda es case-insensitive (ignora mayúsculas/minúsculas)
- Se limpian espacios en blanco automáticamente
- La búsqueda por ISSN acepta formatos con y sin guiones
- **Soporte Excel**: El script detecta automáticamente las pestañas correctas en archivos Excel con múltiples hojas
- **Conversión Web**: La interfaz web procesa archivos completamente en el navegador (sin enviar datos al servidor)

## Fase 2 (Futuro)

La Fase 2 incluirá automatización para:
- Descarga automática de archivos desde Elsevier
- Actualización programada de datos
- Almacenamiento en base de datos en la nube

## Licencia

MIT

