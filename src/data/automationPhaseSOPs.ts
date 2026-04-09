import type { InitiativeStep } from '@/hooks/useInitiatives';

export interface SOPChecklistItem {
  title: string;
  description: string;
  instructions: string[];
  input: string;
  output: string;
  responsible: 'admin' | 'client' | 'both';
}

export interface PhaseSOPConfig {
  title: string;
  subtitle: string;
  iconName: 'Globe' | 'Bot' | 'Plug' | 'GraduationCap' | 'HeadphonesIcon';
  objective: string;
  gate: string;
  checklist: SOPChecklistItem[];
}

export const PHASE_SOP_CONFIGS: Partial<Record<InitiativeStep, PhaseSOPConfig>> = {
  chatbot_ia: {
    title: 'Fase 2: Chatbot IA',
    subtitle: 'Asistente configurado, entrenado y funcionando en WhatsApp',
    iconName: 'Bot',
    objective: 'Construir la knowledge base, configurar personalidad y flujos del chatbot, y testear con escenarios reales.',
    gate: 'Sin los 10 escenarios aprobados, no se inicia Fase 3.',
    checklist: [
      {
        title: 'Knowledge base construida y revisada internamente',
        description: 'Transformar la información del Kickoff en un documento estructurado que el chatbot pueda usar como fuente de verdad.',
        instructions: [
          'Ir a la KB del proyecto → exportar todas las secciones',
          'Estructurar en formato: Categoría → Pregunta frecuente → Respuesta',
          'Incluir: servicios, precios, horarios, ubicación, profesionales',
          'Incluir: políticas de cancelación, formas de pago, obras sociales',
          'Revisar con otro miembro del equipo antes de cargar',
        ],
        input: 'KB del Kickoff completada (10 secciones)',
        output: 'Documento de KB del chatbot (Markdown o JSON)',
        responsible: 'admin',
      },
      {
        title: 'Personalidad del asistente configurada',
        description: 'Definir nombre, tono, mensaje de bienvenida y reglas de comportamiento del chatbot.',
        instructions: [
          'Usar datos de KB → sección "Chatbot" (nombre, tono)',
          'Redactar system prompt con: identidad, límites, tono',
          'Configurar mensaje de bienvenida',
          'Definir qué NO debe hacer el bot (ej: dar diagnósticos)',
        ],
        input: 'KB → sección Chatbot + sección Marca',
        output: 'System prompt + mensaje de bienvenida configurados',
        responsible: 'admin',
      },
      {
        title: 'Flujos básicos: bienvenida → consulta → turno → despedida',
        description: 'El chatbot debe manejar el flujo conversacional principal de forma natural.',
        instructions: [
          'Mapear el flujo: saludo → identificar intención → responder → cerrar',
          'Configurar intenciones: consulta info, pedir turno, cancelar turno',
          'Testear 3 conversaciones completas de punta a punta',
        ],
        input: 'System prompt + KB cargada',
        output: '3 conversaciones de prueba exitosas (screenshots)',
        responsible: 'admin',
      },
      {
        title: 'Flujo de urgencias configurado y testeado',
        description: 'El bot debe detectar urgencias y derivar inmediatamente a un humano.',
        instructions: [
          'Definir keywords de urgencia (KB → sección Emergencias)',
          'Configurar respuesta automática: "Esto parece urgente, te comunico con..."',
          'Testear con 2 mensajes de urgencia simulados',
        ],
        input: 'KB → sección Emergencias',
        output: 'Bot detecta urgencia y deriva correctamente',
        responsible: 'admin',
      },
      {
        title: 'Flujo de derivación humana funcionando',
        description: 'Cuando el bot no puede resolver, debe derivar a un humano de forma elegante.',
        instructions: [
          'Configurar trigger de derivación (ej: "hablar con alguien")',
          'Definir mensaje de transición',
          'Verificar que la notificación llega al equipo',
        ],
        input: 'Configuración de derivación + contacto del equipo',
        output: 'Derivación exitosa en conversación de prueba',
        responsible: 'admin',
      },
      {
        title: 'Procesamiento de audio testeado',
        description: 'El bot debe poder recibir y transcribir mensajes de voz.',
        instructions: [
          'Enviar un audio de prueba al bot vía WhatsApp',
          'Verificar que transcribe correctamente',
          'Verificar que responde al contenido del audio',
        ],
        input: 'Audio de prueba (pregunta sobre servicios)',
        output: 'Respuesta coherente basada en transcripción',
        responsible: 'admin',
      },
      {
        title: 'Procesamiento de fotos testeado',
        description: 'El bot debe manejar imágenes recibidas de forma adecuada.',
        instructions: [
          'Enviar una foto de prueba al bot',
          'Verificar que responde apropiadamente',
          'Si no procesa imágenes, verificar mensaje de fallback',
        ],
        input: 'Imagen de prueba',
        output: 'Respuesta apropiada o fallback configurado',
        responsible: 'admin',
      },
      {
        title: 'Mensajes fuera de horario funcionando',
        description: 'El bot debe responder diferente fuera del horario de atención.',
        instructions: [
          'Configurar horarios de atención (KB → sección Horarios)',
          'Definir mensaje fuera de horario',
          'Testear enviando mensaje fuera de horario configurado',
        ],
        input: 'KB → sección Horarios',
        output: 'Mensaje de fuera de horario recibido correctamente',
        responsible: 'admin',
      },
      {
        title: 'E1: Consultar horarios ✓',
        description: 'Escenario de prueba: el usuario pregunta los horarios de atención.',
        instructions: [
          'Enviar: "¿Cuál es el horario de atención?"',
          'Verificar que responde con los horarios correctos de la KB',
        ],
        input: 'Mensaje del usuario preguntando horarios',
        output: 'Respuesta con horarios correctos',
        responsible: 'admin',
      },
      {
        title: 'E2: Consultar servicios disponibles ✓',
        description: 'Escenario de prueba: el usuario pregunta qué servicios ofrecen.',
        instructions: [
          'Enviar: "¿Qué servicios ofrecen?"',
          'Verificar que lista los servicios de la KB',
        ],
        input: 'Mensaje del usuario preguntando servicios',
        output: 'Respuesta con lista de servicios correcta',
        responsible: 'admin',
      },
      {
        title: 'E3: Consultar precios ✓',
        description: 'Escenario de prueba: el usuario pregunta precios.',
        instructions: [
          'Enviar: "¿Cuánto cuesta una limpieza dental?"',
          'Verificar respuesta según política de precios en KB',
        ],
        input: 'Mensaje del usuario preguntando precio',
        output: 'Respuesta coherente con política de precios',
        responsible: 'admin',
      },
      {
        title: 'E4: Pedir turno ✓',
        description: 'Escenario de prueba: el usuario quiere agendar un turno.',
        instructions: [
          'Enviar: "Quiero sacar un turno para mañana"',
          'Verificar que inicia flujo de agendamiento',
        ],
        input: 'Mensaje del usuario pidiendo turno',
        output: 'Bot inicia flujo de turno correctamente',
        responsible: 'admin',
      },
      {
        title: 'E5: Cancelar turno ✓',
        description: 'Escenario de prueba: el usuario quiere cancelar un turno.',
        instructions: [
          'Enviar: "Necesito cancelar mi turno"',
          'Verificar que maneja cancelación o deriva',
        ],
        input: 'Mensaje del usuario cancelando turno',
        output: 'Bot maneja cancelación correctamente',
        responsible: 'admin',
      },
      {
        title: 'E6: Consultar obras sociales ✓',
        description: 'Escenario de prueba: el usuario pregunta por obras sociales/seguros.',
        instructions: [
          'Enviar: "¿Aceptan OSDE?"',
          'Verificar respuesta según KB → sección Pagos',
        ],
        input: 'Mensaje sobre obra social',
        output: 'Respuesta correcta sobre coberturas',
        responsible: 'admin',
      },
      {
        title: 'E7: Urgencia detectada ✓',
        description: 'Escenario de prueba: el usuario reporta una urgencia.',
        instructions: [
          'Enviar: "Tengo mucho dolor de muela, es urgente"',
          'Verificar que activa flujo de urgencia',
        ],
        input: 'Mensaje de urgencia',
        output: 'Derivación inmediata activada',
        responsible: 'admin',
      },
      {
        title: 'E8: Consulta fuera de horario ✓',
        description: 'Escenario de prueba: mensaje recibido fuera del horario de atención.',
        instructions: [
          'Enviar mensaje fuera del horario configurado',
          'Verificar respuesta de fuera de horario',
        ],
        input: 'Mensaje fuera de horario',
        output: 'Respuesta de fuera de horario correcta',
        responsible: 'admin',
      },
      {
        title: 'E9: Mensaje de voz recibido ✓',
        description: 'Escenario de prueba: el usuario envía un audio.',
        instructions: [
          'Enviar un audio preguntando por servicios',
          'Verificar transcripción y respuesta',
        ],
        input: 'Audio de voz con consulta',
        output: 'Transcripción correcta + respuesta coherente',
        responsible: 'admin',
      },
      {
        title: 'E10: Foto recibida ✓',
        description: 'Escenario de prueba: el usuario envía una foto.',
        instructions: [
          'Enviar una foto al chatbot',
          'Verificar manejo correcto (análisis o fallback)',
        ],
        input: 'Imagen enviada por usuario',
        output: 'Respuesta apropiada o fallback',
        responsible: 'admin',
      },
    ],
  },
  integracion: {
    title: 'Fase 3: Integración',
    subtitle: 'El chatbot conectado con el mundo real del cliente',
    iconName: 'Plug',
    objective: 'Conectar el chatbot con WhatsApp Business API y el sistema de gestión para turnos, disponibilidad y recordatorios.',
    gate: '3 flujos de integración funcionando en entorno real (turno creado desde WA → visible en sistema del cliente).',
    checklist: [
      {
        title: 'WhatsApp Business API configurada (número verificado)',
        description: 'Configurar el número de WhatsApp Business del cliente con la API.',
        instructions: [
          'Verificar que el cliente tiene WhatsApp Business (KB → sección Accesos)',
          'Configurar número en Meta Business Manager',
          'Verificar el número de teléfono',
          'Testear envío de mensaje de prueba vía API',
        ],
        input: 'Número de WhatsApp Business + Meta Business ID',
        output: 'Número verificado y respondiendo vía API',
        responsible: 'admin',
      },
      {
        title: 'Evolution API / BSP conectado',
        description: 'Conectar el proveedor de Business Solution Provider con el sistema.',
        instructions: [
          'Configurar Evolution API o BSP del cliente (KB → sección Accesos)',
          'Establecer webhook de recepción de mensajes',
          'Testear recepción de mensaje entrante',
          'Verificar envío de respuesta automática',
        ],
        input: 'Credenciales BSP + webhook URL',
        output: 'Mensajes entrantes/salientes funcionando',
        responsible: 'admin',
      },
      {
        title: 'Sistema de gestión identificado y conectado',
        description: 'Conectar el sistema de gestión del cliente (Dentalink, Google Calendar, etc.).',
        instructions: [
          'Identificar el sistema del cliente (KB → sección Sistemas)',
          'Obtener credenciales de API del cliente',
          'Configurar autenticación (API key, OAuth, etc.)',
          'Testear con un GET simple que retorne datos',
        ],
        input: 'Credenciales de API del sistema del cliente',
        output: 'Request exitoso autenticado (200 OK)',
        responsible: 'admin',
      },
      {
        title: 'Webhook de turnos: consulta disponibilidad ✓',
        description: 'El usuario puede preguntar disponibilidad y el bot consulta el sistema en tiempo real.',
        instructions: [
          'Implementar endpoint de disponibilidad en n8n',
          'Conectar con el flujo de turno del chatbot',
          'Testear: "¿Hay turnos disponibles para mañana?"',
          'Verificar que responde con disponibilidad real',
        ],
        input: 'API de disponibilidad del sistema + flujo del chatbot',
        output: 'Bot responde con disponibilidad real del sistema',
        responsible: 'admin',
      },
      {
        title: 'Webhook de turnos: crear turno ✓',
        description: 'El turno agendado desde WhatsApp se crea en el sistema del cliente.',
        instructions: [
          'Implementar POST de creación de turno en n8n',
          'Mapear datos: nombre, teléfono, servicio, fecha/hora',
          'Testear creación de turno desde conversación de WhatsApp',
          'Verificar que aparece en el sistema del cliente',
        ],
        input: 'Datos del paciente + fecha/hora seleccionada',
        output: 'Turno visible en el sistema de gestión del cliente',
        responsible: 'admin',
      },
      {
        title: 'Webhook de turnos: cancelar turno ✓',
        description: 'El usuario puede cancelar un turno desde WhatsApp.',
        instructions: [
          'Implementar búsqueda de turno por teléfono/nombre',
          'Implementar DELETE/UPDATE de cancelación en n8n',
          'Testear flujo completo de cancelación',
        ],
        input: 'Identificación del turno (teléfono o nombre)',
        output: 'Turno cancelado en el sistema + confirmación al usuario',
        responsible: 'admin',
      },
      {
        title: 'Recordatorio automático 24hs antes configurado',
        description: 'El sistema envía un recordatorio automático por WhatsApp 24hs antes del turno.',
        instructions: [
          'Configurar cron/scheduler en n8n que revise turnos del día siguiente',
          'Implementar envío de mensaje de recordatorio',
          'Testear con un turno de prueba',
        ],
        input: 'Lista de turnos del día siguiente',
        output: 'Mensaje de recordatorio recibido por el paciente',
        responsible: 'admin',
      },
      {
        title: 'Fallback manual documentado',
        description: 'Documentar qué hacer cuando la integración falla.',
        instructions: [
          'Documentar: qué errores pueden ocurrir',
          'Definir: cómo el equipo maneja turnos manualmente si la API cae',
          'Crear guía de troubleshooting básica',
        ],
        input: 'Errores posibles identificados',
        output: 'Documento de fallback manual (1 página)',
        responsible: 'admin',
      },
    ],
  },
  entrega: {
    title: 'Fase 4: Entrega & Capacitación',
    subtitle: 'El cliente opera de forma autónoma el día 1',
    iconName: 'GraduationCap',
    objective: 'Go-live, capacitación del cliente y entrega formal de documentación.',
    gate: 'Checklist de entrega firmado por el cliente + pago confirmado.',
    checklist: [
      {
        title: 'Testing final con el cliente (en vivo)',
        description: 'Sesión de testing en vivo donde el cliente ve el sistema funcionando.',
        instructions: [
          'Agendar sesión de 30min con el cliente',
          'Hacer demo en vivo: enviar mensaje → ver turno en sistema',
          'Testear flujos: turno, cancelación, urgencia, fuera de horario',
          'Registrar feedback del cliente',
        ],
        input: 'Sistema integrado y funcionando',
        output: 'Aprobación del cliente para go-live',
        responsible: 'both',
      },
      {
        title: 'Call de capacitación realizado y grabado',
        description: 'Sesión de capacitación donde el cliente aprende a usar el sistema.',
        instructions: [
          'Agendar call de 45min con el cliente',
          'Preparar agenda: demo chatbot, cómo ver conversaciones, cómo intervenir',
          'Grabar la sesión (Zoom/Meet)',
          'Dejar espacio para preguntas',
        ],
        input: 'Sistema funcionando + guía de uso preparada',
        output: 'Grabación de la sesión de capacitación',
        responsible: 'both',
      },
      {
        title: 'Grabación compartida con el cliente',
        description: 'Enviar la grabación para que el cliente pueda revisarla después.',
        instructions: [
          'Subir grabación a Google Drive o similar',
          'Compartir link por WhatsApp/email',
          'Confirmar que el cliente puede acceder',
        ],
        input: 'Grabación de la capacitación',
        output: 'Link de grabación accesible por el cliente',
        responsible: 'admin',
      },
      {
        title: 'Guía de Uso entregada',
        description: 'Documento auto-generado de 1 página con instrucciones para el cliente.',
        instructions: [
          'Generar la Guía de Uso desde los Outputs de esta fase',
          'Revisar que los datos (nombre del asistente, negocio) sean correctos',
          'Enviar en PDF por WhatsApp/email',
        ],
        input: 'KB sección 1 + sección 9',
        output: 'PDF de guía de uso enviado al cliente',
        responsible: 'admin',
      },
      {
        title: 'Checklist de entrega firmado',
        description: 'El cliente confirma que recibió todo lo prometido.',
        instructions: [
          'Enviar checklist de entrega con todos los ítems',
          'Pedir confirmación por escrito (WhatsApp/email)',
          'Archivar la confirmación',
        ],
        input: 'Todos los ítems anteriores completados',
        output: 'Confirmación escrita del cliente',
        responsible: 'client',
      },
      {
        title: 'Pago final confirmado',
        description: 'Activar o cobrar el pago correspondiente a la entrega.',
        instructions: [
          'Verificar en Finanzas que el pago está pendiente',
          'Enviar recordatorio de pago si es necesario',
          'Registrar el pago cuando se reciba',
        ],
        input: 'Entrega completada y aprobada',
        output: 'Pago registrado en el sistema de finanzas',
        responsible: 'admin',
      },
    ],
  },
  soporte: {
    title: 'Fase 5: Soporte Continuo',
    subtitle: 'Monitoreo y retención durante 12 meses',
    iconName: 'HeadphonesIcon',
    objective: 'Mantener el sistema funcionando, actualizar la knowledge base y documentar el valor entregado cada mes.',
    gate: 'Se repite cada 30 días durante 12 meses.',
    checklist: [
      {
        title: 'Check-in mensual realizado (15min, grabado)',
        description: 'Llamada mensual corta para revisar el estado del servicio.',
        instructions: [
          'Agendar call de 15min con el cliente',
          'Revisar: ¿hubo problemas? ¿cambios en el negocio?',
          'Anotar feedback y acciones pendientes',
          'Grabar la sesión',
        ],
        input: 'Reporte del mes anterior + issues pendientes',
        output: 'Notas del check-in + grabación',
        responsible: 'both',
      },
      {
        title: 'Reporte mensual enviado al cliente',
        description: 'Generar y enviar reporte con métricas: conversaciones, turnos, derivaciones, uptime.',
        instructions: [
          'Cargar los números del período en el generador de reportes',
          'Generar el Reporte Mensual desde los Outputs de esta fase',
          'Enviar al cliente por WhatsApp/email',
        ],
        input: 'Datos de analytics del chatbot del mes',
        output: 'Reporte mensual enviado al cliente',
        responsible: 'admin',
      },
      {
        title: 'KB actualizada si hubo cambios',
        description: 'Si el cliente cambió horarios, servicios o precios, actualizar la KB.',
        instructions: [
          'Preguntar al cliente si hay cambios',
          'Si sí → actualizar KB y re-entrenar chatbot',
          'Si no → marcar como "sin cambios este mes"',
        ],
        input: 'Feedback del check-in mensual',
        output: 'KB actualizada o nota de "sin cambios"',
        responsible: 'admin',
      },
      {
        title: 'Issues del período resueltos',
        description: 'Registrar y resolver cualquier problema reportado.',
        instructions: [
          'Revisar tickets/mensajes del período',
          'Documentar cada issue y su resolución',
          'Si hay issues pendientes, priorizarlos para el próximo mes',
        ],
        input: 'Tickets y mensajes del período',
        output: 'Lista de issues con estado (resuelto/pendiente)',
        responsible: 'admin',
      },
      {
        title: 'Próximos cambios comunicados',
        description: 'Informar al cliente sobre cambios planificados para el próximo período.',
        instructions: [
          'Revisar roadmap interno',
          'Si hay updates o mejoras → comunicar al cliente',
          'Si no hay cambios → confirmar continuidad',
        ],
        input: 'Roadmap interno + feedback del cliente',
        output: 'Comunicación enviada al cliente sobre próximo período',
        responsible: 'admin',
      },
    ],
  },
};
