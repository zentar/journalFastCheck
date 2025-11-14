# Prueba Rápida de la Aplicación

## Datos de Ejemplo Incluidos

La aplicación incluye archivos JSON de ejemplo con datos de prueba para que puedas probarla inmediatamente.

### Ejemplos de Búsqueda que Funcionan:

1. **Revista ACTIVA** (verde):
   - Buscar: "Journal of Science"
   - Buscar: "1234-5678"
   - Buscar: "9876-5432"

2. **Revista DESCONTINUADA** (rojo):
   - Buscar: "Research Quarterly"
   - Buscar: "2345-6789"
   - Buscar: "8765-4321"

3. **Revista INACTIVA** (amarillo):
   - Buscar: "Academic Studies"
   - Buscar: "3456-7890"

4. **Revista NO ENCONTRADA** (gris):
   - Buscar: "Revista Inexistente"
   - Buscar: "9999-9999"

## Cómo Probar

1. Abre `index.html` en tu navegador
2. O usa un servidor local:
   ```bash
   # Python
   python3 -m http.server 8000
   
   # Node.js
   npx http-server
   ```
3. Visita `http://localhost:8000`
4. Prueba las búsquedas de ejemplo arriba

## Reemplazar con Datos Reales

Cuando tengas los archivos CSV reales de Scopus:

1. Coloca los CSV en la raíz del proyecto
2. Ejecuta: `npm run convert`
3. Los archivos JSON se actualizarán automáticamente


