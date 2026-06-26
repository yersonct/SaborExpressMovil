export type OrderType = 'mesa' | 'llevar';

export interface Order {
  id: string;
  type: OrderType;
  table?: number;
  items: string;
  total: number;
  status: 'pendiente' | 'pagado' | 'pagando_transferencia';
  paymentMethod?: 'transferencia' | 'efectivo';
  deliveryPerson?: string;
  time: string;
  transferProofUrl?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  startTime: string;
  endTime: string;
  basePay: number;
  status: 'trabajando' | 'pagado';
}

export const INITIAL_ORDERS: Order[] = [
  { id: 'ORD-101', type: 'mesa', table: 4, items: '2x Hamburguesa\n1x Gaseosa Litro\n1x Porción de Papas', total: 45000, status: 'pendiente', time: '12:45 PM' },
  { id: 'ORD-102', type: 'llevar', items: '1x Pizza Familiar', total: 55000, status: 'pagado', paymentMethod: 'transferencia', deliveryPerson: 'Carlos Gómez (Moto 1)', time: '12:50 PM' },
  { id: 'ORD-103', type: 'mesa', table: 2, items: '3x Empanadas\n2x Jugos Naturales', total: 22000, status: 'pendiente', time: '01:15 PM' },
  { id: 'ORD-104', type: 'llevar', items: '2x Hamburguesa Sabor\n1x Gaseosa Litro', total: 38000, status: 'pagando_transferencia', paymentMethod: 'transferencia', deliveryPerson: 'Por asignar', time: '01:25 PM', transferProofUrl: 'https://cdn-icons-png.flaticon.com/512/2942/2942269.png' },
];

export const STAFF_TODAY: Employee[] = [
  { id: 'EMP-01', name: 'María Cárdenas', role: 'Mesera', startTime: '08:00 AM', endTime: '04:00 PM', basePay: 45000, status: 'trabajando' },
  { id: 'EMP-02', name: 'Jorge Pérez', role: 'Cocinero Principal', startTime: '06:00 AM', endTime: '04:00 PM', basePay: 60000, status: 'trabajando' },
  { id: 'EMP-03', name: 'Carlos Gómez', role: 'Repartidor', startTime: '12:00 PM', endTime: '09:00 PM', basePay: 35000, status: 'trabajando' },
];

export const MENU_ITEMS = [
  { id: 'm1', name: 'Hamburguesa Sabor', price: 15000 },
  { id: 'm2', name: 'Pizza Familiar', price: 55000 },
  { id: 'm3', name: 'Papas Francesas', price: 5000 },
  { id: 'm4', name: 'Gaseosa Litro', price: 8000 },
  { id: 'm5', name: 'Jugo Natural', price: 6000 },
  { id: 'm6', name: 'Empanada de Carne', price: 3000 },
  { id: 'm7', name: 'Galleta de Chocolate', price: 3500 },
  { id: 'm8', name: 'Cerveza Nacional', price: 7000 },
  { id: 'm9', name: 'Helado Casero', price: 4500 },
];