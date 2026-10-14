# FACENIA Facturación — Aplicación Web Privada

Aplicación web profesional para la gestión, emisión y liquidación de facturas comerciales de **FACENIA**. Desarrollada como un sistema independiente, seguro y preparado tanto para funcionamiento autónomo en local como para despliegue en la nube con Supabase.

---

## 1. Referencia Técnica: ParkingBingo

A partir del análisis del proyecto de referencia (`ParkingBingo` / `CuestionarioTrabajoPadre`):
- **Estructura y Stack aprovechados:** React 18/19, TypeScript estricto, Vite, Tailwind CSS con paleta corporativa y tipografía `Inter`/`Manrope`, `lucide-react` para iconografía técnica y `jspdf` para generación vectorial de documentos A4.
- **Mejoras implementadas respecto a la referencia:**
  - Separación rigurosa de datos y base de datos independiente (no comparte tablas ni credenciales con ParkingBingo).
  - Cálculo contable centralizado (`src/utils/taxCalculator.ts`) con redondeo bancario de 2 decimales para evitar desajustes entre líneas e impuestos totales.
  - Snapshots inmutables de emisor y cliente en cada factura: si un cliente cambia de domicilio o razón social en el futuro, las facturas ya emitidas conservan íntegramente los datos legales con los que fueron expedidas.
  - Flujo de rectificación formal (Facturas Rectificativas con Serie R) conforme al Real Decreto 1619/2012, impidiendo la alteración silenciosa de facturas emitidas.
  - Banner y marca de agua de **Modo Demostración** para evitar que datos ficticios provisionales puedan confundirse con facturas tributarias reales.
  - Generación de PDF A4 con vista previa interactiva, soporte multipágina, marcas de agua condicionales y descarga directa.

---

## 2. Puesta en Marcha en Local

### Requisitos previos
- Node.js (v18 o superior, verificado en v24.13.0).
- npm (v10 o superior, verificado en v11.6.2).

### Pasos de ejecución
```bash
# 1. Acceder al directorio del proyecto
cd "c:\Users\tacky\OneDrive\Escritorio\Proyectos\Factura"

# 2. Instalar dependencias
npm install

# 3. Arrancar servidor de desarrollo local
npm run dev
```

La aplicación estará disponible inmediatamente en `http://localhost:5173`.

### Compilación para Producción y Linter
```bash
# Comprobación de tipos y empaquetado de producción
npm run build

# Análisis de calidad y buenas prácticas (Oxlint)
npm run lint
```

---

## 3. Acceso y Autenticación Privada

Al abrir la aplicación, el acceso se encuentra protegido por una pantalla de inicio de sesión administrativo.

### Credenciales configuradas por defecto:
- **Usuario / Correo:** `administracion@facenia.tech` (o también `admin`)
- **Contraseña:** `Facenia2026!`
- **Persistencia de sesión:** Casilla *"Mantener sesión iniciada"* para guardar el token en `localStorage` o en `sessionStorage`.

---

## 4. Configuración de la Empresa (FACENIA)

La aplicación incluye de inicio **datos provisionales de demostración**:
- **Nombre comercial:** FACENIA
- **Razón social:** FACENIA DEMO
- **NIF/CIF:** `00000000T (DEMO — SUSTITUIR)`
- **Dirección:** Calle de ejemplo, 1, 29000 Málaga, España
- **Correo:** contacto@facenia.tech
- **Teléfono:** +34 951 00 00 00

> [!WARNING]
> Mientras la casilla **«Marcar como datos de demostración»** esté activada, la aplicación mostrará una alerta permanente en la cabecera y todas las facturas descargadas incluirán una marca de agua diagonal **"DATOS DEMO"**.

### Cómo pasar a datos reales definitivos:
1. Vaya a la sección **Configuración** en el menú lateral.
2. Ingrese el NIF/CIF definitivo de FACENIA, su razón social real, domicilio y datos bancarios (IBAN/BIC).
3. Opcionalmente, suba el archivo del logotipo oficial (PNG o JPG).
4. Desmarque la casilla de **Modo Demostración**.
5. Haga clic en **Guardar Configuración**. A partir de ese momento, los PDF se emitirán con validez comercial limpia sin marcas de prueba.

