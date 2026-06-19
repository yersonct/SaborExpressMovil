import React, { useState } from 'react';
import './style/TableroPedidos.css'; 

// Interfaces claras
type EstadoPedido = 'Pendiente' | 'En Preparación' | 'Listo en Barra' | 'Entregado';

interface ItemMenu {
  platillo: string;
  cantidad: number;
  notas?: string;
}

interface Pedido {
  id: string;
  nombreMesero: string;
  mesa: string;
  estado: EstadoPedido;
  menu: ItemMenu[];
}

// Componente
export default function TableroPedidos({ rolActual = 'cocinero' }: { rolActual?: string }) {
  
  const [pedidos, setPedidos] = useState<Pedido[]>([
    {
      id: 'ORD-001',
      nombreMesero: 'Carlos Gómez',
      mesa: 'Mesa 4',
      estado: 'Pendiente',
      menu: [
        { platillo: 'Hamburguesa Sencilla', cantidad: 2, notas: 'Sin cebolla, extra salsa' },
        { platillo: 'Papas Fritas Grandes', cantidad: 1 }
      ]
    },
    {
      id: 'ORD-002',
      nombreMesero: 'Ana López',
      mesa: 'Mesa 12',
      estado: 'En Preparación',
      menu: [
        { platillo: 'Pizza Peperoni', cantidad: 1, notas: 'Bien tostada por favor' },
        { platillo: 'Gaseosa Litro', cantidad: 1 }
      ]
    }
  ]);

  // Función para agrandar pantalla (Botón superior)
  const togglePantallaCompleta = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error al intentar pantalla completa:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  // Función exclusiva para meseros/admins
  const avanzarEstado = (idPedido: string) => {
    setPedidos(pedidosActuales => 
      pedidosActuales.map(pedido => {
        if (pedido.id === idPedido) {
          if (pedido.estado === 'Pendiente') return { ...pedido, estado: 'En Preparación' };
          if (pedido.estado === 'En Preparación') return { ...pedido, estado: 'Listo en Barra' };
          if (pedido.estado === 'Listo en Barra') return { ...pedido, estado: 'Entregado' };
        }
        return pedido;
      })
    );
  };

  // Función auxiliar para las clases de color del estado
  const getClaseEstado = (estado: EstadoPedido) => {
    switch(estado) {
      case 'Pendiente': return 'estado-pendiente';
      case 'En Preparación': return 'estado-preparacion';
      case 'Listo en Barra': return 'estado-listo';
      default: return '';
    }
  };

  return (
    <div className="tablero-wrapper">
      
      {/* HEADER: Título y Botón de Pantalla Completa */}
      <header className="tablero-header">
        <h2>🔥 Panes | Tablero de Cocina <span>({rolActual.toUpperCase()})</span></h2>
        <button className="btn-fullscreen" onClick={togglePantallaCompleta}>
          ⛶ Pantalla Completa
        </button>
      </header>

      {/* GRID DE PEDIDOS */}
      <div className="grid-pedidos">
        {pedidos.filter(p => p.estado !== 'Entregado').map((pedido) => (
          <div key={pedido.id} className="tarjeta-pedido">
            
            {/* Cabecera del Pedido */}
            <div className="pedido-header">
              <div className="pedido-header-top">
                <span className="mesa-badge">{pedido.mesa}</span>
                <span className={`estado-badge ${getClaseEstado(pedido.estado)}`}>
                  {pedido.estado}
                </span>
              </div>
              <div style={{ color: '#666', fontSize: '14px', fontWeight: '500' }}>
                Mesero: {pedido.nombreMesero} | Orden: {pedido.id}
              </div>
            </div>

            {/* Lista de Platillos */}
            <div className="pedido-body">
              <ul className="menu-list">
                {pedido.menu.map((item, index) => (
                  <li key={index} style={{ marginBottom: '15px' }}>
                    <div className="menu-item">
                      <span className="cantidad">{item.cantidad}x</span>
                      <span style={{ fontWeight: '600' }}>{item.platillo}</span>
                    </div>
                    {item.notas && <span className="nota">⚠️ {item.notas}</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* CONDICIÓN CLAVE: Si NO es cocinero, muestra los botones de acción */}
            {rolActual !== 'cocinero' && (
              <div className="pedido-footer">
                <button 
                  className="btn-accion"
                  onClick={() => avanzarEstado(pedido.id)}
                >
                  {pedido.estado === 'Pendiente' ? '▶ Iniciar Preparación' : '✔ Marcar Listo en Barra'}
                </button>
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  );
};