// TableroPedidos.tsx
'use client'; 

import React, { useState } from 'react';
import './style/TableroPedidos.css';
import { Pedido, calcularTiemposConCola } from './TableroUtils';
import PedidoCard from './PedidoCard';
import SidebarMetricas from './SidebarMetricas';

export default function TableroPedidos({ rolActual = 'cocinero' }: { rolActual?: string }) {
  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const pedidosIniciales: Pedido[] = [
      { id: 'ORD-001', nombreMesero: 'Carlos Gómez', mesa: 'Mesa 4', estado: 'Pendiente', tipoPedido: 'Mesa', horaIngreso: '12:30 PM', menu: [{ platillo: 'Hamburguesa Sencilla', cantidad: 2, notas: 'Sin cebolla, urgente' }, { platillo: 'Papas Fritas Grandes', cantidad: 1 }] },
      { id: 'ORD-002', nombreMesero: 'Ana López', mesa: 'Mostrador', estado: 'Pendiente', tipoPedido: 'Para Llevar', horaIngreso: '12:32 PM', menu: [{ platillo: 'Pizza Peperoni', cantidad: 1, notas: 'Bien tostada por favor' }] },
      { id: 'ORD-003', nombreMesero: 'Luis Pérez', mesa: 'Mesa 7', estado: 'Pendiente', tipoPedido: 'Mesa', horaIngreso: '12:35 PM', menu: [{ platillo: 'Carne Asada', cantidad: 1, notas: 'Término medio' }, { platillo: 'Ensalada', cantidad: 2 }] }
    ];
    return calcularTiemposConCola(pedidosIniciales);
  });

  const togglePantallaCompleta = () => {
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => console.error(err));
      } else {
        document.exitFullscreen();
      }
    }
  };

  const avanzarEstado = (idPedido: string) => {
    setPedidos(pedidosActuales => {
      const nuevosPedidos: Pedido[] = pedidosActuales.map((pedido): Pedido[] | any => {
        if (pedido.id === idPedido) {
          if (pedido.estado === 'Pendiente') return { ...pedido, estado: 'En Preparación' };
          if (pedido.estado === 'En Preparación') return { ...pedido, estado: 'Listo en Barra' };
          if (pedido.estado === 'Listo en Barra') return { ...pedido, estado: 'Entregado' };
        }
        return pedido;
      });
      return calcularTiemposConCola(nuevosPedidos);
    });
  };

  return (
    <div className="tablero-wrapper">
      <header className="tablero-header">
        <div className="header-brand">
          <div className="logo-circulo"></div>
          <h2>SABOREXPRESS <span className="rol-badge">ROL: {rolActual.toUpperCase()}</span></h2>
        </div>
        <button className="btn-fullscreen" onClick={togglePantallaCompleta}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
          PANTALLA COMPLETA
        </button>
      </header>

      <div className="layout-principal">
        <div className="grid-pedidos">
          {pedidos.filter(p => p.estado !== 'Entregado').map(pedido => (
            <PedidoCard 
              key={pedido.id} 
              pedido={pedido} 
              rolActual={rolActual} 
              onAvanzarEstado={avanzarEstado} 
            />
          ))}
        </div>

        <SidebarMetricas pedidos={pedidos} />
      </div>
    </div>
  );
}