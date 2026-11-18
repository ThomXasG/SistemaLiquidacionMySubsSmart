# Sistema de Gestión de Terminación Laboral, Paz y Salvo y Liquidaciones (Ecuador)

Plataforma web empresarial para administrar de forma centralizada e integral el proceso de salida de trabajadores en Ecuador, control departamental de paz y salvo, custodia de evidencias documentales, cálculo automatizado de liquidaciones conforme al Código del Trabajo ecuatoriano y generación automática de documentos PDF certificados.

---

## 1. Características Principales

1. **Gestión de Empresas y Trabajadores (CRUD)**:
   - Registro de datos del empleador (Razón social, RUC, representante legal, dirección matriz, teléfonos, correo y región laboral).
   - Registro de trabajadores con validación de cédula ecuatoriana (algoritmo módulo 10) y salario mínimo legal (SBU vigente de $460.00).

2. **Gestión de Terminación Laboral (Art. 169 C.T.)**:
   - Apertura de expedientes según las causales de ley:
     - Desahucio solicitado por el trabajador o empleador (Art. 185).
     - Acuerdo entre las partes (Art. 169 num. 1).
     - Despido intempestivo (Art. 188 y 185).
     - Conclusión de obra o servicio (Art. 169 num. 2).
     - Muerte o incapacidad (Art. 169 num. 4).
     - Visto bueno concedido al empleador o trabajador (Arts. 172 y 173).
     - Caso fortuito o fuerza mayor (Art. 169 num. 5).
   - Generación automática de listas de verificación departamentales al crear el expediente.

3. **Control Departamental de Paz y Salvo**:
   - Módulo interactivo con control de permisos por roles (RRHH, Sistemas / TI, Contabilidad / Finanzas, Administración).
   - Estados de verificación: `Pendiente`, `Aprobado`, `Rechazado`, `No aplica`.
   - Registro de observaciones, responsable y fecha de revisión.
   - Posibilidad de agregar requisitos personalizados por departamento.

4. **Regla de Calidad y Bloqueo Estricto de Paz y Salvo**:
   - **El Certificado de Paz y Salvo solo se puede emitir cuando el 100% de los requisitos obligatorios estén Aprobados o marcados como No aplica.**
   - Si existen requisitos pendientes o rechazados, el sistema bloquea la emisión con alerta detallada de los ítems pendientes.

5. **Gestión de Archivos y Evidencias Documentales**:
   - Carga de archivos en formatos PDF, PNG, JPG y JPEG de hasta 10 MB.
   - Almacenamiento persistente en servidor y vinculación por expediente, departamento y requisito.
   - Visor integrado de documentos dentro de la aplicación y descarga directa.

6. **Control de Vacaciones No Gozadas (Arts. 69 y 71 C.T.)**:
   - Días acumulados por antigüedad (15 días base + 1 día adicional por cada año posterior al 5to año).
   - Registro de días gozados y cálculo proporcional de días y valor económico pendiente.

7. **Cálculo Transparente de Liquidación Laboral Ecuatoriana**:
   - **Haberes**:
     - Sueldo de días laborados en el mes de salida (Art. 82).
     - Vacaciones no gozadas (Arts. 69 y 71).
     - Décimo tercer sueldo proporcional (Art. 111 - ciclo 1 de diciembre a 30 de noviembre).
     - Décimo cuarto sueldo proporcional (Art. 113 - ciclo Sierra/Amazonía 1 Ago a 31 Jul vs. Costa/Insular 1 Mar a 28/29 Feb).
     - Fondos de reserva pendientes (Art. 196 - 8.33%).
     - Bonificación por desahucio (Art. 185 - 25% de la última remuneración por cada año de servicio cumplido).
     - Indemnización por despido intempestivo (Art. 188 - justificado cuando corresponda).
   - **Deducciones**:
     - Anticipos pendientes de sueldo.
     - Préstamos internos autorizados.
   - Desglose matemático paso a paso con base legal citada.

8. **Generación Automática de Documentos PDF (ReportLab)**:
   - **Certificado Oficial de Paz y Salvo Departamental**: Cabecera corporativa, datos del trabajador, relación de requisitos aprobados por cada departamento, cláusula de descargo y firmas (Trabajador, RRHH y Representante Legal).
   - **Acta de Liquidación Laboral**: Tablas desglosadas de haberes y deducciones, bases legales, aclaración sobre formalización en el Ministerio del Trabajo (SUT) y bloques de firma.

9. **Trazabilidad y Auditoría**:
   - Bitácora inmutable de eventos: inicio de expediente, cambios de estado en requisitos, carga de evidencias, cálculos y emisiones de documentos.

---

## 2. Caso de Demostración Precargado

El sistema incluye automáticamente en la base de datos el caso de prueba para demostración:

* **Empresa**: `MySubs Smart` (RUC: `1899999999001`, Ambato, Región Sierra, Empresa de Desarrollo de Software).
* **Representante Legal**: Carlos Mendoza.
* **Trabajador**: Andrés Sebastián Torres (Cédula: `1800000001`).
* **Cargo**: Analista de Sistemas | **Departamento**: Tecnología.
* **Fecha de Ingreso**: 01/03/2023 | **Fecha de Salida**: 31/10/2026.
* **Tiempo de Servicio**: 3 años completos (más 8 meses).
* **Remuneración Mensual**: $800.00 USD.
* **Causa**: Desahucio solicitado por el trabajador (Art. 185 Código del Trabajo).
* **Liquidación Calculada**:
  * Vacaciones no gozadas (10 días): **$266.67**
  * Décimo tercer sueldo (11 meses de Dic 2025 a Oct 2026): **$733.33**
  * Décimo cuarto sueldo (Sierra, 3 meses de Ago a Oct 2026, SBU $460): **$115.00**
  * Fondos de reserva: **$0.00** (al día)
  * Bonificación por desahucio (3 años × 25% de $800 = 3 × $200): **$600.00**
  * Indemnización despido intempestivo (Art. 188): **$0.00** (No aplica por ser desahucio voluntario)
  * **Total Haberes**: **$1,715.00 USD**
  * **Deducciones (Anticipo de sueldo)**: **-$100.00 USD**
  * **Neto a Recibir**: **$1,615.00 USD**
