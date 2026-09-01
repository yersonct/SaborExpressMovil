// TableroTranslations.ts

export type LanguageCode = 'es' | 'en' | 'pt' | 'fr';

export const translations = {
  es: {
    roleChef: "Cocinero",
    logout: "Cerrar sesión",
    logoutConfirm: "¿Estás seguro que deseas salir de tu turno?",
    fullscreen: "PANTALLA COMPLETA",
    themeLight: "Blanco", // 🔥 Agregado
    themeDark: "Negro",   // 🔥 Agregado
    state: "ESTADO",
    waiter: "MESERO",
    orderId: "PEDIDO ID",
    entryTime: "HORA INGRESO",
    prepIn: "PREP. EN",
    min: "MIN",
    totalDishes: "TOTAL PLATOS",
    startPrep: "INICIAR PREPARACIÓN",
    markReady: "MARCAR COMO LISTO",
    note: "NOTA",
    summary: "RESUMEN OPERATIVO",
    completed: "COMPLETADOS",
    waiting: "EN ESPERA",
    avgTime: "TIEMPO PROMEDIO",
    status_Pendiente: "Pendiente",
    status_EnPreparacion: "En Preparación",
    status_ListoEnBarra: "Listo en Barra",
    status_Entregado: "Entregado",
    type_Mesa: "Mesa",
    type_ParaLlevar: "Para Llevar",
    type_Domicilio: "Domicilio"
  },
  en: {
    roleChef: "Chef",
    logout: "Log out",
    logoutConfirm: "Are you sure you want to end your shift?",
    fullscreen: "FULLSCREEN",
    themeLight: "White", // 🔥 Agregado
    themeDark: "Black",  // 🔥 Agregado
    state: "STATUS",
    waiter: "WAITER",
    orderId: "ORDER ID",
    entryTime: "ENTRY TIME",
    prepIn: "PREP. IN",
    min: "MIN",
    totalDishes: "TOTAL DISHES",
    startPrep: "START PREP",
    markReady: "MARK AS READY",
    note: "NOTE",
    summary: "OPERATIONAL SUMMARY",
    completed: "COMPLETED",
    waiting: "WAITING",
    avgTime: "AVG. TIME",
    status_Pendiente: "Pending",
    status_EnPreparacion: "Preparing",
    status_ListoEnBarra: "Ready at Bar",
    status_Entregado: "Delivered",
    type_Mesa: "Table",
    type_ParaLlevar: "Takeaway",
    type_Domicilio: "Delivery"
  },
  pt: {
    roleChef: "Cozinheiro",
    logout: "Sair",
    logoutConfirm: "Tem certeza de que deseja encerrar o turno?",
    fullscreen: "TELA CHEIA",
    themeLight: "Branco", // 🔥 Agregado
    themeDark: "Preto",   // 🔥 Agregado
    state: "ESTADO",
    waiter: "GARÇOM",
    orderId: "ID DO PEDIDO",
    entryTime: "HORA DE ENTRADA",
    prepIn: "PREP. EM",
    min: "MIN",
    totalDishes: "TOTAL DE PRATOS",
    startPrep: "INICIAR PREPARAÇÃO",
    markReady: "MARCAR COMO PRONTO",
    note: "NOTA",
    summary: "RESUMO OPERACIONAL",
    completed: "CONCLUÍDOS",
    waiting: "EM ESPERA",
    avgTime: "TEMPO MÉDIO",
    status_Pendiente: "Pendente",
    status_EnPreparacion: "Em Preparação",
    status_ListoEnBarra: "Pronto no Balcão",
    status_Entregado: "Entregue",
    type_Mesa: "Mesa",
    type_ParaLlevar: "Para Levar",
    type_Domicilio: "Entrega"
  },
  fr: {
    roleChef: "Chef Cuisinier",
    logout: "Se déconnecter",
    logoutConfirm: "Êtes-vous sûr de vouloir terminer votre service ?",
    fullscreen: "PLEIN ÉCRAN",
    themeLight: "Blanc", // 🔥 Agregado
    themeDark: "Noir",   // 🔥 Agregado
    state: "ÉTAT",
    waiter: "SERVEUR",
    orderId: "ID DE COMMANDE",
    entryTime: "HEURE D'ENTRÉE",
    prepIn: "PRÉP. EN",
    min: "MIN",
    totalDishes: "TOTAL DES PLATS",
    startPrep: "COMMENCER LA PRÉPARATION",
    markReady: "MARQUER COMME PRÊT",
    note: "NOTE",
    summary: "RÉSUMÉ OPÉRATIONNEL",
    completed: "TERMINÉS",
    waiting: "EN ATTENTE",
    avgTime: "TEMPS MOYEN",
    status_Pendiente: "En attente",
    status_EnPreparacion: "En préparation",
    status_ListoEnBarra: "Prêt au bar",
    status_Entregado: "Livré",
    type_Mesa: "Table",
    type_ParaLlevar: "À emporter",
    type_Domicilio: "Livraison"
  }
};

export const getTranslatedStatus = (estado: string, lang: LanguageCode) => {
  const map: Record<string, keyof typeof translations['es']> = {
    'Pendiente': 'status_Pendiente',
    'En Preparación': 'status_EnPreparacion',
    'Listo en Barra': 'status_ListoEnBarra',
    'Entregado': 'status_Entregado'
  };
  return translations[lang][map[estado] || 'status_Pendiente'];
};

export const getTranslatedType = (tipo: string, lang: LanguageCode) => {
  const map: Record<string, keyof typeof translations['es']> = {
    'Mesa': 'type_Mesa',
    'Para Llevar': 'type_ParaLlevar',
    'Domicilio': 'type_Domicilio'
  };
  return translations[lang][map[tipo] || 'type_Mesa'];
};