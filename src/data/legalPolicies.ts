export interface PolicySection {
  id: string;
  title: string;
  shortTitle: string;
  icon: string;
  badge?: string;
  lastUpdated: string;
  summary: string;
  content: {
    heading: string;
    paragraphs: string[];
    bullets?: string[];
    highlight?: string;
  }[];
}

export const LEGAL_POLICIES: PolicySection[] = [
  {
    id: 'aviso-legal',
    title: 'Aviso Legal Internacional (Colombia, EE.UU. y Unión Europea)',
    shortTitle: 'Aviso Legal Oficial',
    icon: 'Building2',
    badge: 'Ley 1480 / FTC / Directiva 2000/31/CE',
    lastUpdated: '2 de Octubre de 2026',
    summary: 'Información societaria obligatoria, titularidad del dominio, aviso para consumidores de Colombia, Estados Unidos y la Unión Europea, y canales de contacto legal.',
    content: [
      {
        heading: '1. Identificación del Titular del Sitio Web y Comercio',
        paragraphs: [
          'En cumplimiento del deber de información mercantil y comercial consagrado en la Ley 527 de 1999 y Ley 1480 de 2011 (Colombia), la Directiva 2000/31/CE y Reglamento (UE) 2022/2065 de Servicios Digitales (DSA - Unión Europea), y los lineamientos de la Federal Trade Commission (FTC - Estados Unidos), se informa a los usuarios y consumidores que este sitio web es operado y administrado por:',
          'Razón Social: URBANNOISE S.A.S. (Sociedad por Acciones Simplificada legalmente constituida en Bogotá D.C., Colombia).',
          'Número de Identificación Tributaria (NIT): 901.847.239-1.',
          'Domicilio Principal y Atelier: Cra 10 # 9-37, Local 23-54, Centro Comercial El GranSan, Bogotá D.C., Colombia (Código Postal: 110221).',
          'Correo electrónico oficial: urban.noice2023@gmail.com.',
          'Línea de atención telefónica y WhatsApp: (+57) 310 872 0491.',
          'Objeto social: Diseño, confección, comercialización nacional e internacional y distribución al por menor y mayor de prendas de vestir, accesorios de moda urbana, streetwear y calzado.'
        ]
      },
      {
        heading: '2. Cláusulas y Disposiciones para Consumidores en Colombia (Estatuto del Consumidor)',
        paragraphs: [
          'De conformidad con la Ley 1480 de 2011, URBANNOISE garantiza información veraz, suficiente, transparente y en idioma castellano respecto a las características, materiales (algodón nacional de alto gramaje 210g-320g), tallas, precios en pesos colombianos (COP), impuestos y disponibilidad.',
          'Autoridad de Vigilancia y Control en Colombia: Superintendencia de Industria y Comercio (SIC) - Dirección: Carrera 13 No. 27 - 00, Bogotá D.C. Línea gratuita nacional: 01 8000 910165. Portal web: www.sic.gov.co.'
        ]
      },
      {
        heading: '3. Disposiciones para Consumidores en los Estados Unidos (U.S. Consumers & FTC Compliance)',
        paragraphs: [
          'Para usuarios que accedan o adquieran productos desde los Estados Unidos de América:',
          'Disclaimer of Warranties: To the fullest extent permissible pursuant to applicable federal and state law, except for our explicit 60-day quality guarantee, products and content are provided "as is" and without warranties of any kind either express or implied.',
          'DMCA Notice & Copyright Agent: If you believe that content on our platform infringes your copyright under the Digital Millennium Copyright Act (17 U.S.C. § 512), please contact our designated agent at urban.noice2023@gmail.com with the subject "DMCA Notice".',
          'Tariffs & Currency: Transactions are processed in Colombian Pesos (COP). International bank card issuers may apply standard foreign exchange conversion rates.'
        ]
      },
      {
        heading: '4. Disposiciones para Consumidores en la Unión Europea (EU Consumers & DSA / ODR)',
        paragraphs: [
          'De conformidad con la normativa comunitaria europea sobre comercio electrónico y contratos a distancia:',
          'Plataforma de Resolución de Litigios en Línea (ODR): La Comisión Europea facilita una plataforma oficial de resolución extrajudicial de litigios en línea para consumidores de la UE, disponible en: https://ec.europa.eu/consumers/odr/.',
          'Derechos de Retracto Internacional: Se reconocen las garantías legales de conformidad del producto conforme a la legislación aplicable a ventas transfronterizas.'
        ]
      }
    ]
  },
  {
    id: 'terminos',
    title: 'Términos y Condiciones de Uso y Compra',
    shortTitle: 'Términos y Condiciones',
    icon: 'FileText',
    badge: 'Ley 1480 / Ley 527 / FTC / DSA',
    lastUpdated: '2 de Octubre de 2026',
    summary: 'Condiciones generales de compraventa electrónica, validez de pedidos, precios en pesos colombianos (COP), envíos nacionales y legislación aplicable.',
    content: [
      {
        heading: '1. Aceptación de los Términos',
        paragraphs: [
          'Al acceder, navegar o realizar cualquier transacción de compra en www.urbannoise.com o sus canales digitales asociados, el usuario declara haber leído, comprendido y aceptado en su totalidad estos Términos y Condiciones, los cuales tienen fuerza vinculante conforme a la Ley 527 de 1999 (Comercio Electrónico y Firmas Digitales) y la Ley 1480 de 2011 (Estatuto del Consumidor Colombiano).'
        ]
      },
      {
        heading: '2. Capacidad Legal para Contratar',
        paragraphs: [
          'Los servicios y compras ofrecidos están disponibles únicamente para personas naturales que cuenten con plena capacidad legal para obligarse conforme a la legislación aplicable (mayores de 18 años). Los actos de menores de edad en el sitio serán responsabilidad exclusiva de sus representantes legales.'
        ]
      },
      {
        heading: '3. Características de las Prendas y Siluetas Oversize',
        paragraphs: [
          'URBANNOISE comercializa prendas de moda urbana, streetwear y siluetas contemporáneas (Boxy Fit, Heavyweight Cotton 210g-320g, Dama Oversize y cápsulas de edición limitada). Las fotografías en el portal corresponden a prendas reales; pequeñas variaciones tonales pueden presentarse debido a calibraciones de pantalla o procesos artesanales de tintorería y serigrafía.'
        ]
      },
      {
        heading: '4. Precios, Moneda (COP) e Impuestos',
        paragraphs: [
          'Todos los precios publicados en la plataforma están expresados en Pesos Colombianos (COP) e incluyen los impuestos aplicables conforme a la legislación tributaria colombiana (IVA).',
          'En caso de error involuntario manifiesto en el precio publicado, URBANNOISE contactará al cliente para confirmar la transacción al precio real o autorizar el reembolso inmediato sin costo alguno.'
        ]
      },
      {
        heading: '5. Pagos Seguros y Procesamiento Criptográfico',
        paragraphs: [
          'Los pagos en línea se procesan mediante infraestructura certificada PCI-DSS Nivel 1. Se admiten pagos mediante PSE (Cuentas de ahorro y corriente en Colombia), Tarjetas de Crédito y Débito (Visa, Mastercard, American Express), transferencias bancarias directas y pago contra entrega en Bogotá D.C.'
        ]
      },
      {
        heading: '6. Propiedad Intelectual',
        paragraphs: [
          'Todas las marcas, logotipos "ии", tipografías, estampados, lookbooks, fotografías, textos y código fuente son propiedad exclusiva de URBANNOISE S.A.S. Queda prohibida su reproducción sin consentimiento previo por escrito.'
        ]
      }
    ]
  },
  {
    id: 'datos',
    title: 'Política de Privacidad y Protección de Datos (Colombia, EE.UU. y Unión Europea)',
    shortTitle: 'Política de Privacidad',
    icon: 'ShieldCheck',
    badge: 'Ley 1581 / RGPD / CCPA',
    lastUpdated: '2 de Octubre de 2026',
    summary: 'Tratamiento responsable y encriptado de datos personales conforme al Estatuto de Habeas Data colombiano (Ley 1581), el Reglamento General de Protección de Datos de la UE (RGPD 2016/679) y la CCPA/CPRA de California.',
    content: [
      {
        heading: '1. Responsable del Tratamiento y Oficial de Privacidad',
        paragraphs: [
          'El responsable del tratamiento de tus datos personales es URBANNOISE S.A.S., identificada con NIT 901.847.239-1, con domicilio en Bogotá D.C., Colombia.',
          'Canal de atención para el ejercicio de derechos de privacidad: urban.noice2023@gmail.com o vía WhatsApp al (+57) 310 872 0491 con el asunto "Derechos de Privacidad / Habeas Data".'
        ]
      },
      {
        heading: '2. Finalidades Legítimas del Tratamiento',
        paragraphs: [
          'Los datos personales recopilados (nombre, documento de identidad, dirección, teléfono y correo electrónico) son recolectados con fines lícitos y específicos:',
          '• Procesamiento, facturación digital y cobro seguro de pedidos a través de pasarelas certificadas.',
          '• Coordinación logística y despacho de encomiendas con empresas transportadoras autorizadas (Servientrega, Coordinadora, Envía, Inter Rapidísimo).',
          '• Notificación del estado de entrega, número de guía y seguimiento en tiempo real.',
          '• Atención de solicitudes, garantías, PQRS y ejercicio de derechos de retracto.',
          '• Envío de novedades de nuevas colecciones exclusivamente cuando el usuario haya otorgado su consentimiento expreso previo.'
        ]
      },
      {
        heading: '3. Marco Legal Colombiano: Derechos ARCO (Ley 1581 de 2012 y Decreto 1377)',
        paragraphs: [
          'Como titular de datos personales en Colombia, te asisten los derechos de:',
          'a) Conocer, actualizar y rectificar tus datos personales frente a URBANNOISE.',
          'b) Solicitar prueba de la autorización otorgada.',
          'c) Ser informado del uso que se le ha dado a tus datos.',
          'd) Revocar la autorización y/o solicitar la supresión del dato cuando no medie un deber legal o contractual de conservarlo (ej: facturación tributaria Dian).',
          'e) Presentar quejas ante la Superintendencia de Industria y Comercio (Delegatura de Protección de Datos Personales).'
        ]
      },
      {
        heading: '4. Marco Legal Europeo: Cumplimiento RGPD (UE 2016/679)',
        paragraphs: [
          'Para residentes en el Espacio Económico Europeo (EEE):',
          'Bases Jurídicas: Tratamos tus datos sobre las bases de: 1) Ejecución contractual (Art. 6.1.b RGPD) para despachar tu compra; 2) Cumplimiento de obligaciones legales contables y tributarias (Art. 6.1.c RGPD); 3) Consentimiento expreso (Art. 6.1.a RGPD) para cookies analíticas y boletín.',
          'Derechos Específicos: Derecho de acceso (Art. 15), derecho de rectificación (Art. 16), derecho a la supresión / derecho al olvido (Art. 17), derecho a la limitación del tratamiento (Art. 18), derecho a la portabilidad de datos (Art. 20) y derecho de oposición (Art. 21). Puedes ejercerlos sin coste alguno escribiendo a urban.noice2023@gmail.com.',
          'Transferencias Internacionales: Cuando los datos deban transferirse a servidores fuera del EEE para ejecutar el despacho en Colombia, se implementan Cláusulas Contractuales Tipo (SCC) aprobadas por la Comisión Europea.'
        ]
      },
      {
        heading: '5. Marco Legal de EE.UU.: Cumplimiento CCPA / CPRA & COPPA',
        paragraphs: [
          'Aviso para Residentes de California (California Consumer Privacy Act / CPRA):',
          '• No Venta ni Cesión de Datos: URBANNOISE NO vende ni comparte tus datos personales con terceros para fines comerciales o de publicidad comportamental cruzada ("We do NOT sell or share your personal information").',
          '• No Discriminación: No serás discriminado por ejercer tus derechos de privacidad.',
          '• Protección de Menores (COPPA): Nuestro sitio no está dirigido ni recopila conscientemente datos de menores de 13 años. Si detectamos datos de menores de 13 años sin consentimiento parental, procederemos a eliminarlos de inmediato.'
        ]
      }
    ]
  },
  {
    id: 'cookies',
    title: 'Aviso y Política Integral de Cookies (Directiva ePrivacy UE & Habeas Data)',
    shortTitle: 'Política de Cookies',
    icon: 'Cookie',
    badge: 'Directiva ePrivacy / RGPD',
    lastUpdated: '2 de Octubre de 2026',
    summary: 'Información transparente sobre el uso de cookies técnicas necesarias, analíticas anonimizadas y de preferencias, con control granular de aceptación o rechazo.',
    content: [
      {
        heading: '1. ¿Qué son las Cookies y Tecnologías Similares?',
        paragraphs: [
          'Una cookie es un pequeño archivo de datos que se almacena en tu navegador cuando visitas nuestro sitio web. Permite que la plataforma recuerde tus acciones y preferencias (como las prendas agregadas a tu carrito de compras, tu sesión activa o tus elecciones de moneda) durante un período de tiempo.'
        ]
      },
      {
        heading: '2. Clasificación de Cookies Utilizadas',
        paragraphs: [
          'En URBANNOISE categorizamos nuestras cookies de la siguiente manera:'
        ],
        bullets: [
          'Cookies Estrictamente Necesarias / Técnicas (Exentas de consentimiento): Imprescindibles para el funcionamiento del carrito de compras, la navegación segura y el proceso de checkout cifrado.',
          'Cookies de Preferencias: Guardan tus selecciones de interfaz, estado de sesión y aceptación de avisos legales para no solicitar tu configuración repetidamente.',
          'Cookies Analíticas Anónimas (Requieren consentimiento en la UE): Miden de forma agregada el rendimiento y velocidad de carga de la página, sin identificar nominalmente al usuario ni realizar seguimiento publicitario entre sitios web.'
        ]
      },
      {
        heading: '3. Panel de Control y Configuración del Usuario',
        paragraphs: [
          'Puedes aceptar todas las cookies, configurar tus preferencias o rechazar las cookies no esenciales a través de nuestro banner inferior de consentimiento.',
          'Asimismo, puedes bloquear o eliminar cookies en cualquier momento desde la configuración de tu navegador:',
          '• Google Chrome: Configuración > Privacidad y seguridad > Cookies.',
          '• Apple Safari: Preferencias > Privacidad > Administrar datos de sitios web.',
          '• Mozilla Firefox: Opciones > Privacidad y seguridad > Cookies.',
          '• Microsoft Edge: Configuración > Permisos del sitio > Cookies y datos del sitio.'
        ]
      }
    ]
  },
  {
    id: 'pagos-bold',
    title: 'Métodos de Pago y Seguridad Transaccional Bold.co',
    shortTitle: 'Pagos Seguros (Bold)',
    icon: 'Lock',
    badge: 'PCI-DSS Nivel 1 / PSE / Nequi',
    lastUpdated: '28 de Octubre de 2026',
    summary: 'Infraestructura de pago 100% cifrada mediante pasarela oficial Bold.co. Aceptamos PSE, Nequi, Bancolombia, Tarjetas de Crédito/Débito y Pago Contra Entrega en Bogotá.',
    content: [
      {
        heading: '1. Pasarela Oficial de Pagos Bold.co',
        paragraphs: [
          'Todas las transacciones electrónicas en www.urbannoise.co son procesadas y protegidas a través de la pasarela oficial Bold.co (Bold CF Compañía de Financiamiento S.A.), entidad vigilada por la Superintendencia Financiera de Colombia.',
          'Nuestra infraestructura no almacena números de tarjeta ni claves bancarias. Todas las comunicaciones viajan mediante túneles cifrados SSL/TLS de 256 bits bajo certificación PCI-DSS Nivel 1, el estándar de seguridad más riguroso de la industria financiera mundial.'
        ]
      },
      {
        heading: '2. Medios de Pago Electrónico Habilitados',
        paragraphs: [
          'Puedes abonar tus pedidos en línea de forma inmediata mediante:'
        ],
        bullets: [
          'PSE (Débito a Cuentas de Ahorros y Corrientes de todos los bancos en Colombia).',
          'Nequi y Bancolombia (Aprobación instantánea con código de seguridad).',
          'Daviplata y billeteras digitales autorizadas.',
          'Tarjetas de Crédito y Débito nacionales e internacionales (Visa, Mastercard, American Express, Diners Club).',
          'Pago Contra Entrega exclusivo para entregas en el perímetro urbano de Bogotá D.C.'
        ]
      },
      {
        heading: '3. Firma Criptográfica de Integridad y Prevención de Fraudes',
        paragraphs: [
          'Cada orden genera un Payment Intent con firma SHA-256 única e inviolable calculada entre el identificador de pedido, monto en COP y credenciales secretas de la pasarela. Cualquier intento de alteración de precios o parámetros es rechazado automáticamente en el servidor.',
          'Una vez aprobada tu compra, el sistema emite automáticamente un comprobante digital y reserva tus prendas en el inventario en tiempo real.'
        ]
      }
    ]
  },
  {
    id: 'envios',
    title: 'Política de Envíos, Despachos y Tiempos de Entrega',
    shortTitle: 'Política de Envíos',
    icon: 'Truck',
    badge: 'Cobertura Nacional Colombia',
    lastUpdated: '2 de Octubre de 2026',
    summary: 'Tiempos de despacho desde Bogotá, transportadoras aliadas oficiales, costos de flete y seguro contra robo o pérdida.',
    content: [
      {
        heading: '1. Cobertura y Despachos desde Bogotá D.C.',
        paragraphs: [
          'Realizamos despachos a todo el territorio colombiano con cobertura urbana y rural a través de transportadoras oficiales aliadas: Servientrega, Coordinadora Mercantil, Inter Rapidísimo y Envía.',
          'Todas las prendas se despachan directamente desde nuestro atelier y bodega central en Bogotá D.C.'
        ]
      },
      {
        heading: '2. Tiempos Estimados de Tránsito',
        paragraphs: [
          'Los tiempos de entrega inician una vez verificado el pago de la orden:'
        ],
        bullets: [
          'Bogotá D.C. y Sabana: 24 a 48 horas hábiles.',
          'Ciudades Principales (Medellín, Cali, Barranquilla, Bucaramanga, Cartagena, Pereira, Manizales): 2 a 3 días hábiles.',
          'Resto del País y Zonas Especiales: 3 a 5 días hábiles.'
        ]
      },
      {
        heading: '3. Flete de Cortesía y Rastreo en Tiempo Real',
        paragraphs: [
          'Despacho Gratuito: Ofrecemos envío nacional de cortesía por compras iguales o superiores a $150.000 COP.',
          'Seguimiento en Tiempo Real: En cuanto tu paquete es entregado a la transportadora, recibirás un correo y podrás consultar la guía oficial en tu sección "Mi Cuenta / Mis Pedidos".'
        ]
      }
    ]
  },
  {
    id: 'cambios-garantias',
    title: 'Política de Cambios, Devoluciones y Garantías',
    shortTitle: 'Cambios y Garantías',
    icon: 'RotateCcw',
    badge: 'Ley 1480 (Art. 7 a 17)',
    lastUpdated: '2 de Octubre de 2026',
    summary: 'Garantía legal de 60 días para confección y estampados, 15 días calendario para cambio de talla sin costo de reenvío en tu primer cambio.',
    content: [
      {
        heading: '1. Garantía Legal de Calidad de 60 Días',
        paragraphs: [
          'En cumplimiento de los Artículos 7 al 17 de la Ley 1480 de 2011, todas las prendas URBANNOISE cuentan con una Garantía Legal de Sesenta (60) Días Calendario contados a partir de la fecha de entrega.',
          'La garantía cubre defectos de confección comprobables: descosidos estructurales, fallas en cremalleras o botones, defectos en tejido y desprendimiento prematuro de serigrafía bajo condiciones normales de lavado.'
        ]
      },
      {
        heading: '2. Cambios por Talla o Referencia (15 Días)',
        paragraphs: [
          'Si necesitas cambiar de talla o color, puedes solicitarlo dentro de los Quince (15) Días Calendario posteriores a la entrega del paquete. La prenda debe estar nueva, sin uso, sin lavar y con etiquetas originales.',
          'Beneficio de Primer Cambio: Para tu primer cambio de talla, el flete de reenvío hacia tu domicilio es 100% asumido por URBANNOISE.'
        ]
      }
    ]
  },
  {
    id: 'retracto',
    title: 'Derecho de Retracto y Reversión del Pago (SIC)',
    shortTitle: 'Derecho de Retracto',
    icon: 'Scale',
    badge: 'Art. 47 y 51 Ley 1480',
    lastUpdated: '2 de Octubre de 2026',
    summary: 'Derecho de Retracto legal de 5 días hábiles en compras virtuales con reembolso del 100% del dinero conforme a la legislación colombiana.',
    content: [
      {
        heading: '1. ¿Qué es el Derecho de Retracto? (Artículo 47 Ley 1480 de 2011)',
        paragraphs: [
          'El Derecho de Retracto faculta a los consumidores en compras por internet a rescindir de forma unilateral el contrato dentro de los Cinco (5) Días Hábiles siguientes a la entrega del bien, recibiendo la devolución del 100% de su dinero.',
          'La prenda debe devolverse en las mismas condiciones en que fue recibida (sin uso y con etiquetas).'
        ]
      },
      {
        heading: '2. Reversión de Pago Electrónico (Decreto 587 de 2016)',
        paragraphs: [
          'Los consumidores que realicen pagos electrónicos tienen derecho a solicitar la reversión ante fraude, operaciones no autorizadas, producto no entregado o producto defectuoso dentro de los cinco (5) días hábiles siguientes al conocimiento del evento.'
        ]
      }
    ]
  },
  {
    id: 'pqrs',
    title: 'Canal Oficial de P.Q.R.S. y Protección al Consumidor (SIC)',
    shortTitle: 'Radicar PQRS (SIC)',
    icon: 'HelpCircle',
    badge: 'Respuesta en 15 Días Hábiles',
    lastUpdated: '2 de Octubre de 2026',
    summary: 'Radica tus Peticiones, Quejas, Reclamos y Sugerencias de manera formal ante URBANNOISE con radicado oficial y respuesta garantizada en máximo 15 días hábiles.',
    content: [
      {
        heading: '1. Marco Legal de Atención de PQRS',
        paragraphs: [
          'En cumplimiento del Estatuto del Consumidor (Ley 1480 de 2011) y la Ley 1755 de 2015, URBANNOISE garantiza respuesta formal y motivada dentro de un plazo improrrogable de Quince (15) Días Hábiles.',
          'Puedes radicar tu solicitud usando el formulario electrónico interactivo de esta sección o mediante correo a urban.noice2023@gmail.com.'
        ]
      }
    ]
  }
];
