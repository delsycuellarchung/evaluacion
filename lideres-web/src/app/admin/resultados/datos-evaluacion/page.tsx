"use client";

import React from 'react';
import { mapLabelToNumeric } from '@/lib/scaleMapper';

type Afirm = { codigo?: string; pregunta: string; tipo?: string | null; categoria?: string };
type RespEntry = { id: string; createdAt: string; responses?: Record<string, string>; token?: string; evaluatorName?: string; evaluadoNombre?: string; evaluadoCodigo?: string };

export default function DatosEvaluacionPage() {
  const [allResponses, setAllResponses] = React.useState<RespEntry[]>([]);
  const [afirmaciones, setAfirmaciones] = React.useState<Afirm[]>([]);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage.getItem('form_responses') || '[]';
      setAllResponses(JSON.parse(raw) || []);
    } catch {
      setAllResponses([]);
    }

    try {
      const rawA = window.localStorage.getItem('formulario_afirmaciones') || '[]';
      setAfirmaciones(JSON.parse(rawA) || []);
    } catch {
      setAfirmaciones([]);
    }
  }, []);

  const competenciasAgrupadas = React.useMemo(() => {
    const map: Record<string, Afirm[]> = {};
    for (const a of afirmaciones) {
      if (a.categoria === 'competencia' && a.tipo) {
        if (!map[a.tipo]) map[a.tipo] = [];
        map[a.tipo].push(a);
      }
    }
    return map;
  }, [afirmaciones]);

  const estilosAgrupados = React.useMemo(() => {
    const map: Record<string, Afirm[]> = {};
    for (const a of afirmaciones) {
      if (a.categoria === 'estilo' && a.tipo) {
        if (!map[a.tipo]) map[a.tipo] = [];
        map[a.tipo].push(a);
      }
    }
    return map;
  }, [afirmaciones]);

  const codigosCompetencias = Object.keys(competenciasAgrupadas);
  const codigosEstilos = Object.keys(estilosAgrupados);

  return (
    <section style={{ padding: '12px 24px 20px 24px' }}>
      <h1 style={{ margin: '0 0 0 12px', fontSize: 28, fontWeight: 800, textTransform: 'uppercase', transform: 'translateY(-32px)' }}>Datos Evaluacion</h1>
      <div style={{ marginTop: -12, marginLeft: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, color: '#2f2f2f' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #dcdcdc', color: '#555', fontWeight: 600 }}>
              <th style={{ padding: '10px 10px', width: 80 }}>Código</th>
              <th style={{ padding: '10px 10px', width: 160 }}>Evaluado</th>
              <th style={{ padding: '10px 10px', width: 120 }}>Evaluador</th>
              <th style={{ padding: '10px 10px', width: 100 }}>Fecha</th>
              {codigosCompetencias.map(tipo => (
                <th key={tipo} style={{ padding: '10px 10px', width: 80 }}>{tipo.toUpperCase()}</th>
              ))}
              {codigosEstilos.map(tipo => (
                <th key={tipo} style={{ padding: '10px 10px', width: 80 }}>{tipo.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allResponses.map((resp, idx) => (
              <tr key={resp.id || idx} style={{ borderBottom: '1px solid #ededed' }}>
                <td style={{ padding: '10px 10px', width: 80 }}>{resp.evaluadoCodigo}</td>
                <td style={{ padding: '10px 10px', width: 160 }}>{resp.evaluadoNombre}</td>
                <td style={{ padding: '10px 10px', width: 120 }}>{resp.evaluatorName}</td>
                <td style={{ padding: '10px 10px', width: 100 }}>{resp.createdAt ? new Date(resp.createdAt).toLocaleDateString() : ''}</td>
                {codigosCompetencias.map(tipo => {
                  const afirmList = competenciasAgrupadas[tipo];
                  const values = afirmList
                    .map(a => {
                      if (a.codigo && resp.responses?.[a.codigo]) {
                        const val = mapLabelToNumeric(resp.responses[a.codigo]);
                        return typeof val === 'number' && !isNaN(val) ? val : null;
                      }
                      return null;
                    })
                    .filter((v): v is number => v !== null);
                  const avg = values.length > 0 ? (values.reduce((s, v) => s + v, 0) / values.length).toFixed(2) : '';
                  return (
                    <td key={tipo} style={{ padding: '10px 10px', width: 80, textAlign: 'center', fontWeight: 700 }}>{avg}</td>
                  );
                })}
                {codigosEstilos.map(tipo => {
                  const afirmList = estilosAgrupados[tipo];
                  const values = afirmList
                    .map(a => {
                      if (a.codigo && resp.responses?.[a.codigo]) {
                        const val = mapLabelToNumeric(resp.responses[a.codigo]);
                        return typeof val === 'number' && !isNaN(val) ? val : null;
                      }
                      return null;
                    })
                    .filter((v): v is number => v !== null);
                  const avg = values.length > 0 ? (values.reduce((s, v) => s + v, 0) / values.length).toFixed(2) : '';
                  return (
                    <td key={tipo} style={{ padding: '10px 10px', width: 80, textAlign: 'center', fontWeight: 700 }}>{avg}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const thNormal: React.CSSProperties = {
  padding: '14px 18px',
  textAlign: 'left'
};

const thSmall: React.CSSProperties = {
  padding: '14px 10px',
  textAlign: 'left',
  width: 70
};

const thCenter: React.CSSProperties = {
  padding: '14px 10px',
  textAlign: 'center'
};

const tdNormal: React.CSSProperties = {
  padding: '16px 18px'
};

const tdSmall: React.CSSProperties = {
  padding: '16px 10px',
  width: 70
};

const tdCenter: React.CSSProperties = {
  padding: '16px 10px',
  textAlign: 'center'
};