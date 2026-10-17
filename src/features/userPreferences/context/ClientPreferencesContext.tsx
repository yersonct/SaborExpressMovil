import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setNetworkErrorLanguage } from "@/features/shared/services/networkStatus";
import { getApiLanguage, setApiLanguage } from "@/features/auth/services/apiLanguage";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getUserIdFromToken } from "@/features/auth/services/decodeToken";
import {
  clientSettingsService,
  type ClientSettings,
  type ClientSettingsUpdate,
} from "../services/clientSettingsService";

export type ClientLanguage = "es" | "en" | "pt" | "fr";

const defaultSettings: ClientSettings = {
  theme: "light",
  emailNotifications: true,
  pushNotifications: true,
  soundNotifications: true,
  timeZone: "America/Bogota",
  updatedAt: null,
  isDefault: true,
};

const labels: Record<ClientLanguage, Record<string, string>> = {
  es: {
    oneProduct: "producto", manyProducts: "productos",
    statusPending: "Pendiente", statusConfirmed: "Confirmado", statusInPreparation: "Preparando", statusReady: "Listo", statusDelivered: "Entregado", statusCancelled: "Cancelado",
    trackTitle: "Pedido", cancelledOrder: "Este pedido fue cancelado.", products: "Productos", rateDriver: "Calificar al repartidor", yourAddress: "Tu dirección", noPhone: "Sin teléfono",
    thankYou: "¡Gracias!", deliveryComplete: "¡Pedido entregado!", rateQuestion: "¿Cómo estuvo el servicio de", starPrompt: "Toca una estrella", feedbackPlaceholder: "Cuéntanos más (opcional)", notNow: "Ahora no", sendRating: "Enviar calificación",
    rateVeryBad: "Muy malo", rateBad: "Malo", rateFair: "Regular", rateGood: "Bueno", rateExcellent: "Excelente",
    orderReceived: "¡Pedido recibido!", paymentConfirmed: "¡Pago confirmado!", orderPaidMessage: "Recibimos tu pago y tu pedido ya está en preparación. Te avisaremos cuando salga hacia tu dirección.",
    orderPendingMessage: "Tu pedido está pendiente de confirmación en la sede. Te avisaremos cuando esté en camino.", profileTrackingNote: "Sigue el estado de tu pedido en Mi Perfil.",
    confirmation: "Confirmación", wompiAmount: "Monto a pagar con Wompi:", wompiInstructions: "Se abrirá la pasarela segura de Wompi (Nequi, tarjeta, PSE). Al terminar, vuelve a esta app: confirmaremos tu pago automáticamente.",
    cashPayment: "Pago en efectivo (contra entrega):", cashInstructions: "Le pagarás directamente al repartidor cuando entregue tu pedido. Por favor, intenta tener el dinero exacto.",
    waitingPayment: "Esperando confirmación del pago...", cancelWait: "Cancelar espera", processing: "Procesando...", confirmOrderAndSend: "Confirmar pedido y enviar", payWithWompi: "Pagar con Wompi",
    paymentMethod: "Método de pago", totalToPay: "Total a pagar", paymentQuestion: "¿Cómo deseas pagar?", cardTypes: "Nequi, tarjetas, PSE", cash: "Efectivo", payDriver: "Pago al repartidor", continue: "Continuar", orderTitle: "Tu pedido", emptyCart: "Aún no has agregado nada.", continueToPayment: "Continuar al pago",
    addressesTitle: "Mis direcciones", newAddress: "Nueva dirección", addressField: "Dirección", reference: "Referencia (opcional)",
    defaultAddress: "Predeterminada", setDefault: "Hacer predeterminada", deleteAddress: "Eliminar", emptyAddresses: "Aún no tienes direcciones guardadas.",
    saveAddress: "Guardar dirección", savingAddress: "Guardando...", useGps: "Usar mi ubicación actual",
    menu: "Menú", profile: "Perfil", settings: "Ajustes", settingsTitle: "Configuración",
    notifications: "Notificaciones", appearance: "Apariencia y preferencias", orderAlerts: "Estado del pedido",
    orderAlertsDesc: "Alertas cuando tu comida esté en camino", sounds: "Sonidos",
    soundsDesc: "Reproducir sonidos de notificación", darkMode: "Modo oscuro",
    darkModeDesc: "Usar colores oscuros en la aplicación", language: "Idioma", chooseLanguage: "Selecciona un idioma",
    logout: "Cerrar sesión", greeting: "¿Qué vas a pedir hoy?", deliverTo: "Entregar en:", addAddress: "Agrega una dirección",
    nearestBranch: "Buscando la sede más cercana...", noBranch: "No se pudo calcular la sede", viewMap: "Ver mapa",
    selectedLocation: "Ubicación elegida", changeLocation: "Cambiar ubicación", cart: "Ver carrito",
    addToCart: "¿Agregar al carrito?", cancel: "Cancelar", add: "Agregar", close: "Cerrar", whereDeliver: "¿Dónde te entregamos?",
    noAddresses: "Todavía no tienes direcciones guardadas.", addNewAddress: "+ Agregar nueva dirección", seeLess: "Ver menos",
    all: "Todos", useLocation: "Usar mi ubicación", noCoverage: "No tenemos cobertura en esta ubicación",
    chooseAddress: "Elige una dirección o usa tu ubicación para ver el menú", noProducts: "No hay productos disponibles en esta sede.",
    loadingMenu: "Cargando menú...", orderFrom: "Pedido desde:", currentLocation: "tu ubicación actual",
    changeBranch: "Cambiar sede", useThisBranch: "Usar esta sede",
    changeDelivery: "Cambiar entrega", deliveryOptionsTitle: "Cambiar dirección o sede",
    deliveryAddressOptionDesc: "Marca otro punto en el mapa y se buscará la sede más cercana.",
    deliveryBranchOptionDesc: "Selecciona desde qué sede se preparará tu pedido.",
    trackDriverMap: "Ver repartidor en el mapa",
    cartMustBeEmptyTitle: "Vacía el carrito primero", cartMustBeEmptyForLocation: "Para cambiar la dirección o la sede, vacía el carrito y vuelve a agregar los productos de la nueva sede.",
    saveLocationBeforeOrderTitle: "Guarda la dirección de entrega", saveLocationBeforeOrderMessage: "Para pedir en esta ubicación, guárdala como dirección de entrega y vuelve a intentarlo.",
    profileTitle: "Mi Perfil", myOrders: "Mis pedidos", inProgress: "En curso", delivered: "Entregados", total: "Total",
    live: "EN VIVO", preparing: "Preparando", onTheWay: "En camino", gpsTrackingLive: "GPS en vivo", gpsWaiting: "Esperando ubicación GPS", assignedDriver: "Repartidor asignado",
    contact: "Contacto:", unavailable: "No disponible", latestOrders: "Últimos pedidos", noOrders: "Aún no has hecho pedidos.",
    moreOrders: "Ver más pedidos", myData: "Mis datos", edit: "Editar", save: "Guardar cambios", saving: "Guardando...",
    name: "Nombre", lastName: "Apellido", document: "Documento", email: "Correo electrónico", phone: "Teléfono móvil",
    address: "Dirección predeterminada", noAddress: "Sin dirección registrada", manageAddresses: "Gestionar mis direcciones de entrega",
    error: "Error", addressSaveError: "No se pudo guardar la dirección.", addressUpdateError: "No se pudo actualizar.", addressDeleteError: "No se pudo eliminar.",
    deleteAddressTitle: "Eliminar dirección", deleteAddressConfirm: "¿Seguro que deseas eliminar esta dirección?", streetPlaceholder: "Calle 123 #45-67, Apto 802", referencePlaceholder: "Portón azul, al lado del parque",
    locationError: "No se pudo obtener tu ubicación actual. Intenta de nuevo.", selectPaymentTitle: "Selecciona un método de pago", selectPaymentMessage: "Debes elegir cómo deseas pagar antes de continuar.",
    orderCancelledTitle: "Pedido cancelado", orderCancelledMessage: "No completaste el pago, así que el pedido no se envió.", selectAddressTitle: "Selecciona una dirección", selectAddressMessage: "Elige o agrega una dirección de entrega antes de continuar.",
    paymentRejectedTitle: "Pago no aprobado", paymentRejectedMessage: "Wompi no aprobó el pago y el pedido fue cancelado. Puedes intentarlo de nuevo.", paymentUnconfirmedTitle: "No recibimos confirmación", paymentUnconfirmedMessage: "Si ya pagaste, tu pedido llegará en unos minutos. Si no, cancélalo desde 'Pedido en curso'.",
    createOrderError: "No se pudo crear el pedido. Intenta de nuevo.", useLocationTitle: "¿Usar esta ubicación?", useLocationMessage: "Puedes guardarla como tu dirección de entrega para hacer el pedido ahí.", onlyViewBranch: "Solo ver la sede", saveAndUse: "Guardar y usar",
    savedTitle: "¡Guardado!", profileSavedMessage: "Tu información personal se ha actualizado exitosamente.", profileSaveError: "No se pudo guardar tu información. Intenta de nuevo.", phoneDialError: "No se pudo abrir el marcador del teléfono.",
    notificationTitle: "Notificaciones", clearNotificationsTitle: "¿Eliminar notificaciones?", clearNotificationsMessage: "Se eliminarán todas las notificaciones de esta lista. Esta acción no se puede deshacer.", clear: "Limpiar", noNotifications: "Sin notificaciones por ahora", yesDelete: "Sí, eliminar",
    added: "agregado", receiptUploaded: "Evidencia cargada correctamente", morning: "Buenos días", afternoon: "Buenas tardes", evening: "Buenas noches", currentOrder: "Pedido en curso", orderNumber: "Pedido", ratingSendError: "No se pudo enviar la calificación.",
    notificationPaymentTitle: "Pago confirmado", notificationPaymentMessage: "Tu pago para el pedido #{order} fue aprobado.", notificationOnWayTitle: "Tu pedido va en camino", notificationOnWayMessage: "Tu pedido #{order} ya salió hacia tu dirección.", notificationDeliveredTitle: "Pedido entregado", notificationDeliveredMessage: "Tu pedido #{order} fue entregado. ¡Buen provecho!",
    nameRequired: "El nombre no puede estar vacío.", nameMin: "El nombre debe tener mínimo 3 caracteres.", nameNoDigits: "El nombre no puede contener números.", phoneRequired: "El teléfono es obligatorio.", phoneFormat: "Debe tener 7 o 10 dígitos, sin espacios ni guiones.",
    locationPermission: "Necesitamos permiso de ubicación para capturar tu dirección exacta.", addressRequired: "La dirección es obligatoria.", captureAddressLocation: "Usa el botón de ubicación para capturar dónde queda esta dirección.", locationFetchError: "No se pudo obtener tu ubicación. Intenta de nuevo.", delete: "Eliminar",
    branchLocations: "Nuestras sedes", branchesNoLocation: "Las sedes todavía no tienen ubicación registrada.", routeCalculating: "Calculando ruta...", routeNoStreet: "no se pudo calcular la ruta por calles", yourDeliveryAddress: "Tu dirección de entrega", yourBranch: "Tu sede", nearBranch: "Sede más cercana", mapMobileOnly: "El mapa solo está disponible en la app móvil.", branchesMapMobileOnly: "El mapa de sedes solo está disponible en la app móvil.", tapMapGps: "Toca el mapa para colocar tu ubicación, o usa el botón GPS.", dragPinAdjust: "Arrastra el pin para ajustar.", dragPin: "Arrastra el pin para ajustar tu ubicación.", confirmLocation: "Confirmar ubicación", locationPermissionTitle: "Permiso necesario", locationPermissionMessage: "Activa el permiso de ubicación o toca el mapa para elegir el punto.",
  },
  en: {
    oneProduct: "item", manyProducts: "items",
    statusPending: "Pending", statusConfirmed: "Confirmed", statusInPreparation: "Preparing", statusReady: "Ready", statusDelivered: "Delivered", statusCancelled: "Cancelled",
    trackTitle: "Order", cancelledOrder: "This order was cancelled.", products: "Products", rateDriver: "Rate the delivery person", yourAddress: "Your address", noPhone: "No phone number",
    thankYou: "Thank you!", deliveryComplete: "Order delivered!", rateQuestion: "How was the service from", starPrompt: "Tap a star", feedbackPlaceholder: "Tell us more (optional)", notNow: "Not now", sendRating: "Send rating",
    rateVeryBad: "Very bad", rateBad: "Bad", rateFair: "Fair", rateGood: "Good", rateExcellent: "Excellent",
    orderReceived: "Order received!", paymentConfirmed: "Payment confirmed!", orderPaidMessage: "We received your payment and your order is being prepared. We will let you know when it is on the way.",
    orderPendingMessage: "Your order is waiting for the restaurant to confirm it. We will let you know when it is on the way.", profileTrackingNote: "Track your order in My Profile.",
    confirmation: "Confirmation", wompiAmount: "Amount to pay with Wompi:", wompiInstructions: "Wompi's secure checkout will open. When you finish, return to this app; we will confirm your payment automatically.",
    cashPayment: "Cash on delivery:", cashInstructions: "Pay the delivery person when your order arrives. Please try to have the exact amount.",
    waitingPayment: "Waiting for payment confirmation...", cancelWait: "Cancel waiting", processing: "Processing...", confirmOrderAndSend: "Confirm and place order", payWithWompi: "Pay with Wompi",
    paymentMethod: "Payment method", totalToPay: "Total to pay", paymentQuestion: "How would you like to pay?", cardTypes: "Nequi, cards, PSE", cash: "Cash", payDriver: "Pay the delivery person", continue: "Continue", orderTitle: "Your order", emptyCart: "You have not added anything yet.", continueToPayment: "Continue to payment",
    addressesTitle: "My addresses", newAddress: "New address", addressField: "Address", reference: "Reference (optional)",
    defaultAddress: "Default", setDefault: "Set as default", deleteAddress: "Delete", emptyAddresses: "You have no saved addresses yet.",
    saveAddress: "Save address", savingAddress: "Saving...", useGps: "Use my current location",
    menu: "Menu", profile: "Profile", settings: "Settings", settingsTitle: "Settings", notifications: "Notifications",
    appearance: "Appearance and preferences", orderAlerts: "Order status", orderAlertsDesc: "Alerts when your food is on the way", sounds: "Sounds",
    soundsDesc: "Play notification sounds", darkMode: "Dark mode", darkModeDesc: "Use dark colors in the app", language: "Language",
    chooseLanguage: "Select a language", logout: "Log out", greeting: "What would you like to order today?", deliverTo: "Deliver to:",
    addAddress: "Add an address", nearestBranch: "Finding the nearest location...", noBranch: "Could not find a location", viewMap: "View map",
    selectedLocation: "Location selected", changeLocation: "Change location", cart: "View cart", addToCart: "Add to cart?",
    cancel: "Cancel", add: "Add", close: "Close", whereDeliver: "Where should we deliver?", noAddresses: "You have no saved addresses yet.",
    addNewAddress: "+ Add a new address", seeLess: "See less", all: "All", useLocation: "Use my location",
    noCoverage: "We do not deliver to this location", chooseAddress: "Choose an address or use your location to see the menu",
    noProducts: "No products are available at this location.", loadingMenu: "Loading menu...", orderFrom: "Order from:", currentLocation: "your current location",
    changeBranch: "Change branch", useThisBranch: "Use this branch",
    changeDelivery: "Change delivery", deliveryOptionsTitle: "Change address or branch",
    deliveryAddressOptionDesc: "Mark another point on the map to find the nearest branch.",
    deliveryBranchOptionDesc: "Choose which branch will prepare your order.",
    trackDriverMap: "Track the driver on the map",
    cartMustBeEmptyTitle: "Empty your cart first", cartMustBeEmptyForLocation: "To change the delivery address or location, empty your cart and add products from the new location.",
    saveLocationBeforeOrderTitle: "Save the delivery address", saveLocationBeforeOrderMessage: "To order at this location, save it as a delivery address and try again.",
    profileTitle: "My Profile", myOrders: "My orders", inProgress: "In progress", delivered: "Delivered", total: "Total", live: "LIVE",
    preparing: "Preparing", onTheWay: "On the way", gpsTrackingLive: "Live GPS tracking", gpsWaiting: "Waiting for GPS location", assignedDriver: "Driver assigned", contact: "Contact:", unavailable: "Unavailable",
    latestOrders: "Recent orders", noOrders: "You have not placed any orders yet.", moreOrders: "See more orders", myData: "My details",
    edit: "Edit", save: "Save changes", saving: "Saving...", name: "First name", lastName: "Last name", document: "ID",
    email: "Email", phone: "Mobile phone", address: "Default address", noAddress: "No address saved", manageAddresses: "Manage delivery addresses",
    error: "Error", addressSaveError: "Could not save the address.", addressUpdateError: "Could not update the address.", addressDeleteError: "Could not delete the address.",
    deleteAddressTitle: "Delete address", deleteAddressConfirm: "Are you sure you want to delete this address?", streetPlaceholder: "123 Main St, Apt 802", referencePlaceholder: "Blue gate, next to the park",
    locationError: "Could not get your current location. Please try again.", selectPaymentTitle: "Select a payment method", selectPaymentMessage: "Choose how you want to pay before continuing.",
    orderCancelledTitle: "Order cancelled", orderCancelledMessage: "You did not complete the payment, so the order was not sent.", selectAddressTitle: "Select an address", selectAddressMessage: "Choose or add a delivery address before continuing.",
    paymentRejectedTitle: "Payment declined", paymentRejectedMessage: "Wompi declined the payment and the order was cancelled. You can try again.", paymentUnconfirmedTitle: "We did not receive confirmation", paymentUnconfirmedMessage: "If you paid, your order should arrive in a few minutes. Otherwise, cancel it from 'Current order'.",
    createOrderError: "Could not create the order. Please try again.", useLocationTitle: "Use this location?", useLocationMessage: "You can save it as your delivery address and place your order there.", onlyViewBranch: "View location only", saveAndUse: "Save and use",
    savedTitle: "Saved!", profileSavedMessage: "Your personal information was updated successfully.", profileSaveError: "Could not save your information. Please try again.", phoneDialError: "Could not open the phone dialer.",
    notificationTitle: "Notifications", clearNotificationsTitle: "Delete notifications?", clearNotificationsMessage: "All notifications in this list will be deleted. This cannot be undone.", clear: "Clear", noNotifications: "No notifications yet", yesDelete: "Yes, delete",
    added: "added", receiptUploaded: "Receipt uploaded successfully", morning: "Good morning", afternoon: "Good afternoon", evening: "Good evening", currentOrder: "Current order", orderNumber: "Order", ratingSendError: "Could not send the rating.",
    notificationPaymentTitle: "Payment confirmed", notificationPaymentMessage: "Your payment for order #{order} was approved.", notificationOnWayTitle: "Your order is on its way", notificationOnWayMessage: "Your order #{order} has left for your address.", notificationDeliveredTitle: "Order delivered", notificationDeliveredMessage: "Your order #{order} was delivered. Enjoy!",
    nameRequired: "Name cannot be empty.", nameMin: "Name must contain at least 3 characters.", nameNoDigits: "Name cannot contain numbers.", phoneRequired: "Phone number is required.", phoneFormat: "Enter 7 or 10 digits, without spaces or hyphens.",
    locationPermission: "Location permission is needed to capture your exact address.", addressRequired: "Address is required.", captureAddressLocation: "Use the location button to capture where this address is.", locationFetchError: "Could not get your location. Please try again.", delete: "Delete",
    branchLocations: "Our locations", branchesNoLocation: "Our locations do not have a registered position yet.", routeCalculating: "Calculating route...", routeNoStreet: "route could not be calculated along streets", yourDeliveryAddress: "Your delivery address", yourBranch: "Your location", nearBranch: "Nearest location", mapMobileOnly: "The map is only available in the mobile app.", branchesMapMobileOnly: "The locations map is only available in the mobile app.", tapMapGps: "Tap the map to place your location, or use the GPS button.", dragPinAdjust: "Drag the pin to adjust.", dragPin: "Drag the pin to adjust your location.", confirmLocation: "Confirm location", locationPermissionTitle: "Permission required", locationPermissionMessage: "Enable location permission or tap the map to choose a point.",
  },
  pt: {
    oneProduct: "produto", manyProducts: "produtos",
    statusPending: "Pendente", statusConfirmed: "Confirmado", statusInPreparation: "Preparando", statusReady: "Pronto", statusDelivered: "Entregue", statusCancelled: "Cancelado",
    trackTitle: "Pedido", cancelledOrder: "Este pedido foi cancelado.", products: "Produtos", rateDriver: "Avaliar entregador", yourAddress: "Seu endereço", noPhone: "Sem telefone",
    thankYou: "Obrigado!", deliveryComplete: "Pedido entregue!", rateQuestion: "Como foi o atendimento de", starPrompt: "Toque em uma estrela", feedbackPlaceholder: "Conte mais (opcional)", notNow: "Agora não", sendRating: "Enviar avaliação",
    rateVeryBad: "Muito ruim", rateBad: "Ruim", rateFair: "Regular", rateGood: "Bom", rateExcellent: "Excelente",
    orderReceived: "Pedido recebido!", paymentConfirmed: "Pagamento confirmado!", orderPaidMessage: "Recebemos seu pagamento e seu pedido está sendo preparado. Avisaremos quando sair para entrega.",
    orderPendingMessage: "Seu pedido aguarda confirmação da unidade. Avisaremos quando estiver a caminho.", profileTrackingNote: "Acompanhe seu pedido em Meu perfil.",
    confirmation: "Confirmação", wompiAmount: "Valor a pagar com Wompi:", wompiInstructions: "O pagamento seguro da Wompi será aberto. Ao terminar, volte ao aplicativo; confirmaremos seu pagamento automaticamente.",
    cashPayment: "Pagamento em dinheiro na entrega:", cashInstructions: "Pague ao entregador quando o pedido chegar. Tente ter o valor exato.",
    waitingPayment: "Aguardando confirmação do pagamento...", cancelWait: "Cancelar espera", processing: "Processando...", confirmOrderAndSend: "Confirmar e enviar pedido", payWithWompi: "Pagar com Wompi",
    paymentMethod: "Método de pagamento", totalToPay: "Total a pagar", paymentQuestion: "Como deseja pagar?", cardTypes: "Nequi, cartões, PSE", cash: "Dinheiro", payDriver: "Pagamento ao entregador", continue: "Continuar", orderTitle: "Seu pedido", emptyCart: "Você ainda não adicionou nada.", continueToPayment: "Continuar para o pagamento",
    addressesTitle: "Meus endereços", newAddress: "Novo endereço", addressField: "Endereço", reference: "Referência (opcional)",
    defaultAddress: "Padrão", setDefault: "Definir como padrão", deleteAddress: "Excluir", emptyAddresses: "Você ainda não tem endereços salvos.",
    saveAddress: "Salvar endereço", savingAddress: "Salvando...", useGps: "Usar minha localização atual",
    menu: "Cardápio", profile: "Perfil", settings: "Ajustes", settingsTitle: "Configurações", notifications: "Notificações",
    appearance: "Aparência e preferências", orderAlerts: "Status do pedido", orderAlertsDesc: "Avisos quando seu pedido estiver a caminho", sounds: "Sons", soundsDesc: "Tocar sons de notificação",
    darkMode: "Modo escuro", darkModeDesc: "Usar cores escuras no aplicativo", language: "Idioma", chooseLanguage: "Selecione um idioma",
    logout: "Sair", greeting: "O que você vai pedir hoje?", deliverTo: "Entregar em:", addAddress: "Adicione um endereço",
    nearestBranch: "Buscando a unidade mais próxima...", noBranch: "Não foi possível encontrar a unidade", viewMap: "Ver mapa",
    selectedLocation: "Localização selecionada", changeLocation: "Alterar localização", cart: "Ver carrinho", addToCart: "Adicionar ao carrinho?",
    cancel: "Cancelar", add: "Adicionar", close: "Fechar", whereDeliver: "Onde devemos entregar?", noAddresses: "Você ainda não tem endereços salvos.",
    addNewAddress: "+ Adicionar novo endereço", seeLess: "Ver menos", all: "Todos", useLocation: "Usar minha localização",
    noCoverage: "Não atendemos nesta localização", chooseAddress: "Escolha um endereço ou use sua localização para ver o cardápio",
    noProducts: "Não há produtos disponíveis nesta unidade.", loadingMenu: "Carregando cardápio...", orderFrom: "Pedido da unidade:", currentLocation: "sua localização atual",
    changeBranch: "Trocar unidade", useThisBranch: "Usar esta unidade",
    changeDelivery: "Alterar entrega", deliveryOptionsTitle: "Alterar endereço ou unidade",
    deliveryAddressOptionDesc: "Marque outro ponto no mapa para encontrar a unidade mais próxima.",
    deliveryBranchOptionDesc: "Escolha qual unidade preparará seu pedido.",
    trackDriverMap: "Ver o entregador no mapa",
    cartMustBeEmptyTitle: "Esvazie o carrinho primeiro", cartMustBeEmptyForLocation: "Para mudar o endereço ou a unidade, esvazie o carrinho e adicione novamente os produtos da nova unidade.",
    saveLocationBeforeOrderTitle: "Salve o endereço de entrega", saveLocationBeforeOrderMessage: "Para pedir neste local, salve-o como endereço de entrega e tente novamente.",
    profileTitle: "Meu perfil", myOrders: "Meus pedidos", inProgress: "Em andamento", delivered: "Entregues", total: "Total", live: "AO VIVO",
    preparing: "Preparando", onTheWay: "A caminho", gpsTrackingLive: "GPS ao vivo", gpsWaiting: "Aguardando localização GPS", assignedDriver: "Entregador designado", contact: "Contato:", unavailable: "Indisponível",
    latestOrders: "Pedidos recentes", noOrders: "Você ainda não fez pedidos.", moreOrders: "Ver mais pedidos", myData: "Meus dados", edit: "Editar",
    save: "Salvar alterações", saving: "Salvando...", name: "Nome", lastName: "Sobrenome", document: "Documento", email: "E-mail",
    phone: "Celular", address: "Endereço padrão", noAddress: "Nenhum endereço cadastrado", manageAddresses: "Gerenciar endereços de entrega",
    error: "Erro", addressSaveError: "Não foi possível salvar o endereço.", addressUpdateError: "Não foi possível atualizar o endereço.", addressDeleteError: "Não foi possível excluir o endereço.",
    deleteAddressTitle: "Excluir endereço", deleteAddressConfirm: "Tem certeza de que deseja excluir este endereço?", streetPlaceholder: "Rua Principal, 123, Apt. 802", referencePlaceholder: "Portão azul, ao lado do parque",
    locationError: "Não foi possível obter sua localização atual. Tente novamente.", selectPaymentTitle: "Selecione uma forma de pagamento", selectPaymentMessage: "Escolha como deseja pagar antes de continuar.",
    orderCancelledTitle: "Pedido cancelado", orderCancelledMessage: "Você não concluiu o pagamento, então o pedido não foi enviado.", selectAddressTitle: "Selecione um endereço", selectAddressMessage: "Escolha ou adicione um endereço de entrega antes de continuar.",
    paymentRejectedTitle: "Pagamento não aprovado", paymentRejectedMessage: "A Wompi não aprovou o pagamento e o pedido foi cancelado. Você pode tentar novamente.", paymentUnconfirmedTitle: "Não recebemos a confirmação", paymentUnconfirmedMessage: "Se você já pagou, seu pedido chegará em alguns minutos. Caso contrário, cancele em 'Pedido em andamento'.",
    createOrderError: "Não foi possível criar o pedido. Tente novamente.", useLocationTitle: "Usar este local?", useLocationMessage: "Você pode salvá-lo como endereço de entrega e pedir para lá.", onlyViewBranch: "Apenas ver unidade", saveAndUse: "Salvar e usar",
    savedTitle: "Salvo!", profileSavedMessage: "Suas informações pessoais foram atualizadas com sucesso.", profileSaveError: "Não foi possível salvar suas informações. Tente novamente.", phoneDialError: "Não foi possível abrir o discador.",
    notificationTitle: "Notificações", clearNotificationsTitle: "Excluir notificações?", clearNotificationsMessage: "Todas as notificações desta lista serão excluídas. Esta ação não pode ser desfeita.", clear: "Limpar", noNotifications: "Nenhuma notificação por enquanto", yesDelete: "Sim, excluir",
    added: "adicionado", receiptUploaded: "Comprovante enviado com sucesso", morning: "Bom dia", afternoon: "Boa tarde", evening: "Boa noite", currentOrder: "Pedido em andamento", orderNumber: "Pedido", ratingSendError: "Não foi possível enviar a avaliação.",
    notificationPaymentTitle: "Pagamento confirmado", notificationPaymentMessage: "Seu pagamento do pedido nº {order} foi aprovado.", notificationOnWayTitle: "Seu pedido está a caminho", notificationOnWayMessage: "Seu pedido nº {order} saiu para entrega no seu endereço.", notificationDeliveredTitle: "Pedido entregue", notificationDeliveredMessage: "Seu pedido nº {order} foi entregue. Bom apetite!",
    nameRequired: "O nome não pode ficar vazio.", nameMin: "O nome deve ter pelo menos 3 caracteres.", nameNoDigits: "O nome não pode conter números.", phoneRequired: "O telefone é obrigatório.", phoneFormat: "Digite 7 ou 10 números, sem espaços ou hífens.",
    locationPermission: "Precisamos da permissão de localização para registrar seu endereço exato.", addressRequired: "O endereço é obrigatório.", captureAddressLocation: "Use o botão de localização para marcar este endereço.", locationFetchError: "Não foi possível obter sua localização. Tente novamente.", delete: "Excluir",
    branchLocations: "Nossas unidades", branchesNoLocation: "As unidades ainda não têm localização cadastrada.", routeCalculating: "Calculando rota...", routeNoStreet: "não foi possível calcular a rota pelas ruas", yourDeliveryAddress: "Seu endereço de entrega", yourBranch: "Sua unidade", nearBranch: "Unidade mais próxima", mapMobileOnly: "O mapa está disponível apenas no aplicativo móvel.", branchesMapMobileOnly: "O mapa das unidades está disponível apenas no aplicativo móvel.", tapMapGps: "Toque no mapa para marcar sua localização ou use o botão GPS.", dragPinAdjust: "Arraste o marcador para ajustar.", dragPin: "Arraste o marcador para ajustar sua localização.", confirmLocation: "Confirmar localização", locationPermissionTitle: "Permissão necessária", locationPermissionMessage: "Ative a permissão de localização ou toque no mapa para escolher o ponto.",
  },
  fr: {
    oneProduct: "article", manyProducts: "articles",
    statusPending: "En attente", statusConfirmed: "Confirmée", statusInPreparation: "En préparation", statusReady: "Prête", statusDelivered: "Livrée", statusCancelled: "Annulée",
    trackTitle: "Commande", cancelledOrder: "Cette commande a été annulée.", products: "Produits", rateDriver: "Évaluer le livreur", yourAddress: "Votre adresse", noPhone: "Aucun téléphone",
    thankYou: "Merci !", deliveryComplete: "Commande livrée !", rateQuestion: "Comment était le service de", starPrompt: "Touchez une étoile", feedbackPlaceholder: "Dites-nous en plus (facultatif)", notNow: "Pas maintenant", sendRating: "Envoyer l’évaluation",
    rateVeryBad: "Très mauvais", rateBad: "Mauvais", rateFair: "Moyen", rateGood: "Bon", rateExcellent: "Excellent",
    orderReceived: "Commande reçue !", paymentConfirmed: "Paiement confirmé !", orderPaidMessage: "Votre paiement a été reçu et votre commande est en préparation. Nous vous informerons lorsqu’elle sera en livraison.",
    orderPendingMessage: "Votre commande attend la confirmation du restaurant. Nous vous informerons lorsqu’elle sera en livraison.", profileTrackingNote: "Suivez votre commande dans Mon profil.",
    confirmation: "Confirmation", wompiAmount: "Montant à payer avec Wompi :", wompiInstructions: "Le paiement sécurisé Wompi va s’ouvrir. À la fin, revenez dans l’application ; nous confirmerons le paiement automatiquement.",
    cashPayment: "Paiement en espèces à la livraison :", cashInstructions: "Payez le livreur à la réception. Essayez d’avoir le montant exact.",
    waitingPayment: "En attente de confirmation du paiement...", cancelWait: "Annuler l’attente", processing: "Traitement...", confirmOrderAndSend: "Confirmer et commander", payWithWompi: "Payer avec Wompi",
    paymentMethod: "Mode de paiement", totalToPay: "Total à payer", paymentQuestion: "Comment souhaitez-vous payer ?", cardTypes: "Nequi, cartes, PSE", cash: "Espèces", payDriver: "Paiement au livreur", continue: "Continuer", orderTitle: "Votre commande", emptyCart: "Vous n’avez encore rien ajouté.", continueToPayment: "Continuer vers le paiement",
    addressesTitle: "Mes adresses", newAddress: "Nouvelle adresse", addressField: "Adresse", reference: "Référence (facultatif)",
    defaultAddress: "Par défaut", setDefault: "Définir par défaut", deleteAddress: "Supprimer", emptyAddresses: "Aucune adresse enregistrée pour le moment.",
    saveAddress: "Enregistrer l’adresse", savingAddress: "Enregistrement...", useGps: "Utiliser ma position actuelle",
    menu: "Menu", profile: "Profil", settings: "Réglages", settingsTitle: "Configuration", notifications: "Notifications",
    appearance: "Apparence et préférences", orderAlerts: "État de la commande", orderAlertsDesc: "Alertes lorsque votre repas est en route",
    sounds: "Sons", soundsDesc: "Émettre les sons de notification",
    darkMode: "Mode sombre", darkModeDesc: "Utiliser des couleurs sombres dans l’application", language: "Langue", chooseLanguage: "Choisissez une langue",
    logout: "Déconnexion", greeting: "Que souhaitez-vous commander aujourd’hui ?", deliverTo: "Livrer à :", addAddress: "Ajouter une adresse",
    nearestBranch: "Recherche du restaurant le plus proche...", noBranch: "Impossible de trouver un restaurant", viewMap: "Voir la carte",
    selectedLocation: "Emplacement sélectionné", changeLocation: "Changer d’emplacement", cart: "Voir le panier", addToCart: "Ajouter au panier ?",
    cancel: "Annuler", add: "Ajouter", close: "Fermer", whereDeliver: "Où livrer votre commande ?", noAddresses: "Aucune adresse enregistrée pour le moment.",
    addNewAddress: "+ Ajouter une adresse", seeLess: "Voir moins", all: "Tous", useLocation: "Utiliser ma position",
    noCoverage: "Nous ne livrons pas à cet emplacement", chooseAddress: "Choisissez une adresse ou utilisez votre position pour voir le menu",
    noProducts: "Aucun produit disponible dans ce restaurant.", loadingMenu: "Chargement du menu...", orderFrom: "Commande du restaurant :", currentLocation: "votre position actuelle",
    changeBranch: "Changer de restaurant", useThisBranch: "Choisir ce restaurant",
    changeDelivery: "Modifier la livraison", deliveryOptionsTitle: "Modifier l’adresse ou le restaurant",
    deliveryAddressOptionDesc: "Choisissez un autre point sur la carte pour trouver le restaurant le plus proche.",
    deliveryBranchOptionDesc: "Choisissez le restaurant qui préparera votre commande.",
    trackDriverMap: "Voir le livreur sur la carte",
    cartMustBeEmptyTitle: "Videz d'abord votre panier", cartMustBeEmptyForLocation: "Pour changer l'adresse ou le restaurant, videz votre panier puis ajoutez les produits du nouveau restaurant.",
    saveLocationBeforeOrderTitle: "Enregistrez l'adresse de livraison", saveLocationBeforeOrderMessage: "Pour commander à cet emplacement, enregistrez-le comme adresse de livraison puis réessayez.",
    profileTitle: "Mon profil", myOrders: "Mes commandes", inProgress: "En cours", delivered: "Livrées", total: "Total", live: "EN DIRECT",
    preparing: "En préparation", onTheWay: "En livraison", gpsTrackingLive: "Suivi GPS en direct", gpsWaiting: "En attente de la position GPS", assignedDriver: "Livreur assigné", contact: "Contact :", unavailable: "Indisponible",
    latestOrders: "Commandes récentes", noOrders: "Vous n’avez pas encore passé de commande.", moreOrders: "Voir plus de commandes", myData: "Mes informations",
    edit: "Modifier", save: "Enregistrer", saving: "Enregistrement...", name: "Prénom", lastName: "Nom", document: "Pièce d’identité",
    email: "E-mail", phone: "Téléphone mobile", address: "Adresse par défaut", noAddress: "Aucune adresse enregistrée", manageAddresses: "Gérer mes adresses de livraison",
    error: "Erreur", addressSaveError: "Impossible d'enregistrer l'adresse.", addressUpdateError: "Impossible de mettre à jour l'adresse.", addressDeleteError: "Impossible de supprimer l'adresse.",
    deleteAddressTitle: "Supprimer l'adresse", deleteAddressConfirm: "Voulez-vous vraiment supprimer cette adresse ?", streetPlaceholder: "12 rue Principale, appartement 802", referencePlaceholder: "Portail bleu, près du parc",
    locationError: "Impossible d'obtenir votre position actuelle. Réessayez.", selectPaymentTitle: "Choisissez un moyen de paiement", selectPaymentMessage: "Choisissez votre mode de paiement avant de continuer.",
    orderCancelledTitle: "Commande annulée", orderCancelledMessage: "Le paiement n'a pas été effectué, la commande n'a donc pas été envoyée.", selectAddressTitle: "Choisissez une adresse", selectAddressMessage: "Choisissez ou ajoutez une adresse de livraison avant de continuer.",
    paymentRejectedTitle: "Paiement refusé", paymentRejectedMessage: "Wompi a refusé le paiement et la commande a été annulée. Vous pouvez réessayer.", paymentUnconfirmedTitle: "Confirmation non reçue", paymentUnconfirmedMessage: "Si vous avez payé, votre commande arrivera dans quelques minutes. Sinon, annulez-la depuis 'Commande en cours'.",
    createOrderError: "Impossible de créer la commande. Réessayez.", useLocationTitle: "Utiliser cet emplacement ?", useLocationMessage: "Vous pouvez l'enregistrer comme adresse de livraison et commander à cet endroit.", onlyViewBranch: "Voir le restaurant uniquement", saveAndUse: "Enregistrer et utiliser",
    savedTitle: "Enregistré !", profileSavedMessage: "Vos informations personnelles ont été mises à jour.", profileSaveError: "Impossible d'enregistrer vos informations. Réessayez.", phoneDialError: "Impossible d'ouvrir le clavier téléphonique.",
    notificationTitle: "Notifications", clearNotificationsTitle: "Supprimer les notifications ?", clearNotificationsMessage: "Toutes les notifications de cette liste seront supprimées. Cette action est irréversible.", clear: "Effacer", noNotifications: "Aucune notification pour le moment", yesDelete: "Oui, supprimer",
    added: "ajouté", receiptUploaded: "Justificatif envoyé avec succès", morning: "Bonjour", afternoon: "Bon après-midi", evening: "Bonsoir", currentOrder: "Commande en cours", orderNumber: "Commande", ratingSendError: "Impossible d'envoyer l'évaluation.",
    notificationPaymentTitle: "Paiement confirmé", notificationPaymentMessage: "Le paiement de la commande n° {order} a été approuvé.", notificationOnWayTitle: "Votre commande est en route", notificationOnWayMessage: "La commande n° {order} est partie vers votre adresse.", notificationDeliveredTitle: "Commande livrée", notificationDeliveredMessage: "La commande n° {order} a été livrée. Bon appétit !",
    nameRequired: "Le nom ne peut pas être vide.", nameMin: "Le nom doit contenir au moins 3 caractères.", nameNoDigits: "Le nom ne peut pas contenir de chiffres.", phoneRequired: "Le téléphone est obligatoire.", phoneFormat: "Saisissez 7 ou 10 chiffres, sans espaces ni tirets.",
    locationPermission: "L'autorisation de localisation est nécessaire pour enregistrer votre adresse exacte.", addressRequired: "L'adresse est obligatoire.", captureAddressLocation: "Utilisez le bouton de localisation pour marquer cette adresse.", locationFetchError: "Impossible d'obtenir votre position. Réessayez.", delete: "Supprimer",
    branchLocations: "Nos restaurants", branchesNoLocation: "La position des restaurants n'est pas encore enregistrée.", routeCalculating: "Calcul de l'itinéraire...", routeNoStreet: "impossible de calculer l'itinéraire par les rues", yourDeliveryAddress: "Votre adresse de livraison", yourBranch: "Votre restaurant", nearBranch: "Restaurant le plus proche", mapMobileOnly: "La carte est disponible uniquement dans l'application mobile.", branchesMapMobileOnly: "La carte des restaurants est disponible uniquement dans l'application mobile.", tapMapGps: "Touchez la carte pour placer votre position ou utilisez le bouton GPS.", dragPinAdjust: "Déplacez le repère pour l'ajuster.", dragPin: "Déplacez le repère pour ajuster votre position.", confirmLocation: "Confirmer la position", locationPermissionTitle: "Autorisation nécessaire", locationPermissionMessage: "Activez la localisation ou touchez la carte pour choisir un point.",
  },
};

