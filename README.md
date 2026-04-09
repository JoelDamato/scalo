# Waves Portal — CRM & Productized Services Platform

## Qué es

**Waves Portal** es un sistema interno para gestionar una agencia de desarrollo/automatización que vende servicios productizados ("amenities") a clientes (clínicas, comercios, emprendedores, etc.).

Combina:
- **CRM** con pipeline de oportunidades (lead → prospect → negotiation → client → churned)
- **Gestión de Proyectos** con tareas Kanban (backlog → in-progress → review → done)
- **Product Initiatives** — workflows estandarizados por tipo de servicio (MVP, Automatización, Landing Page)
- **Finanzas** con facturación ARCA (AFIP Argentina) integrada
- **WhatsApp** integration para comunicación con clientes
- **Soporte** con tickets y seguimiento
- **ElevenLabs Voice Assistant** para interacción por voz

## Arquitectura

### Frontend
- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui** (design system con tokens semánticos)
- **React Router** para navegación SPA
- **TanStack React Query** para data fetching/caching
- **@hello-pangea/dnd** para drag-and-drop en Kanban
- **next-themes** para dark/light mode

### Backend (Lovable Cloud / Supabase)
- **PostgreSQL** con Row Level Security (RLS)
- **Edge Functions** (Deno) para lógica server-side (AI, WhatsApp, facturación)
- **Auth** con roles (admin/client) via tabla `user_roles`
- **Storage** para archivos

## Estructura de Archivos Clave

```
src/
├── pages/                    # Rutas principales
│   ├── Dashboard.tsx         # Index/home con stats
│   ├── Projects.tsx          # Lista de proyectos
│   ├── ProjectDetail.tsx     # Detalle: Detalles, Productos, Tareas
│   ├── InitiativeDetail.tsx  # Workflow de un producto (stepper por fases)
│   ├── CRM.tsx               # Pipeline de clientes/oportunidades
│   ├── Finance.tsx           # Ingresos, gastos, facturación ARCA
│   ├── Tasks.tsx             # Kanban global de tareas
│   ├── WhatsApp.tsx          # Chat con clientes
│   ├── Support.tsx           # Tickets de soporte
│   └── Auth.tsx              # Login/registro
│
├── hooks/
│   ├── useInitiatives.ts     # 🔑 Core: tipos, steps, CRUD de iniciativas
│   ├── useData.ts            # Proyectos, tareas
│   ├── useCRM.ts             # Clientes, oportunidades, interacciones
│   ├── useFinance.ts         # Registros financieros
│   ├── useExpenses.ts        # Gastos operativos
│   ├── useTickets.ts         # Tickets de soporte
│   ├── useWhatsApp.ts        # Conversaciones WhatsApp
│   ├── useAuth.tsx           # Autenticación + roles (admin/client)
│   ├── useProjectKnowledgeBase.ts  # KB del proyecto (datos del negocio del cliente)
│   └── useAIGeneration.ts    # Generación de contenido con IA
│
├── components/
│   ├── initiatives/          # Componentes de Product Initiatives
│   │   ├── steps/            # Cada fase del workflow
│   │   │   ├── AutomationKickoffStep.tsx   # 🔑 Fase 1: formularios inline del KB
│   │   │   ├── AutomationPhaseStep.tsx     # Fases 2-5 de automatización
│   │   │   ├── BriefStep.tsx               # Discovery/Brief para MVP/App
│   │   │   ├── FeaturesStep.tsx            # Features con prioridad MoSCoW
│   │   │   ├── PRDStep.tsx                 # Product Requirements Document
│   │   │   ├── ScreensStep.tsx             # Pantallas y flujos
│   │   │   ├── TechDocsStep.tsx            # Especificaciones técnicas
│   │   │   └── ImplementationStep.tsx      # Tareas de desarrollo
│   │   ├── InitiativeCard.tsx
│   │   ├── CreateInitiativeDialog.tsx
│   │   └── InitiativeStepProgress.tsx      # Stepper visual
│   │
│   ├── crm/                  # CRM: clientes, oportunidades, pipeline
│   ├── finance/              # Finanzas: facturas, gastos, ARCA
│   ├── tasks/                # Kanban, cards, checklists
│   ├── tickets/              # Soporte
│   ├── whatsapp/             # Chat
│   ├── dashboard/            # Cards del dashboard
│   └── layout/               # Sidebar, AppLayout
│
├── data/
│   ├── automationKnowledgeBaseTemplates.ts  # 🔑 10 secciones del KB de Automatización
│   ├── knowledgeBaseTemplates.ts            # KB genérico (para MVP/otros)
│   └── questionnaireTemplates.ts            # Templates de cuestionarios
│
supabase/
├── functions/                # Edge Functions
│   ├── assistant/            # AI assistant
│   ├── generate-initiative-content/  # Generación de Brief/PRD con IA
│   ├── create-user/          # Creación de usuarios
│   ├── receive-lead/         # Webhook para leads entrantes
│   └── extract-tasks-from-audio/     # Voz → tareas
└── config.toml               # Configuración Supabase
```

