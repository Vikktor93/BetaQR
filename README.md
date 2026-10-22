# 🖨️ BetaQR - Sistema de Registro y Monitoreo de Impresoras 3D

Plataforma web responsive *Mobile-First* y PWA para la gestión, registro de uso mediante códigos QR y monitoreo en tiempo real del laboratorio de prototipado 3D.

> **Institución:** Universidad de Los Lagos - Departamento de Ciencias de la Ingeniería  
> **Carrera:** Ingeniería Civil en Informática  
> **Versión:** 0.2.0-Beta

---

## 📋 Tabla de Contenidos
1. [Descripción General](#-descripción-general)
2. [Estado Actual del Proyecto](#-estado-actual-del-proyecto)
3. [Arquitectura y Stack Tecnológico](#-arquitectura-y-stack-tecnológico)
4. [Módulos del Sistema](#-módulos-del-sistema)
5. [Rutas de la Aplicación](#-rutas-de-la-aplicación)
6. [Estructura del Proyecto](#-estructura-del-proyecto)
7. [Modelo de Datos (Firebase Firestore)](#-modelo-de-datos-firebase-firestore)
8. [Flujo de Funcionamiento y Seguridad QR](#-flujo-de-funcionamiento-y-seguridad-qr)
9. [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
10. [Configuración Inicial en Firebase](#-configuración-inicial-en-firebase)
11. [Reglas de Seguridad Recomendadas](#-reglas-de-seguridad-recomendadas)
12. [Despliegue (Deploy)](#-despliegue-deploy)
13. [Flujo de Trabajo con Git](#-flujo-de-trabajo-con-git)
14. [Requerimientos del Sistema (Trazabilidad)](#-requerimientos-del-sistema-trazabilidad)
15. [Créditos](#-créditos)

---

## 📖 Descripción General

**BetaQR** es una solución ligera diseñada para optimizar el flujo de trabajo en talleres y laboratorios universitarios de fabricación digital. Elimina las planillas manuales de papel y los inicios de sesión engorrosos, permitiendo que un estudiante inicie su sesión de impresión en menos de 10 segundos escaneando un código QR pegado físicamente en la máquina.

Paralelamente, el encargado del laboratorio cuenta con un **Dashboard en tiempo real** que muestra el estado de disponibilidad de cada impresora, cronómetros de uso sincronizados y controles para editar, eliminar o liberar equipos.

---

## 🚦 Estado Actual del Proyecto

| Área | Estado |
|---|---|
| Vista del estudiante (QR → formulario → cronómetro → STOP) | ✅ Funcional |
| Registro de duración de cada sesión en Firestore (RF05) | ✅ Funcional |
| Login de administrador con Firebase Auth y ruta protegida | ✅ Funcional |
| Dashboard en tiempo real con resumen de estados | ✅ Funcional |
| Edición, eliminación y liberación forzada de impresoras | ✅ Funcional |
| Alta de impresoras desde el panel | ⏳ Pendiente (se crean desde Firebase Console) |
| Historial de sesiones, filtros y exportación a Excel/CSV | ⏳ Pendiente |
| Configuración PWA (manifest, íconos, instalación) | ⏳ Pendiente |
| Reglas de seguridad y despliegue a Firebase Hosting | ⏳ Pendiente |

---

## ⚡ Arquitectura y Stack Tecnológico

El proyecto sigue una arquitectura *Serverless* reactiva, priorizando tiempos de carga inferiores a 2 segundos en redes móviles (4G/Wi-Fi universitario):

* **Frontend:** [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
* **Enrutamiento:** [React Router 7](https://reactrouter.com/)
* **Estilos y UI:** [Tailwind CSS 4](https://tailwindcss.com/) (plugin `@tailwindcss/vite`) + [Lucide React](https://lucide.dev/) (iconografía)
* **Backend as a Service (BaaS):** [Firebase Firestore](https://firebase.google.com/docs/firestore) con listeners en tiempo real (`onSnapshot`)
* **Autenticación (solo Admin):** [Firebase Authentication](https://firebase.google.com/docs/auth) con correo y contraseña
* **Hosting & CDN (planificado):** [Firebase Hosting](https://firebase.google.com/docs/hosting) o [Vercel](https://vercel.com/), con HTTPS obligatorio para cámara y PWA
* **Exportación de reportes (planificado):** [SheetJS (xlsx)](https://docs.sheetjs.com/), ya incluido como dependencia

---

## 📱 Módulos del Sistema

### 1. Módulo Estudiante (Mobile-First)
* **Acceso por QR:** cada impresora tiene su propia URL (`/impresora/:printerId?token=...`).
* **Validación de token:** si la impresora tiene `securityToken` y el token de la URL no coincide, se muestra "Acceso no autorizado".
* **Formulario simple:** nombre y apellido, más la carrera desde un desplegable precargado (`src/config/careers.js`).
* **Inicio de sesión de impresión:** crea el registro en `print_sessions` con `startTime` del servidor y marca la impresora como `Ocupado`.
* **Sesión activa:** cronómetro en vivo `HH:MM:SS` y botón **STOP**.
* **Finalización:** calcula y guarda la duración (`durationSeconds`, `durationFormatted`) y libera la impresora.
* **Impresora no disponible:** si el encargado la marca como `No disponible`, el estudiante no puede iniciar sesión.

### 2. Módulo Administrador (Dashboard en Tiempo Real)
* **Login protegido:** `/admin` redirige a `/login` si no hay usuario autenticado; incluye cierre de sesión.
* **Resumen de estados:** contadores de impresoras disponibles, en uso y no disponibles.
* **Tarjetas de impresora** con estado en tiempo real:
  * 🟢 **Disponible:** lista para un nuevo escaneo.
  * 🟠 **En uso:** muestra estudiante, carrera, hora de inicio y cronómetro en vivo.
  * 🔴 **No disponible:** fuera de servicio o en mantención.
* **Editar impresora:** nombre, modelo y estado operativo manual.
* **Eliminar impresora:** con modal de confirmación.
* **Liberación forzada (Kill-Switch):** cierra la sesión activa con estado `LIBERACION_FORZADA` cuando el estudiante olvidó presionar STOP.

---

## 🧭 Rutas de la Aplicación

| Ruta | Vista | Acceso |
|---|---|---|
| `/` | Redirige a `/admin` | — |
| `/impresora/:printerId` | Vista del estudiante (`StudentScanView`) | Pública, vía QR |
| `/login` | Login del administrador (`AdminLogin`) | Pública |
| `/admin` | Dashboard (`AdminDashboard`) | Requiere autenticación |
| `*` | Página 404 (`NotFound`) | Pública |

---

## 📂 Estructura del Proyecto

```text
BetaQR/
├── public/
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── assets/                      # Imágenes
│   ├── components/
│   │   └── admin/
│   │       ├── ConfirmModal.jsx     # Modal genérico de confirmación
│   │       ├── EditPrinterModal.jsx # Edición de nombre, modelo y estado
│   │       └── PrinterCard.jsx      # Tarjeta de impresora con estado reactivo
│   ├── config/
│   │   ├── careers.js               # Listado oficial de carreras
│   │   └── firebase.js              # Inicialización de Firebase (Firestore y Auth)
│   ├── context/
│   │   └── AuthContext.jsx          # Contexto de autenticación del administrador
│   ├── hooks/
│   │   ├── useLiveTimer.js          # Cronómetro HH:MM:SS a partir de un startTime
│   │   └── usePrinters.js           # Listener en tiempo real de la colección 'printers'
│   ├── pages/
│   │   ├── AdminDashboard.jsx       # Panel del encargado del laboratorio
│   │   ├── AdminLogin.jsx           # Inicio de sesión administrativo
│   │   ├── NotFound.jsx             # Rutas inexistentes
│   │   └── StudentScanView.jsx      # Vista del estudiante (móvil)
│   ├── services/
│   │   └── printerService.js        # Operaciones Firestore: iniciar, detener, editar, eliminar
│   ├── App.jsx                      # Rutas y protección de /admin
│   ├── App.css
│   ├── index.css                    # Estilos globales y Tailwind CSS
│   └── main.jsx                     # Punto de entrada
├── .env.example                     # Plantilla de variables de entorno
├── eslint.config.js
├── index.html
├── package.json
└── vite.config.js
```

---

## 🗄️ Modelo de Datos (Firebase Firestore)

El sistema usa solo dos colecciones. Firestore las crea automáticamente con la primera escritura.

### Colección: `printers`
Identificador de documento sugerido: `printer_01`, `printer_02`, etc. Debe coincidir con el `:printerId` del QR.

```json
{
  "name": "Bambu Lab A1 Mini #01",
  "model": "Bambu Lab A1 Mini",
  "status": "Disponible",
  "securityToken": "a8f9e2b1c4",
  "currentSession": {
    "sessionId": "<id del documento en print_sessions>",
    "studentName": "Juan Pérez",
    "career": "Ingeniería Civil en Informática",
    "startTime": "<Firestore Timestamp>"
  },
  "updatedAt": "<Firestore Timestamp>"
}
```

| Campo | Notas |
|---|---|
| `name` | **Obligatorio.** El dashboard ordena por este campo y Firestore omite los documentos que no lo tienen. |
| `status` | `"Disponible"` · `"Ocupado"` · `"No disponible"` |
| `securityToken` | Opcional. Si existe, la URL del QR debe incluir `?token=` con el mismo valor. |
| `currentSession` | Solo existe mientras hay una impresión en curso. |

### Colección: `print_sessions` (historial)
Identificador de documento: autogenerado por Firestore.

```json
{
  "printerId": "printer_01",
  "printerName": "Bambu Lab A1 Mini #01",
  "studentName": "Juan Pérez",
  "career": "Ingeniería Civil en Informática",
  "startTime": "<Firestore Timestamp>",
  "endTime": "<Firestore Timestamp>",
  "durationSeconds": 6330,
  "durationFormatted": "01:45:30",
  "status": "FINALIZADO",
  "stoppedBy": "ESTUDIANTE"
}
```

| Campo | Valores |
|---|---|
| `status` | `"EN_CURSO"` · `"FINALIZADO"` · `"LIBERACION_FORZADA"` |
| `stoppedBy` | `null` mientras está en curso · `"ESTUDIANTE"` · `"ADMINISTRADOR"` |

---

## 🔐 Flujo de Funcionamiento y Seguridad QR

```
 [ Código QR en Impresora ]
            │
            ▼ (Escaneo con la cámara del móvil)
 [ URL: /impresora/printer_01?token=a8f9e2b1c4 ]
            │
            ├─► ¿La impresora existe?            No ──► [ Error: impresora no encontrada ]
            ├─► ¿El token coincide?              No ──► [ Acceso no autorizado ]
            ├─► ¿Estado "No disponible"?         Sí ──► [ Aviso: equipo fuera de servicio ]
            ▼
 [ Formulario: Nombre + Carrera ]
            │
            ▼ (Clic "Iniciar Impresión")
   ├── Crea documento en 'print_sessions' (status: EN_CURSO)
   └── Actualiza 'printers/printer_01' (status: Ocupado, currentSession: {...})
            │
            ▼
 [ Sesión activa: Cronómetro + Botón STOP ]
            │
            ▼ (STOP del estudiante o liberación forzada del admin)
   ├── Calcula la duración (durationSeconds / durationFormatted)
   ├── Actualiza 'print_sessions' (FINALIZADO o LIBERACION_FORZADA)
   └── Libera 'printers/printer_01' (status: Disponible, sin currentSession)
```

> ⚠️ La validación del token ocurre en el cliente. Para que sea una protección real, debe complementarse con reglas de seguridad en Firestore.

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
* Node.js **20.19 o superior** (requerido por Vite 8)
* Cuenta en Google Firebase (plan Spark gratuito)

### 1. Clonar el repositorio
```bash
git clone https://github.com/Vikktor93/BetaQR
cd BetaQR
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz tomando como base `.env.example`:

```env
VITE_FIREBASE_API_KEY="tu_api_key"
VITE_FIREBASE_AUTH_DOMAIN="tu_proyecto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="tu_proyecto_id"
VITE_FIREBASE_STORAGE_BUCKET="tu_proyecto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="tu_sender_id"
VITE_FIREBASE_APP_ID="tu_app_id"
```

### 4. Ejecutar en entorno local
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

### Scripts disponibles
| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Compilación para producción en `dist/` |
| `npm run preview` | Previsualiza la compilación de producción |
| `npm run lint` | Revisión de código con ESLint |

---

## 🔧 Configuración Inicial en Firebase

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/) y registra una app web para obtener las credenciales del `.env`.
2. Habilita **Cloud Firestore**.
3. En **Authentication → Método de acceso**, habilita **Correo electrónico/contraseña**.
4. En **Authentication → Usuarios**, crea manualmente la cuenta del encargado del laboratorio (no hay pantalla de registro).
5. En Firestore, crea la colección `printers` con un documento por impresora (por ejemplo `printer_01`) que tenga al menos `name`, `model` y `status: "Disponible"`. Si quieres proteger el QR, agrega `securityToken`.
6. Genera el QR de cada impresora con la URL `https://<tu-dominio>/impresora/printer_01?token=<securityToken>`.

---

## 🛡️ Reglas de Seguridad Recomendadas

Propuesta para `firestore.rules` (aún no incluida en el repositorio). El estudiante no inicia sesión, por lo que solo puede tocar los campos de estado; el administrador autenticado tiene control total.

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    match /printers/{printerId} {
      allow read: if true;
      allow create, delete: if request.auth != null;
      allow update: if request.auth != null
        || request.resource.data.diff(resource.data).affectedKeys()
             .hasOnly(['status', 'currentSession', 'updatedAt']);
    }

    match /print_sessions/{sessionId} {
      allow read: if request.auth != null;
      allow create: if request.resource.data.studentName is string
                    && request.resource.data.career is string;
      allow update: if true;
      allow delete: if request.auth != null;
    }
  }
}
```

---

## 🚢 Despliegue (Deploy)

### Firebase Hosting (planificado)
```bash
npm install -g firebase-tools
firebase login
firebase init hosting        # carpeta pública: dist · app de una sola página: Sí
npm run build
firebase deploy
```

---

## 🌿 Flujo de Trabajo con Git

* `main`: rama estable, siempre debe compilar.
* Cada colaborador trabaja en su propia rama (por ejemplo `VicenteGarin`).
* Los cambios se integran a `main` mediante Pull Request o merge, probando cada commit antes de subirlo.
* Se recomienda que todos usen la misma versión de Node y npm para evitar cambios innecesarios en `package-lock.json`.

---

## 📊 Requerimientos del Sistema (Trazabilidad)

| Código | Tipo | Nombre | Estado |
|---|---|---|---|
| **RF01** | Funcional | Escaneo Único por Impresora (QR por máquina) | ✅ Implementado |
| **RF02** | Funcional | Registro Mínimo de Usuario (Nombre + Desplegable Carrera) | ✅ Implementado |
| **RF03** | Funcional | Captura Automática de Timestamp de Inicio | ✅ Implementado |
| **RF04** | Funcional | Botón de Término "STOP" y Cronómetro en Vivo | ✅ Implementado |
| **RF05** | Funcional | Cierre y Registro de Fin con Cálculo de Duración | ✅ Implementado |
| **RF06** | Funcional | Dashboard Web de Estado en Vivo (Cards por estado) | ✅ Implementado |
| **RF07** | Funcional | Visualización de Uso en Tiempo Real (Datos + Tiempo HH:MM:SS) | ✅ Implementado |
| **RF08** | Funcional | Histórico y Exportación Consolidada a Excel/CSV | ❌ Pendiente |
| **RF09** | Funcional | Finalización Forzada (Kill-Switch para Encargado) | ✅ Implementado |
| **RNF01**| No Funcional | Usabilidad Móvil *Mobile-First* (< 2 segundos de carga) | ⏳ En Curso |
| **RNF02**| No Funcional | Mínimo Esfuerzo de Ingreso (< 10 segundos flujo total) | ⏳ En Curso |
| **RNF03**| No Funcional | Arquitectura Web Liviana y Serverless | ✅ Implementado |
| **RNF04**| No Funcional | Actualización Dinámica sin recarga (Firestore Snapshots) | ✅ Implementado |
| **RNF05**| No Funcional | Validación de Tokens de Seguridad en QR | ⏳ En Curso (falta reforzar con reglas) |
| **RNF06**| No Funcional | Integridad de Datos y Privacidad Institucional | ❌ Pendiente |

---

## 👥 Créditos

* **Docente Responsable:** Víctor Saldivia Vera (`victor.saldivia@ulagos.cl`)
* **Desarrollador Principal:** Víctor Saldivia Vera (`victor.saldivia@ulagos.cl`)
* **Co-Desarrollador:** Vicente Garin Pereda (`vicentemartin.garin@alumnos.ulagos.cl`)
* **Unidad Académica:** Departamento de Ciencias de la Ingeniería - Ingeniería Civil en Informática
* **Institución:** Universidad de Los Lagos, Sede Chiloé.