# Sistema de Gestión de Activos Institucionales — Misiones

Manual de Usuario Final

---

## Descripción General

El sistema permite gestionar el inventario tecnológico institucional organizado en tres niveles:

- **Unidades** → instituciones o reparticiones (ej: Hospital Central, Escuela N°5)
- **Equipos** → dispositivos o conjuntos de hardware asociados a una unidad (ej: PC de escritorio)
- **Componentes** → partes individuales asociadas a un equipo (ej: Monitor, Teclado, Disco Rígido)

---

## 1. Acceso al Sistema

1. Ingresar la URL del sistema en el navegador.
2. En la pantalla de **inicio de sesión**, completar:
   - **Usuario**
   - **Contraseña**
3. Hacer clic en **Iniciar Sesión**.

> La sesión se mantiene activa mediante un token de seguridad. Si el token expira, el sistema redirigirá automáticamente al login.

---

## 2. Panel Principal (Dashboard)

Una vez autenticado, se accede al **Dashboard** con un menú lateral izquierdo que permite navegar entre cuatro vistas:

| Icono | Vista | Descripción |
|-------|-------|-------------|
| 📊 | **Ver Informe** | Buscar una unidad y consultar su inventario completo |
| 🔌 | **Componentes** | Listado, búsqueda y gestión de componentes |
| 💻 | **Equipos** | Listado, búsqueda y gestión de equipos |
| 🏢 | **Unidades** | Listado, búsqueda y gestión de unidades institucionales |

En la esquina superior derecha se muestra el **nombre del usuario** activo. Haciendo clic sobre él se accede al perfil.

---

## 3. Vista: Informe por Unidad

### 3.1 Buscar una Unidad

1. En la vista **Ver Informe**, escribir el nombre o código de la unidad en el buscador.
2. El sistema filtra los resultados en tiempo real mientras se tipea.
3. Hacer clic en la unidad deseada de la lista desplegable.

### 3.2 Ver el Detalle del Inventario

Una vez seleccionada la unidad, se muestra una tarjeta con la información de la unidad y tres botones de acción:

- **🧹 Limpiar** — Borra la selección actual para realizar una nueva búsqueda.
- **👁️ Ver Datos Completos** — Abre una tabla expandida con todos los campos de cada componente.
- **📄 Descargar Informe PDF** — Genera y descarga un informe en formato PDF con toda la información de la unidad.

Debajo de la tarjeta de selección se muestra el **Detalle de Activos**, que lista todos los equipos de la unidad y sus componentes asociados en una tabla anidada.

### 3.3 Filtrar dentro del Informe

Dentro del detalle, hay un campo de búsqueda para filtrar por:
- Nombre de equipo
- Nombre de componente
- Número de serie

### 3.4 Editar o Eliminar desde el Informe

Cada fila de componente en el detalle del informe tiene dos botones de acción:
- **✏️ Editar** — Abre el formulario de edición del componente.
- **🗑️ Eliminar** — Solicita confirmación y elimina el componente.

---

## 4. Vista: Datos Completos de una Unidad

Accesible desde el botón **👁️ Ver Datos Completos** del informe, muestra una tabla detallada con todos los campos de cada componente de la unidad:

- Código, Equipo, Denominación, Nro. Serie/Lote, Cantidad, Ubicación, Estado Técnico, Nro. Alta, Clasificación, Lugar, Observación.

### Exportar a Excel

El botón **📈 Exportar Excel** descarga todos los datos de la tabla en un archivo `.xlsx` con el nombre de la unidad.

---

## 5. Vista: Componentes

### 5.1 Ver y Buscar

- Hacer clic en **👁️ Ver todos** para cargar el listado completo de componentes.
- Escribir en el campo de búsqueda y pulsar **Enter** o el ícono 🔍 para filtrar por nombre o número de serie.

### 5.2 Crear un Nuevo Componente

1. Hacer clic en **➕ Nuevo Componente**.
2. Completar el formulario:

| Campo | Descripción |
|-------|-------------|
| **Nombre del Componente** | Nombre con autocompletado: sugiere nombres ya existentes mientras se tipea |
| **Número de Serie** | Número de serie o lote (S/N) |
| **Unidad Asociada** | Desplegable con todas las unidades registradas |
| **Equipo Asociado** | Desplegable con todos los equipos registrados |
| **Estado Técnico** | Seleccionar: Funcional/Bueno · Regular · Falla/Malo · En Reparación · En Depósito |
| **Ubicación** | Descripción del lugar físico (ej: Piso 1, Oficina 2) |
| **Nro Alta** | Número de alta patrimonial |
| **Clasificación** | Categoría del componente |
| **Observación Detallada** | Notas adicionales de libre texto |

