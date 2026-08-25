# 🖨️ BetaQR - Sistema de Registro y Monitoreo de Impresoras 3D

Plataforma web responsive *Mobile-First* y PWA para la gestión, registro de uso mediante códigos QR y monitoreo en tiempo real del laboratorio de prototipado 3D.
> 
> **Institución:** Universidad de Los Lagos - Departamento de Ciencias de la Ingeniería  
> **Carrera:** Ingeniería Civil en Informática  
> **Versión:** 0.0.1-Beta

---

## 📋 Tabla de Contenidos
1. [Descripción General](#-descripción-general)
2. [Arquitectura y Stack Tecnológico](#-arquitectura-y-stack-tecnológico)
3. [Módulos del Sistema](#-módulos-del-sistema)
4. [Estructura del Proyecto](#-estructura-del-proyecto)
5. [Modelo de Datos (Firebase Firestore)](#-modelo-de-datos-firebase-firestore)
6. [Flujo de Funcionamiento y Seguridad QR](#-flujo-de-funcionamiento-y-seguridad-qr)
7. [Instalación y Puesta en Marcha](#-instalación-y-puesta-en-marcha)
8. [Configuración de Variables de Entorno](#-configuración-de-variables-de-entorno)
9. [Despliegue (Deploy)](#-despliegue-deploy)
10. [Requerimientos del Sistema (Trazabilidad)](#-requerimientos-del-sistema-trazabilidad)
11. [Créditos y Licencia](#-créditos-y-licencia)

---

## 📖 Descripción General

**BetaQR** es una solución ligera diseñada para optimizar el flujo de trabajo en talleres y laboratorios universitarios de fabricación digital. Elimina las planillas manuales de papel y los inicios de sesión engorrosos, permitiendo que un estudiante inicie su sesión de impresión en menos de 10 segundos escaneando un código QR pegado físicamente en la máquina.

Paralelamente, el encargado del laboratorio cuenta con un **Dashboard en tiempo real** que muestra el estado de disponibilidad de cada impresora, cronómetros de uso sincronizados, historial consolidado y exportación de métricas a Excel/CSV.

---

## ⚡ Arquitectura y Stack Tecnológico

El proyecto está diseñado bajo una arquitectura *Serverless* reactiva, priorizando tiempos de carga inferiores a 2 segundos en redes móviles (4G/Wi-Fi universitario):

* **Frontend:** [React.js](https://react.dev/) + [Vite](https://vitejs.dev/) (para compilación instantánea y bundle ultra liviano) o HTML5 moderno.
* **Estilos y UI:** [Tailwind CSS](https://tailwindcss.com/) (diseño Mobile-First adaptativo) + [Lucide React](https://lucide.dev/) (iconografía).
* **Backend as a Service (BaaS):** [Firebase Firestore](https://firebase.google.com/docs/firestore) (Base de datos NoSQL reactiva con sincronización en tiempo real vía WebSockets/Snapshot listeners).
* **Autenticación (Solo Admin):** [Firebase Authentication](https://firebase.google.com/docs/auth) (protección de rutas del panel administrativo).
* **Hosting & CDN:** [Firebase Hosting](https://firebase.google.com/docs/hosting) / [Vercel](https://vercel.com/) con certificado SSL/HTTPS obligatorio para lectores de cámara y PWA.
* **Exportación de Reportes:** [SheetJS (xlsx)](https://docs.sheetjs.com/) o parser CSV nativo.

---

## 📱 Módulos del Sistema

### 1. Módulo Estudiante (Mobile-First / PWA)
* **Escaneo QR Dedicado:** Redirección automática a la vista de la máquina escaneada (`/impresora/:printerId?token=...`).
* **Formulario Ultra Simple:** Ingreso de Nombre y Apellido, y selección de Carrera universitaria desde un desplegable precargado.
* **Inicio Instantáneo:** Captura de `timestamp` exacto en servidor al pulsar *"Iniciar Impresión"*.
* **Sesión Activa:** Cronómetro en vivo y botón destacado de *"STOP"* (Término de Impresión).
* **Finalización:** Cálculo automático de tiempo transcurrido, liberación de la máquina y pantalla de confirmación.

### 2. Módulo Administrador (Dashboard en Tiempo Real)
* **Matriz de Impresoras (Cards):** Visualización del estado de cada equipo en tiempo real:
  * 🟢 **Disponible:** Lista para nuevo escaneo.
  * 🔴 **Ocupada:** Muestra nombre del alumno, carrera, hora de inicio y cronómetro en vivo (`HH:MM:SS`).
* **Liberación Forzada (Kill-Switch):** Botón para forzar la liberación de una máquina si el estudiante olvidó presionar "STOP".
* **Historial y Filtros:** Tabla de sesiones finalizadas con filtros por rango de fechas, carrera e impresora.
* **Exportación:** Descarga de reportes en Excel (.xlsx) / CSV para métricas de gestión mensual.

---

## 📂 Estructura del Proyecto

```text
BetaQR/
├── .github/
│   └── workflows/
│       └── firebase-deploy.yml      # CI/CD para despliegue automático
├── public/
│   ├── favicon.ico
│   ├── icon-192.png                 # Icono PWA
│   ├── icon-512.png                 # Icono PWA
│   ├── manifest.json                # Configuración Web App Manifest
│   └── robots.txt
├── src/
│   ├── assets/                      # Logos e imágenes institucionales
│   ├── components/
│   │   ├── admin/
│   │   │   ├── ExportModal.jsx      # Modal de configuración de exportación
│   │   │   ├── HistoryTable.jsx     # Tabla de registros históricos con filtros
│   │   │   ├── MetricCards.jsx      # KPIs generales (horas totales, uso diario)
│   │   │   └── PrinterCard.jsx      # Card individual de impresora con estado reactivo
│   │   ├── student/
│   │   │   ├── ActiveSession.jsx    # Vista con cronómetro y botón STOP
│   │   │   ├── ConfirmationModal.jsx# Resumen de sesión finalizada
│   │   │   └── RegisterForm.jsx     # Formulario rápido (Nombre + Dropdown Carrera)
│   │   └── ui/
│   │       ├── Button.jsx           # Botones reutilizables con feedback háptico/táctil
│   │       ├── Card.jsx
│   │       ├── Navbar.jsx
│   │       ├── Select.jsx
│   │       └── Spinner.jsx
│   ├── config/
│   │   ├── careers.js               # Listado oficial de carreras de la sede
│   │   └── firebase.js              # Inicialización de Firebase (Firestore & Auth)
│   ├── context/
│   │   └── AuthContext.jsx          # Contexto de autenticación para administradores
│   ├── hooks/
│   │   ├── useLiveTimer.js          # Custom hook para cálculo de cronómetro HH:MM:SS
│   │   ├── usePrinters.js           # Listener en tiempo real de la colección 'printers'
│   │   └── useSessionHistory.js     # Consulta y filtrado de histórico de impresiones
│   ├── pages/
│   │   ├── AdminDashboard.jsx       # Vista principal del encargado del laboratorio
│   │   ├── AdminLogin.jsx           # Vista de inicio de sesión administrativo
│   │   ├── NotFound.jsx             # Manejo de rutas no encontradas
│   │   └── StudentScanView.jsx      # Vista principal del estudiante (Mobile)
│   ├── services/
│   │   ├── exportService.js         # Generación de archivos Excel / CSV
│   │   └── printerService.js        # Operaciones Firestore (iniciar, parar, forzar liberación)
│   ├── utils/
│   │   ├── dateUtils.js             # Formateo de fechas y cálculo de duraciones
│   │   └── qrSecurity.js            # Validación de hash tokens por impresora
│   ├── App.jsx                      # Configuración de React Router
│   ├── index.css                    # Estilos globales y directivas Tailwind CSS
│   └── main.jsx                     # Punto de entrada de la aplicación
├── .env.example                     # Plantilla de variables de entorno
├── .gitignore
├── firebase.json                    # Configuración de Firebase Hosting y Firestore Rules
├── firestore.indexes.json           # Índices compuestos para consultas y reportes
├── firestore.rules                  # Reglas de seguridad de base de datos
├── index.html                       # HTML raíz optimizado para viewport móvil
├── package.json                     # Dependencias y scripts del proyecto
├── postcss.config.js
├── tailwind.config.js               # Paleta de colores e interfaz responsive
└── vite.config.js                   # Configuración de bundler Vite
```

---

## 🗄️ Modelo de Datos (Firebase Firestore)

### Colección: `printers` (Documentos por máquina física)
Identificador de documento: `printer_01`, `printer_02`, etc.
```json
{
  "id": "printer_01",
  "name": "Ender 3 V2 - Sala A",
  "model": "Creality Ender 3 V2",
  "status": "BUSY", // "AVAILABLE" | "BUSY" | "MAINTENANCE"
  "securityToken": "a8f9e2b1c4", // Token validado contra el QR
  "currentSession": {
    "sessionId": "sess_20260811_001",
    "studentName": "Juan Pérez",
    "career": "Ingeniería Civil en Informática",
    "startTime": "2026-08-11T10:30:00Z" // Firestore Timestamp
  },
  "updatedAt": "2026-08-11T10:30:00Z"
}
```

### Colección: `print_sessions` (Historial inmutable)
Identificador de documento: Auto-generado por Firestore.
```json
{
  "printerId": "printer_01",
  "printerName": "Ender 3 V2 - Sala A",
  "studentName": "Juan Pérez",
  "career": "Ingeniería Civil en Informática",
  "startTime": "2026-08-11T10:30:00Z",
  "endTime": "2026-08-11T12:15:30Z",
  "totalDurationMinutes": 105.5,
  "formattedDuration": "01:45:30",
  "status": "COMPLETED", // "COMPLETED" | "FORCE_STOPPED"
  "stoppedBy": "STUDENT", // "STUDENT" | "ADMIN"
  "createdAt": "2026-08-11T12:15:30Z"
}
```

---

## 🔐 Flujo de Funcionamiento y Seguridad QR

```
 [ Código QR en Impresora ] 
            │
            ▼ (Escaneo vía Cámara Móvil)
 [ URL: /impresora/printer_01?token=a8f9e2b1c4 ]
            │
            ├─► Valida Token vs Firestore
            │     ├── Token Inválido ──► [ Error: Código no autorizado ]
            │     └── Token Válido
            ▼
 [ Formulario: Nombre + Carrera ]
            │
            ▼ (Clic "Iniciar Impresión")
 [ Firestore Transaction ]
   ├── Crea documento en 'print_sessions' (status: RUNNING)
   └── Actualiza 'printers/printer_01' (status: BUSY, currentSession: {...})
            │
            ▼
 [ Pantalla Activa PWA: Cronómetro + Botón STOP ]
            │
            ▼ (Clic "STOP" o Liberación de Admin)
 [ Cierre de Sesión ]
   ├── Calcula duración total
   ├── Actualiza 'print_sessions' (status: COMPLETED)
   └── Libera 'printers/printer_01' (status: AVAILABLE, currentSession: null)
```

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
* Node.js v18.0.0 o superior
* Cuenta en Google Firebase (plan Spark gratuito)
* Firebase CLI instalado globalmente: `npm install -g firebase-tools`

### 1. Clonar el repositorio
```bash
git clone https://github.com/Vikktor93/BetaQR
cd BetaQR
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Firebase
1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/).
2. Habilita **Cloud Firestore** en modo de producción.
3. Habilita **Firebase Authentication** con el proveedor *Email/Password* (para administradores).
4. Copia las credenciales en tu archivo local `.env`.

### 4. Ejecutar en entorno local
```bash
npm run dev
```
La aplicación estará disponible en `http://localhost:5173`.

---

## ⚙️ Configuración de Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto tomando como base `.env.example`:

```env
VITE_FIREBASE_API_KEY="tu_api_key"
VITE_FIREBASE_AUTH_DOMAIN="tu_proyecto.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="tu_proyecto_id"
VITE_FIREBASE_STORAGE_BUCKET="tu_proyecto.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="tu_sender_id"
VITE_FIREBASE_APP_ID="tu_app_id"
VITE_LAB_NAME="Laboratorio de Prototipado 3D - ULagos"
```

---

## 🛡️ Reglas de Seguridad (firestore.rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Lectura pública de impresoras para alumnos, escritura controlada
    match /printers/{printerId} {
      allow read: if true;
      allow update: if request.resource.data.diff(resource.data).affectedKeys()
                      .hasAny(['status', 'currentSession', 'updatedAt']);
      allow create, delete: if request.auth != null;
    }
    
    // Sesiones de impresión
    match /print_sessions/{sessionId} {
      allow read: if true;
      allow create: if request.resource.data.studentName is string &&
                       request.resource.data.career is string;
      allow update: if true;
      allow delete: if request.auth != null;
    }
  }
}
```

---

## 🚢 Despliegue (Deploy)

### Despliegue a Firebase Hosting
```bash
# 1. Iniciar sesión en Firebase CLI
firebase login

# 2. Asociar el proyecto local con Firebase
firebase use --add

# 3. Compilar el proyecto para producción
npm run build

# 4. Desplegar reglas y frontend
firebase deploy
```

---

## 📊 Requerimientos del Sistema (Trazabilidad)

| Código | Tipo | Nombre | Estado |
|---|---|---|---|
| **RF01** | Funcional | Escaneo Único por Impresora (QR por máquina) | ❌ Pendiente |
| **RF02** | Funcional | Registro Mínimo de Usuario (Nombre + Desplegable Carrera) | ❌ Pendiente |
| **RF03** | Funcional | Captura Automática de Timestamp de Inicio | ❌ Pendiente |
| **RF04** | Funcional | Botón de Término "STOP" y Cronómetro en Vivo | ❌ Pendiente |
| **RF05** | Funcional | Cierre y Registro de Fin con Cálculo de Duración | ❌ Pendiente |
| **RF06** | Funcional | Dashboard Web de Estado en Vivo (Cards Verde/Rojo) | ❌ Pendiente |
| **RF07** | Funcional | Visualización de Uso en Tiempo Real (Datos + Tiempo HH:MM:SS) | ❌ Pendiente |
| **RF08** | Funcional | Histórico y Exportación Consolidada a Excel/CSV | ❌ Pendiente |
| **RF09** | Funcional | Finalización Forzada (Kill-Switch para Encargado) | ❌ Pendiente |
| **RNF01**| No Funcional | Usabilidad Móvil *Mobile-First* (< 2 segundos de carga) | ❌ Pendiente |
| **RNF02**| No Funcional | Mínimo Esfuerzo de Ingreso (< 10 segundos flujo total) | ❌ Pendiente |
| **RNF03**| No Funcional | Arquitectura Web Liviana y Serverless | ❌ Pendiente |
| **RNF04**| No Funcional | Actualización Dinámica sin recarga (Firestore Snapshots) | ❌ Pendiente |
| **RNF05**| No Funcional | Validación de Tokens de Seguridad en QR | ❌ Pendiente |
| **RNF06**| No Funcional | Integridad de Datos y Privacidad Institucional | ❌ Pendiente |

---

## 👥 Créditos

* **Docente Responsable:** Víctor Saldivia Vera (`victor.saldivia@ulagos.cl`)
* **Desarrollador Principal:** Víctor Saldivia Vera (`victor.saldivia@ulagos.cl`)
* **Co-Desarrollador:** Vicente Garin Pereda (`vicentemartin.garin@alumnos.ulagos.cl`)
* **Unidad Académica:** Departamento de Ciencias de la Ingeniería - Ingeniería Civil en Informática
* **Institución:** Universidad de Los Lagos, Sede Chiloé.