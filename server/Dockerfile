# Dockerfile para Koyeb (opcional - Koyeb puede usar buildpacks automáticos)
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de configuración del servidor
COPY server/package*.json ./server/
WORKDIR /app/server

# Instalar dependencias del servidor
RUN npm ci --only=production

# Copiar código del servidor
COPY server/ ./

# Crear directorios necesarios
RUN mkdir -p data uploads

# Exponer puerto (Koyeb asignará el puerto dinámicamente)
ENV PORT=8080
EXPOSE 8080

# Comando para iniciar el servidor
CMD ["node", "server.js"]

