    export const CURRENT_DRIVER_NAME = "Carlos Gómez";

    export type PaymentMethod = 'Efectivo' | 'Datáfono' | 'Transferencia';
    export type PaymentStatus = 'Pendiente' | 'Pagado';

export interface OrderItem {
  name: string;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  address: string;
  status: 'Pendiente' | 'Aceptado';
  restaurantStatus: 'Preparando' | 'Listo para recoger';
  subtotal: number;
  deliveryFee: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  assignedDriver: string | null;
  items: OrderItem[]; 
}

const SAMPLE_PRODUCTS = ["Hamburguesa Sabor", "Pizza Express", "Papas Francesas", "Gaseosa 500ml", "Empanada de Carne", "Jugo Natural"];

export const generateMockOrders = (startIndex: number, count: number): Order[] => {
  const newOrders: Order[] = [];
  const paymentMethods: PaymentMethod[] = ['Efectivo', 'Datáfono', 'Transferencia'];
  for (let i = startIndex; i < startIndex + count; i++) {
    const isTakenByOther = Math.random() > 0.8; 
    const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    const numItems = Math.floor(Math.random() * 4) + 1;
    const orderItems: OrderItem[] = [];
    for (let j = 0; j < numItems; j++) {
      orderItems.push({
        name: SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)],
        quantity: Math.floor(Math.random() * 3) + 1
      });
    }
    
    newOrders.push({
      id: `ORD-${1000 + i}`,
      customerName: `Cliente ${i + 1}`,
      customerPhone: `+57 300 ${Math.floor(1000000 + Math.random() * 9000000)}`,
      address: `Calle Falsa ${123 + i}, Barrio Centro`,
      status: isTakenByOther ? 'Aceptado' : 'Pendiente',
      restaurantStatus: Math.random() > 0.5 ? 'Preparando' : 'Listo para recoger',
      subtotal: Math.floor(Math.random() * 30000) + 15000,
      deliveryFee: 4500,
      paymentMethod,
      paymentStatus: paymentMethod === 'Efectivo' ? 'Pendiente' : 'Pagado',
      assignedDriver: isTakenByOther ? 'Pedro Pérez' : null,
      items: orderItems,
    });
  }
  return newOrders;
};