---

## 5. Integración con Base de Datos (Supabase)

La aplicación funciona de forma autónoma con persistencia local (`localStorage`) y exportación/importación de copias de seguridad en JSON.

Si desea sincronizar los datos con una base de datos PostgreSQL remota en **Supabase**:

### 1. Variables de entorno (`.env`)
Copie el archivo de ejemplo:
```bash
cp .env.example .env
```
Y configure sus credenciales obtenidas de su panel de Supabase:
```env
VITE_SUPABASE_URL=https://su-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=su-anon-key-publica
```

### 2. Ejecutar la migración SQL
Abra el **SQL Editor** en el panel de su proyecto de Supabase y ejecute el script completo ubicado en:
`supabase/migrations/001_initial_schema.sql`

Este script contiene:
- Tablas `empresa_config`, `clientes`, `facturas`, `factura_lineas`, `pagos_factura`.
- Restricciones de integridad referencial (`ON DELETE CASCADE`, `CHECK` de estados).
- Clave única compuesta `(user_id, serie, numero)` para evitar colisiones de numeración.
- Activación estricta de **Row Level Security (RLS)** con políticas granulares por operación (`SELECT`, `INSERT`, `UPDATE`, `DELETE`) vinculadas a `(SELECT auth.uid()) = user_id`.
- Índices de rendimiento en todas las claves foráneas y columnas de filtrado.

---

## 6. Normativa Española y Régimen de Facturación

Esta aplicación ha sido diseñada considerando los requisitos del **Real Decreto 1619/2012** (Reglamento de obligaciones de facturación en España):
- **Campos obligatorios:** Número, serie, fechas de expedición y operación, NIF del emisor y destinatario, domicilio fiscal de ambas partes, desglose de bases por tipo impositivo, cuotas repercutidas y tipo de retención IRPF.
- **Inmutabilidad y Facturas Rectificativas:** Las facturas emitidas no pueden eliminarse arbitrariamente. En caso de error o devolución, el sistema permite emitir una **Factura Rectificativa (Serie R)** que referencia al número original e invierte o compensa los importes.
- **Tipos impositivos españoles soportados:** 21% (general), 10% (reducido), 4% (superreducido) y 0% (exento).
- **Retención IRPF soportada:** 0% (sociedades), 15% (tipo general profesional), 7% (nuevos autónomos) y 19%.

> [!NOTE]
> **Aviso sobre VeriFactu y Facturación Electrónica:** La generación de facturas en PDF o formato local no constituye por sí sola la certificación de sistema verificable de emisión de facturas (VeriFactu / RD 1007/2023) ni la interconexión con las plataformas públicas de factura electrónica B2B (Ley Crea y Crece). Dicha adaptación requiere la integración de huellas encadenadas (hash SHA-256), código QR tributario y firma electrónica en el momento en que entre en vigor obligatorio para la tipología de la empresa.

---

## 7. Pruebas Realizadas y Verificación

1. **Compilación de Tipos:** `npm run build` ejecutado con éxito sin errores de TypeScript.
2. **Auditoría de Código:** `npm run lint` (`oxlint`) validado con 0 errores.
3. **Prueba en Navegador Real (Chrome DevTools MCP):**
   - Autenticación con credenciales administrativas (`administracion@facenia.tech` / `Facenia2026!`).
   - Cálculo del Dashboard sobre datos reales (Total facturado, pendiente y cobrado).
   - Creación de nueva factura con numeración automática consecutiva (`FAC-2026-0003`).
   - Generación de vista previa de PDF en A4 e iframe sin textos cortados ni solapamientos.
   - Registro y conciliación de pago bancario actualizando el estado a "Cobrada / Liquidada".
   - Navegación responsive validada en resolución de escritorio (1280x800) y móvil (375x667 con drawer lateral).
   - Inspección de consola de DevTools (0 excepciones de runtime) y de peticiones de red (todas HTTP 200).
