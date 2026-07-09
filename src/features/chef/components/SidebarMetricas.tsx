// SidebarMetricas.tsx
import React from 'react';
import { Pedido } from './TableroUtils';

interface SidebarProps {
  pedidos: Pedido[];
}

export default function SidebarMetricas({ pedidos }: SidebarProps) {
  const pedidosPendientes = pedidos.filter(p => p.estado === 'Pendiente').length;
  
  return (
    <aside className="sidebar-metricas">
      <h3 className="sidebar-titulo">RESUMEN OPERATIVO</h3>

      <div className="metricas-grid">
        <div className="metric-box">
          <h4>COMPLETADOS</h4>
          <p className="numero numero-verde">42</p>
        </div>

        <div className="metric-box">
          <h4>EN ESPERA</h4>
          <p className="numero numero-naranja">{pedidosPendientes}</p>
        </div>

        <div className="metric-box">
          <h4>TIEMPO PROMEDIO</h4>
          <p className="numero numero-azul">
            14<span className="unidad-tiempo"> MIN</span>
          </p>
        </div>
      </div>
    </aside>
  );
}