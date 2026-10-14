import React from "react";
import { Ionicons } from "@expo/vector-icons";

export const TIEMPOS_POR_PLATILLO: Record<string, number> = {
  "Hamburguesa Sencilla": 10,
  "Papas Fritas Grandes": 5,
  "Pizza Peperoni": 15,
  "Gaseosa Litro": 1,
  "Carne Asada": 20,
  Ensalada: 3,
};

export type EstadoPedido =
  | "Pendiente"
  | "En Preparación"
  | "Listo en Barra"
  | "Entregado";
export type TipoPedido = "Mesa" | "Para Llevar" | "Domicilio";

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
  return listaPedidos.map((pedido) => {
    if (pedido.estado === "Entregado" || pedido.estado === "Listo en Barra") {
      return { ...pedido, tiempoEstimado: 0 };
    }
    let tiempoBasePedido = 0;
    pedido.menu.forEach((item) => {
      const tiempoPlatillo = TIEMPOS_POR_PLATILLO[item.platillo] || 5;
      if (tiempoPlatillo > tiempoBasePedido) tiempoBasePedido = tiempoPlatillo;
    });
    const tiempoRealEstimado = tiempoAcumuladoCola + tiempoBasePedido;
    tiempoAcumuladoCola += tiempoBasePedido;
    return { ...pedido, tiempoEstimado: tiempoRealEstimado };
  });
};

// Devuelve el color según estado (se usa en los estilos del PedidoCard)
export const getColorEstado = (estado: EstadoPedido) => {
  switch (estado) {
    case "Pendiente":
      return "#f97316"; // naranja
    case "En Preparación":
      return "#3b82f6"; // azul
    case "Listo en Barra":
      return "#22c55e"; // verde
    default:
      return "#64748b";
  }
};

export const IconoReloj = ({
  color = "#94a3b8",
  size = 16,
}: {
  color?: string;
  size?: number;
}) => <Ionicons name="time-outline" size={size} color={color} />;

export const IconoMesa = ({
  color = "#94a3b8",
  size = 18,
}: {
  color?: string;
  size?: number;
}) => <Ionicons name="restaurant-outline" size={size} color={color} />;

export const IconoLlevar = ({
  color = "#94a3b8",
  size = 18,
}: {
  color?: string;
  size?: number;
}) => <Ionicons name="bag-handle-outline" size={size} color={color} />;

export const getIconoTipo = (tipo: TipoPedido, color?: string) => {
  if (tipo === "Para Llevar" || tipo === "Domicilio")
    return <IconoLlevar color={color} />;
  return <IconoMesa color={color} />;
};
