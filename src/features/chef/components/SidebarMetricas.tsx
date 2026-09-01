import React from 'react';
import { Pedido } from './TableroUtils';
import { translations, LanguageCode } from './../../../locales/TableroTranslations';

interface SidebarProps {
  pedidos: Pedido[];
  lang: LanguageCode;
}

export default function SidebarMetricas({ pedidos, lang }: SidebarProps) {
  const t = translations[lang];
  const pedidosPendientes = pedidos.filter(p => p.estado === 'Pendiente').length;
  
  return (
    <aside className="sidebar-metricas">
      <h3 className="sidebar-titulo">{t.summary}</h3>

      <div className="metricas-grid">
        <div className="metric-box">
          <h4>{t.completed}</h4>
          <p className="numero numero-verde">42</p>
        </div>

        <div className="metric-box">
          <h4>{t.waiting}</h4>
          <p className="numero numero-naranja">{pedidosPendientes}</p>
        </div>

        <div className="metric-box">
          <h4>{t.avgTime}</h4>
          <p className="numero numero-azul">
            14<span className="unidad-tiempo"> {t.min}</span>
          </p>
        </div>
      </div>
    </aside>
  );
}