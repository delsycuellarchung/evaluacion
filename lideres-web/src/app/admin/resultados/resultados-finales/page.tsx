"use client";

import React from "react";

export default function ResultadosFinalesPage() {
  // Simulación de datos
  const datos = [
    { codigo: "1", nombre: "PONCE DE LEON CASTEDO ALEJANDRA BEATRIZ", fecha: "feb-26", evaluadores: 6, comunicacion: 3.23, respeto: 2.90, desarrollo: 2.83, adaptabilidad: 2.77, motivacion: 2.63, promedio: 2.87, autocratico: 2.73 },
    { codigo: "7", nombre: "SAAVEDRA TARDIO LUIS FERNANDO", fecha: "feb-26", evaluadores: 12, comunicacion: "-", respeto: "-", desarrollo: "-", adaptabilidad: "-", motivacion: "-", promedio: "-", autocratico: "-" },
    { codigo: "37", nombre: "MOLINA MENESES ARNOLD GUSTAVO", fecha: "feb-26", evaluadores: 2, comunicacion: "-", respeto: "-", desarrollo: "-", adaptabilidad: "-", motivacion: "-", promedio: "-", autocratico: "-" },
    { codigo: "107", nombre: "RIBERA FARIÑAS EDDY WINSOR", fecha: "feb-26", evaluadores: 7, comunicacion: "-", respeto: "-", desarrollo: "-", adaptabilidad: "-", motivacion: "-", promedio: "-", autocratico: "-" },
    { codigo: "120", nombre: "KENNY PAZ CAMPERO BRENDAN JAVIER", fecha: "feb-26", evaluadores: 7, comunicacion: "-", respeto: "-", desarrollo: "-", adaptabilidad: "-", motivacion: "-", promedio: "-", autocratico: "-" },
    { codigo: "128", nombre: "BRUUN NUÑEZ JEFFER", fecha: "feb-26", evaluadores: 4, comunicacion: "-", respeto: "-", desarrollo: "-", adaptabilidad: "-", motivacion: "-", promedio: "-", autocratico: "-" },
    { codigo: "406", nombre: "TOLEDO BARBA JORGE NELSON", fecha: "feb-26", evaluadores: 3, comunicacion: "-", respeto: "-", desarrollo: "-", adaptabilidad: "-", motivacion: "-", promedio: "-", autocratico: "-" },
    { codigo: "509", nombre: "SUCHET MATHILDE ANNE", fecha: "feb-26", evaluadores: 9, comunicacion: "-", respeto: "-", desarrollo: "-", adaptabilidad: "-", motivacion: "-", promedio: "-", autocratico: "-" },
    { codigo: "728", nombre: "GONZALES PICTOR ANA PAOLA", fecha: "feb-26", evaluadores: 6, comunicacion: 2.73, respeto: 2.53, desarrollo: 2.80, adaptabilidad: 2.47, motivacion: 2.73, promedio: 2.65, autocratico: 2.73 },
    { codigo: "873", nombre: "TORRICO ARRAZOLA FERNANDO EDUARDO", fecha: "feb-26", evaluadores: 3, comunicacion: "-", respeto: "-", desarrollo: "-", adaptabilidad: "-", motivacion: "-", promedio: "-", autocratico: "-" },
    { codigo: "907", nombre: "IRIGOYEN COIMBRA RUBEN CARLOS", fecha: "feb-26", evaluadores: 4, comunicacion: "-", respeto: "-", desarrollo: "-", adaptabilidad: "-", motivacion: "-", promedio: "-", autocratico: "-" },
    { codigo: "908", nombre: "JALDIN SALVATIERRA RUBEN", fecha: "feb-26", evaluadores: 3, comunicacion: "-", respeto: "-", desarrollo: "-", adaptabilidad: "-", motivacion: "-", promedio: "-", autocratico: "-" },
    { codigo: "966", nombre: "GROSS ITURRI DANIEL FELIPE CARLOS", fecha: "feb-26", evaluadores: 7, comunicacion: "-", respeto: "-", desarrollo: "-", adaptabilidad: "-", motivacion: "-", promedio: "-", autocratico: "-" },
    { codigo: "1090", nombre: "CRONENBOLD AGUILERA ALEJANDRO", fecha: "feb-26", evaluadores: 13, comunicacion: "-", respeto: "-", desarrollo: "-", adaptabilidad: "-", motivacion: "-", promedio: "-", autocratico: "-" },
    { codigo: "1169", nombre: "ULLOA JAVIER DORIAN AMIN", fecha: "feb-26", evaluadores: 13, comunicacion: "-", respeto: "-", desarrollo: "-", adaptabilidad: "-", motivacion: "-", promedio: "-", autocratico: "-" },
  ];

  return (
    <section style={{ padding: '6px 24px 20px 24px' }}>
      <h1 style={{ margin: '0 0 0 12px', fontSize: 32, fontWeight: 800, textTransform: 'uppercase', transform: 'translateY(-82px)' }}>Resultados Finales</h1>
      <div className="bg-white border border-gray-300 rounded-md p-4">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={{ background: '#3b82f6', color: '#fff', padding: '6px 8px', minWidth: 50 }}>COD</th>
              <th style={{ background: '#2563eb', color: '#fff', padding: '6px 8px', minWidth: 180 }}>EVALUADO</th>
              <th style={{ background: '#2563eb', color: '#fff', padding: '6px 8px', minWidth: 90 }}>FECHA</th>
              <th style={{ background: '#2563eb', color: '#fff', padding: '6px 8px', minWidth: 60 }}> NUMERO DE EVALUADORES</th>
              <th style={{ background: '#f97316', color: '#fff', padding: '6px 8px', minWidth: 120 }}>COMUNICACIÓN Y DIRECCIÓN</th>
              <th style={{ background: '#f97316', color: '#fff', padding: '6px 8px', minWidth: 120 }}>RESPETO Y CONFIANZA</th>
              <th style={{ background: '#f97316', color: '#fff', padding: '6px 8px', minWidth: 120 }}>DESARROLLO DE EQUIPO Y EMPOWERMENT</th>
              <th style={{ background: '#f97316', color: '#fff', padding: '6px 8px', minWidth: 120 }}>ADAPTABILIDAD Y RESILIENCIA</th>
              <th style={{ background: '#f97316', color: '#fff', padding: '6px 8px', minWidth: 120 }}>MOTIVACION E INFLUENCIA</th>
              <th style={{ background: '#a3a045', color: '#fff', padding: '6px 8px', minWidth: 90 }}>PROMEDIO</th>
            </tr>
          </thead>
          <tbody>
            {datos.map((row, idx) => (
              <tr key={row.codigo} style={{ background: idx % 2 === 0 ? '#f9fafb' : '#fff' }}>
                <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700 }}>{row.codigo}</td>
                <td style={{ padding: '4px 8px', color: row.codigo === "908" ? '#dc2626' : '#222', fontWeight: row.codigo === "908" ? 700 : 400 }}>{row.nombre}</td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>{row.fecha}</td>
                <td style={{ padding: '4px 8px', textAlign: 'center', background: row.evaluadores <= 2 ? '#fee2e2' : 'inherit', color: row.evaluadores <= 2 ? '#dc2626' : '#222', fontWeight: row.evaluadores <= 2 ? 700 : 400 }}>{row.evaluadores}</td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>{row.comunicacion}</td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>{row.respeto}</td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>{row.desarrollo}</td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>{row.adaptabilidad}</td>
                <td style={{ padding: '4px 8px', textAlign: 'center' }}>{row.motivacion}</td>
                <td style={{ padding: '4px 8px', textAlign: 'center', fontWeight: 700 }}>{row.promedio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