* **Evidencias Ficticias Adjuntas**:
  * Actas de entrega de laptop de desarrollo y accesorios TI.
  * Bitácora de cierre de cuentas, accesos VPN y repositorios.
  * Entrega de credencial física a RRHH.
  * Comprobante contable del anticipo de $100.00.
  * Entrega de tarjetas de acceso magnéticas y llaves a Administración.
* **Documentos PDF Generados**:
  * `backend/uploads/certificado_paz_y_salvo_exp_1.pdf`
  * `backend/uploads/liquidacion_laboral_exp_1.pdf`

---

## 3. Arquitectura del Proyecto

```
├── backend/
│   ├── main.py              # Aplicación FastAPI, endpoints REST y servidor SPA
│   ├── database.py          # Configuración SQLAlchemy y base SQLite (paz_y_salvo.db)
│   ├── models.py            # Entidades ORM: Company, Employee, TerminationProcess, etc.
│   ├── schemas.py           # Esquemas Pydantic v2 y validaciones de cédula/RUC
│   ├── calculators.py       # Motor de cálculo laboral según el Código del Trabajo
│   ├── pdf_generator.py     # Generador de PDFs con ReportLab (Paz y Salvo y Liquidación)
│   ├── seed_data.py         # Precarga del caso hipotético y evidencias demostrativas
│   └── uploads/             # Almacenamiento persistente de evidencias y PDFs generados
├── frontend/
│   ├── src/
│   │   ├── api.js           # Cliente API REST
│   │   ├── App.jsx          # Enrutamiento React Router
│   │   ├── context/         # RoleContext (Selector de roles de aprobación)
│   │   ├── components/      # Sidebar, Navbar, Modal, PdfViewerModal
│   │   └── pages/           # Dashboard, ProcessDetail, ProcessesList, NewProcess,
│   │                        # EmployeesList, CompanySettings, LegalGuide
│   ├── package.json         # React 18, Vite, Tailwind CSS, Lucide React
│   └── dist/                # Bundle compilado de producción
├── test_system.py           # Suite automatizada de pruebas funcionales y matemáticas
└── README.md                # Documentación del sistema
```

---

## 4. Instrucciones de Instalación y Ejecución

### Prerrequisitos
* Python 3.10 o superior.
* Node.js v18+ y npm (para desarrollo frontend).

### Paso 1: Configurar el Entorno Backend

En la raíz del proyecto:
```bash
# Crear y activar entorno virtual (si no está creado)
python -m venv .venv
.\.venv\Scripts\activate   # En Windows

# Instalar dependencias
pip install -r requirements.txt
```

### Paso 2: Precarga de la Base de Datos

Ejecute el script de inicialización para crear las tablas y sembrar el caso demostrativo con sus documentos y evidencias:
```bash
python backend/seed_data.py
```

### Paso 3: Ejecutar la Aplicación

#### Opción A: Servidor Unificado (Recomendada)
FastAPI sirve automáticamente la API REST y el frontend compilado en un solo puerto:
```bash
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
```
Abra su navegador en: **`http://localhost:8000`**

#### Opción B: Modo Desarrollo Frontend (Vite HMR)
Para realizar modificaciones en vivo al código de React:
1. En una terminal, inicie el backend:
   ```bash
   python -m uvicorn backend.main:app --port 8000
   ```
2. En otra terminal, inicie Vite:
   ```bash
   cd frontend
   npm run dev
   ```
   Abra su navegador en: **`http://localhost:5173`**

---

## 5. Ejecución de Pruebas Automatizadas

El proyecto incluye una suite completa de pruebas unitarias y de integración que verifica:
1. Validación algorítmica de cédula y RUC.
2. Fórmulas de cálculo de liquidación según la normativa ecuatoriana.
3. Endpoints del API REST.
4. Regla de negocio que bloquea la emisión de certificados incompletos.
5. Existencia e integridad de los archivos PDF generados.

Para ejecutar las pruebas:
```bash
python test_system.py
```
Resultado esperado: **`TODAS LAS PRUEBAS AUTOMATIZADAS PASARON EXITOSAMENTE (100% OK)`**.

---

## 6. Base Legal de Referencia (Código del Trabajo de Ecuador)

* **Art. 169**: Causas de terminación del contrato de trabajo.
* **Art. 185**: Bonificación por desahucio (25% de la última remuneración mensual por cada año de servicio cumplido).
* **Art. 188**: Indemnización por despido intempestivo (hasta 3 años: 3 meses; más de 3 años: 1 mes por año o fracción).
* **Art. 111**: Décima tercera remuneración o bono navideño (cálculo sobre el período 1 de diciembre al 30 de noviembre).
* **Art. 113**: Décima cuarta remuneración o bono escolar (1 SBU proporcional al ciclo escolar de la región Sierra o Costa).
* **Art. 69 y 71**: Derecho a 15 días anuales de vacaciones, días adicionales por antigüedad mayor a 5 años y liquidación en dinero de vacaciones no gozadas.
* **Art. 196**: Fondos de reserva (8.33% de la remuneración mensual a partir del segundo año).

