import { useClientDeliveryLocation } from "./useClientDeliveryLocation";
import { useClientCatalogCart } from "./useClientCatalogCart";
import { useClientCheckout } from "./useClientCheckout";
export function useClientDashboard() {
const location = useClientDeliveryLocation();
const catalog = useClientCatalogCart(location);
const checkout = useClientCheckout({ ...location, ...catalog });
return { ...location, ...catalog, ...checkout };
}
export type ClientDashboardModel = ReturnType<typeof useClientDashboard>;
