import React from 'react';

export const TIEMPOS_POR_PLATILLO: Record<string, number> = {
  'Hamburguesa Sencilla': 10,
  'Papas Fritas Grandes': 5,
  'Pizza Peperoni': 15,
  'Gaseosa Litro': 1,
  'Carne Asada': 20,
  'Ensalada': 3
};

export type EstadoPedido = 'Pendiente' | 'En Preparación' | 'Listo en Barra' | 'Entregado';
export type TipoPedido = 'Mesa' | 'Para Llevar' | 'Domicilio';

export interface ItemMenu {
  platillo: string;
  cantidad: number;
  notas?: string;
}

export interface Pedido {
  id: string;
  nombreMesero: string;
  mesa: string;
  estado: EstadoPedido;
  menu: ItemMenu[];
  tiempoEstimado?: number;
  tipoPedido: TipoPedido;
  horaIngreso: string;
}

export const calcularTiemposConCola = (listaPedidos: Pedido[]): Pedido[] => {
  let tiempoAcumuladoCola = 0;
  return listaPedidos.map(pedido => {
    if (pedido.estado === 'Entregado' || pedido.estado === 'Listo en Barra') {
      return { ...pedido, tiempoEstimado: 0 };
    }
    let tiempoBasePedido = 0;
    pedido.menu.forEach(item => {
      const tiempoPlatillo = TIEMPOS_POR_PLATILLO[item.platillo] || 5;
      if (tiempoPlatillo > tiempoBasePedido) {
        tiempoBasePedido = tiempoPlatillo;
      }
    });
    const tiempoRealEstimado = tiempoAcumuladoCola + tiempoBasePedido;
    tiempoAcumuladoCola += tiempoBasePedido;
    return { ...pedido, tiempoEstimado: tiempoRealEstimado };
  });
};

export const getClaseEstado = (estado: EstadoPedido) => {
  switch (estado) {
    case 'Pendiente': return 'estado-pendiente';
    case 'En Preparación': return 'estado-preparacion';
    case 'Listo en Barra': return 'estado-listo';
    default: return '';
  }
};

// 🔥 Iconos Profesionales SVG en lugar de Emojis 🔥
export const IconoLlevar = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
);

export const IconoMesa = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 18h18"></path><path d="M5 21V18"></path><path d="M19 21V18"></path><path d="M8 7l4-4 4 4"></path><path d="M12 3v15"></path></svg>
);

export const IconoReloj = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
);

export const getIconoTipo = (tipo: TipoPedido) => {
  if (tipo === 'Para Llevar' || tipo === 'Domicilio') return <IconoLlevar />;
  return <IconoMesa />;
};