export function getClientLocale(language: ClientLanguage): string {
  return { es: "es-CO", en: "en-US", pt: "pt-BR", fr: "fr-FR" }[language];
}

type ClientPreferencesContextValue = {
  settings: ClientSettings;
  language: ClientLanguage;
  hydrated: boolean;
  loading: boolean;
  saving: boolean;
  error: string | null;
  isDark: boolean;
  colors: { background: string; surface: string; elevated: string; text: string; muted: string; border: string; accent: string };
  t: (key: string) => string;
  updateSettings: (changes: Partial<ClientSettingsUpdate>) => Promise<void>;
  updateLanguage: (language: ClientLanguage) => Promise<void>;
};

const lightColors = { background: "#F8FAFC", surface: "#FFFFFF", elevated: "#F1F5F9", text: "#1E293B", muted: "#64748B", border: "#E2E8F0", accent: "#E61C24" };
const darkColors = {
  background: "#0B1220",
  surface: "#111827",
  elevated: "#1F2937",
  text: "#F8FAFC",
  muted: "#CBD5E1",
  border: "#334155",
  accent: "#E61C24",
};
const ClientPreferencesContext = createContext<ClientPreferencesContextValue | null>(null);

export function ClientPreferencesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const cacheScope = user
    ? String(getUserIdFromToken(user.token) ?? user.identifier.trim().toLowerCase())
    : "anonymous";
  const cacheKey = `client-preferences:${encodeURIComponent(cacheScope)}`;
  const languageSelectedBeforeLogin = useRef<ClientLanguage>(getApiLanguage());
  const [settings, setSettings] = useState(defaultSettings);
  const settingsRef = useRef(defaultSettings);
  const [language, setLanguage] = useState<ClientLanguage>("es");
  const languageRef = useRef<ClientLanguage>("es");
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const settingsTouched = useRef(false);
  const languageTouched = useRef(false);

  useEffect(() => {
    setNetworkErrorLanguage(language);
    setApiLanguage(language);
  }, [language]);

  useEffect(() => {
    let mounted = true;
    settingsTouched.current = false;
    languageTouched.current = false;

    const load = async () => {
      let restoredFromCache = false;
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as { settings?: Partial<ClientSettings>; language?: string };
          if (parsed.settings) {
            const next = { ...defaultSettings, ...parsed.settings };
            settingsRef.current = next;
            setSettings(next);
            restoredFromCache = true;
          }
          if (parsed.language && parsed.language in labels) {
            const nextLanguage = parsed.language as ClientLanguage;
            languageRef.current = nextLanguage;
            setApiLanguage(nextLanguage);
            setLanguage(nextLanguage);
            restoredFromCache = true;
          }
        }
      } catch {
        // A corrupt or unavailable cache must not block server preferences.
      }
      if (restoredFromCache && mounted) setLoading(false);

      try {
        const [settingsResult, languageResult] = await Promise.allSettled([
          clientSettingsService.getSettings(),
          clientSettingsService.getLanguage(),
        ]);
        if (!mounted) return;
        if (settingsResult.status === "fulfilled" && !settingsTouched.current) {
          const next = { ...defaultSettings, ...settingsResult.value };
          settingsRef.current = next;
          setSettings(next);
        }
        if (
          languageResult.status === "fulfilled" &&
          languageResult.value.language in labels &&
          !languageTouched.current
        ) {
          const localLanguage = languageRef.current;
          const nextLanguage = languageResult.value.isConfigured
            ? languageResult.value.language as ClientLanguage
            : (localLanguage in labels
              ? localLanguage
              : languageSelectedBeforeLogin.current);
          languageRef.current = nextLanguage;
          setApiLanguage(nextLanguage);
          setLanguage(nextLanguage);
          if (!languageResult.value.isConfigured) {
            await clientSettingsService.updateLanguage(nextLanguage).catch(() => undefined);
          }
        }
        void AsyncStorage.setItem(cacheKey, JSON.stringify({
          settings: settingsRef.current,
          language: languageRef.current,
        })).catch(() => {});
      } finally {
        if (mounted) {
          setHydrated(true);
          setLoading(false);
        }
      }
    };

    void load().catch(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, [cacheKey]);

  const updateSettings = useCallback((changes: Partial<ClientSettingsUpdate>) => {
    const next = { ...settingsRef.current, ...changes };
    settingsTouched.current = true;
    settingsRef.current = next;
    setSettings(next);
    void AsyncStorage.setItem(cacheKey, JSON.stringify({ settings: next, language: languageRef.current })).catch(() => {});
    setSaving(true);
    setError(null);
    queue.current = queue.current.catch(() => undefined).then(async () => {
      const current = settingsRef.current;
      const saved = await clientSettingsService.updateSettings({
        theme: current.theme,
        emailNotifications: current.emailNotifications,
        pushNotifications: current.pushNotifications,
        soundNotifications: current.soundNotifications,
        timeZone: current.timeZone,
      });
      settingsRef.current = { ...settingsRef.current, ...saved };
      setSettings(settingsRef.current);
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "No se pudieron guardar las preferencias.");
    }).finally(() => setSaving(false));
    return queue.current;
  }, [cacheKey]);

  const updateLanguage = useCallback(async (next: ClientLanguage) => {
    languageTouched.current = true;
    const previous = language;
    languageRef.current = next;
    setApiLanguage(next);
    setLanguage(next);
    void AsyncStorage.setItem(cacheKey, JSON.stringify({ settings: settingsRef.current, language: next })).catch(() => {});
    setSaving(true);
    setError(null);
    try {
      const saved = await clientSettingsService.updateLanguage(next);
      if (saved.language in labels) {
        languageRef.current = saved.language as ClientLanguage;
        setLanguage(languageRef.current);
        void AsyncStorage.setItem(cacheKey, JSON.stringify({ settings: settingsRef.current, language: languageRef.current })).catch(() => {});
      }
    } catch (err) {
      languageRef.current = previous;
      setLanguage(previous);
      setError(err instanceof Error ? err.message : "No se pudo guardar el idioma.");
      throw err;
    } finally {
      setSaving(false);
    }
  }, [cacheKey, language]);

  const value = useMemo(() => {
    const isDark = settings.theme === "dark";
    return {
      settings, language, hydrated, loading, saving, error, isDark,
      colors: isDark ? darkColors : lightColors,
      t: (key: string) => labels[language][key] ?? labels.es[key] ?? key,
      updateSettings, updateLanguage,
    };
  }, [settings, language, hydrated, loading, saving, error, updateSettings, updateLanguage]);

  return <ClientPreferencesContext.Provider value={value}>{children}</ClientPreferencesContext.Provider>;
}

