"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

const LOCAL_IMPORT_DATA_KEY = "local_import_data";

type Persona = {
  id: string;
  codigo: string;
  nombre: string;
  cargo: string | null;
  correo: string | null;
  area_nombre: string | null;
  gerencia_nombre: string | null;
  regional: string | null;
  tipo: string;
  // Campos adicionales para sincronización
  codigo_alt?: string | null;
  nombre_alt?: string | null;
  correo_alt?: string | null;
  area_alt?: string | null;
  gerencia_alt?: string | null;
};

type RawRow = Record<string, unknown>;
type ImportLastResponse = { rows?: RawRow[] };

const getFirstValue = (row: RawRow, keys: string[]): string | null => {
  for (const key of keys) {
    const value = row[key];
    if (value === undefined || value === null || value === '') continue;
    return String(value);
  }
  return null;
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

export default function DatosImportadosPage() {
  const [tab, setTab] = useState<"importados" | "otra" | "evaluaciones">("importados");
  const [evaluados, setEvaluados] = useState<Persona[]>([]);
  const [evaluadores, setEvaluadores] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const disableDb = String(process.env.NEXT_PUBLIC_DISABLE_DB || '').toLowerCase() === 'true';
  
  useEffect(() => {
    cargarDatos();
  }, []);
  
  const cargarDatos = async () => {
    setLoading(true);

    if (!supabase || disableDb) {
      try {
        const raw = localStorage.getItem(LOCAL_IMPORT_DATA_KEY);
        const payload = raw ? JSON.parse(raw) : null;
        let rows: RawRow[] = payload?.rows || [];
        if (rows.length === 0) {
          try {
            const res = await fetch('/api/import-last');
            if (res.ok) {
              const data = (await res.json()) as ImportLastResponse;
              rows = Array.isArray(data?.rows) ? data.rows : [];
            }
          } catch (fetchErr) {
            console.warn('No local import data from server', fetchErr);
          }
        }
        const localEvaluados: Persona[] = [];
        const localEvaluadores: Persona[] = [];
        rows.forEach((row, idx) => {
          let tipo = 'evaluado';
          let codigo = getFirstValue(row, ['Código del Evaluado', 'Codigo del Evaluado', 'codigo']);
          let nombre = getFirstValue(row, ['Nombre del Evaluado', 'Nombre', 'nombre']);
          let cargo = getFirstValue(row, ['Cargo del Evaluado', 'Cargo', 'cargo']);
          let correo = getFirstValue(row, ['Correo del Evaluado', 'Correo', 'correo', 'Email', 'email']);
          let area = getFirstValue(row, ['Área del Evaluado', 'Area del Evaluado', 'Area', 'area']);
          let gerencia = getFirstValue(row, ['Gerencia del Evaluado', 'Gerencia', 'gerencia']);
          let regional = null;

          if (!codigo) {
            tipo = 'evaluador';
            codigo = getFirstValue(row, ['Código del Evaluador', 'Codigo del Evaluador', 'codigo']);
            nombre = getFirstValue(row, ['Nombre del Evaluador', 'Nombre', 'nombre']);
            cargo = getFirstValue(row, ['Cargo del Evaluador', 'Cargo', 'cargo']);
            correo = getFirstValue(row, ['Correo del Evaluador', 'Correo', 'correo', 'Email', 'email']);
            area = getFirstValue(row, ['Área del Evaluador', 'Area del Evaluador', 'Area', 'area']);
            gerencia = getFirstValue(row, ['Gerencia del Evaluador', 'Gerencia', 'gerencia']);
            regional = getFirstValue(row, ['Regional del Evaluador', 'Regional Evaluador', 'regional']);
          }

          if (!codigo || !nombre) return;

          const persona: Persona = {
            id: String(idx),
            codigo: String(codigo),
            nombre: String(nombre),
            cargo: cargo || null,
            correo: correo || null,
            area_nombre: area ? String(area) : null,
            gerencia_nombre: gerencia ? String(gerencia) : null,
            regional: regional || null,
            tipo,
          };
          if (tipo === 'evaluado') localEvaluados.push(persona);
          else localEvaluadores.push(persona);
        });

        setEvaluados(localEvaluados);
        setEvaluadores(localEvaluadores);
      } catch (e) {
        console.warn('Error cargando datos locales', e);
        setEvaluados([]);
        setEvaluadores([]);
      } finally {
        setLoading(false);
      }
      return;
    }
    
    // Cargar evaluados y evaluadores desde la tabla 'evaluators'
    // Intentar ordenar por `row_index` para respetar el orden de importación
    let evaluatorsData: any[] | null = null;
    let evalError: any = null;
    try {
      const res = await supabase.from('evaluators').select('*').order('row_index', { ascending: true }).limit(10000);
      evaluatorsData = res.data as any[] | null;
      evalError = res.error;
    } catch (e) {
      const res2 = await supabase.from('evaluators').select('*').limit(10000);
      evaluatorsData = res2.data as any[] | null;
      evalError = res2.error;
    }
    
    if (evalError) {
      console.error('Error cargando evaluators:', evalError);
    }
    
    if (evaluatorsData) {
      const evaluados: Persona[] = [];
      const evaluadores: Persona[] = [];
      
      evaluatorsData.forEach((row: any, idx: number) => {
        // Si tiene datos de evaluado, agregarlo a la lista
        if (row.codigo_evaluado && row.nombre_evaluado) {
          evaluados.push({
            id: `evaluado-${idx}`,
            codigo: row.codigo_evaluado || '',
            nombre: row.nombre_evaluado || '',
            cargo: row.cargo_evaluado || null,
            correo: row.correo_evaluado || null,
            area_nombre: row.area_evaluado || null,
            gerencia_nombre: row.gerencia_evaluado || null,
            regional: null,
            tipo: 'evaluado',
            codigo_alt: null,
            nombre_alt: null,
            correo_alt: null,
            area_alt: null,
            gerencia_alt: null,
          });
        }
        
        // Si tiene datos de evaluador, agregarlo a la lista
        if (row.codigo_evaluador && row.nombre_evaluador) {
          evaluadores.push({
            id: `evaluador-${idx}`,
            codigo: row.codigo_evaluador || '',
            nombre: row.nombre_evaluador || '',
            cargo: row.cargo_evaluador || null,
            correo: row.correo_evaluador || null,
            area_nombre: row.area_evaluador || null,
            gerencia_nombre: row.gerencia_evaluador || null,
            regional: row.regional_evaluador || null,
            tipo: 'evaluador',
            codigo_alt: row.codigo_evaluado || null,
            nombre_alt: row.nombre_evaluado || null,
            correo_alt: row.correo_evaluado || null,
            area_alt: row.area_evaluado || null,
            gerencia_alt: row.gerencia_evaluado || null,
          });
        }
      });
      
      setEvaluados(evaluados);
      setEvaluadores(evaluadores);
    }
    
    setLoading(false);
  };

  const normalizedSearch = normalizeText(searchText.trim());
  const searchTokens = normalizedSearch.split(/\s+/).filter(Boolean);

  const matchesSearch = (persona: Persona) => {
    if (searchTokens.length === 0) return true;
    const values = [
      persona.codigo,
      persona.nombre,
      persona.cargo,
      persona.correo,
      persona.area_nombre,
      persona.gerencia_nombre,
      persona.regional,
      persona.codigo_alt,
      persona.nombre_alt,
      persona.correo_alt,
      persona.area_alt,
      persona.gerencia_alt,
      persona.tipo,
    ]
      .filter((value) => value !== null && value !== undefined)
      .map((value) => normalizeText(String(value)));

    return searchTokens.every((token) => values.some((value) => value.includes(token)));
  };

  const filteredEvaluados = evaluados.filter(matchesSearch);
  const filteredEvaluadores = evaluadores.filter(matchesSearch);

  return (
    <div style={{ padding: 28, transform: 'translateY(-32px)' }}>
      <div className="page-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0 }}>
        <h2 style={{ margin: '0 0 0 28px', fontSize: 32, fontWeight: 800, transform: 'translateY(-70px)' }}>DATOS IMPORTADOS</h2>

        <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start', paddingLeft: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="text"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Buscar en cualquier columna"
              aria-label="Buscar en cualquier columna"
              style={{
                height: 40,
                padding: '0 12px',
                borderRadius: 10,
                border: '1px solid rgba(15,23,42,0.2)',
                background: '#fff',
                minWidth: 260,
              }}
            />
            <div className="tabs" role="tablist" aria-label="Tablas de datos" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                role="tab"
                aria-selected={tab === "importados"}
                className={`tab-btn ${tab === "importados" ? "active" : ""}`}
                onClick={() => setTab("importados")}
                style={{ height: 40 }}
              >
                Evaluado
              </button>
              <button
                role="tab"
                aria-selected={tab === "otra"}
                className={`tab-btn ${tab === "otra" ? "active" : ""}`}
                onClick={() => setTab("otra")}
                style={{ height: 40 }}
              >
                Evaluador
              </button>
              <button
                role="tab"
                aria-selected={tab === "evaluaciones"}
                className={`tab-btn ${tab === "evaluaciones" ? "active" : ""}`}
                onClick={() => setTab("evaluaciones")}
                style={{ height: 40 }}
              >
                Evaluaciones
              </button>
            </div>

            <button
              onClick={cargarDatos}
              className="btn-press"
              style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 0, display: 'inline-flex', alignItems: 'center', gap: 10, height: 40 }}
              aria-label="Recargar datos"
            >
              <img src="/images/recargar.png" alt="recargar" style={{ width: 18, height: 18, display: 'block' }} />
              <span style={{ fontWeight: 600 }}>Recargar</span>
            </button>
          </div>
        </div>
      </div>


      {tab === "importados" ? (
        <table className="import-table" aria-label="Tabla de datos importados" style={{ margin: '24px 0 24px 28px' }}>
          <thead>
            <tr>
              <th>Código del Evaluado</th>
              <th>Nombre del Evaluado</th>
              <th>Cargo del Evaluado</th>
              <th>Correo del Evaluado</th>
              <th>Área del Evaluado</th>
              <th>Gerencia del Evaluado</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, textAlign: 'center' }}>
                  Cargando...
                </td>
              </tr>
            ) : filteredEvaluados.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 12, color: "rgba(15,23,42,0.6)" }}>
                  {searchTokens.length > 0 ? 'No hay resultados.' : 'No hay datos importados.'}
                </td>
              </tr>
            ) : (
              filteredEvaluados.map((evaluado) => (
                <tr key={evaluado.id}>
                  <td>{evaluado.codigo}</td>
                  <td>{evaluado.nombre}</td>
                  <td>{evaluado.cargo || '-'}</td>
                  <td>{evaluado.correo || '-'}</td>
                  <td>{evaluado.area_nombre || '-'}</td>
                  <td>{evaluado.gerencia_nombre || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      ) : tab === "otra" ? (
        <table className="import-table" aria-label="Tabla adicional de datos" style={{ margin: '24px 0 24px 28px' }}>
          <thead>
            <tr>
              <th>Código del Evaluador</th>
              <th>Nombre del Evaluador</th>
              <th>Cargo del Evaluador</th>
              <th>Correo del Evaluador</th>
              <th>Área del Evaluador</th>
              <th>Gerencia del Evaluador</th>
              <th>Regional del Evaluador</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 12, textAlign: 'center' }}>
                  Cargando...
                </td>
              </tr>
            ) : filteredEvaluadores.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 12, color: "rgba(15,23,42,0.6)" }}>
                  {searchTokens.length > 0 ? 'No hay resultados.' : 'No hay datos en esta tabla.'}
                </td>
              </tr>
            ) : (
              filteredEvaluadores.map((evaluador) => (
                <tr key={evaluador.id}>
                  <td>{evaluador.codigo}</td>
                  <td>{evaluador.nombre}</td>
                  <td>{evaluador.cargo || '-'}</td>
                  <td>{evaluador.correo || '-'}</td>
                  <td>{evaluador.area_nombre || '-'}</td>
                  <td>{evaluador.gerencia_nombre || '-'}</td>
                  <td>{evaluador.regional || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      ) : (
        <table className="import-table" aria-label="Tabla de evaluaciones" style={{ margin: '24px 0 24px 28px' }}>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Área</th>
              <th>Correo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6} style={{ padding: 12, color: "rgba(15,23,42,0.6)" }}>
                No hay evaluaciones importadas.
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
