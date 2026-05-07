import { useTenantContext } from '@/shared/providers/TenantProvider';

// ── Type ──────────────────────────────────────────────────────

interface LinkFieldDef { label: string; placeholder: string; }

interface SettingsMessages {
  brandPage:       { title: string; description: string };
  preferencesPage: { title: string; description: string };
  profilePage:     { title: string; description: string; comingSoon: string };
  teamPage:        { title: string; description: string };

  brandDetails: {
    sectionTitle: string; clickToAddBanner: string; changeBanner: string;
    addBanner: string; editLogo: string; addLogo: string; businessName: string;
    bookingUrl: string; urlReadOnly: string; industry: string;
    selectPlaceholder: string; about: string; aboutPlaceholder: string; save: string;
    errorUpload: string; successLogo: string; successBanner: string;
    errorUnexpected: string; successSave: string;
    errorTooLarge:   { title: string; description: string };
    errorInvalidType: { title: string; description: string };
    industries: readonly string[];
  };

  appearance: {
    sectionTitle: string; brandColor: string; custom: string;
    buttonShape: string; shapes: readonly [string, string, string];
    theme: string; themes: readonly [string, string, string];
    save: string; successSave: string;
  };

  contact: {
    sectionTitle: string; sectionDesc: string; primaryEmail: string;
    emailPlaceholder: string; primaryPhone: string; phonePlaceholder: string;
    additionalPhone: string; additionalEmail: string; addMore: string;
    save: string; successSave: string;
  };

  location: {
    sectionTitle: string; sectionDesc: string; address: string;
    addressPlaceholder: string; city: string; cityPlaceholder: string;
    state: string; postalCode: string; postalPlaceholder: string;
    country: string; countryPlaceholder: string; currency: string;
    currencyWarning: string; timezone: string; save: string; successSave: string;
  };

  workingHours: {
    sectionTitle: string; sectionDesc: string;
    days: readonly [string, string, string, string, string, string, string];
    closed: string; save: string; successSave: string;
  };

  links: {
    sectionTitle: string; sectionDesc: string; save: string; successSave: string;
    fields: {
      website: LinkFieldDef; instagram: LinkFieldDef; facebook: LinkFieldDef;
      tiktok: LinkFieldDef; youtube: LinkFieldDef; linkedin: LinkFieldDef;
      pinterest: LinkFieldDef;
    };
  };

  policies: {
    accordionTitle: string;
    leadTime:      { title: string; desc: string };
    bookingWindow: { title: string; desc: string };
    slotDuration:  { title: string; tooltip: string; desc: string };
    cancellation:  { title: string; desc: string };
    customMessage: { title: string; desc: string };
    addPolicyToHomepage: string;
    units: { minutes: string; hours: string; days: string; months: string };
    cancellationOptions: readonly string[];
    saving: string; save: string; errorSave: string; successSave: string;
  };

  config: {
    accordionTitle: string; flowTitle: string;
    firstSlot:     { title: string; hint: string };
    skipTeam:      { title: string; hint: string };
    multiServices: { title: string; hint: string };
    anyMember:     { title: string; hint: string };
    clientLogin:   { title: string; hint: string };
    required: string;
    accordion:     { title: string; hint: string };
    rescheduling:  { title: string; hint: string };
    cancellation:  { title: string; hint: string };
    rebookBtn:     { title: string; hint: string };
    contactFieldsTitle: string;
    fieldName: string; fieldPhone: string; fieldEmail: string; fieldAddress: string;
    required_badge: string; optional_badge: string;
    customFieldsTitle: string; fieldPlaceholder: string;
    addField: string; deleteFieldTitle: string;
    saving: string; save: string; errorSave: string; successSave: string;
  };

  personalization: {
    accordionTitle: string; generalTitle: string; preferredLang: string;
    timeFormat: string; timeFormat12: string; timeFormat24: string;
    weekStart: string; weekStartMon: string; weekStartSun: string;
    servicesTitle: string; showPrices: string; showDuration: string;
    showWorkingHours: string; showLocalTime: string;
    termsTitle: string; termsLabel: string; termsLabelPlaceholder: string;
    termsLink: string; requireAcceptance: string;
    redirectTitle: string; redirectLabel: string; redirectLabelPlaceholder: string;
    redirectLink: string;
    saving: string; save: string; errorSave: string; successSave: string;
  };

  visibility: {
    accordionTitle: string; searchResultsTitle: string; searchResultsDesc: string;
    showInSearch: string;
    saving: string; save: string; errorSave: string; successSave: string;
  };