export function useClientPreferences() {
  const context = useContext(ClientPreferencesContext);
  if (!context) throw new Error("useClientPreferences debe usarse dentro del panel cliente.");
  return context;
}

// Notification services are shared with delivery staff, where client settings are not mounted.
export function useOptionalClientPreferences() {
  return useContext(ClientPreferencesContext);
}

export function useClientThemedStyles<T extends object>(baseStyles: T): T {
  const { isDark } = useClientPreferences();
  return useMemo(() => {
    if (!isDark) return baseStyles;
    const backgroundReplacements: Record<string, string> = {
      "#FFFFFF": darkColors.surface, "#FFF": darkColors.surface,
      "#F8FAFC": darkColors.background, "#F1F5F9": darkColors.elevated,
      "#FEF2F2": "#3B2024", "#FEE2E2": "#4C2529", "#E2E8F0": darkColors.border,
      "#CBD5E1": darkColors.border, "#FCA5A5": "#7F1D1D", "#ECFDF5": "#123329",
      "#1E293B": darkColors.elevated, "#334155": darkColors.elevated,
      "#A7F3D0": "#14532D",
    };
    const textReplacements: Record<string, string> = {
      "#1E293B": darkColors.text, "#334155": darkColors.text,
      "#64748B": darkColors.muted, "#94A3B8": "#A8B6C8",
      "#B91C1C": "#FCA5A5", "#EF4444": "#F87171", "#065F46": "#6EE7B7",
      "#047857": "#6EE7B7", "#10B981": "#34D399", "#3B82F6": "#93C5FD",
    };
    const borderReplacements: Record<string, string> = {
      "#E2E8F0": darkColors.border, "#CBD5E1": darkColors.border, "#F1F5F9": darkColors.border,
    };
    const borderProperties = new Set(["borderColor", "borderBottomColor", "borderTopColor"]);
    const colorProperties = new Set([
      "backgroundColor",
      "color",
      "borderColor",
      "borderBottomColor",
      "borderTopColor",
    ]);
    const themed = Object.fromEntries(Object.entries(baseStyles).map(([key, raw]) => {
      const flattened = StyleSheet.flatten(raw as never);
      const style = flattened ? { ...(flattened as Record<string, unknown>) } : raw;
      if (style && typeof style === "object") {
        for (const property of colorProperties) {
          const color = (style as Record<string, unknown>)[property];
          if (typeof color === "string") {
            const normalized = color.toUpperCase();
            const replacements = borderProperties.has(property)
              ? borderReplacements
              : property === "color" ? textReplacements : backgroundReplacements;
            if (replacements[normalized]) (style as Record<string, unknown>)[property] = replacements[normalized];
          }
        }
      }
      return [key, style];
    }));
    return themed as T;
  }, [baseStyles, isDark]);
}
