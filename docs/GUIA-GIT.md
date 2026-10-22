# Guía de Trabajo con Git - BetaQR

Este documento es una guía práctica para trabajar en equipo en BetaQR. Explica cómo se organiza el repositorio, cómo hacer buenos commits y cómo revisar e integrar el trabajo en `main`.

> **Para el estudiante:** secciones 1 a 5.  
> **Para el docente:** secciones 6 y 7.  
> **Para ambos:** secciones 8 y 9.

---

## 📋 Contenido
1. [Organización del repositorio](#1-organización-del-repositorio)
2. [Configuración inicial](#2-configuración-inicial)
3. [Flujo de trabajo diario](#3-flujo-de-trabajo-diario)
4. [Commits atómicos](#4-commits-atómicos)
5. [Mensajes de commit](#5-mensajes-de-commit)
6. [Revisar el trabajo commit por commit](#6-revisar-el-trabajo-commit-por-commit)
7. [Integrar a main (merge)](#7-integrar-a-main-merge)
8. [Problemas frecuentes y cómo resolverlos](#8-problemas-frecuentes-y-cómo-resolverlos)
9. [Resumen de comandos](#9-resumen-de-comandos)

---

## 1. Organización del repositorio

| Rama | Propósito | Quién escribe |
|---|---|---|
| `main` | Versión estable. **Siempre debe compilar y funcionar.** | El docente, al integrar |
| `VicenteGarin` | Rama de trabajo del estudiante | El estudiante |

Reglas básicas:

- Nadie programa directamente en `main`.
- Todo cambio llega a `main` después de ser revisado y probado.
- Antes de empezar a trabajar, la rama personal se actualiza con lo último de `main`.

---

## 2. Configuración inicial

Se hace una sola vez por computador.

```bash
# Identidad (aparece en cada commit)
git config --global user.name "Nombre Apellido"
git config --global user.email "correo@ulagos.cl"

# Clonar el proyecto
git clone https://github.com/Vikktor93/BetaQR
cd BetaQR
npm install
```

**Ubicación del proyecto:** guárdalo **fuera de OneDrive, Dropbox o Google Drive**. Estos servicios bloquean archivos mientras sincronizan y provocan errores al cambiar de rama. El respaldo ya lo hace GitHub.

**Misma versión de Node:** todos deben usar la misma versión de Node y npm para evitar cambios innecesarios en `package-lock.json`. Verifícala con:

```bash
node -v
npm -v
```

---

## 3. Flujo de trabajo diario

### 3.1 Antes de empezar: traer lo último de main

```bash
git checkout VicenteGarin
git fetch origin
git merge origin/main
```

Así tu rama incluye todo lo que ya se integró, por ejemplo cambios en el README o correcciones del docente. Si aparecen conflictos, revisa la [sección 8](#conflictos-al-hacer-merge).

### 3.2 Mientras trabajas

Repite este ciclo por cada cambio pequeño y completo:

```bash
# 1 Ver qué archivos cambiaron
git status

# 2 Ver el detalle de los cambios
git diff

# 3 Agregar solo los archivos de este cambio
git add src/services/printerService.js

# 4 Revisar lo que va a entrar al commit
git diff --staged

# 5 Comprobar que el proyecto sigue funcionando
npm run lint
npm run build

# 6 Crear el commit
git commit -m "feat(sesiones): guardar duración de la impresión en print_sessions"
```

> Evita `git add .` cuando hay varios cambios mezclados. Agrega archivo por archivo, o usa `git add -p` para elegir partes de un archivo.

### 3.3 Al terminar la jornada: subir los commits

```bash
git push origin VicenteGarin
```

Luego avisa al docente qué commits están listos para revisar, o abre un Pull Request en GitHub (ver sección 7).

---

## 4. Commits atómicos

Un **commit atómico** contiene **un solo cambio lógico, completo y funcional**.

### Las tres reglas

1. **Un solo propósito:** el commit hace una cosa. Si para describirlo necesitas la palabra "y", probablemente son dos commits.
2. **Completo:** el proyecto compila y funciona después del commit. Nunca dejes un commit "a medias".
3. **Pequeño:** debe poder revisarse en pocos minutos.

### Por qué importa

- Permite **probar cada avance por separado**, como hicimos al integrar RF05, la autenticación y el CRUD.
- Si algo falla, se puede **revertir un solo commit** sin perder el resto del trabajo.
- El historial explica **cómo y por qué** evolucionó el proyecto.

### Ejemplos

❌ **Commit no atómico:**
```
"avances varios"
  → agrega login de admin
  → cambia colores del dashboard
  → corrige bug del cronómetro
  → actualiza package-lock.json
```

✅ **Mismo trabajo en commits atómicos:**
```
feat(auth): agregar login de administrador con Firebase Auth
style(dashboard): ajustar colores de las tarjetas de impresora
fix(cronometro): corregir cálculo cuando startTime es Timestamp
chore: actualizar package-lock.json
```

### Cómo separar cambios que ya están mezclados

Si ya modificaste varias cosas, usa `git add -p`. Git te muestra cada bloque de cambios y preguntas:

| Tecla | Acción |
|---|---|
| `y` | Agregar este bloque al commit |
| `n` | Dejarlo para otro commit |
| `s` | Dividir el bloque en partes más pequeñas |
| `q` | Salir |

---

## 5. Mensajes de commit

Formato: **`tipo(alcance): descripción`**

- **tipo:** qué clase de cambio es (tabla abajo).
- **alcance** (opcional): parte del sistema afectada, por ejemplo `auth`, `dashboard`, `estudiante`, `sesiones`.
- **descripción:** en español, en infinitivo, en minúscula y sin punto final. Máximo unos 70 caracteres.

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de un error |
| `refactor` | Mejora del código sin cambiar su comportamiento |
| `style` | Cambios visuales o de formato |
| `docs` | Documentación (README, docs/) |
| `test` | Pruebas |
| `chore` | Mantenimiento: dependencias, configuración, package-lock |

Si el commit cumple un requerimiento, menciónalo:

```
feat(sesiones): calcular y guardar duración de la impresión (RF05)
feat(admin): agregar liberación forzada de impresoras (RF09)
fix(estudiante): impedir iniciar sesión con nombre vacío
docs: agregar roadmap de desarrollo
```

Para explicar más detalles, agrega un cuerpo al mensaje:

```bash
git commit -m "fix(sesiones): usar hora del servidor en currentSession" -m "Antes se usaba la hora del dispositivo del estudiante, lo que generaba diferencias en la duración calculada."
```

---

## 6. Revisar el trabajo commit por commit

Esta sección esta pensada para el docente, aunque el estudiante también puede usarla para revisar su propio trabajo antes de pedir la integración.

### 6.1 Ver qué commits nuevos trae la rama

```bash
git fetch origin

# Commits que están en la rama del estudiante y no en main
git log --oneline main..origin/VicenteGarin
```

### 6.2 Ver qué cambió en cada commit

```bash
# Archivos modificados en un commit
git show --stat <hash>

# Cambios completos de un commit
git show <hash>

# Comparar toda la rama contra main
git diff main..origin/VicenteGarin --stat
```

`<hash>` son los primeros 7 caracteres del commit, por ejemplo `e140278`.

### 6.3 Probar un commit específico

```bash
# Moverse temporalmente a ese commit
git switch --detach <hash>

npm install
npm run lint
npm run build
npm run dev        # probar la funcionalidad en el navegador

# Volver a main al terminar
git switch main
```

### 6.4 Lista de chequeo por commit

- [ ] El mensaje describe bien el cambio y sigue el formato de la sección 5
- [ ] El commit hace una sola cosa (es atómico)
- [ ] `npm run build` termina sin errores
- [ ] `npm run lint` no agrega errores nuevos
- [ ] La funcionalidad se probó en el navegador, también en vista móvil
- [ ] Si cambia datos en Firestore, se revisó si requiere campos, colecciones o reglas nuevas
- [ ] No incluye archivos que no corresponden (`.env`, `node_modules/`, archivos personales)
- [ ] Si completa una tarea, actualiza `docs/ROADMAP.md`

---

## 7. Integrar a main (merge)

Hay dos caminos. El resultado es el mismo, elige según el caso.

### Opción A: Pull Request en GitHub (recomendada)

1. El estudiante sube su rama: `git push origin VicenteGarin`.
2. En GitHub: **Pull requests → New pull request**, base `main` y compare `VicenteGarin`.
3. El docente revisa los cambios en la pestaña **Files changed** y deja comentarios por línea.
4. Si hay correcciones, el estudiante hace nuevos commits en su rama y el PR se actualiza solo.
5. Cuando todo está bien, el docente presiona **Merge pull request**.
6. Ambos actualizan su copia local: `git checkout main` y `git pull origin main`.

**Ventaja:** queda registro de la revisión y la retroalimentación al estudiante.

### Opción B: integración local commit por commit

Útil cuando hay varios commits y se quiere probar cada uno antes de avanzar.

```bash
# 1 Partir desde main actualizado
git checkout main
git pull origin main
git fetch origin

# 2 Crear una rama de prueba
git checkout -b integracion-vicente

# 3 Avanzar de a un commit, probando cada uno
git merge --ff-only <hash-commit-1>
npm install
npm run dev        # probar

git merge --ff-only <hash-commit-2>
npm run dev        # probar
# ... repetir con cada commit

# 4 Si todo funciona, mover main al último commit probado
git restore package-lock.json      # descartar cambios locales de npm, si los hay
git checkout main
git merge --ff-only integracion-vicente
git push origin main

# 5 Borrar la rama de prueba
git branch -d integracion-vicente
```

**¿Qué es `--ff-only`?** *Fast-forward* significa que `main` simplemente avanza hasta los commits nuevos, sin crear un commit de merge. Solo es posible cuando `main` no tiene commits propios desde que se creó la rama del estudiante. Si Git responde *"Not possible to fast-forward"*, significa que ambas ramas avanzaron por separado. En ese caso usa `git merge <rama>` sin la opción y resuelve los conflictos si aparecen (sección 8).

### Después de integrar

El estudiante debe traer `main` a su rama antes de seguir trabajando:

```bash
git checkout VicenteGarin
git fetch origin
git merge origin/main
```

---

## 8. Problemas frecuentes y cómo resolverlos

### "Your local changes would be overwritten by checkout"

Tienes cambios sin commitear que se perderían al cambiar de rama.

```bash
git status                          # ver qué archivo es

# Si el cambio no sirve (por ejemplo, package-lock.json modificado por npm):
git restore <archivo>

# Si el cambio sí sirve, pero aún no quieres commitearlo:
git stash                           # guardarlo temporalmente
git checkout <otra-rama>
git stash pop                       # recuperarlo cuando vuelvas
```

### package-lock.json aparece modificado después de npm install

Ocurre cuando cada persona usa una versión distinta de npm. Opciones:

- Descartarlo: `git restore package-lock.json`.
- Guardarlo en un commit propio: `chore: actualizar package-lock.json`. Nunca lo mezcles con cambios de código.
- Solución de fondo: que todos usen la misma versión de Node y npm.

### "Deletion of directory ... failed. Should I try again?" (Windows)

Windows no deja borrar una carpeta porque algo la tiene abierta. Causas comunes:

1. `npm run dev` sigue corriendo en otra terminal: detenlo con `Ctrl + C`.
2. El proyecto está dentro de OneDrive: pausa la sincronización o, mejor, mueve el proyecto fuera de OneDrive.
3. VS Code o sus extensiones vigilan la carpeta: cierra VS Code y ejecuta el comando desde una terminal aparte.

Si el checkout ya quedó a medias, responde `n` y deja la rama igual al commit deseado:

```bash
git status                          # confirmar en qué rama quedaste
git reset --hard <rama-o-hash>      # ⚠️ descarta cambios sin commitear
```

### Conflictos al hacer merge

Aparecen cuando dos personas modificaron las mismas líneas de un archivo.

1. `git status` muestra los archivos en conflicto (*both modified*).
2. Abre cada archivo y busca las marcas:
   ```
   <<<<<<< HEAD
   código de tu rama
   =======
   código de la otra rama
   >>>>>>> origin/main
   ```
3. Deja la versión correcta (o una combinación de ambas) y borra las marcas. VS Code ofrece botones para elegir: *Accept Current*, *Accept Incoming* o *Accept Both*.
4. Prueba que todo compile con `npm run build`.
5. Termina el merge:
   ```bash
   git add <archivo>
   git commit
   ```

Para cancelar el merge y volver al estado anterior: `git merge --abort`.

### Deshacer cambios

| Situación | Comando |
|---|---|
| Descartar cambios de un archivo sin commitear | `git restore <archivo>` |
| Sacar un archivo del área de preparación (después de `git add`) | `git restore --staged <archivo>` |
| Corregir el mensaje del último commit (aún no subido) | `git commit --amend -m "nuevo mensaje"` |
| Deshacer el último commit, conservando los cambios | `git reset --soft HEAD~1` |
| Deshacer un commit **ya subido** a GitHub | `git revert <hash>` |

> ⚠️ Nunca uses `git reset` ni `git push --force` sobre commits que ya están en GitHub y que otra persona pudo descargar. Para esos casos usa `git revert`, que crea un commit nuevo que deshace el anterior sin reescribir el historial.

---

## 9. Resumen de comandos

| Acción | Comando |
|---|---|
| Ver estado | `git status` |
| Ver historial resumido | `git log --oneline --graph -15` |
| Traer cambios de GitHub sin aplicarlos | `git fetch origin` |
| Actualizar mi rama con main | `git merge origin/main` |
| Cambiar de rama | `git checkout <rama>` |
| Ver cambios no preparados | `git diff` |
| Ver cambios preparados | `git diff --staged` |
| Preparar un archivo | `git add <archivo>` |
| Preparar por partes | `git add -p` |
| Crear un commit | `git commit -m "tipo(alcance): descripción"` |
| Subir mi rama | `git push origin <rama>` |
| Commits de una rama que no están en main | `git log --oneline main..origin/<rama>` |
| Ver un commit | `git show <hash>` |
| Probar un commit | `git switch --detach <hash>` |
| Integrar sin commit de merge | `git merge --ff-only <rama-o-hash>` |
| Guardar cambios temporalmente | `git stash` / `git stash pop` |