  team: {
    membersTitle: string; noMembers: string; you: string; inactive: string;
    roleOwner: string; roleStaff: string;
    promoteToOwner: string; demoteToStaff: string;
    deactivate: string; reactivate: string;
    expired: string; pending: string; cancelInvite: string;
    pendingInvites: string; inviteMember: string; emailPlaceholder: string;
    cancel: string; sendInvite: string;
    successReactivate: string; successDeactivate: string;
    successRoleUpdate: string; successInviteCancel: string;
    successInviteSentPrefix: string;
  };
}

// ── Translations ──────────────────────────────────────────────

const SETTINGS_I18N: Record<'pt' | 'es' | 'en', SettingsMessages> = {
  pt: {
    brandPage:       { title: 'Sua marca',                   description: 'Configure a identidade visual do seu negócio.' },
    preferencesPage: { title: 'Preferências de agendamento', description: 'Configure como os seus clientes fazem reservas.' },
    profilePage:     { title: 'Seu perfil',                  description: 'Gerencie as suas informações pessoais e de acesso.', comingSoon: 'Em breve.' },
    teamPage:        { title: 'Sua equipa',                  description: 'Gerencie os membros da sua equipa e os seus acessos.' },

    brandDetails: {
      sectionTitle: 'Detalhes da marca', clickToAddBanner: 'Clique para adicionar banner',
      changeBanner: 'Alterar banner', addBanner: 'Adicionar banner',
      editLogo: 'Editar logo', addLogo: 'Adicionar logo',
      businessName: 'Nome do negócio', bookingUrl: 'URL da sua página de reservas',
      urlReadOnly: 'O URL não pode ser alterado após a criação.',
      industry: 'Indústria', selectPlaceholder: 'Selecionar…',
      about: 'Sobre', aboutPlaceholder: 'Apresente o seu negócio aos clientes…',
      save: 'Guardar', errorUpload: 'Erro ao carregar ficheiro',
      successLogo: 'Logo atualizado', successBanner: 'Banner atualizado',
      errorUnexpected: 'Erro inesperado ao carregar ficheiro', successSave: 'Dados da marca guardados',
      errorTooLarge: {
        title: 'Imagem demasiado grande',
        description: 'O ficheiro deve ser inferior a {maxMb} MB. Reduza ou comprima a imagem e tente novamente.',
      },
      errorInvalidType: {
        title: 'Formato não suportado',
        description: 'Apenas são aceites imagens JPEG, PNG, WebP, GIF, AVIF ou SVG.',
      },
      industries: ['Beleza', 'Saúde e Bem-estar', 'Fitness', 'Educação', 'Consultoria', 'Fotografia', 'Tecnologia', 'Alimentação', 'Moda', 'Outro'],
    },

    appearance: {
      sectionTitle: 'Aparência', brandColor: 'Cor da marca', custom: 'Personalizado:',
      buttonShape: 'Forma do botão', shapes: ['Pílula', 'Arredondado', 'Retângulo'],
      theme: 'Tema', themes: ['Sistema', 'Claro', 'Escuro'],
      save: 'Guardar', successSave: 'Aparência atualizada com sucesso',
    },

    contact: {
      sectionTitle: 'Detalhes do contato', sectionDesc: 'Deixe os seus leads e clientes saberem como entrar em contato.',
      primaryEmail: 'Email primário', emailPlaceholder: 'seu@email.com',
      primaryPhone: 'Telefone principal', phonePlaceholder: '912 345 678',
      additionalPhone: 'Telefone adicional', additionalEmail: 'Email adicional',
      addMore: 'Adicionar mais', save: 'Guardar', successSave: 'Contacto guardado',
    },

    location: {
      sectionTitle: 'Localização', sectionDesc: 'Forneça o seu endereço comercial para listar na sua página de reservas.',
      address: 'Endereço', addressPlaceholder: 'Rua exemplo, 123',
      city: 'Cidade', cityPlaceholder: 'Lisboa', state: 'Estado',
      postalCode: 'CEP', postalPlaceholder: '1000-000',
      country: 'País', countryPlaceholder: 'Portugal', currency: 'Moeda',
      currencyWarning: 'Desconecte o seu provedor de pagamentos para alterar a moeda. Reconecte-o quando terminar.',
      timezone: 'Fuso horário', save: 'Guardar', successSave: 'Localização atualizada com sucesso',
    },

    workingHours: {
      sectionTitle: 'Horário de trabalho', sectionDesc: 'Destaque quando o seu negócio abre e fecha na sua página de reservas.',
      days: ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'],
      closed: 'Fechado', save: 'Guardar', successSave: 'Horários guardados',
    },

    links: {
      sectionTitle: 'Seus links', sectionDesc: 'Direcione visitantes para o seu site, redes sociais e muito mais.',
      save: 'Guardar', successSave: 'Links guardados',
      fields: {
        website:   { label: 'Site',      placeholder: 'https://seu-site.com'                      },
        instagram: { label: 'Instagram', placeholder: 'https://instagram.com/seu-perfil'           },
        facebook:  { label: 'Facebook',  placeholder: 'https://facebook.com/sua-pagina'            },
        tiktok:    { label: 'TikTok',    placeholder: 'https://tiktok.com/@seu-perfil'             },
        youtube:   { label: 'YouTube',   placeholder: 'https://youtube.com/@seu-canal'             },
        linkedin:  { label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/sua-empresa'   },
        pinterest: { label: 'Pinterest', placeholder: 'https://pinterest.com/seu-perfil'           },
      },
    },

    policies: {
      accordionTitle: 'Políticas de reserva',
      leadTime:      { title: 'Tempo de reserva',              desc: 'Com quanto de antecedência é necessário avisar antes de uma consulta?' },
      bookingWindow: { title: 'Janela de agendamento',         desc: 'Com quanto de antecedência os clientes podem marcar' },
      slotDuration:  { title: 'Tamanho do horário de reserva', tooltip: 'Se selecionar 1 hora, as vagas aparecem a cada hora a partir da abertura.', desc: 'Com que frequência devem aparecer as vagas disponíveis?' },
      cancellation:  { title: 'Política de cancelamento',      desc: 'Quanto antes de um compromisso os Clientes podem remarcar ou cancelar?' },
      customMessage: { title: 'Mensagem personalizada',        desc: 'Partilhe informações sobre alterações, reembolsos e mais antes dos clientes confirmarem.' },
      addPolicyToHomepage: 'Adicionar política à página inicial',
      units: { minutes: 'Minutos', hours: 'Horas', days: 'Dias', months: 'Meses' },
      cancellationOptions: ['Em qualquer momento', '1 hora', '2 horas', '4 horas', '6 horas', '10 horas', '12 horas', '24 horas', '48 horas', '72 horas', '1 semana', 'Nunca'],
      saving: 'Guardando...', save: 'Guardar', errorSave: 'Erro ao guardar políticas', successSave: 'Políticas guardadas com sucesso',
    },

    config: {
      accordionTitle: 'Configuração de agendamento', flowTitle: 'Fluxo de Reservas',
      firstSlot:     { title: 'Primeira Marcação Disponível',   hint: 'Direciona os clientes para o primeiro horário disponível.' },
      skipTeam:      { title: 'Saltar membros da equipa',       hint: 'O cliente seleciona um horário e é atribuído automaticamente a um membro da equipa.' },
      multiServices: { title: 'Prestar Serviços Múltiplos',     hint: 'Permite reservar vários serviços de uma vez' },
      anyMember:     { title: 'Qualquer membro da equipa',      hint: 'Permite que os clientes evitem selecionar um membro da equipa durante o agendamento' },
      clientLogin:   { title: 'Login de Cliente',               hint: 'Requer que os clientes façam login' },
      required: 'Obrigatório',
      accordion:     { title: 'Vista Accordion',                hint: 'Mostra os passos em forma de acordeão' },
      rescheduling:  { title: 'Permitir o reagendamento online', hint: 'Clientes podem remarcar pelo link da reserva' },
      cancellation:  { title: 'Permitir cancelamentos online',  hint: 'Clientes podem cancelar pelo link da reserva' },
      rebookBtn:     { title: "Botão 'Fazer nova marcação'",    hint: 'Mostrar botão após a confirmação' },
      contactFieldsTitle: 'Campos de contato',
      fieldName: 'Nome', fieldPhone: 'Telefone', fieldEmail: 'E-mail', fieldAddress: 'Endereço',
      required_badge: 'Obrigatório', optional_badge: 'Opcional',
      customFieldsTitle: 'Campos personalizados', fieldPlaceholder: 'Nome do campo…',
      addField: 'Adicionar campo personalizado', deleteFieldTitle: 'Eliminar campo',
      saving: 'Guardando...', save: 'Guardar', errorSave: 'Erro ao guardar configuração', successSave: 'Configuração guardada com sucesso',
    },

    personalization: {
      accordionTitle: 'Personalização', generalTitle: 'Geral', preferredLang: 'Língua preferida',
      timeFormat: 'Formato do tempo', timeFormat12: '12 Horas', timeFormat24: '24 Horas',
      weekStart: 'Semana começa em', weekStartMon: 'Segunda-feira', weekStartSun: 'Domingo',
      servicesTitle: 'Serviços e aulas', showPrices: 'Preços de serviços e aulas',
      showDuration: 'Serviço e duração da aula', showWorkingHours: 'Horário de trabalho', showLocalTime: 'Hora local',
      termsTitle: 'Termos e condições', termsLabel: 'Etiqueta', termsLabelPlaceholder: 'Ex: Termos de Serviço',
      termsLink: 'Link Termos', requireAcceptance: 'Requerer aceitação',
      redirectTitle: 'Confirmação de Redirecionamento', redirectLabel: 'Etiqueta', redirectLabelPlaceholder: 'Ex: Voltar ao site',
      redirectLink: 'Link Redirecionamento',
      saving: 'Guardando...', save: 'Guardar', errorSave: 'Erro ao guardar personalização', successSave: 'Personalização guardada com sucesso',
    },

    visibility: {
      accordionTitle: 'Visibilidade da página de agendamentos',
      searchResultsTitle: 'Resultados de pesquisa',
      searchResultsDesc: 'Faça com que a sua página de reservas apareça no Google e noutros motores de busca.',
      showInSearch: 'Aparecer nos resultados de pesquisa',
      saving: 'Guardando...', save: 'Guardar', errorSave: 'Erro ao guardar visibilidade', successSave: 'Visibilidade guardada com sucesso',
    },

    team: {
      membersTitle: 'Membros da equipa', noMembers: 'Sem membros ainda.', you: '(você)', inactive: 'Inativo',
      roleOwner: 'Proprietário', roleStaff: 'Staff',
      promoteToOwner: 'Promover a proprietário', demoteToStaff: 'Rebaixar a staff',
      deactivate: 'Desativar membro', reactivate: 'Reativar membro',
      expired: 'Expirado', pending: 'Pendente', cancelInvite: 'Cancelar convite',
      pendingInvites: 'Convites pendentes', inviteMember: 'Convidar membro', emailPlaceholder: 'email@exemplo.com',
      cancel: 'Cancelar', sendInvite: 'Enviar convite',
      successReactivate: 'Membro reativado', successDeactivate: 'Membro desativado',
      successRoleUpdate: 'Papel atualizado', successInviteCancel: 'Convite cancelado',
      successInviteSentPrefix: 'Convite enviado para ',
    },
  },

  es: {
    brandPage:       { title: 'Tu marca',                    description: 'Configura la identidad visual de tu negocio.' },
    preferencesPage: { title: 'Preferencias de agenda',      description: 'Configura cómo tus clientes hacen reservas.' },
    profilePage:     { title: 'Tu perfil',                   description: 'Gestiona tu información personal y de acceso.', comingSoon: 'Próximamente.' },
    teamPage:        { title: 'Tu equipo',                   description: 'Gestiona los miembros de tu equipo y sus accesos.' },

    brandDetails: {
      sectionTitle: 'Detalles de la marca', clickToAddBanner: 'Haz clic para añadir banner',
      changeBanner: 'Cambiar banner', addBanner: 'Añadir banner',
      editLogo: 'Editar logo', addLogo: 'Añadir logo',
      businessName: 'Nombre del negocio', bookingUrl: 'URL de tu página de reservas',
      urlReadOnly: 'La URL no puede cambiarse después de la creación.',
      industry: 'Sector', selectPlaceholder: 'Seleccionar…',
      about: 'Sobre', aboutPlaceholder: 'Presenta tu negocio a los clientes…',
      save: 'Guardar', errorUpload: 'Error al subir el archivo',
      successLogo: 'Logo actualizado', successBanner: 'Banner actualizado',
      errorUnexpected: 'Error inesperado al subir el archivo', successSave: 'Datos de la marca guardados',
      errorTooLarge: {
        title: 'Imagen demasiado grande',
        description: 'El archivo debe ser menor de {maxMb} MB. Redúcelo o comprímelo e inténtalo de nuevo.',
      },
      errorInvalidType: {
        title: 'Formato no soportado',
        description: 'Solo se aceptan imágenes JPEG, PNG, WebP, GIF, AVIF o SVG.',
      },
      industries: ['Belleza', 'Salud y Bienestar', 'Fitness', 'Educación', 'Consultoría', 'Fotografía', 'Tecnología', 'Alimentación', 'Moda', 'Otro'],
    },

    appearance: {
      sectionTitle: 'Apariencia', brandColor: 'Color de la marca', custom: 'Personalizado:',
      buttonShape: 'Forma del botón', shapes: ['Píldora', 'Redondeado', 'Rectángulo'],
      theme: 'Tema', themes: ['Sistema', 'Claro', 'Oscuro'],
      save: 'Guardar', successSave: 'Apariencia actualizada con éxito',
    },

    contact: {
      sectionTitle: 'Detalles de contacto', sectionDesc: 'Deja que tus leads y clientes sepan cómo contactarte.',
      primaryEmail: 'Email principal', emailPlaceholder: 'tu@email.com',
      primaryPhone: 'Teléfono principal', phonePlaceholder: '600 000 000',
      additionalPhone: 'Teléfono adicional', additionalEmail: 'Email adicional',
      addMore: 'Añadir más', save: 'Guardar', successSave: 'Contacto guardado',
    },

    location: {
      sectionTitle: 'Ubicación', sectionDesc: 'Proporciona tu dirección comercial para mostrar en tu página de reservas.',
      address: 'Dirección', addressPlaceholder: 'Calle Ejemplo, 123',
      city: 'Ciudad', cityPlaceholder: 'Madrid', state: 'Provincia',
      postalCode: 'Código postal', postalPlaceholder: '28001',
      country: 'País', countryPlaceholder: 'España', currency: 'Moneda',
      currencyWarning: 'Desconecta tu proveedor de pagos para cambiar la moneda. Vuelve a conectarlo cuando termines.',
      timezone: 'Zona horaria', save: 'Guardar', successSave: 'Ubicación actualizada con éxito',
    },

    workingHours: {
      sectionTitle: 'Horario de trabajo', sectionDesc: 'Indica cuándo abre y cierra tu negocio en tu página de reservas.',
      days: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
      closed: 'Cerrado', save: 'Guardar', successSave: 'Horarios guardados',
    },

    links: {
      sectionTitle: 'Tus enlaces', sectionDesc: 'Dirige a los visitantes a tu sitio web, redes sociales y mucho más.',
      save: 'Guardar', successSave: 'Enlaces guardados',
      fields: {
        website:   { label: 'Sitio web',  placeholder: 'https://tu-sitio.com'                        },
        instagram: { label: 'Instagram',  placeholder: 'https://instagram.com/tu-perfil'             },
        facebook:  { label: 'Facebook',   placeholder: 'https://facebook.com/tu-pagina'              },
        tiktok:    { label: 'TikTok',     placeholder: 'https://tiktok.com/@tu-perfil'               },
        youtube:   { label: 'YouTube',    placeholder: 'https://youtube.com/@tu-canal'               },
        linkedin:  { label: 'LinkedIn',   placeholder: 'https://linkedin.com/company/tu-empresa'     },
        pinterest: { label: 'Pinterest',  placeholder: 'https://pinterest.com/tu-perfil'             },
      },
    },

    policies: {
      accordionTitle: 'Políticas de reserva',
      leadTime:      { title: 'Tiempo de reserva',              desc: '¿Con cuánta antelación hay que avisar antes de una cita?' },
      bookingWindow: { title: 'Ventana de agendamiento',        desc: '¿Con cuánta antelación pueden reservar los clientes?' },
      slotDuration:  { title: 'Tamaño del horario de reserva',  tooltip: 'Si seleccionas 1 hora, aparecerán franjas cada hora desde la apertura.', desc: '¿Con qué frecuencia deben aparecer las franjas disponibles?' },
      cancellation:  { title: 'Política de cancelación',        desc: '¿Con cuánta antelación pueden los clientes reprogramar o cancelar?' },
      customMessage: { title: 'Mensaje personalizado',          desc: 'Comparte información sobre cambios en reservas, reembolsos y más antes de que los clientes confirmen.' },
      addPolicyToHomepage: 'Añadir política a la página de inicio',
      units: { minutes: 'Minutos', hours: 'Horas', days: 'Días', months: 'Meses' },
      cancellationOptions: ['En cualquier momento', '1 hora', '2 horas', '4 horas', '6 horas', '10 horas', '12 horas', '24 horas', '48 horas', '72 horas', '1 semana', 'Nunca'],
      saving: 'Guardando...', save: 'Guardar', errorSave: 'Error al guardar políticas', successSave: 'Políticas guardadas con éxito',
    },

    config: {
      accordionTitle: 'Configuración de agenda', flowTitle: 'Flujo de Reservas',
      firstSlot:     { title: 'Primera Cita Disponible',         hint: 'Dirige a los clientes a su primer horario disponible.' },
      skipTeam:      { title: 'Omitir miembros del equipo',      hint: 'El cliente selecciona una franja y se le asigna automáticamente un miembro del equipo.' },
      multiServices: { title: 'Prestar Múltiples Servicios',     hint: 'Permite reservar varios servicios a la vez' },
      anyMember:     { title: 'Cualquier miembro del equipo',    hint: 'Permite que los clientes eviten seleccionar un miembro del equipo al reservar' },
      clientLogin:   { title: 'Login de Cliente',                hint: 'Requiere que los clientes inicien sesión' },
      required: 'Obligatorio',
      accordion:     { title: 'Vista Accordion',                 hint: 'Muestra los pasos en forma de acordeón' },
      rescheduling:  { title: 'Permitir reagendamiento online',  hint: 'Los clientes pueden reprogramar desde el enlace de reserva' },
      cancellation:  { title: 'Permitir cancelaciones online',   hint: 'Los clientes pueden cancelar desde el enlace de reserva' },
      rebookBtn:     { title: "Botón 'Nueva reserva'",           hint: 'Mostrar botón tras la confirmación' },
      contactFieldsTitle: 'Campos de contacto',
      fieldName: 'Nombre', fieldPhone: 'Teléfono', fieldEmail: 'E-mail', fieldAddress: 'Dirección',
      required_badge: 'Obligatorio', optional_badge: 'Opcional',
      customFieldsTitle: 'Campos personalizados', fieldPlaceholder: 'Nombre del campo…',
      addField: 'Añadir campo personalizado', deleteFieldTitle: 'Eliminar campo',
      saving: 'Guardando...', save: 'Guardar', errorSave: 'Error al guardar configuración', successSave: 'Configuración guardada con éxito',
    },

    personalization: {
      accordionTitle: 'Personalización', generalTitle: 'General', preferredLang: 'Idioma preferido',
      timeFormat: 'Formato de hora', timeFormat12: '12 Horas', timeFormat24: '24 Horas',
      weekStart: 'La semana comienza en', weekStartMon: 'Lunes', weekStartSun: 'Domingo',
      servicesTitle: 'Servicios y clases', showPrices: 'Precios de servicios y clases',
      showDuration: 'Servicio y duración de la clase', showWorkingHours: 'Horario de trabajo', showLocalTime: 'Hora local',
      termsTitle: 'Términos y condiciones', termsLabel: 'Etiqueta', termsLabelPlaceholder: 'Ej: Términos de Servicio',
      termsLink: 'Enlace Términos', requireAcceptance: 'Requerir aceptación',
      redirectTitle: 'Confirmación de Redirección', redirectLabel: 'Etiqueta', redirectLabelPlaceholder: 'Ej: Volver al sitio',
      redirectLink: 'Enlace Redirección',
      saving: 'Guardando...', save: 'Guardar', errorSave: 'Error al guardar personalización', successSave: 'Personalización guardada con éxito',
    },

    visibility: {
      accordionTitle: 'Visibilidad de la página de reservas',
      searchResultsTitle: 'Resultados de búsqueda',
      searchResultsDesc: 'Haz que tu página de reservas aparezca en Google y otros motores de búsqueda.',
      showInSearch: 'Aparecer en los resultados de búsqueda',
      saving: 'Guardando...', save: 'Guardar', errorSave: 'Error al guardar visibilidad', successSave: 'Visibilidad guardada con éxito',
    },

    team: {
      membersTitle: 'Miembros del equipo', noMembers: 'Sin miembros aún.', you: '(tú)', inactive: 'Inactivo',
      roleOwner: 'Propietario', roleStaff: 'Staff',
      promoteToOwner: 'Promover a propietario', demoteToStaff: 'Degradar a staff',
      deactivate: 'Desactivar miembro', reactivate: 'Reactivar miembro',
      expired: 'Expirado', pending: 'Pendiente', cancelInvite: 'Cancelar invitación',
      pendingInvites: 'Invitaciones pendientes', inviteMember: 'Invitar miembro', emailPlaceholder: 'email@ejemplo.com',
      cancel: 'Cancelar', sendInvite: 'Enviar invitación',
      successReactivate: 'Miembro reactivado', successDeactivate: 'Miembro desactivado',
      successRoleUpdate: 'Rol actualizado', successInviteCancel: 'Invitación cancelada',
      successInviteSentPrefix: 'Invitación enviada a ',
    },
  },

  en: {
    brandPage:       { title: 'Your brand',              description: 'Configure your business visual identity.' },
    preferencesPage: { title: 'Scheduling preferences',  description: 'Configure how your clients make bookings.' },
    profilePage:     { title: 'Your profile',            description: 'Manage your personal information and access.', comingSoon: 'Coming soon.' },
    teamPage:        { title: 'Your team',               description: 'Manage your team members and their access.' },

    brandDetails: {
      sectionTitle: 'Brand details', clickToAddBanner: 'Click to add banner',
      changeBanner: 'Change banner', addBanner: 'Add banner',
      editLogo: 'Edit logo', addLogo: 'Add logo',
      businessName: 'Business name', bookingUrl: 'URL of your booking page',
      urlReadOnly: 'The URL cannot be changed after creation.',
      industry: 'Industry', selectPlaceholder: 'Select…',
      about: 'About', aboutPlaceholder: 'Introduce your business to clients…',
      save: 'Save', errorUpload: 'Error uploading file',
      successLogo: 'Logo updated', successBanner: 'Banner updated',
      errorUnexpected: 'Unexpected error uploading file', successSave: 'Brand details saved',
      errorTooLarge: {
        title: 'File too large',
        description: 'The file must be under {maxMb} MB. Reduce or compress the image and try again.',
      },
      errorInvalidType: {
        title: 'Unsupported format',
        description: 'Only JPEG, PNG, WebP, GIF, AVIF or SVG images are accepted.',
      },
      industries: ['Beauty', 'Health & Wellness', 'Fitness', 'Education', 'Consulting', 'Photography', 'Technology', 'Food', 'Fashion', 'Other'],
    },

    appearance: {
      sectionTitle: 'Appearance', brandColor: 'Brand color', custom: 'Custom:',
      buttonShape: 'Button shape', shapes: ['Pill', 'Rounded', 'Rectangle'],
      theme: 'Theme', themes: ['System', 'Light', 'Dark'],
      save: 'Save', successSave: 'Appearance updated successfully',
    },

    contact: {
      sectionTitle: 'Contact details', sectionDesc: 'Let your leads and clients know how to reach you.',
      primaryEmail: 'Primary email', emailPlaceholder: 'you@email.com',
      primaryPhone: 'Primary phone', phonePlaceholder: '+1 555 000 0000',
      additionalPhone: 'Additional phone', additionalEmail: 'Additional email',
      addMore: 'Add more', save: 'Save', successSave: 'Contact saved',
    },

    location: {
      sectionTitle: 'Location', sectionDesc: 'Provide your business address to list on your booking page.',
      address: 'Address', addressPlaceholder: 'Example Street, 123',
      city: 'City', cityPlaceholder: 'London', state: 'State / Region',
      postalCode: 'Postal code', postalPlaceholder: 'SW1A 1AA',
      country: 'Country', countryPlaceholder: 'United Kingdom', currency: 'Currency',
      currencyWarning: 'Disconnect your payment provider to change the currency. Reconnect it when done.',
      timezone: 'Time zone', save: 'Save', successSave: 'Location updated successfully',
    },

    workingHours: {
      sectionTitle: 'Working hours', sectionDesc: 'Show when your business opens and closes on your booking page.',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      closed: 'Closed', save: 'Save', successSave: 'Hours saved',
    },

    links: {
      sectionTitle: 'Your links', sectionDesc: 'Direct visitors to your website, social media and more.',
      save: 'Save', successSave: 'Links saved',
      fields: {
        website:   { label: 'Website',   placeholder: 'https://your-site.com'                        },
        instagram: { label: 'Instagram', placeholder: 'https://instagram.com/your-profile'           },
        facebook:  { label: 'Facebook',  placeholder: 'https://facebook.com/your-page'               },
        tiktok:    { label: 'TikTok',    placeholder: 'https://tiktok.com/@your-profile'             },
        youtube:   { label: 'YouTube',   placeholder: 'https://youtube.com/@your-channel'            },
        linkedin:  { label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/your-company'    },
        pinterest: { label: 'Pinterest', placeholder: 'https://pinterest.com/your-profile'           },
      },
    },

    policies: {
      accordionTitle: 'Booking policies',
      leadTime:      { title: 'Booking lead time',    desc: 'How much notice is required before an appointment?' },
      bookingWindow: { title: 'Booking window',       desc: 'How far in advance can clients book?' },
      slotDuration:  { title: 'Booking slot size',    tooltip: 'If you select a 1-hour slot, available times appear every hour from opening.', desc: 'How often should available slots appear?' },
      cancellation:  { title: 'Cancellation policy',  desc: 'How far in advance can clients reschedule or cancel?' },
      customMessage: { title: 'Custom message',       desc: 'Share info about booking changes, refunds and more before clients confirm.' },
      addPolicyToHomepage: 'Add policy to homepage',
      units: { minutes: 'Minutes', hours: 'Hours', days: 'Days', months: 'Months' },
      cancellationOptions: ['Anytime', '1 hour', '2 hours', '4 hours', '6 hours', '10 hours', '12 hours', '24 hours', '48 hours', '72 hours', '1 week', 'Never'],
      saving: 'Saving...', save: 'Save', errorSave: 'Error saving policies', successSave: 'Policies saved successfully',
    },

    config: {
      accordionTitle: 'Scheduling config', flowTitle: 'Booking Flow',
      firstSlot:     { title: 'First Available Slot',          hint: 'Directs clients to their first available time slot.' },
      skipTeam:      { title: 'Skip team member',              hint: 'The client selects a slot and is automatically assigned a team member.' },
      multiServices: { title: 'Allow Multiple Services',       hint: 'Allows booking several services at once' },
      anyMember:     { title: 'Any team member',               hint: 'Allow clients to skip selecting a team member during booking' },
      clientLogin:   { title: 'Client Login',                  hint: 'Requires clients to log in' },
      required: 'Required',
      accordion:     { title: 'Accordion View',                hint: 'Shows steps in accordion form' },
      rescheduling:  { title: 'Allow online rescheduling',     hint: 'Clients can reschedule via the booking link' },
      cancellation:  { title: 'Allow online cancellations',    hint: 'Clients can cancel via the booking link' },
      rebookBtn:     { title: "'Book again' button",           hint: 'Show button after confirmation' },
      contactFieldsTitle: 'Contact fields',
      fieldName: 'Name', fieldPhone: 'Phone', fieldEmail: 'E-mail', fieldAddress: 'Address',
      required_badge: 'Required', optional_badge: 'Optional',
      customFieldsTitle: 'Custom fields', fieldPlaceholder: 'Field name…',
      addField: 'Add custom field', deleteFieldTitle: 'Delete field',
      saving: 'Saving...', save: 'Save', errorSave: 'Error saving config', successSave: 'Config saved successfully',
    },

    personalization: {
      accordionTitle: 'Customization', generalTitle: 'General', preferredLang: 'Preferred language',
      timeFormat: 'Time format', timeFormat12: '12 hours', timeFormat24: '24 hours',
      weekStart: 'Week starts on', weekStartMon: 'Monday', weekStartSun: 'Sunday',
      servicesTitle: 'Services & classes', showPrices: 'Service and class prices',
      showDuration: 'Service and class duration', showWorkingHours: 'Working hours', showLocalTime: 'Local time',
      termsTitle: 'Terms & conditions', termsLabel: 'Label', termsLabelPlaceholder: 'e.g. Terms of Service',
      termsLink: 'Terms URL', requireAcceptance: 'Require acceptance',
      redirectTitle: 'Redirect Confirmation', redirectLabel: 'Label', redirectLabelPlaceholder: 'e.g. Back to site',
      redirectLink: 'Redirect URL',
      saving: 'Saving...', save: 'Save', errorSave: 'Error saving customization', successSave: 'Customization saved successfully',
    },

    visibility: {
      accordionTitle: 'Booking page visibility',
      searchResultsTitle: 'Search results',
      searchResultsDesc: 'Make your booking page appear on Google and other search engines.',
      showInSearch: 'Appear in search results',
      saving: 'Saving...', save: 'Save', errorSave: 'Error saving visibility', successSave: 'Visibility saved successfully',
    },

    team: {
      membersTitle: 'Team members', noMembers: 'No members yet.', you: '(you)', inactive: 'Inactive',
      roleOwner: 'Owner', roleStaff: 'Staff',
      promoteToOwner: 'Promote to owner', demoteToStaff: 'Demote to staff',
      deactivate: 'Deactivate member', reactivate: 'Reactivate member',
      expired: 'Expired', pending: 'Pending', cancelInvite: 'Cancel invitation',
      pendingInvites: 'Pending invitations', inviteMember: 'Invite member', emailPlaceholder: 'email@example.com',
      cancel: 'Cancel', sendInvite: 'Send invitation',
      successReactivate: 'Member reactivated', successDeactivate: 'Member deactivated',
      successRoleUpdate: 'Role updated', successInviteCancel: 'Invitation cancelled',
      successInviteSentPrefix: 'Invitation sent to ',
    },
  },
};

// ── Accessors ─────────────────────────────────────────────────

/** Pure accessor for server components — pass locale from headers(). */
export function getSettingsT(locale: string): SettingsMessages {
  const key = (locale === 'es' || locale === 'en') ? locale : 'pt';
  return SETTINGS_I18N[key];
}

/** React hook for client components — reads locale from TenantContext. */
export function useSettingsT(): SettingsMessages {
  const { locale } = useTenantContext();
  return getSettingsT(locale);
}
