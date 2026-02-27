"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import { supabase } from "@/lib/supabaseClient";

type ImportRecord = {
  id: string;
  fileName: string;
  type: string;
  timestamp: number;
};

type RawRow = Record<string, unknown>;

const STORAGE_KEY = "adminImports";
const LOCAL_IMPORT_DATA_KEY = "local_import_data";

export default function AdminImportPage() {
  const [imports, setImports] = useState<ImportRecord[]>([]);
  const [pastedData, setPastedData] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const REQUIRED_HEADERS = [
    'Codigo del Evaluado',
    'Nombre del Evaluado',
    'Cargo del Evaluado',
    'Correo del Evaluado',
    'Area del Evaluado',
    'Gerencia del Evaluado',
    'Codigo del Evaluador',
    'Nombre Evaluador',
    'Cargo del Evaluador',
    'Correo Evaluador',
    'Area Evaluador',
    'Gerencia Evaluador',
    'Regional del Evaluador',
  ];

  const normalizeHeader = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ');

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: ImportRecord[] = JSON.parse(raw);
        parsed.sort((a, b) => b.timestamp - a.timestamp);
        setImports(parsed);
      }
    } catch (e) {
      console.warn("no previous imports", e);
    }
  }, []);

  const saveImports = (list: ImportRecord[]) => {
    setImports(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn("could not persist imports", e);
    }
  };

  const parseTabDelimited = (text: string): RawRow[] => {
    console.log('[PASTE] Parsing tab-delimited data');
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('No hay datos suficientes (mínimo encabezados + 1 fila)');

    const headers = lines[0].split('\t');
    const headerMap = new Map<string, string>();

    // Map headers MÁS flexible - busca por palabras clave y similaridad
    const buildHeaderMap = () => {
      const map = new Map<string, string>();
      
      // Función para calcular similaridad de strings
      const getSimilarityScore = (str1: string, str2: string): number => {
        const words1 = str1.split(' ').filter(w => w.length > 0);
        const words2 = str2.split(' ').filter(w => w.length > 0);
        
        let matchedCount = 0;
        for (const w1 of words1) {
          if (words2.some(w2 => w2.includes(w1) || w1.includes(w2))) {
            matchedCount++;
          }
        }
        
        // Score basado en palabras coincidentes
        const score = words1.length > 0 ? matchedCount / Math.max(words1.length, words2.length) : 0;
        return score;
      };
      
      for (const required of REQUIRED_HEADERS) {
        const requiredNorm = normalizeHeader(required);
        let bestMatch: string | null = null;
        let bestScore = 0;
        
        // Busca el header que MÁS se parece a lo requerido
        for (const header of headers) {
          if (!header || map.has(requiredNorm)) continue;
          
          const normalized = normalizeHeader(header);
          const score = getSimilarityScore(requiredNorm, normalized);
          
          // Aceptar si tiene al menos 40% de similaridad (MUCHO más flexible)
          if (score > bestScore && score >= 0.4) {
            bestScore = score;
            bestMatch = header;
          }
        }
        
        if (bestMatch) {
          map.set(requiredNorm, bestMatch);
        }
      }
      
      return map;
    };

    const headerMap2 = buildHeaderMap();

    const missing = REQUIRED_HEADERS.filter((h) => !headerMap2.has(normalizeHeader(h)));
    if (missing.length > 0) {
      console.error('[PASTE] Headers encontrados:', Array.from(headerMap2.keys()));
      throw new Error(`Faltan columnas requeridas: ${missing.join(', ')}`);
    }

    const rows: RawRow[] = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split('\t');
      const row: RawRow = {};

      for (const canonical of REQUIRED_HEADERS) {
        const originalHeader = headerMap2.get(normalizeHeader(canonical));
        const idx = headers.indexOf(originalHeader || '');
        row[canonical] = idx >= 0 ? values[idx] ?? null : null;
      }

      rows.push(row);
    }

    if (rows.length === 0) throw new Error('No hay filas de datos (solo encabezados)');
    return rows;
  };

  const handlePaste = async () => {
    if (!pastedData.trim()) {
      setError('Por favor pega datos');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('[PASTE] Starting parse...');
      const rows = parseTabDelimited(pastedData);
      console.log('[PASTE] ✓ Parsed', rows.length, 'rows');

      // Save to localStorage
      try {
        localStorage.setItem(LOCAL_IMPORT_DATA_KEY, JSON.stringify({ 
          rows, 
          savedAt: new Date().toISOString() 
        }));
      } catch (e) {
        console.warn('could not persist local import data', e);
      }

      // Save to Supabase if available (include batch metadata + row index to preserve upload order)
      let batchId: string | undefined = undefined;
      if (supabase) {
        console.log('[SUPABASE] Saving', rows.length, 'rows to database...');
        try {
          // Batch id to group this import and preserve order
          batchId = `batch-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;

          // Transform rows to match Supabase schema and include row_index + import_batch
          const transformedRows = rows.map((row: RawRow, idx: number) => ({
            codigo_evaluado: row['Codigo del Evaluado'] || null,
            nombre_evaluado: row['Nombre del Evaluado'] || null,
            cargo_evaluado: row['Cargo del Evaluado'] || null,
            correo_evaluado: row['Correo del Evaluado'] || null,
            area_evaluado: row['Area del Evaluado'] || null,
            gerencia_evaluado: row['Gerencia del Evaluado'] || null,
            codigo_evaluador: row['Codigo del Evaluador'] || null,
            nombre_evaluador: row['Nombre Evaluador'] || null,
            cargo_evaluador: row['Cargo del Evaluador'] || null,
            correo_evaluador: row['Correo Evaluador'] || null,
            area_evaluador: row['Area Evaluador'] || null,
            gerencia_evaluador: row['Gerencia Evaluador'] || null,
            regional_evaluador: row['Regional del Evaluador'] || null,
            row_index: idx,
            import_batch: batchId,
          }));

          const { data, error: insertError } = await supabase
            .from('evaluators')
            .insert(transformedRows);
          
          if (insertError) {
            console.warn('[SUPABASE] Error saving:', insertError);
            setError(`Datos parseados pero error al guardar en BD: ${insertError.message}`);
          } else {
            console.log('[SUPABASE] ✓ Saved successfully');
          }
        } catch (supaErr) {
          console.error('[SUPABASE] Exception:', supaErr);
          setError(`Error de conexión con BD: ${supaErr instanceof Error ? supaErr.message : String(supaErr)}`);
        }
      } else {
        console.log('[SUPABASE] Supabase not available, saving locally only');
      }

      // Add to import history (use same batch id if created)
      const rec = { 
        id: typeof batchId !== 'undefined' ? batchId : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, 
        fileName: `import-${new Date().toISOString().slice(0, 10)}`, 
        type: 'users', 
        timestamp: Date.now() 
      };
      saveImports([rec, ...imports]);

      setSuccess(`✓ Importados ${rows.length} registros correctamente`);
      setPastedData("");

      // Redirect after 2 seconds
      setTimeout(() => {
        try { 
          router.push('/admin/datos-importados'); 
        } catch { 
          window.location.href = '/admin/datos-importados'; 
        }
      }, 2000);
    } catch (err: unknown) {
      console.error('[PASTE] Error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <h2 style={{ margin: '0 0 24px 24px', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', transform: 'translateY(-72px)' }}>
        IMPORTAR DATOS
      </h2>

      <div style={{ marginLeft: 24, maxWidth: 1200 }}>
        <div style={{ 
          background: '#f0f9ff', 
          border: '1px solid #0ea5e9',
          borderRadius: 8,
          padding: 16,
          marginBottom: 24,
          maxWidth: 1200
        }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
            Instrucciones:
          </h3>
          <ol style={{ marginLeft: 20, lineHeight: 1.8 }}>
            <li>Abre tu archivo Excel</li>
            <li>Selecciona TODAS las filas y columnas (Ctrl+A)</li>
            <li>Copia (Ctrl+C)</li>
            <li>Pega en el recuadro de abajo (Ctrl+V)</li>
            <li>Presiona "Importar"</li>
          </ol>
        </div>

        <div style={{ marginBottom: 20, maxWidth: 1200 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>
            Pega tus datos aquí:
          </label>
          <textarea
            value={pastedData}
            onChange={(e) => setPastedData(e.target.value)}
            placeholder="Ctrl+C en Excel → Ctrl+V aquí"
            style={{
              width: '100%',
              height: 150,
              padding: 12,
              border: '1px solid #ccc',
              borderRadius: 6,
              fontFamily: 'monospace',
              fontSize: 12,
              boxSizing: 'border-box',
              maxWidth: 1200
            }}
            disabled={loading}
          />
        </div>

        {error && (
          <div style={{
            background: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: 12,
            borderRadius: 6,
            marginBottom: 16,
          }}>
            ✗ {error}
          </div>
        )}

        {success && (
          <div style={{
            background: '#dcfce7',
            border: '1px solid #86efac',
            color: '#166534',
            padding: 12,
            borderRadius: 6,
            marginBottom: 16,
          }}>
            {success}
          </div>
        )}

        <button
          onClick={handlePaste}
          disabled={loading}
          className="btn-press"
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            height: 40,
            opacity: loading ? 0.7 : 1,
          }}
        >
          <img src="/images/agregar.png" alt="importar" style={{ width: 18, height: 18, display: 'block' }} />
          <span>{loading ? 'Importando...' : 'Importar'}</span>
        </button>

        <div style={{ marginTop: 32 }}>
          <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600 }}>
            Importaciones Recientes:
          </h3>
          {imports.length === 0 ? (
            <p style={{ color: '#666' }}>No hay importaciones registradas</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Importación</th>
                  <th style={{ padding: 8, textAlign: 'left', fontWeight: 600 }}>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {imports.map((imp) => (
                  <tr key={imp.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: 8 }}>{imp.fileName}</td>
                    <td style={{ padding: 8 }}>
                      {new Date(imp.timestamp).toLocaleString('es-ES')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </section>
  );
}