3. Hacer clic en **✅ Crear Registro** y confirmar.

### 5.3 Editar un Componente

1. En el listado, hacer clic en **✏️** en la fila del componente deseado.
2. Modificar los campos necesarios (mismos campos que en la creación).
3. Hacer clic en **✅ Confirmar Cambios** y confirmar.

### 5.4 Eliminar un Componente

1. En el listado, hacer clic en **🗑️** en la fila del componente deseado.
2. Confirmar la eliminación en el diálogo.

---

## 6. Vista: Equipos

### 6.1 Ver y Buscar

- Hacer clic en **👁️ Ver todos** para cargar el listado.
- Usar el campo de búsqueda para filtrar por nombre de equipo.

### 6.2 Crear un Nuevo Equipo

1. Hacer clic en **➕ Nuevo Equipo**.
2. Ingresar el **Nombre del Equipo**. El campo tiene autocompletado con sugerencias de equipos ya registrados.
3. Hacer clic en **✅ Crear Registro** y confirmar.

### 6.3 Editar / Eliminar un Equipo

Igual que en componentes: usar **✏️** para editar o **🗑️** para eliminar desde el listado.

---

## 7. Vista: Unidades

### 7.1 Ver y Buscar

- Hacer clic en **👁️ Ver todos** para cargar el listado.
- Filtrar por nombre institucional o código de unidad.

### 7.2 Crear una Nueva Unidad

1. Hacer clic en **➕ Nueva Unidad**.
2. Completar el formulario:

| Campo | Descripción |
|-------|-------------|
| **UNIDAD** | Código corto de referencia (ej: HOSP01, EDU-05) |
| **NOMBRE** | Nombre institucional completo |
| **ÁMBITO** | Área institucional. Filtra sugerencias de ámbitos existentes mientras se tipea. Si el ámbito no existe, se puede ingresar uno nuevo libremente. |

3. Hacer clic en **✅ Crear Registro** y confirmar.

> El código interno (`codigo_unidad`) se genera automáticamente por el sistema. No es necesario ingresarlo.

### 7.3 Editar / Eliminar una Unidad

Igual que en las demás vistas: **✏️** para editar y **🗑️** para eliminar.

---

## 8. Perfil de Usuario

Accesible haciendo clic en el **nombre del usuario** en la cabecera del Dashboard. Contiene tres pestañas:

### Pestaña: Editar Mi Perfil

- Cambiar el **correo electrónico** asociado a la cuenta.
- Cambiar la **contraseña**: ingresar la nueva contraseña y confirmarla. Si los campos no coinciden, el sistema lo informará.

### Pestaña: Registrar Usuario

Permite al usuario con acceso crear nuevas cuentas en el sistema:
- Ingresar **Nombre de usuario** y **Correo**.
- El nuevo usuario se crea con una **contraseña por defecto** (`Abc123456`) que deberá cambiar al ingresar.

### Pestaña: Gestión de Usuarios

Lista todos los usuarios registrados en el sistema. Desde aquí se puede:
- **Resetear la contraseña** de cualquier usuario (vuelve a la contraseña por defecto).

---

## 9. Cerrar Sesión

En la parte inferior del menú lateral, hacer clic en **⬅ Cerrar Sesión**. El sistema eliminará la sesión activa y redirigirá al login.

---

## 10. Historial de Acciones

Todas las operaciones de creación, edición y eliminación quedan registradas automáticamente en el historial del sistema. Esto incluye:
- El tipo de acción (Crear / Editar / Eliminar)
- La entidad afectada (componente, equipo o unidad)
- El usuario que realizó la acción
- La fecha y hora

---

## Notas Generales

- Todas las acciones destructivas (editar, eliminar) requieren **confirmación explícita** antes de ejecutarse.
- El sistema evita errores tipográficos mediante **sugerencias de autocompletado** en los campos de nombre de equipo, nombre de componente y ámbito de unidad.
- Las **unidades y equipos asociados** a un componente se seleccionan desde desplegables precargados, evitando inconsistencias de datos.
