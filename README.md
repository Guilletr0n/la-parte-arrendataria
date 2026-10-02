# La Parte Arrendataria — CMS Fanzine Guerrilla
*(Neobrutalismo Digital × Prensa de Guerrilla Vintage)*

Content Management System basado en **Astro 5+**, diseñado con estética de fanzine fotocopiable y neobrutalismo digital, optimizado para desplegarse en **Google Cloud Platform (Cloud Run + Firestore + Cloud Storage)** con generación de **PDF editorial a 3 columnas con códigos QR vectoriales**.

---

## 🚀 Inicio Rápido (Desarrollo Local)

El proyecto incluye un almacenamiento local persistente transparente (`.data/`) para que funcione **sin necesidad de configurar credenciales de Google Cloud o Firebase**:

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:4321`.

---

## 👥 Credenciales y Sistema de Roles (RBAC)

Accede a la redacción desde `http://localhost:4321/admin`:

| Rol | Correo | Contraseña | Capacidades |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@lapartearrendataria.org` | `admin123` | **Control total**: publicar, despublicar, eliminar artículos, seleccionar contenido para el fanzine físico y exportar el PDF a 3 columnas. |
| **Editor** | `editor@lapartearrendataria.org` | `editor123` | **Redacción en borrador**: redactar textos en Markdown, 1 única fotografía por artículo, nota de voz SpeakPipe (máx. 2 min) y enlace a fuente original. |

*(La pantalla de login incluye botones de acceso rápido para probar ambos roles con 1 clic).*

---

## 📰 Estructura y Vistas Principales

- `/`: **Feed Web Público** (contenedor de 720px de ancho máximo, cabecera de impacto "LA PARTE ARRENDATARIA", tipografía editorial, reproductor de audio SpeakPipe y enlaces a fuentes).
- `/admin`: **Panel de Control** (métricas de catálogo, listado de artículos, cambios de estado y accesos rápidos).
- `/admin/new-article`: **Formulario Editorial** (disciplina estricta de 1 foto, SpeakPipe API, editor Markdown con opción de escribir o **subir archivo `.md`/`.txt` vía drag-and-drop**, enlace a fuente).
- `/admin/edit/[id]`: **Edición de Artículos** respetando permisos de rol (con soporte para sustituir o cargar archivos `.md`).
- `/admin/export-fanzine`: **Taller de Imprenta** (selector interactivo con checkboxes, asignación de orden en columnas y botón de exportación).
- `/print/issue-preview`: **Vista de Impresión A4** (cabecera a todo ancho, flujo a 3 columnas `column-count: 3`, tipografía justificada con silabeo y códigos QR autogenerados).
- `/api/fanzine/export`: **Endpoint de Descarga Directa** (renderiza el PDF mediante Puppeteer emulando `@media print`).

---

## ☁️ Despliegue en Google Cloud Platform (Cloud Run)

### 1. Despliegue directo con Google Cloud SDK:

```bash
gcloud run deploy la-parte-arrendataria \
  --source . \
  --region europe-west1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 2Gi \
  --cpu 1
```

*Nota: Se recomienda asignar al menos 2Gi de memoria para permitir que Chromium (Puppeteer) renderice los PDFs sin restricciones de memoria.*

### 2. Variables de Entorno en GCP:
- `GCP_PROJECT_ID`: ID del proyecto de Google Cloud.
- `FIREBASE_SERVICE_ACCOUNT_KEY` *(opcional)*: JSON de la cuenta de servicio si no se usan Application Default Credentials.
- `GCS_BUCKET_NAME`: Nombre del bucket de Cloud Storage para imágenes.

---

## 🛠️ Tecnologías Empleadas

- **Astro 5+** en modo SSR (`output: 'server'`).
- **Tailwind CSS v4** con `@tailwindcss/vite`.
- **Node.js** Standalone Adapter (`@astrojs/node`).
- **Puppeteer** para renderizado serverless de PDF de alta fidelidad.
- **QRCode** para generación vectorial de códigos QR de contraste extremo.
- **Marked** para procesamiento rápido y seguro de Markdown.
