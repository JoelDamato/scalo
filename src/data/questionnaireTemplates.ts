import { ProductType } from '@/hooks/useInitiatives';

export type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'boolean' | 'repeater';

export interface QuestionnaireField {
  key: string;
  label: string;
  placeholder?: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  subFields?: Omit<QuestionnaireField, 'subFields'>[];
}

export interface QuestionnaireSection {
  key: string;
  title: string;
  description: string;
  icon: string;
  fields: QuestionnaireField[];
}

export type QuestionnaireTemplate = QuestionnaireSection[];

// ─── AUTOMATION — Strategic Discovery ───
const automationTemplate: QuestionnaireTemplate = [
  {
    key: 'problem',
    title: 'Problema a resolver',
    description: '¿Qué necesidad operativa o de atención querés automatizar?',
    icon: 'Lightbulb',
    fields: [
      { key: 'main_problem', label: '¿Cuál es el principal problema que querés resolver?', placeholder: 'Ej: Perdemos muchos turnos porque la secretaria no da abasto con WhatsApp', type: 'textarea', required: true },
      { key: 'current_process', label: '¿Cómo se hace hoy?', placeholder: 'Ej: La secretaria responde uno por uno por WhatsApp', type: 'textarea', required: true },
      { key: 'pain_points', label: '¿Qué es lo que más molesta del proceso actual?', placeholder: 'Ej: Se pierden mensajes, demora en responder, errores en horarios', type: 'textarea' },
      { key: 'volume', label: '¿Cuántas consultas/turnos/mensajes manejás por día?', placeholder: 'Ej: 30-50 mensajes de WhatsApp por día', type: 'text' },
    ],
  },
  {
    key: 'goals',
    title: 'Objetivos',
    description: '¿Qué querés lograr con la automatización?',
    icon: 'TrendingUp',
    fields: [
      { key: 'primary_goal', label: 'Objetivo principal', type: 'select', options: ['Automatizar atención al cliente', 'Automatizar turnos/reservas', 'Captar más leads', 'Reducir trabajo manual', 'Mejorar tiempos de respuesta', 'Otro'], required: true },
      { key: 'secondary_goals', label: 'Otros objetivos', type: 'multiselect', options: ['Responder 24/7', 'Reducir carga del equipo', 'Unificar canales', 'Enviar recordatorios automáticos', 'Cobrar online', 'Derivar a un humano cuando sea necesario'] },
      { key: 'success_metric', label: '¿Cómo sabrías que funcionó?', placeholder: 'Ej: Que el 80% de los turnos se agenden sin intervención humana', type: 'textarea' },
    ],
  },
  {
    key: 'scope',
    title: 'Alcance del proyecto',
    description: '¿Qué canales y funcionalidades necesitás?',
    icon: 'MessageCircle',
    fields: [
      { key: 'channels', label: '¿En qué canales necesitás automatización?', type: 'multiselect', options: ['WhatsApp', 'Instagram DM', 'Web chat', 'Teléfono', 'Email'], required: true },
      { key: 'needs_landing', label: '¿Necesitás una landing page?', type: 'boolean' },
      { key: 'needs_booking', label: '¿Necesitás sistema de turnos/reservas?', type: 'boolean' },
      { key: 'needs_payments', label: '¿Necesitás cobrar online?', type: 'boolean' },
      { key: 'integrations', label: '¿Con qué sistemas necesita integrarse?', placeholder: 'Ej: Dentalink, Google Calendar, MercadoPago...', type: 'textarea' },
    ],
  },
  {
    key: 'chatbot',
    title: 'Personalidad del asistente',
    description: 'Cómo debería comunicarse el bot.',
    icon: 'MessageCircle',
    fields: [
      { key: 'tone', label: 'Tono preferido', type: 'select', options: ['Profesional y cálido', 'Cercano y amigable', 'Formal', 'Otro'] },
      { key: 'addressing', label: '¿Cómo trata a los clientes?', type: 'select', options: ['De usted', 'De vos', 'De tú'] },
      { key: 'restrictions', label: '¿Algo que NO debería decir?', placeholder: 'Ej: no dar diagnósticos, no recomendar medicación', type: 'textarea' },
      { key: 'escalation', label: '¿Cuándo debería derivar a un humano?', placeholder: 'Ej: reclamos, urgencias, consultas complejas', type: 'textarea' },
    ],
  },
  {
    key: 'timeline',
    title: 'Tiempos y presupuesto',
    description: 'Expectativas del proyecto.',
    icon: 'Clock',
    fields: [
      { key: 'urgency', label: '¿Para cuándo lo necesitás?', type: 'select', options: ['Lo antes posible', '1 mes', '2-3 meses', 'Sin apuro'] },
      { key: 'budget_range', label: 'Rango de presupuesto', type: 'select', options: ['Hasta USD 1.000', 'USD 1.000 - 3.000', 'USD 3.000 - 5.000', 'Más de USD 5.000', 'No definí todavía'] },
      { key: 'priority', label: '¿Qué es lo más urgente de resolver?', placeholder: 'Ej: primero el chatbot de WhatsApp, después la landing', type: 'textarea' },
    ],
  },
];