## Modelo de Datos Principal

### Product Types (servicios productizados)

Cada "Product Type" es un servicio estandarizado que vendemos como agencia. Cada uno tiene su propio workflow (fases lineales), su propia UI, y su propio SOP. La inspiración viene de **021from**: productizar servicios para escalar sin depender de la creatividad de cada proyecto.

#### Cómo funciona el modelo

1. Un **Proyecto** (`projects`) pertenece a un cliente
2. Cada Proyecto puede tener N **Productos** (`product_initiatives`) 
3. Cada Producto tiene un `product_type` que determina su workflow de fases
4. El avance es lineal con un stepper. **Functional Gates** bloquean el avance si no se completó la fase actual
5. Cada fase tiene un componente React dedicado y un SOP (checklist operativo con pasos, inputs, outputs y responsable)

#### Workflows por tipo

| Type | Fases | Qué vendemos |
|------|-------|-------------|
| `automation` | Kickoff → Chatbot IA → Integración → Entrega → Soporte (5 fases) | Chatbot IA en WhatsApp para atención al cliente. El cliente es una estética, dentista, clínica mental, etc. Quieren agendar turnos, responder preguntas frecuentes, derivar urgencias. Incluye 12 meses de soporte. |
| `mvp` | Discovery → Features → PRD → Pantallas → Tech Docs → Implementación (6 fases) | Minimum Viable Product. Validamos hipótesis con producto real en ~14 días. Inspirado en Lean Startup. |
| `landing_page` | Discovery → Secciones → Diseño → Desarrollo (4 fases) | Página web optimizada con SEO. Para negocios que necesitan presencia digital rápida. |
| `funnel` | (usa workflow MVP por ahora) | Embudo de conversión — pendiente de definir SOP propio |
| `app` | (usa workflow MVP por ahora) | App completa — pendiente de definir SOP propio |

#### SOP de Automatización & IA (detalle)

Este es nuestro producto estrella. El flujo es:

**Fase 1: Kickoff (Onboarding & KB)**
- Formularios inline con 10 secciones de Knowledge Base
- El KB es la fuente de verdad del negocio del cliente
- Gate: todas las secciones requeridas deben estar completas
- Componente: `AutomationKickoffStep.tsx`

**Fase 2: Chatbot IA**
- Construir KB del chatbot, configurar personalidad y flujos
- Testear con 10 escenarios reales (turnos, preguntas, urgencias)
- Gate: 10 escenarios aprobados
- Componente: `AutomationPhaseStep.tsx`

**Fase 3: Integración**
- Conectar el chatbot con el sistema de gestión del cliente (calendario, CRM)
- Gate: integración funcionando en producción
- Componente: `AutomationPhaseStep.tsx`

**Fase 4: Entrega & Capacitación**
- Capacitar al cliente y su equipo
- Entregar documentación y accesos
- Gate: cliente operando de forma autónoma
- Componente: `AutomationPhaseStep.tsx`

**Fase 5: Soporte Continuo**
- Mantenimiento y optimización durante 12 meses
- Reportes mensuales de performance
- Componente: `AutomationPhaseStep.tsx`

