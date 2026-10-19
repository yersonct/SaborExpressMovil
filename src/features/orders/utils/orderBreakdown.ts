// Fix21: el impoconsumo se agrega al subtotal de productos.
// El domicilio se suma aparte y no hace parte de la base gravable.
export function calcBreakdown(
  subTotal: number,
  taxRate: number,
  deliveryFee: number,
) {
  const fee = subTotal > 0 ? deliveryFee : 0;
  const exactTax = taxRate > 0 ? (subTotal * taxRate) / 100 : 0;
  const taxCents = exactTax * 100;
  const tax =
    Math.round(
      taxCents + Number.EPSILON * Math.max(1, Math.abs(taxCents)),
    ) / 100;

  return {
    subTotal,
    taxRate,
    tax,
    taxIncludedInPrice: false,
    deliveryFee: fee,
    total: subTotal + tax + fee,
  };
}

// Distancia en km entre dos puntos (Haversine)
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LABELS = {
  es: {
    subtotal: "Subtotal (productos)",
    taxBase: "Base gravable (comida/bebida)",
    taxIncluded: "Impoconsumo incluido en el precio",
    taxLegacy: "Impoconsumo adicional",
    delivery: "Domicilio",
  },
  en: {
    subtotal: "Subtotal (products)",
    taxBase: "Taxable base (food/drinks)",
    taxIncluded: "Consumption tax included in price",
    taxLegacy: "Additional consumption tax",
    delivery: "Delivery",
  },
  pt: {
    subtotal: "Subtotal (produtos)",
    taxBase: "Base tributável (comida/bebida)",
    taxIncluded: "Imposto sobre consumo incluído no preço",
    taxLegacy: "Imposto sobre consumo adicional",
    delivery: "Entrega",
  },
  fr: {
    subtotal: "Sous-total (produits)",
    taxBase: "Base imposable (repas/boissons)",
    taxIncluded: "Taxe incluse dans le prix",
    taxLegacy: "Taxe additionnelle sur la consommation",
    delivery: "Livraison",
  },
} as const;

export const getBreakdownLabels = (lang?: string) =>
  LABELS[lang as keyof typeof LABELS] ?? LABELS.es;

const MESSAGES = {
  es: {
    radiusTitle: "Fuera de la zona de entrega",
    radiusBody: (km: string, r: string, b: string) =>
      `Tu dirección está a ${km} km de la sede ${b} y el radio de entrega es de ${r} km. No podemos llevar el pedido a esa dirección.`,
    notConfiguredTitle: "Sede no disponible",
    notConfiguredBody:
      "Esta sede aún no tiene configurados el Impoconsumo y la tarifa de domicilio. Intenta más tarde.",
  },
  en: {
    radiusTitle: "Outside the delivery area",
    radiusBody: (km: string, r: string, b: string) =>
      `Your address is ${km} km from ${b} and the delivery radius is ${r} km. We can't deliver to that address.`,
    notConfiguredTitle: "Branch unavailable",
    notConfiguredBody:
      "This branch has no consumption tax or delivery fee configured yet. Please try later.",
  },
  pt: {
    radiusTitle: "Fora da área de entrega",
    radiusBody: (km: string, r: string, b: string) =>
      `Seu endereço está a ${km} km da unidade ${b} e o raio de entrega é de ${r} km. Não podemos entregar nesse endereço.`,
    notConfiguredTitle: "Unidade indisponível",
    notConfiguredBody:
      "Esta unidade ainda não tem imposto sobre consumo e taxa de entrega configurados. Tente mais tarde.",
  },
  fr: {
    radiusTitle: "Hors de la zone de livraison",
    radiusBody: (km: string, r: string, b: string) =>
      `Votre adresse est à ${km} km de ${b} et le rayon de livraison est de ${r} km. Nous ne pouvons pas livrer à cette adresse.`,
    notConfiguredTitle: "Succursale indisponible",
    notConfiguredBody:
      "Cette succursale n'a pas encore configuré la taxe à la consommation ni les frais de livraison. Réessayez plus tard.",
  },
} as const;

export const getRadiusMessages = (lang?: string) =>
  MESSAGES[lang as keyof typeof MESSAGES] ?? MESSAGES.es;
