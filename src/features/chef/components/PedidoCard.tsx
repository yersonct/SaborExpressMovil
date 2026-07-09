// PedidoCard.tsx
import React from 'react';
import { Pedido, getClaseEstado, IconoReloj } from './TableroUtils';

interface PedidoCardProps {
  pedido: Pedido;
  rolActual: string;
  onAvanzarEstado: (id: string) => void;
}

export default function PedidoCard({ pedido, rolActual, onAvanzarEstado }: PedidoCardProps) {
  return (
    <div className="tarjeta-pedido">
      <div className="pedido-header">
        <div className="pedido-header-top">
          <span className="mesa-badge">{pedido.mesa.toUpperCase()}</span>
          <div className="estado-container">
            <span className="info-label">ESTADO:</span>
            <span className={`estado-badge ${getClaseEstado(pedido.estado)}`}>
              {pedido.estado.toUpperCase()}
            </span>
          </div>
        </div>

        <div className="pedido-info-meta">
          <div className="info-item">
            <span className="info-label">MESERO:</span>
            <span className="info-valor">{pedido.nombreMesero}</span>
          </div>
          <div className="info-item">
            <span className="info-label">PEDIDO ID:</span>
            <span className="info-valor">{pedido.id}</span>
          </div>
          <div className="info-item full-width">
            <span className="info-label">HORA INGRESO:</span>
            <span className="info-valor hora-valor">
              <IconoReloj /> {pedido.horaIngreso}
            </span>
          </div>
        </div>

        {/* Solo dejamos el tiempo estimado si es mayor a cero, sin repetir el tipo de pedido */}
        {pedido.tiempoEstimado !== undefined && pedido.tiempoEstimado > 0 && (
          <div className="pedido-tags">
            <div className="tag-tiempo">
              <IconoReloj /> PREP. EN: {pedido.tiempoEstimado} MIN
            </div>
          </div>
        )}
      </div>

      <div className="pedido-body">
        <ul className="menu-list">
          {pedido.menu.map((item, index) => (
            <li key={index}>
              <div className="menu-item">
                <span className="cantidad">{item.cantidad}x</span>
                <span className="platillo-nombre">{item.platillo}</span>
              </div>
              {item.notas && <span className="nota">NOTA: {item.notas}</span>}
            </li>
          ))}
        </ul>

        <div className="pedido-totales">
          <span className="totales-label">TOTAL PLATOS:</span>
          <span className="totales-valor">
            {pedido.menu.reduce((total, item) => total + item.cantidad, 0)}
          </span>
        </div>
      </div>

      {rolActual !== 'cocinero' && (
        <div className="pedido-footer">
          <button className="btn-accion" onClick={() => onAvanzarEstado(pedido.id)}>
            {pedido.estado === 'Pendiente' ? 'INICIAR PREPARACIÓN' : 'MARCAR COMO LISTO'}
          </button>
        </div>
      )}
    </div>
  );
}