#### SOP de MVP (detalle)

Inspirado en 021from y Lean Startup. Cada fase genera artefactos que alimentan la siguiente:

**Fase 1: Discovery** — Brief estratégico con IA (problema, usuarios, solución, métricas)
**Fase 2: Features** — Lista priorizada con MoSCoW (Must/Should/Could/Won't)
**Fase 3: PRD** — Requisitos detallados por feature (casos de uso, edge cases, criterios de aceptación)
**Fase 4: Pantallas** — Flujos de navegación y wireframes
**Fase 5: Tech Docs** — Stack, DB schema, API routes, plan de implementación
**Fase 6: Implementación** — Auto-genera tareas en el Kanban del proyecto desde features Must/Should

### Knowledge Base (KB)
El KB es la **fuente de verdad** del negocio del cliente. Para Automatización tiene 10 secciones:

1. **Datos del Negocio** — nombre, rubro, contacto, redes
2. **Horarios** — días, excepciones, mensaje fuera de horario
3. **Equipo** — profesionales, roles, especialidades
4. **Servicios** — catálogo con precios, duración, categorías
5. **Medios de Pago** — métodos, obras sociales, cuotas
6. **Urgencias** — protocolo, keywords, derivación
7. **Sistemas Actuales** — gestión, calendario, CRM existente
8. **Identidad de Marca** — dominio, colores, logo, estilo visual
9. **Configuración del Chatbot** — nombre, tono, capacidades, FAQs
10. **Accesos** — WhatsApp Business, APIs, hosting, dominio

Los inputs del KB están **embebidos directamente en la Fase 1 (Kickoff)** de cada iniciativa de automatización.

### Tablas DB principales
- `projects` — Proyectos con estado y cliente asociado
- `product_initiatives` — Iniciativas con `product_type` y `current_step`
- `initiative_briefs` — Discovery/brief estratégico
- `initiative_features` — Features con prioridad MoSCoW y complejidad
- `initiative_prds` — PRD por feature
- `initiative_screens` — Pantallas y flujos
- `initiative_tech_docs` — Stack técnico
- `initiative_questionnaires` — Cuestionario por iniciativa
- `project_knowledge_base` — KB operativo del negocio (JSON responses)
- `customers` — CRM con stage pipeline
- `crm_opportunities` — Oportunidades con valor y probabilidad
- `finance_records` — Ingresos
- `expenses` — Gastos con categorías
- `tasks` — Tareas con Kanban
- `support_tickets` — Tickets de soporte
- `user_roles` — Roles (admin/client)
- `project_events` — Calendario de eventos del proyecto (checkpoints, reuniones)

### Roles y Permisos
- **admin**: acceso total (CRM, finanzas, tareas, configuración)
- **client**: ve sus proyectos, tareas visibles, productos, calendario. Puede crear tickets de soporte.

## Convenciones

- **Idioma UI**: Español (Argentina)
- **Terminología**: "Productos" (no "Iniciativas"), "Pendientes" (no "Backlog")
- **Product Types**: servicios estandarizados e independientes del cliente
- **Gates**: checklists que bloquean el avance entre fases (100% requerido)
- **Source of Truth**: el KB alimenta todas las fases (Chatbot, Integración, Entrega)
- **SOPs**: cada fase tiene pasos detallados con input, output y responsable (admin/client/both)

## Setup Local

```bash
git clone <repo-url>
cd <project>
npm install
npm run dev
```

Requiere las variables de entorno de Supabase (`.env` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`).

## Estado Actual / Pendientes

- ✅ MVP workflow completo (6 fases con generación IA)
- ✅ Automatización workflow (5 fases: Kickoff → Chatbot IA → Integración → Entrega → Soporte)
- ✅ Landing Page workflow (4 fases)
- ✅ Functional Gates (bloqueo de avance por checklist/KB incompleto)
- ✅ Portal de cliente (proyectos, tareas, productos, calendario)
- ⬜ Funnel/App: workflows pendientes de definir
- ⬜ Auto-generación de System Prompt desde KB para el chatbot
- ⬜ Google Calendar sync vía n8n
