import React, { useState } from 'react';
import './style/TableroPedidos.css';

const TIEMPOS_POR_PLATILLO: Record<string, number> = {
  'Hamburguesa Sencilla': 10,
  'Papas Fritas Grandes': 5,
  'Pizza Peperoni': 15,
  'Gaseosa Litro': 1,
  'Carne Asada': 20,
  'Ensalada': 3
};

type EstadoPedido = 'Pendiente' | 'En Preparación' | 'Listo en Barra' | 'Entregado';
type TipoPedido = 'Mesa' | 'Para Llevar' | 'Domicilio';

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
  tiempoEstimado?: number;
  tipoPedido: TipoPedido;
  horaIngreso: string;
}

const calcularTiemposConCola = (listaPedidos: Pedido[]): Pedido[] => {
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

export default function TableroPedidos({ rolActual = 'cocinero' }: { rolActual?: string }) {

  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const pedidosIniciales: Pedido[] = [
      {
        id: 'ORD-001',
        nombreMesero: 'Carlos Gómez',
        mesa: 'Mesa 4',
        estado: 'Pendiente',
        tipoPedido: 'Mesa',
        horaIngreso: '12:30 PM',
        menu: [
          { platillo: 'Hamburguesa Sencilla', cantidad: 2, notas: 'Sin cebolla, urgente' },
          { platillo: 'Papas Fritas Grandes', cantidad: 1 }
        ]
      },
      {
        id: 'ORD-002',
        nombreMesero: 'Ana López',
        mesa: 'Mostrador',
        estado: 'Pendiente',
        tipoPedido: 'Para Llevar',
        horaIngreso: '12:32 PM',
        menu: [
          { platillo: 'Pizza Peperoni', cantidad: 1, notas: 'Bien tostada por favor' },
        ]
      },
      {
        id: 'ORD-003',
        nombreMesero: 'Luis Pérez',
        mesa: 'Mesa 7',
        estado: 'Pendiente',
        tipoPedido: 'Mesa',
        horaIngreso: '12:35 PM',
        menu: [
          { platillo: 'Carne Asada', cantidad: 1, notas: 'Término medio' },
          { platillo: 'Ensalada', cantidad: 2 }
        ]
      }
    ];
    return calcularTiemposConCola(pedidosIniciales);
  });

  const togglePantallaCompleta = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Error al intentar pantalla completa:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const avanzarEstado = (idPedido: string) => {
    setPedidos(pedidosActuales => {
      const nuevosPedidos: Pedido[] = pedidosActuales.map((pedido): Pedido => {
        if (pedido.id === idPedido) {
          if (pedido.estado === 'Pendiente') {
            return { ...pedido, estado: 'En Preparación' };
          }
          if (pedido.estado === 'En Preparación') {
            return { ...pedido, estado: 'Listo en Barra' };
          }
          if (pedido.estado === 'Listo en Barra') {
            return { ...pedido, estado: 'Entregado' };
          }
        }
        return pedido;
      });

      return calcularTiemposConCola(nuevosPedidos);
    });
  };

  const getClaseEstado = (estado: EstadoPedido) => {
    switch (estado) {
      case 'Pendiente': return 'estado-pendiente';
      case 'En Preparación': return 'estado-preparacion';
      case 'Listo en Barra': return 'estado-listo';
      default: return '';
    }
  };

  const getIconoTipo = (tipo: TipoPedido) => {
    if (tipo === 'Para Llevar' || tipo === 'Domicilio') return '🥡';
    return '🍽️';
  };

  return (
    <div className="tablero-wrapper">

      <header className="tablero-header">
        <h2>🔥 SaborExpress | Cocina <span>({rolActual.toUpperCase()})</span></h2>
        <button className="btn-fullscreen" onClick={togglePantallaCompleta}>
          ⛶ Pantalla Completa
        </button>
      </header>

      <div className="layout-principal">

        {/* LOS PEDIDOS AHORA VAN DE ARRIBA A ABAJO Y SE DESPLAZAN HACIA LA DERECHA */}
        <div className="grid-pedidos">
          {pedidos.filter(p => p.estado !== 'Entregado').map((pedido) => (
            <div key={pedido.id} className="tarjeta-pedido">

              <div className="pedido-header">
                <div className="pedido-header-top">
                  <span className="mesa-badge">{pedido.mesa}</span>
                  <span className={`estado-badge ${getClaseEstado(pedido.estado)}`}>
                    {pedido.estado}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '16px', fontWeight: '600', marginBottom: '12px', marginTop: '15px' }}>
                  <span>{pedido.nombreMesero} | {pedido.id}</span>
                  <span style={{ color: '#0f172a' }}>⌚ {pedido.horaIngreso}</span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ backgroundColor: '#f1f5f9', color: '#334155', fontWeight: 'bold', padding: '6px 10px', borderRadius: '6px', fontSize: '15px' }}>
                    {getIconoTipo(pedido.tipoPedido)} {pedido.tipoPedido}
                  </div>
                  {pedido.tiempoEstimado !== undefined && pedido.tiempoEstimado > 0 && (
                    <div style={{ color: '#d32f2f', fontWeight: '900', fontSize: '15px', backgroundColor: '#ffebee', padding: '6px 10px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}>
                      ⏳ Prep en: {pedido.tiempoEstimado} min
                    </div>
                  )}
                </div>
              </div>

              <div className="pedido-body">
                <div style={{
                  position: 'absolute',
                  top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                  fontSize: '150px', opacity: 0.08, pointerEvents: 'none', zIndex: 0
                }}>
                  {getIconoTipo(pedido.tipoPedido)}
                </div>

                <ul className="menu-list">
                  {pedido.menu.map((item, index) => (
                    <li key={index}>
                      <div className="menu-item">
                        <span className="cantidad">{item.cantidad}x</span>
                        <span style={{ fontWeight: '800' }}>{item.platillo}</span>
                      </div>
                      {item.notas && <span className="nota">⚠️ {item.notas}</span>}
                    </li>
                  ))}
                </ul>

                <div style={{
                  marginTop: 'auto',
                  paddingTop: '20px',
                  borderTop: '2px dashed #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  zIndex: 1,
                  position: 'relative'
                }}>
                  <span style={{ fontSize: '16px', color: '#64748b', fontWeight: 'bold' }}>Total platos:</span>
                  <span style={{ fontSize: '24px', color: '#0f172a', fontWeight: '900' }}>
                    {pedido.menu.reduce((total, item) => total + item.cantidad, 0)}
                  </span>
                </div>
              </div>

              {rolActual !== 'cocinero' && (
                <div className="pedido-footer">
                  <button
                    className="btn-accion"
                    onClick={() => avanzarEstado(pedido.id)}
                  >
                    {pedido.estado === 'Pendiente' ? '▶ Iniciar Preparación' : '✔ ¡Plato Listo!'}
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>

        <aside className="sidebar-metricas">
          <h3 style={{ marginTop: 0, color: '#1e293b', fontSize: '22px', borderBottom: '2px solid #e2e8f0', paddingBottom: '15px', marginBottom: '20px' }}>
            📊 Resumen
          </h3>

          <div className="metric-box">
            <h4>Completados</h4>
            <p className="numero" style={{ color: '#10b981' }}>42</p>
          </div>

          <div className="metric-box">
            <h4>En Espera</h4>
            <p className="numero" style={{ color: '#f59e0b' }}>
              {pedidos.filter(p => p.estado === 'Pendiente').length}
            </p>
          </div>

          <div className="metric-box">
            <h4>Tiempo Promedio</h4>
            <p className="numero" style={{ color: '#3b82f6' }}>14<span style={{ fontSize: '18px', color: '#64748b' }}> min</span></p>
          </div>
        </aside>

      </div>
    </div>
  );
};