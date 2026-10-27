# Roadmap de Desarrollo - BetaQR

Hoja de ruta del proyecto BetaQR: qué está terminado, qué sigue y en qué orden. Se actualiza cada vez que se integra trabajo a `main`.

> **Versión actual:** 0.2.0-Beta  
> **Última actualización:** octubre 2026
   
**Leyenda:** ✅ Terminado · 🔄 En curso · ⬜ Pendiente

---

## 📌 Resumen de Fases

| Fase | Objetivo | Versión | Estado |
|---|---|---|---|
| 0 | Base del proyecto y flujo del estudiante | 0.1.0 | ✅ |
| 1 | Panel de administración en tiempo real | 0.2.0 | ✅ |
| 2 | Estabilización y seguridad | 0.3.0 | 🔄 |
| 3 | Historial, métricas y exportación (RF08) | 0.4.0 | ⬜ |
| 4 | PWA y gestión de códigos QR | 0.5.0 | ⬜ |
| 5 | Despliegue y piloto en el laboratorio | 0.9.0 | ⬜ |
| 6 | Validación de requerimientos no funcionales | 1.0.0 | ⬜ |

---

## ✅ Fase 0 - Base del Proyecto y Flujo del Estudiante (v0.1.0)

- [x] Proyecto React + Vite + Tailwind CSS
- [x] Configuración de Firebase mediante variables de entorno (`.env.example`)
- [x] Listado oficial de carreras (`src/config/careers.js`)
- [x] Enrutador de la aplicación y páginas base
- [x] Servicio de datos para Firestore (`printerService.js`)
- [x] Vista del estudiante: formulario, inicio de sesión de impresión y botón STOP
- [x] RF01 - QR por impresora · RF02 - Registro mínimo · RF03 - Timestamp de inicio · RF04 - STOP y cronómetro

## ✅ Fase 1 - Panel de Administración en Tiempo Real (v0.2.0)

- [x] RF05 - Cálculo y registro de la duración en `print_sessions`
- [x] Login de administrador con Firebase Auth y ruta `/admin` protegida
- [x] Hook `usePrinters` (listener en tiempo real) y hook `useLiveTimer`
- [x] RF06 / RF07 - Dashboard con tarjetas por estado y cronómetro en vivo
- [x] RF09 - Liberación forzada (Kill-Switch)
- [x] Edición y eliminación de impresoras con modales de confirmación

---

## 🔄 Fase 2 - Estabilización y Seguridad (v0.3.0)

**Objetivo:** dejar una base sólida antes de agregar funciones nuevas.

### Calidad de código
- [x] Corregir los errores de ESLint (`npm run lint`): quedan 6 de 8, principalmente `setState` dentro de `useEffect`
- [ ] Reemplazar el cronómetro duplicado de `StudentScanView` por el hook `useLiveTimer`
- [x] Unificar los valores de `status` en `src/config/status.js`
- [ ] Eliminar archivos de plantilla que no se usan (`App.css`, `react.svg`, `vite.svg`, `hero.png`)

### Integridad de datos
- [x] Usar `runTransaction` al iniciar una sesión, para que dos estudiantes no puedan tomar la misma impresora al mismo tiempo
- [x] Usar `runTransaction` al detener una sesión, para que no se cierre dos veces (STOP del estudiante y liberación forzada al mismo tiempo)
- [x] Usar la hora del servidor en ambos `startTime` (`print_sessions` y `currentSession`)
- [x] Validar en el formulario que el nombre no esté vacío ni tenga solo espacios

### Seguridad
- [ ] Agregar `firestore.rules` y `firebase.json` al repositorio (propuesta en el README)
- [ ] Restringir la lectura de `print_sessions` solo a administradores
- [ ] Probar las reglas con el emulador de Firebase antes de publicarlas

### Gestión de impresoras
- [x] Crear impresoras desde el panel (completar el CRUD)
- [x] Generar automáticamente el `securityToken` al crear una impresora

---

## ⬜ Fase 3 - Historial, Métricas y Exportación (v0.4.0)

Objetivo: cumplir RF08.

- [ ] Hook `useSessionHistory` para consultar `print_sessions`
- [ ] Tabla de historial de sesiones finalizadas
- [ ] Filtros por rango de fechas, carrera e impresora
- [ ] Índices compuestos en `firestore.indexes.json` para las consultas con filtros
- [ ] Exportación a Excel (.xlsx) con SheetJS y a CSV
- [ ] Tarjetas de métricas: horas totales, sesiones por día y uso por carrera e impresora
- [ ] Paginación del historial para no descargar todas las sesiones de una vez

---

## ⬜ Fase 4 - PWA y Gestión de Códigos QR (v0.5.0)

- [ ] `manifest.json` con nombre, colores e íconos de 192 y 512 px
- [ ] Service worker con `vite-plugin-pwa` (instalación y caché de la app)
- [ ] Generador de QR por impresora desde el panel (URL con `printerId` y `token`)
- [ ] Vista imprimible de los QR para pegarlos en cada máquina
- [ ] Regenerar el token de una impresora para invalidar un QR antiguo

---

## ⬜ Fase 5 - Despliegue y Piloto en el Laboratorio (v0.9.0)

- [ ] Despliegue en Firebase Hosting con HTTPS
- [ ] GitHub Actions: lint y build en cada Pull Request; despliegue automático al integrar en `main`
- [ ] Separar proyectos de Firebase de desarrollo y producción
- [ ] Pegar los QR en las impresoras reales del laboratorio
- [ ] Piloto de dos semanas con estudiantes reales y registro de incidencias
- [ ] Ajustes según la retroalimentación del piloto

---

## ⬜ Fase 6 - Validación de Requerimientos No Funcionales (v1.0.0)

| Código | Validación propuesta |
|---|---|
| RNF01 | Carga menor a 2 s en red móvil, medida con Lighthouse. Dividir el bundle (hoy pesa ~800 kB) con `import()` dinámico |
| RNF02 | Cronometrar el flujo QR → inicio de impresión con varios estudiantes (meta: menos de 10 s) |
| RNF03 | Confirmar que todo funciona con el plan gratuito de Firebase |
| RNF04 | Probar la actualización simultánea en dos o más dispositivos |
| RNF05 | Verificar que un QR sin token o con token incorrecto no permite iniciar sesión, también desde la consola del navegador |
| RNF06 | Aviso de privacidad para el estudiante y política de retención de datos del historial |

---

## 🔁 Cómo actualizar este roadmap

1. Al terminar una tarea, marcar su casilla con `[x]` en el mismo Pull Request o commit que la implementa.
2. Al completar una fase, cambiar su estado en la tabla de resumen y actualizar la versión en el README.
3. Las tareas nuevas se agregan en la fase que corresponda, nunca en una fase ya cerrada.
