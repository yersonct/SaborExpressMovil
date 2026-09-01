// TableroPedidos.tsx
'use client';

import React, { useState } from 'react';
import './style/TableroPedidos.css';
import { Pedido, calcularTiemposConCola } from './TableroUtils';
import PedidoCard from './PedidoCard';
import SidebarMetricas from './SidebarMetricas';
import { translations, LanguageCode } from './../../../locales/TableroTranslations'; // Asegúrate de la ruta correcta de importación

export default function TableroPedidos({ rolActual = 'cocinero' }: { rolActual?: string }) {

  const [pedidos, setPedidos] = useState<Pedido[]>(() => {
    const pedidosIniciales: Pedido[] = [
      { id: 'ORD-001', nombreMesero: 'Carlos Gómez', mesa: 'Mesa 4', estado: 'Pendiente', tipoPedido: 'Mesa', horaIngreso: '12:30 PM', menu: [{ platillo: 'Hamburguesa Sencilla', cantidad: 2, notas: 'Sin cebolla, urgente' }, { platillo: 'Papas Fritas Grandes', cantidad: 1 }] },
      { id: 'ORD-002', nombreMesero: 'Ana López', mesa: 'Mostrador', estado: 'Pendiente', tipoPedido: 'Para Llevar', horaIngreso: '12:32 PM', menu: [{ platillo: 'Pizza Peperoni', cantidad: 1, notas: 'Bien tostada por favor' }] },
      { id: 'ORD-003', nombreMesero: 'Luis Pérez', mesa: 'Mesa 7', estado: 'Pendiente', tipoPedido: 'Mesa', horaIngreso: '12:35 PM', menu: [{ platillo: 'Carne Asada', cantidad: 1, notas: 'Término medio' }, { platillo: 'Ensalada', cantidad: 2 }] }
    ];
    return calcularTiemposConCola(pedidosIniciales);
  });

  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [language, setLanguage] = useState<LanguageCode>('es');
  const t = translations[language];

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
      const nuevosPedidos: Pedido[] = pedidosActuales.map((pedido): Pedido | any => {
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

  const handleLogout = () => {
    if (window.confirm(t.logoutConfirm)) {
      window.location.href = '/';
    }
  };

  const themeVars = isDarkTheme 
    ? {
        '--bg-main': '#0d0e12',
        '--bg-card': '#15181e',
        '--bg-header': '#1a1e24',
        '--text-main': '#f1f5f9',
        '--text-muted': '#94a3b8',
        '--border-color': '#22252a',
        '--border-light': '#262a30',
        '--accent-bg': '#1e293b'
      }
    : {
        '--bg-main': '#f0f2f5',
        '--bg-card': '#ffffff',
        '--bg-header': '#f8fafc',
        '--text-main': '#0f172a',
        '--text-muted': '#475569',
        '--border-color': '#e2e8f0',
        '--border-light': '#cbd5e1',
        '--accent-bg': '#ffffff'
      };

  return (
    <div className={`tablero-wrapper ${isDarkTheme ? 'theme-dark' : 'theme-light'}`} style={themeVars as any}>
      <header className="tablero-header">

        <div className="header-brand">
          <div className="logo-circulo"></div>
          <h2>SABOREXPRESS <span className="rol-badge">{t.roleChef ? t.roleChef.toUpperCase() : 'COCINERO'}</span></h2>
        </div>

        <div className="header-controls">

          <select 
            className="lang-select" 
            value={language} 
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            title="Seleccionar Idioma"
          >
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="pt">Português</option>
            <option value="fr">Français</option>
          </select>

         {/* 🔥 BOTÓN DE TEMA EXACTO A LA IMAGEN 🔥 */}
          <div className="theme-toggle-container">
            <button 
              className={`theme-option ${!isDarkTheme ? 'active-light' : ''}`}
              onClick={() => setIsDarkTheme(false)}
            >
              <span className="icon">☀️</span>
              {/* {!isDarkTheme && <span className="text">{t.themeLight || 'Blanco'}</span>} */}
            </button>

            <button 
              className={`theme-option ${isDarkTheme ? 'active-dark' : ''}`}
              onClick={() => setIsDarkTheme(true)}
            >
              <span className="icon">🌙</span>
              {/* {isDarkTheme && <span className="text">{t.themeDark || 'Negro'}</span>} */}
            </button>
          </div>

          <button className="btn-fullscreen" onClick={togglePantallaCompleta} title={t.fullscreen}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>
            <span className="hide-on-mobile"> {t.fullscreen}</span>
          </button>

          {/* 🔥 BOTÓN PERFIL EXACTAMENTE COMO LA IMAGEN 🔥 */}
          <button className="btn-user-profile" onClick={handleLogout} title={t.logout}>
            <div className="user-info">
              {/* <span className="user-name">{rolActual}_01</span> */}
              <span className="user-back">← Volver al login</span>
            </div>
            {/* <div className="user-avatar-red">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div> */}
          </button>

        </div>
      </header>

      <div className="layout-principal">
        <div className="grid-pedidos">
          {pedidos.filter(p => p.estado !== 'Entregado').map(pedido => (
            <PedidoCard
              key={pedido.id}
              pedido={pedido}
              rolActual={rolActual}
              onAvanzarEstado={avanzarEstado}
              lang={language}
            />
          ))}
        </div>

        <SidebarMetricas pedidos={pedidos} lang={language} />
      </div>
    </div>
  );
}