// ─── MVP — Strategic Discovery ───
const mvpTemplate: QuestionnaireTemplate = [
  {
    key: 'idea',
    title: 'La idea',
    description: 'Contanos de qué se trata el producto.',
    icon: 'Lightbulb',
    fields: [
      { key: 'elevator_pitch', label: '¿Qué hace tu producto en una oración?', placeholder: 'Ej: Una app para que los dueños de mascotas encuentren veterinarios de guardia', type: 'textarea', required: true },
      { key: 'problem', label: '¿Qué problema resuelve?', placeholder: 'Describí el dolor o necesidad de tu usuario', type: 'textarea', required: true },
      { key: 'target_user', label: '¿Quién lo va a usar?', placeholder: 'Ej: profesionales de salud, pymes, estudiantes...', type: 'textarea' },
      { key: 'existing_solutions', label: '¿Cómo se resuelve hoy sin tu producto?', placeholder: 'Ej: Excel, WhatsApp, a mano...', type: 'textarea' },
    ],
  },
  {
    key: 'scope',
    title: 'Alcance del MVP',
    description: 'Qué incluir en la primera versión.',
    icon: 'ListChecks',
    fields: [
      { key: 'must_have', label: '¿Qué funciones son imprescindibles?', placeholder: 'Las 3-5 funciones clave para lanzar', type: 'textarea', required: true },
      { key: 'nice_to_have', label: '¿Qué puede esperar a la v2?', type: 'textarea' },
      { key: 'inspiration', label: '¿Algún producto que te inspire?', placeholder: 'Links o nombres', type: 'textarea' },
    ],
  },
  {
    key: 'users',
    title: 'Usuarios y plataforma',
    description: 'Cómo van a acceder al producto.',
    icon: 'Users',
    fields: [
      { key: 'user_types', label: '¿Qué tipos de usuarios hay?', placeholder: 'Ej: admin, cliente, vendedor...', type: 'textarea' },
      { key: 'auth_method', label: '¿Cómo se registran?', type: 'select', options: ['Email y contraseña', 'Google', 'WhatsApp', 'No sé todavía'] },
      { key: 'platform', label: '¿Dónde lo van a usar?', type: 'multiselect', options: ['Web', 'Celular (web móvil)', 'App nativa', 'No sé'] },
    ],
  },
  {
    key: 'business',
    title: 'Modelo y tiempos',
    description: 'Cómo pensás monetizar y cuándo necesitás lanzar.',
    icon: 'TrendingUp',
    fields: [
      { key: 'revenue_model', label: '¿Cómo pensás monetizar?', type: 'select', options: ['Suscripción', 'Pago único', 'Freemium', 'Comisión', 'No definí'] },
      { key: 'timeline', label: '¿Para cuándo lo necesitás?', type: 'text' },
      { key: 'budget', label: '¿Tenés un presupuesto estimado?', type: 'text' },
      { key: 'validation', label: '¿Ya validaste la idea con usuarios reales?', type: 'select', options: ['Sí, tengo feedback', 'Parcialmente', 'No todavía'] },
    ],
  },
];

