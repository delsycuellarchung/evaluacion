"use client";

import React from 'react';
import { GeneralDonut } from '@/components/GeneralDonut';
import { mapLabelToNumeric } from '@/lib/scaleMapper';
import { supabase } from '@/lib/supabaseClient';

type Afirm = { codigo?: string; pregunta: string; tipo?: string | null; categoria?: string };
type RespEntry = { id: string; createdAt: string; responses?: Record<string, string>; token?: string; evaluatorName?: string; evaluadoNombre?: string; evaluadoCodigo?: string };

export default function ResultadosPage() {
  const [allResponses, setAllResponses] = React.useState<RespEntry[]>([]);
  const [afirmaciones, setAfirmaciones] = React.useState<Afirm[]>([]);
  const [selectedName, setSelectedName] = React.useState<string>('');
  const [selectedCode, setSelectedCode] = React.useState<string>('');
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [selectedData, setSelectedData] = React.useState<{ codigo?: string; evaluadores?: number } | null>(null);
  const [supabaseTried, setSupabaseTried] = React.useState(false);
  const [supabaseError, setSupabaseError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('form_responses') || '[]';
      const parsed = JSON.parse(raw) || [];
      setAllResponses(parsed);
    } catch (e) {
      setAllResponses([]);
    }
    try {
      const rawA = window.localStorage.getItem('formulario_afirmaciones') || '[]';
      const parsedA = JSON.parse(rawA) || [];
      setAfirmaciones(parsedA);
    } catch (e) {
      setAfirmaciones([]);
    }
  }, []);

  React.useEffect(() => {
    const setCodes = new Set<string>();
    for (const r of allResponses) {
      if (r.evaluadoCodigo) setCodes.add(String(r.evaluadoCodigo));
    }
    setSuggestions(Array.from(setCodes).filter(n => n));
  }, [allResponses]);

  const suggestionsInfo = React.useMemo(() => {
    const tmp: Record<string, Set<string>> = {};
    const nameForCode: Record<string, string> = {};
    for (const r of allResponses) {
      const code = String(r.evaluadoCodigo || '');
      const name = String(r.evaluadoNombre || '');
      if (!code) continue;
      nameForCode[code] = nameForCode[code] || name;
      if (!tmp[code]) tmp[code] = new Set<string>();
      if (r.evaluatorName) tmp[code].add(String(r.evaluatorName).trim());
    }
    return suggestions.map(code => ({ code, name: nameForCode[code] || '', evaluadores: tmp[code] ? tmp[code].size : 0 }));
  }, [suggestions, allResponses]);

  const onSelectName = (name: string) => {
    setSelectedName(name);
    const entries = allResponses.filter(e => (e.evaluadoNombre || '').toString() === name);
    const codigo = entries.find(e => e.evaluadoCodigo)?.evaluadoCodigo;
    const evaluadores = new Set(entries.map(e => (e.evaluatorName || '').toString().trim()).filter(x => x));
    setSelectedData({ codigo: codigo || undefined, evaluadores: evaluadores.size });
  };

  const stats = React.useMemo(() => {
    if (!selectedCode && !selectedName) return null;
    const entries = selectedCode
      ? allResponses.filter(e => String(e.evaluadoCodigo) === String(selectedCode))
      : allResponses.filter(e => (e.evaluadoNombre || '').toString() === selectedName);
    if (!entries || entries.length === 0) return { evaluadoresCount: 0, competencias: {}, estilos: {}, overallCompetenciasAvg: null, overallEstilosAvg: null };

    const evaluadoresSet = new Set(entries.map(e => (e.evaluatorName || '').toString().trim()).filter(x => x));
    const evaluadoresCount = evaluadoresSet.size;

    return {
      evaluadoresCount,
      competencias: {},
      estilos: {},
      overallCompetenciasAvg: null,
      overallEstilosAvg: null,
    };
  }, [selectedCode, selectedName, allResponses]);

  const getAfirmValues = (entries: RespEntry[], a: Afirm): number[] => {
    const vals: number[] = [];
    for (const e of entries) {
      if (!e.responses || !a.codigo) continue;
      const raw = e.responses[a.codigo];
      const mapped = mapLabelToNumeric(raw as string);
      if (typeof mapped === 'number' && !isNaN(mapped)) vals.push(mapped);
    }
    return vals;
  };

  return (
    <section style={{ padding: '6px 24px 20px 24px' }}>
      <h1 style={{ margin: '0 0 0 12px', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', transform: 'translateY(-82px)' }}>Resultados Detalle</h1>
      <div style={{ marginTop: -38, marginLeft: 12 }}>
        <label style={{ display: 'block', fontWeight: 700, marginBottom: 17 }}>Buscar por código del evaluado</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            placeholder="Código..."
            value={selectedCode}
            onChange={(e) => setSelectedCode(e.target.value)}
            list="evaluados-list"
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.08)', width: 200 }}
          />
          <datalist id="evaluados-list">
            {suggestions.map((s, i) => <option key={i} value={s} />)}
          </datalist>
          <button onClick={() => {
            const code = selectedCode.trim();
            const entries = allResponses.filter(a => String(a.evaluadoCodigo) === code);
            const name = entries.find(e => e.evaluadoNombre)?.evaluadoNombre || '';
            setSelectedName(name);
            const evaluadores = new Set(entries.map(e => (e.evaluatorName || '').toString().trim()).filter(x => x));
            setSelectedData({ codigo: code, evaluadores: evaluadores.size });
          }} style={{ padding: '8px 12px', borderRadius: 8, background: '#4f46e5', color: '#fff', border: 'none' }}>Cargar</button>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginRight: 8 }}>Nombre</label>
            <input disabled value={selectedName || ''} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.08)', width: 220, background: '#cbd5e1', color: '#0f172a' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#374151', marginRight: 8 }}>Evaluadores</label>
            <input disabled value={(selectedData?.evaluadores ?? 0).toString()} placeholder="# Evaluadores" style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(15,23,42,0.08)', width: 120, textAlign: 'center', background: '#cbd5e1', color: '#0f172a' }} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: '1fr', gap: 18 }}>
        {/* Competencias */}
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid rgba(15,23,42,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#f9fafb', minWidth: 0, whiteSpace: 'normal', wordBreak: 'break-word' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px' }}>COMPETENCIA</th>
                    <th style={{ textAlign: 'left', padding: '6px 10px', minWidth: 80 }}>COD</th>
                    <th style={{ textAlign: 'left', padding: '6px 10px', borderRight: '1.5px solid #e5e7eb', minWidth: 160 }}>AFIRMACIÓN / COMPORTAMIENTO</th>
                    <th style={{ textAlign: 'left', padding: '4px 6px', borderLeft: '1.5px solid #e5e7eb', minWidth: 70 }}>PROMEDIO AFIRMACIÓN</th>
                    <th style={{ textAlign: 'left', padding: '4px 6px', minWidth: 70 }}>PROMEDIO COMPETENCIA</th>
                    <th style={{ textAlign: 'left', padding: '4px 6px', border: 'none', minWidth: 90 }}>PROMEDIO COMPETENCIAS</th>
                  </tr>
                </thead>
            <tbody>
              {(() => {
                const comps: Record<string, Afirm[]> = {};
                afirmaciones.filter(a => a.tipo && (!a.categoria || a.categoria === 'competencia')).forEach(a => {
                  if (!comps[a.tipo!]) comps[a.tipo!] = [];
                  comps[a.tipo!].push(a);
                });
                const palette = ['#EF8A4B', '#F59E0B', '#10B981', '#06B6D4', '#8B5CF6', '#F97316', '#EF4444'];
                const compIndex: Record<string, number> = {};
                Object.keys(comps).forEach((c, i) => { compIndex[c] = i % palette.length; });
                const entries = selectedCode
                  ? allResponses.filter(e => String(e.evaluadoCodigo) === String(selectedCode))
                  : (selectedName ? allResponses.filter(e => (e.evaluadoNombre || '').toString() === selectedName) : allResponses);
                const rows: React.ReactNode[] = [];
                Object.entries(comps).forEach(([comp, compRows]) => {
                    const color = palette[compIndex[comp]];
                    compRows.forEach((a, idx) => {
                      rows.push(
                        <tr key={`${comp}-${String(a.codigo)}`} style={{ background: '#fff', fontSize: 12, borderBottom: '1px solid #e5e7eb' }}>
                          {idx === 0 ? <td rowSpan={compRows.length} style={{ padding: 0, verticalAlign: 'middle', background: color, color: '#fff', fontWeight: 800, textAlign: 'center', fontSize: 13, borderRight: '1.5px solid #e5e7eb', borderLeft: `4px solid ${color}`, borderBottom: idx === compRows.length - 1 ? '2px solid #cbd5e1' : '1px solid #e5e7eb' }}>{comp}</td> : null}
                          <td style={{ padding: '5px 8px', verticalAlign: 'middle', fontWeight: 600, color: '#374151', background: color + '22', fontSize: 12, borderBottom: idx === compRows.length - 1 ? '2px solid #cbd5e1' : '1px solid #e5e7eb' }}>{a.codigo}</td>
                          <td style={{ padding: '6px 8px', borderBottom: idx === compRows.length - 1 ? '2px solid #cbd5e1' : '1px solid #e5e7eb', whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: 420 }}>{a.pregunta}</td>
                          <td style={{ padding: '5px 8px', borderLeft: '1.5px solid #e5e7eb', borderBottom: idx === compRows.length - 1 ? '2px solid #cbd5e1' : '1px solid #e5e7eb' }}>{(() => {
                            const values = entries.map(e => e.responses && a.codigo && mapLabelToNumeric(e.responses[a.codigo])).filter((v): v is number => typeof v === 'number' && !isNaN(v));
                            if (!values.length) return '';
                            return (values.reduce((s, v) => s + v, 0) / values.length).toFixed(2);
                          })()}</td>
                          <td style={{ padding: '5px 8px', fontWeight: 700, fontSize: 12, background: '#e0e7ff', color: '#3730a3', borderLeft: '2px solid #cbd5e1', borderRight: '2px solid #cbd5e1', borderBottom: idx === compRows.length - 1 ? '2px solid #cbd5e1' : '1px solid #e5e7eb' }}>
                            {(() => {
                              const values = entries.map(e => e.responses && a.codigo && mapLabelToNumeric(e.responses[a.codigo])).filter((v): v is number => typeof v === 'number' && !isNaN(v));
                              if (!values.length) return '';
                              return (values.reduce((s, v) => s + v, 0) / values.length).toFixed(2);
                            })()}
                          </td>
                          {idx === 0 ? (
                            <td rowSpan={compRows.length} style={{ padding: '5px 8px', background: '#e0e7ff', border: 'none', borderBottom: idx === compRows.length - 1 ? '2px solid #cbd5e1' : '1px solid #e5e7eb' }}></td>
                          ) : null}
                        </tr>
                      );
                  });
                });
                return rows;
              })()}
            </tbody>
          </table>
        </div>
        {/* Estilos */}
        <div style={{ background: '#fff', padding: 12, borderRadius: 8, border: '1px solid rgba(15,23,42,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, background: '#f9fafb', minWidth: 0, whiteSpace: 'normal', wordBreak: 'break-word' }}>
            <thead>
              <tr style={{ background: '#f3f4f6' }}>
                <th style={{ padding: '6px 8px' }}>ESTILO</th>
                <th style={{ padding: '6px 10px', minWidth: 80 }}>COD</th>
                <th style={{ padding: '6px 10px', borderRight: '1.5px solid #e5e7eb', minWidth: 160 }}>AFIRMACIÓN / COMPORTAMIENTO</th>
                <th style={{ padding: '4px 6px', borderLeft: '1.5px solid #e5e7eb', minWidth: 70 }}>PROMEDIO AFIRMACIÓN</th>
                <th style={{ padding: '4px 6px', minWidth: 70 }}>PROMEDIO ESTILO</th>
                <th style={{ padding: '4px 6px', minWidth: 90 }}>PROMEDIO ESTILOS</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                  const estilos: Record<string, Afirm[]> = {};
                  afirmaciones.filter(a => a.tipo && a.categoria === 'estilo').forEach(a => {
                    if (!estilos[a.tipo!]) estilos[a.tipo!] = [];
                    estilos[a.tipo!].push(a);
                  });
                  const palette = ['#1E3A8A', '#1D4ED8', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#DBEAFE'];
                  const estIndex: Record<string, number> = {};
                  Object.keys(estilos).forEach((c, i) => { estIndex[c] = i % palette.length; });

                  const entries = selectedCode
                    ? allResponses.filter(e => String(e.evaluadoCodigo) === String(selectedCode))
                    : (selectedName ? allResponses.filter(e => (e.evaluadoNombre || '').toString() === selectedName) : allResponses);
                  const rows: React.ReactNode[] = [];
                  Object.entries(estilos).forEach(([est, estRows]) => {
                    const color = palette[estIndex[est]];
                    estRows.forEach((a, idx) => {
                      rows.push(
                        <tr key={`${est}-${a.codigo}`} style={{ borderBottom: '1px solid #e5e7eb', background: '#fff', fontSize: 12, height: 18 }}>
                          {idx === 0 ? <td rowSpan={estRows.length} style={{ padding: 0, verticalAlign: 'middle', background: color, color: '#fff', fontWeight: 800, textAlign: 'center', fontSize: 13, borderRight: '1.5px solid #e5e7eb' }}>{est}</td> : null}
                          <td style={{ padding: '5px 8px', verticalAlign: 'middle', fontWeight: 600, color: '#374151', background: color + '22', fontSize: 12 }}>{a.codigo}</td>
                        <td style={{ padding: '6px 8px', whiteSpace: 'normal', wordBreak: 'break-word', maxWidth: 420 }}>{a.pregunta}</td>
                        <td style={{ padding: '5px 8px', borderLeft: '1.5px solid #e5e7eb' }}>{(() => {
                          const values = entries.map(e => e.responses && a.codigo && mapLabelToNumeric(e.responses[a.codigo])).filter((v): v is number => typeof v === 'number' && !isNaN(v));
                          if (!values.length) return '';
                          return (values.reduce((s, v) => s + v, 0) / values.length).toFixed(2);
                        })()}</td>
                          {idx === 0 ? (
                            <td rowSpan={estRows.length} style={{ padding: '5px 8px', fontWeight: 700, fontSize: 12, background: '#e0e7ff', color: '#3730a3', borderLeft: '2px solid #cbd5e1', borderRight: '2px solid #cbd5e1', borderBottom: '1px solid #cbd5e1' }}>
                              {''}
                            </td>
                          ) : null}
                          {idx === 0 ? (
                            <td rowSpan={estRows.length} style={{ padding: '5px 8px', background: '#e0e7ff' }}></td>
                          ) : null}
                      </tr>
                    );
                  });
                });
                return rows;
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
