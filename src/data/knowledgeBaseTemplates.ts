export type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'boolean' | 'repeater';

export interface KBField {
  key: string;
  label: string;
  placeholder?: string;
  type: FieldType;
  options?: string[];
  required?: boolean;
  subFields?: Omit<KBField, 'subFields'>[];
}

export interface KBSection {
  key: string;
  title: string;
  description: string;
  icon: string;
  fields: KBField[];
}

// ─── Universal Knowledge Base Template ───
// This captures operational data about the client's business
// regardless of what deliverables (initiatives) they need.

export const knowledgeBaseSections: KBSection[] = [
  {
    key: 'business',
    title: 'Datos del negocio',
    description: 'Información básica sobre el negocio del cliente.',
    icon: 'Building2',
    fields: [
      { key: 'business_name', label: 'Nombre del negocio', type: 'text', required: true },
      { key: 'industry', label: 'Rubro / Industria', placeholder: 'Ej: Salud dental, gastronomía, coaching...', type: 'text', required: true },
      { key: 'description', label: 'Descripción breve del negocio', placeholder: '¿A qué se dedica? ¿Cuál es su diferencial?', type: 'textarea' },
      { key: 'address', label: 'Dirección', placeholder: 'Calle, número, ciudad', type: 'text' },
      { key: 'phone', label: 'Teléfono principal', type: 'text' },
      { key: 'whatsapp', label: 'WhatsApp del negocio', type: 'text' },
      { key: 'email', label: 'Email de contacto', type: 'text' },
      { key: 'website', label: 'Sitio web actual', placeholder: 'https://...', type: 'text' },
      { key: 'social_media', label: 'Redes sociales', placeholder: 'Instagram, Facebook, etc.', type: 'text' },
    ],
  },
  {
    key: 'hours',
    title: 'Horarios de atención',
    description: 'Cuándo opera el negocio.',
    icon: 'Clock',
    fields: [
      { key: 'weekdays', label: 'Lunes a Viernes', placeholder: 'Ej: 9:00 a 13:00 y 16:00 a 20:00', type: 'text' },
      { key: 'saturday', label: 'Sábados', placeholder: 'Ej: 9:00 a 13:00 / No atiende', type: 'text' },
      { key: 'sunday_holidays', label: 'Domingos y feriados', placeholder: 'Ej: Cerrado', type: 'text' },
      { key: 'exceptions', label: 'Excepciones o aclaraciones', placeholder: 'Ej: en verano cambia el horario', type: 'textarea' },
    ],
  },
  {
    key: 'team',
    title: 'Equipo / Profesionales',
    description: 'Quién trabaja en el negocio.',
    icon: 'Users',
    fields: [
      {
        key: 'professionals',
        label: 'Profesionales',
        type: 'repeater',
        subFields: [
          { key: 'name', label: 'Nombre', type: 'text', required: true },
          { key: 'role', label: 'Rol / Especialidad', placeholder: 'Ej: Ortodoncia, Chef, Coach', type: 'text' },
          { key: 'schedule', label: 'Días y horarios', placeholder: 'Ej: Lunes y Miércoles 9 a 13', type: 'text' },
        ],
      },
    ],
  },
  {
    key: 'services',
    title: 'Servicios / Productos',
    description: 'Lo que ofrece el negocio.',
    icon: 'ListChecks',
    fields: [
      {
        key: 'services_list',
        label: 'Servicios o productos',
        type: 'repeater',
        subFields: [
          { key: 'name', label: 'Nombre', type: 'text', required: true },
          { key: 'price', label: 'Precio / Rango', placeholder: 'Ej: $15.000 o "consultar"', type: 'text' },
          { key: 'notes', label: 'Notas', type: 'text' },
        ],
      },
    ],
  },
  {
    key: 'payments',
    title: 'Medios de pago',
    description: 'Cómo cobra el negocio.',
    icon: 'CreditCard',
    fields: [
      { key: 'payment_methods', label: '¿Qué medios de pago acepta?', type: 'multiselect', options: ['Efectivo', 'Débito', 'Crédito', 'Transferencia', 'MercadoPago', 'Otro'] },
      { key: 'credit_details', label: 'Detalles de tarjetas / cuotas', placeholder: 'Visa, Mastercard, cuotas...', type: 'text' },
      { key: 'insurance', label: 'Obras sociales / Prepagas', placeholder: 'Si aplica', type: 'textarea' },
    ],
  },
  {
    key: 'systems',
    title: 'Sistemas y herramientas',
    description: 'Qué software o herramientas usa actualmente.',
    icon: 'Plug',
    fields: [
      { key: 'management_system', label: 'Sistema de gestión', placeholder: 'Ej: Dentalink, Simma, Excel, ninguno', type: 'text' },
      { key: 'system_plan', label: 'Plan del sistema', placeholder: 'Básico / Premium / No sé', type: 'text' },
      { key: 'has_api', label: '¿Tiene acceso a API?', type: 'select', options: ['Sí', 'No', 'No sé'] },
      { key: 'email_tool', label: 'Email marketing', placeholder: 'Mailchimp, ActiveCampaign, ninguno', type: 'text' },
      { key: 'crm', label: 'CRM', placeholder: 'HubSpot, Excel, ninguno', type: 'text' },
      { key: 'other_tools', label: 'Otras herramientas', placeholder: 'Calendly, Google Calendar, etc.', type: 'textarea' },
    ],
  },
  {
    key: 'brand',
    title: 'Identidad de marca',
    description: 'Material visual y de marca existente.',
    icon: 'Palette',
    fields: [
      { key: 'has_logo', label: '¿Tiene logo?', type: 'boolean' },
      { key: 'brand_colors', label: 'Colores de marca', placeholder: 'Si tiene colores definidos', type: 'text' },
      { key: 'font', label: 'Tipografía', placeholder: 'Si tiene fuente preferida', type: 'text' },
      { key: 'has_photos', label: '¿Tiene fotos profesionales?', type: 'boolean' },
      { key: 'domain', label: 'Dominio web', placeholder: 'midominio.com', type: 'text' },
    ],
  },
  {
    key: 'access',
    title: 'Accesos',
    description: 'Credenciales y accesos que el cliente necesita compartir.',
    icon: 'Key',
    fields: [
      { key: 'whatsapp_business', label: 'WhatsApp Business — acceso al número', type: 'boolean' },
      { key: 'management_system_access', label: 'Sistema de gestión — credenciales', type: 'boolean' },
      { key: 'hosting_access', label: 'Hosting actual', type: 'text' },
      { key: 'social_access', label: 'Redes sociales — acceso', type: 'boolean' },
      { key: 'notes', label: 'Notas sobre accesos', placeholder: 'Aclaraciones adicionales', type: 'textarea' },
    ],
  },
];