// ─── FUNNEL — Strategic Discovery ───
const funnelTemplate: QuestionnaireTemplate = [
  {
    key: 'objective',
    title: 'Objetivo del funnel',
    description: '¿Qué querés lograr?',
    icon: 'TrendingUp',
    fields: [
      { key: 'goal', label: 'Objetivo principal', type: 'select', options: ['Captar leads', 'Vender un producto/servicio', 'Agendar llamadas', 'Lanzamiento', 'Otro'], required: true },
      { key: 'product_service', label: '¿Qué vendés o promocionás?', type: 'textarea', required: true },
      { key: 'target_audience', label: '¿A quién le vendés?', placeholder: 'Describí tu cliente ideal', type: 'textarea' },
      { key: 'price', label: 'Precio del producto/servicio', type: 'text' },
    ],
  },
  {
    key: 'traffic',
    title: 'Tráfico y captación',
    description: '¿De dónde vienen tus visitantes?',
    icon: 'Globe',
    fields: [
      { key: 'traffic_source', label: 'Fuentes de tráfico', type: 'multiselect', options: ['Instagram Ads', 'Facebook Ads', 'Google Ads', 'Orgánico / SEO', 'WhatsApp', 'Email', 'Otro'] },
      { key: 'lead_magnet', label: '¿Tenés un lead magnet?', placeholder: 'Ebook, webinar, descuento...', type: 'textarea' },
      { key: 'has_funnel_before', label: '¿Ya tuviste un funnel antes?', type: 'boolean' },
      { key: 'monthly_budget_ads', label: 'Presupuesto mensual en ads', placeholder: 'Ej: $50.000 ARS / USD 200', type: 'text' },
    ],
  },
  {
    key: 'content',
    title: 'Contenido clave',
    description: 'Lo que necesitamos para armar la landing.',
    icon: 'FileText',
    fields: [
      { key: 'headline', label: 'Propuesta de valor en una oración', type: 'text' },
      { key: 'benefits', label: 'Beneficios principales (3-5)', type: 'textarea' },
      { key: 'testimonials', label: '¿Tenés testimonios?', type: 'boolean' },
      { key: 'differentiator', label: '¿Qué te diferencia de la competencia?', type: 'textarea' },
    ],
  },
  {
    key: 'timeline',
    title: 'Tiempos',
    description: 'Cuándo necesitás que esté listo.',
    icon: 'Clock',
    fields: [
      { key: 'urgency', label: '¿Para cuándo lo necesitás?', type: 'select', options: ['Lo antes posible', '1-2 semanas', '1 mes', 'Sin apuro'] },
      { key: 'budget', label: 'Presupuesto para el funnel', type: 'text' },
    ],
  },
];

// ─── APP — Strategic Discovery ───
const appTemplate: QuestionnaireTemplate = [
  {
    key: 'vision',
    title: 'Visión del producto',
    description: 'Qué querés construir y por qué.',
    icon: 'Lightbulb',
    fields: [
      { key: 'description', label: '¿Qué hace la app?', placeholder: 'Describí en 2-3 oraciones', type: 'textarea', required: true },
      { key: 'problem', label: '¿Qué problema resuelve?', type: 'textarea', required: true },
      { key: 'target_user', label: '¿Quién la va a usar?', type: 'textarea' },
      { key: 'competitors', label: '¿Conocés apps similares?', placeholder: 'Links o nombres', type: 'textarea' },
    ],
  },
  {
    key: 'scope',
    title: 'Funcionalidades clave',
    description: 'Qué tiene que hacer la app.',
    icon: 'ListChecks',
    fields: [
      { key: 'core_features', label: 'Funciones principales', type: 'textarea', required: true },
      { key: 'user_types', label: '¿Qué tipos de usuarios hay?', type: 'textarea' },
      { key: 'platform', label: '¿Dónde se va a usar?', type: 'multiselect', options: ['iOS', 'Android', 'Web', 'Todas'] },
      { key: 'integrations', label: '¿Necesita integrarse con algo?', placeholder: 'Pasarela de pago, maps, calendario...', type: 'textarea' },
    ],
  },
  {
    key: 'business',
    title: 'Modelo y tiempos',
    description: 'Monetización y expectativas.',
    icon: 'TrendingUp',
    fields: [
      { key: 'revenue_model', label: '¿Cómo monetiza?', type: 'select', options: ['Suscripción', 'Pago único', 'Freemium', 'Comisión', 'No definí'] },
      { key: 'timeline', label: '¿Para cuándo?', type: 'text' },
      { key: 'budget', label: 'Presupuesto estimado', type: 'text' },
      { key: 'scale', label: '¿Cuántos usuarios esperás al inicio?', placeholder: 'Ej: 100, 1000, 10000', type: 'text' },
    ],
  },
];

const templateMap: Record<ProductType, QuestionnaireTemplate> = {
  automation: automationTemplate,
  mvp: mvpTemplate,
  funnel: funnelTemplate,
  app: appTemplate,
  landing_page: funnelTemplate,
};

export function getQuestionnaireTemplate(productType: ProductType): QuestionnaireTemplate {
  return templateMap[productType] || mvpTemplate;
}
