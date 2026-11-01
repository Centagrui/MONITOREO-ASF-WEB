import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { LoginAdmin } from './LoginAdmin';
import TelefonosRegistrados from './TelefonosRegistrados'; 
import { Reportes } from './Reportes'; 

import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState
} from '@tanstack/react-table';

// Modelo de datos de llamadas actualizado con el campo origen
export interface Llamada {
  id: number;
  nombre_contacto: string | null;
  numero_telefono: string;
  tipo_llamada: string;
  estado_llamada: string;
  duracion_segundos: number;
  fecha_hora: string;
  id_dispositivo: string;
  origen: string | null; 
}

export const calcularEstadoReal = (duracion: number): string => {
  if (duracion === 0) return 'NO CONTESTADA';
  if (duracion > 0 && duracion <= 5) return 'POSIBLE BUZÓN DE VOZ';
  return 'CONTESTADA';
};

interface TablaProps {
  llamadas: Llamada[];
  cargando: boolean;
  formatearFecha: (fecha: string | number | null | undefined) => string;
  formatearDuracion: (segundos: number) => string;
}

const columnHelper = createColumnHelper<Llamada>();

export const TablaLlamadasTanStack: React.FC<TablaProps> = ({
  llamadas,
  cargando,
  formatearFecha,
  formatearDuracion
}) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'fecha_hora', desc: true }
  ]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('nombre_contacto', {
        id: 'contacto_telefono',
        header: 'Contacto / Teléfono',
        cell: (info) => (
          <div className="py-1">
            <div className="fw-semibold" style={{ color: 'var(--text)' }}>
              {info.row.original.nombre_contacto || 'Desconocido'}
            </div>
            <div className="small" style={{ color: 'var(--text-secondary)' }}>
              {info.row.original.numero_telefono}
            </div>
          </div>
        )
      }),
      columnHelper.accessor('duracion_segundos', {
        id: 'estado_llamada_calculado',
        header: 'Estado',
        cell: (info) => {
          const duracion = info.getValue() || 0;
          const estado = calcularEstadoReal(duracion);
          
          let claseCss = 'asf-badge-danger'; 
          if (estado === 'CONTESTADA') claseCss = 'asf-badge-green'; 
          if (estado === 'POSIBLE BUZÓN DE VOZ') claseCss = 'bg-warning text-dark'; 
          
          return (
            <span className={`badge ${claseCss}`}>
              {estado}
            </span>
          );
        }
      }),
      columnHelper.accessor('duracion_segundos', {
        header: 'Duración',
        cell: (info) => (
          <span className="font-monospace small" style={{ color: 'var(--text)' }}>
            {formatearDuracion(info.getValue())}
          </span>
        )
      }),
      columnHelper.accessor('fecha_hora', {
        header: 'Fecha y Hora',
        cell: (info) => (
          <span className="small" style={{ color: 'var(--text-secondary)' }}>
            {formatearFecha(info.getValue())}
          </span>
        )
      }),
      columnHelper.accessor('id_dispositivo', {
        header: 'Dispositivo',
        cell: (info) => (
          <span className="badge bg-light text-dark border" style={{ borderColor: 'var(--border)' }}>
            <i className="bi bi-person-badge me-1" style={{ color: 'var(--agro-green)' }}></i>
            {info.getValue() || 'N/A'}
          </span>
        )
      }),
      columnHelper.accessor('origen', {
        header: 'Grupo',
        cell: (info) => {
          const valor = info.getValue();
          return valor ? (
            <span className="badge asf-badge-magenta">
              <i className="bi bi-tags me-1"></i> {valor}
            </span>
          ) : (
            <span className="text-muted small">Sin grupo</span>
          );
        }
      })
    ],
    [formatearFecha, formatearDuracion]
  );

  const table = useReactTable({
    data: llamadas,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  });

  return (
    <div className="asf-card shadow-sm overflow-hidden">
      <div className="table-responsive">
        <table className="table table-hover align-middle mb-0">
          <thead className="asf-table-header text-uppercase small">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const puedeOrdenar = header.column.getCanSort();
                  const orden = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      scope="col"
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ cursor: puedeOrdenar ? 'pointer' : 'default', userSelect: 'none' }}
                      className="py-3 px-4"
                    >
                      <div className="d-flex align-items-center gap-2">
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {puedeOrdenar && (
                          <span className="small opacity-75">
                            {orden === 'asc' ? '▲' : orden === 'desc' ? '▼' : '⇅'}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="py-3 px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                  {cargando ? 'Cargando llamadas...' : 'No hay llamadas registradas para este periodo o filtro(s) seleccionado(s).'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="d-flex flex-wrap align-items-center justify-content-between p-3 border-top gap-2">
        <div className="d-flex align-items-center gap-2">
          <span className="small text-muted">
            Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de{' '}
            <strong>{table.getPageCount() || 1}</strong> ({llamadas.length} llamadas en total)
          </span>
          <select
            className="form-select form-select-sm w-auto"
            value={table.getState().pagination.pageSize}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>Mostrar {size}</option>
            ))}
          </select>
        </div>

        <div className="btn-group">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>« Primero</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>‹ Anterior</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Siguiente ›</button>
          <button className="btn btn-outline-secondary btn-sm" onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>Último »</button>
        </div>
      </div>
    </div>
  );
};

const API_URL = 'https://api2.agrosantafe.com.mx/api/llamadas';
type FiltroFecha = 'TODAS' | 'HOY' | 'ESTE_MES' | 'PERSONALIZADA';

export default function App() {
  const [vistaActual, setVistaActual] = useState<'inicio' | 'usuarios' | 'reportes'>('inicio');

  const [adminAutenticado, setAdminAutenticado] = useState<string | null>(() => {
    return sessionStorage.getItem('admin_sesion');
  });

  const cerrarSesion = () => {
    sessionStorage.removeItem('admin_sesion');
    setAdminAutenticado(null);
  };

  const [llamadas, setLlamadas] = useState<Llamada[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // ESTADOS DEL FILTRO PRINCIPAL (Usuarios y Grupos)
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<string[]>([]);
  const [dropdownFiltroAbierto, setDropdownFiltroAbierto] = useState(false);
  
  const [gruposSeleccionados, setGruposSeleccionados] = useState<string[]>([]);
  const [dropdownGruposAbierto, setDropdownGruposAbierto] = useState(false);
  
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('TODAS');
  const [fechaEspecifica, setFechaEspecifica] = useState<string>('');

  // ESTADOS DEL MODAL DE DESCARGA
  const [mostrarModalDescarga, setMostrarModalDescarga] = useState<boolean>(false);
  const [usuariosModal, setUsuariosModal] = useState<string[]>([]);
  const [dropdownModalAbierto, setDropdownModalAbierto] = useState(false);
  
  const [fechaInicioModal, setFechaInicioModal] = useState<string>('');
  const [fechaFinModal, setFechaFinModal] = useState<string>('');

  const cargarLlamadas = async () => {
    try {
      setCargando(true);
      const res = await axios.get<Llamada[]>(API_URL);
      setLlamadas(res.data);
    } catch (error) {
      console.error('Error al obtener llamadas:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (adminAutenticado) {
      cargarLlamadas();
      const intervalo = setInterval(cargarLlamadas, 10000);
      return () => clearInterval(intervalo);
    }
  }, [adminAutenticado]);

  const listaIngenieros = useMemo(() => {
    const nombres = llamadas
      .map((ll) => (ll.id_dispositivo || '').trim())
      .filter((nombre) => nombre.length > 0);
    return Array.from(new Set(nombres)).sort();
  }, [llamadas]);

  const listaGrupos = useMemo(() => {
    const grupos = llamadas
      .map((ll) => (ll.origen || '').trim())
      .filter((grupo) => grupo.length > 0);
    return Array.from(new Set(grupos)).sort();
  }, [llamadas]);

  const formatearDuracion = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins}m ${segs}s`;
  };

  const formatearFecha = (raw: string | number | null | undefined): string => {
    if (!raw) return 'Sin fecha';
    const fechaStr = String(raw).replace(' ', 'T');
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return String(raw);

    return d.toLocaleString('es-MX', {
      timeZone: 'America/Mexico_City',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const obtenerFechaStrLocal = (fecha: Date): string => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const establecerRangoRapido = (diasAtrasInicio: number, diasAtrasFin: number = 0) => {
    const hoy = new Date();
    const inicio = new Date(hoy);
    inicio.setDate(hoy.getDate() - diasAtrasInicio);
    const fin = new Date(hoy);
    fin.setDate(hoy.getDate() - diasAtrasFin);
    
    setFechaInicioModal(obtenerFechaStrLocal(inicio));
    setFechaFinModal(obtenerFechaStrLocal(fin));
  };

  const coincideConFiltroFecha = (rawFecha: string | number) => {
    if (filtroFecha === 'TODAS') return true;

    const fechaSegura = typeof rawFecha === 'string' ? rawFecha.replace(' ', 'T') : rawFecha;
    const fechaLlamada = new Date(fechaSegura);
    if (isNaN(fechaLlamada.getTime())) return false;

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);

    switch (filtroFecha) {
      case 'HOY':
        return fechaLlamada >= inicioHoy && fechaLlamada <= finHoy;
      case 'ESTE_MES': {
        const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59, 999);
        return fechaLlamada >= inicioMes && fechaLlamada <= finMes;
      }
      case 'PERSONALIZADA': {
        if (!fechaEspecifica) return true;
        return obtenerFechaStrLocal(fechaLlamada) === fechaEspecifica;
      }
      default:
        return true;
    }
  };

  const llamadasFiltradas = llamadas.filter((ll) => {
    const coincideUsuario =
      usuariosSeleccionados.length === 0 ||
      (ll.id_dispositivo && usuariosSeleccionados.includes(ll.id_dispositivo));

    const coincideGrupo =
      gruposSeleccionados.length === 0 || 
      (ll.origen && gruposSeleccionados.includes(ll.origen));

    const coincideFecha = coincideConFiltroFecha(ll.fecha_hora);
    return coincideUsuario && coincideGrupo && coincideFecha;
  });

  const totalLlamadas = llamadasFiltradas.length;
  const contestadas = llamadasFiltradas.filter((ll) => calcularEstadoReal(ll.duracion_segundos) === 'CONTESTADA').length;
  const noContestadas = llamadasFiltradas.filter((ll) => calcularEstadoReal(ll.duracion_segundos) !== 'CONTESTADA').length;
  const segundosTotales = llamadasFiltradas.reduce((acc, curr) => acc + (curr.duracion_segundos || 0), 0);
  const minutosTotales = Math.floor(segundosTotales / 60);

  const ejecutarDescargaExcel = () => {
    if (!fechaInicioModal || !fechaFinModal) {
      alert('Por favor selecciona la fecha de inicio y fin para el reporte');
      return;
    }

    const datosExportar = llamadas.filter((ll) => {
      if (usuariosModal.length > 0 && (!ll.id_dispositivo || !usuariosModal.includes(ll.id_dispositivo))) {
        return false;
      }

      const f = new Date(ll.fecha_hora);
      if (isNaN(f.getTime())) return false;
      const fechaLlamadaStr = obtenerFechaStrLocal(f);

      return fechaLlamadaStr >= fechaInicioModal && fechaLlamadaStr <= fechaFinModal;
    });

    if (datosExportar.length === 0) {
      alert('No se encontraron llamadas para los criterios y usuario(s) seleccionado(s) en el reporte.');
      return;
    }

    const filasExcel = datosExportar.map((item) => ({
      'ID': item.id,
      'Contacto': item.nombre_contacto || 'Desconocido',
      'Número Telefónico': item.numero_telefono,
      'Grupo': item.origen || 'Sin grupo',
      'Estado': calcularEstadoReal(item.duracion_segundos),
      'Duración': formatearDuracion(item.duracion_segundos),
      'Duración (Segundos)': item.duracion_segundos,
      'Fecha y Hora': formatearFecha(item.fecha_hora),
      'Dispositivo': item.id_dispositivo || 'N/A'
    }));

    const hoja = XLSX.utils.json_to_sheet(filasExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Reporte Llamadas');

    const usuarioSufijo = usuariosModal.length === 0 
      ? '_GENERAL' 
      : (usuariosModal.length === 1 ? `_${usuariosModal[0].replace(/\s+/g, '_')}` : '_VARIOS');
    
    const fechaSufijo = `${fechaInicioModal}_al_${fechaFinModal}`;
    XLSX.writeFile(libro, `Reporte_Llamadas${usuarioSufijo}_${fechaSufijo}.xlsx`);
    
    setMostrarModalDescarga(false);
  };

  if (!adminAutenticado) {
    return <LoginAdmin onLoginExitoso={(admin) => setAdminAutenticado(admin)} />;
  }

  return (
    <>
      {vistaActual === 'inicio' && (
        <div 
          className="container py-4" 
          onClick={() => {
            setDropdownFiltroAbierto(false);
            setDropdownGruposAbierto(false);
          }}
        >
          <header className="d-flex flex-column flex-md-row justify-content-between align-items-md-center pb-3 mb-4 asf-header">
            <div>
              <h1 className="h3 fw-bold mb-1" style={{ color: 'var(--agro-green-dark)' }}>
                Monitoreo de Llamadas <span style={{ color: 'var(--agro-magenta)' }}>ASF</span>
              </h1>
              <p className="text-muted small mb-0">
                {usuariosSeleccionados.length > 0
                  ? `Visualizando métricas de: ${usuariosSeleccionados.length} usuario(s)`
                  : 'Panel de control general '}
              </p>
            </div>

            <div className="d-flex align-items-center gap-2 mt-3 mt-md-0 flex-wrap">
              <button onClick={() => setVistaActual('usuarios')} className="btn d-inline-flex align-items-center gap-2 shadow-sm text-white" style={{ backgroundColor: '#0b6623', borderColor: '#09541d' }}>
                <i className="bi bi-people-fill"></i> Directorio
              </button>
              <button onClick={() => setVistaActual('reportes')} className="btn d-inline-flex align-items-center gap-2 shadow-sm text-white" style={{ backgroundColor: '#0b6623', borderColor: '#09541d' }}>
                <i className="bi bi-bar-chart-fill"></i> Reportes
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setUsuariosModal(usuariosSeleccionados);
                  setMostrarModalDescarga(true);
                }}
                className="btn asf-btn-primary d-inline-flex align-items-center gap-2 shadow-sm"
              >
                <i className="bi bi-file-earmark-excel"></i> Descargar 
              </button>

              <button onClick={cerrarSesion} className="btn btn-outline-danger d-inline-flex align-items-center gap-1 shadow-sm ms-md-2" title="Cerrar sesión">
                <i className="bi bi-box-arrow-right"></i> Salir
              </button>
            </div>
          </header>

          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="asf-card h-100 shadow-sm p-3">
                <span className="small text-uppercase fw-semibold" style={{ color: 'var(--text-secondary)' }}>Total Llamadas</span>
                <h2 className="display-6 fw-bold mt-2 mb-0" style={{ color: 'var(--agro-green)' }}>{totalLlamadas}</h2>
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="asf-card h-100 shadow-sm p-3">
                <span className="small text-uppercase fw-semibold" style={{ color: 'var(--text-secondary)' }}>Contestadas</span>
                <h2 className="display-6 fw-bold mt-2 mb-0" style={{ color: 'var(--agro-green)' }}>{contestadas}</h2>
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="asf-card h-100 shadow-sm p-3">
                <span className="small text-uppercase fw-semibold" style={{ color: 'var(--text-secondary)' }}>No Contestadas</span>
                <h2 className="display-6 fw-bold mt-2 mb-0" style={{ color: 'var(--agro-magenta)' }}>{noContestadas}</h2>
              </div>
            </div>
            
            <div className="col-12 col-sm-6 col-lg-3">
              <div className="asf-card h-100 shadow-sm p-3">
                <span className="small text-uppercase fw-semibold" style={{ color: 'var(--text-secondary)' }}>Minutos Totales</span>
                <h2 className="display-6 fw-bold mt-2 mb-0" style={{ color: 'var(--agro-green-dark)' }}>
                  {minutosTotales} <span className="fs-6 fw-normal" style={{ color: 'var(--text-secondary)' }}>min</span>
                </h2>
              </div>
            </div>
          </div>

          <div className="asf-card p-3 mb-4 shadow-sm">
            <div className="row g-3 align-items-center">
              
              {/* FILTRO DISPOSITIVOS (MÚLTIPLE) */}
              <div className="col-12 col-md-6 col-xl-3">
                <div className="dropdown w-100 position-relative" onClick={(e) => e.stopPropagation()}>
                  <div className="input-group">
                    
                    <button
                      className="btn form-control text-start d-flex justify-content-between align-items-center bg-white text-dark"
                      type="button"
                      style={{ borderColor: 'var(--border)', fontWeight: 500 }}
                      onClick={() => {
                        setDropdownFiltroAbierto(!dropdownFiltroAbierto);
                        setDropdownGruposAbierto(false);
                      }}
                    >
                      <span className="text-truncate">
                        {usuariosSeleccionados.length === 0
                          ? ' Todos los usuarios'
                          : `${usuariosSeleccionados.length} usuario(s) seleccionado(s)`}
                      </span>
                      <i className={`bi bi-chevron-${dropdownFiltroAbierto ? 'up' : 'down'} ms-2 text-muted`}></i>
                    </button>
                    {usuariosSeleccionados.length > 0 && (
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setUsuariosSeleccionados([])}
                        title="Restablecer usuarios"
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    )}
                  </div>

                  {dropdownFiltroAbierto && (
                    <div className="dropdown-menu show w-100 p-2 shadow mt-1 border-0 rounded-3" style={{ maxHeight: '250px', overflowY: 'auto', position: 'absolute', top: '100%', left: 0, zIndex: 1050 }}>
                      {listaIngenieros.map(nombre => (
                        <div className="form-check mb-2" key={nombre}>
                          <input
                            className="form-check-input cursor-pointer"
                            type="checkbox"
                            id={`filtro-check-${nombre.replace(/\s+/g, '-')}`}
                            checked={usuariosSeleccionados.includes(nombre)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUsuariosSeleccionados(prev => [...prev, nombre]);
                              } else {
                                setUsuariosSeleccionados(prev => prev.filter(u => u !== nombre));
                              }
                            }}
                            style={{ cursor: 'pointer' }}
                          />
                          <label className="form-check-label w-100 small" htmlFor={`filtro-check-${nombre.replace(/\s+/g, '-')}`} style={{ cursor: 'pointer' }}>
                            {nombre}
                          </label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* FILTRO GRUPOS (MÚLTIPLE) */}
              <div className="col-12 col-md-6 col-xl-3">
                <div className="dropdown w-100 position-relative" onClick={(e) => e.stopPropagation()}>
                  <div className="input-group">
                    
                    <button
                      className="btn form-control text-start d-flex justify-content-between align-items-center bg-white text-dark"
                      type="button"
                      style={{ borderColor: 'var(--border)', fontWeight: 500 }}
                      onClick={() => {
                        setDropdownGruposAbierto(!dropdownGruposAbierto);
                        setDropdownFiltroAbierto(false);
                      }}
                    >
                      <span className="text-truncate">
                        {gruposSeleccionados.length === 0
                          ? ' Todos los grupos'
                          : `${gruposSeleccionados.length} grupo(s)`}
                      </span>
                      <i className={`bi bi-chevron-${dropdownGruposAbierto ? 'up' : 'down'} ms-2 text-muted`}></i>
                    </button>
                    {gruposSeleccionados.length > 0 && (
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setGruposSeleccionados([])}
                        title="Restablecer grupos"
                      >
                        <i className="bi bi-x-circle"></i>
                      </button>
                    )}
                  </div>

                  {dropdownGruposAbierto && (
                    <div className="dropdown-menu show w-100 p-2 shadow mt-1 border-0 rounded-3" style={{ maxHeight: '250px', overflowY: 'auto', position: 'absolute', top: '100%', left: 0, zIndex: 1050 }}>
                      {listaGrupos.length > 0 ? (
                        listaGrupos.map(grupo => (
                          <div className="form-check mb-2" key={grupo}>
                            <input
                              className="form-check-input cursor-pointer"
                              type="checkbox"
                              id={`filtro-grupo-${grupo.replace(/\s+/g, '-')}`}
                              checked={gruposSeleccionados.includes(grupo)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setGruposSeleccionados(prev => [...prev, grupo]);
                                } else {
                                  setGruposSeleccionados(prev => prev.filter(g => g !== grupo));
                                }
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label w-100 small" htmlFor={`filtro-grupo-${grupo.replace(/\s+/g, '-')}`} style={{ cursor: 'pointer' }}>
                              {grupo}
                            </label>
                          </div>
                        ))
                      ) : (
                        <div className="text-muted small text-center p-2">No hay grupos disponibles</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* FILTROS DE FECHA */}
              <div className="col-12 col-md-7 col-xl-4">
                <div className="btn-group w-100" role="group">
                  <button type="button" onClick={() => setFiltroFecha('TODAS')} className={`btn btn-sm ${filtroFecha === 'TODAS' ? 'asf-btn-primary' : 'btn-outline-secondary'}`}>Todas</button>
                  <button type="button" onClick={() => setFiltroFecha('HOY')} className={`btn btn-sm ${filtroFecha === 'HOY' ? 'asf-btn-primary' : 'btn-outline-secondary'}`}>Hoy</button>
                  <button type="button" onClick={() => setFiltroFecha('ESTE_MES')} className={`btn btn-sm ${filtroFecha === 'ESTE_MES' ? 'asf-btn-primary' : 'btn-outline-secondary'}`}>Este Mes</button>
                </div>
              </div>

              <div className="col-12 col-md-5 col-xl-2">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-white" style={{ borderColor: 'var(--border)' }}>
                    <i className="bi bi-calendar-event" style={{ color: 'var(--agro-green)' }}></i>
                  </span>
                  <input
                    type="date"
                    className="form-control"
                    style={{ borderColor: 'var(--border)' }}
                    value={fechaEspecifica}
                    onChange={(e) => {
                      setFechaEspecifica(e.target.value);
                      if (e.target.value) setFiltroFecha('PERSONALIZADA');
                      else setFiltroFecha('TODAS');
                    }}
                  />
                  {fechaEspecifica && (
                    <button className="btn btn-outline-secondary" type="button" onClick={() => { setFechaEspecifica(''); setFiltroFecha('TODAS'); }} title="Limpiar fecha">
                      <i className="bi bi-x"></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <TablaLlamadasTanStack llamadas={llamadasFiltradas} cargando={cargando} formatearFecha={formatearFecha} formatearDuracion={formatearDuracion} />
        </div>
      )}

      {mostrarModalDescarga && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content asf-card p-3 border-0 shadow-lg" onClick={() => setDropdownModalAbierto(false)}>
              <div className="modal-header border-0 pb-1">
                <h5 className="modal-title fw-bold" style={{ color: 'var(--agro-green-dark)' }}>
                  <i className="bi bi-file-earmark-spreadsheet me-2 text-success"></i> Generador de Reportes
                </h5>
                <button type="button" className="btn-close" onClick={() => setMostrarModalDescarga(false)}></button>
              </div>

              <div className="modal-body pt-3">
                <div className="mb-4">
                  <label className="form-label small fw-semibold text-secondary mb-1">Filtrar por Vendedor / Ingeniero</label>
                  <div className="dropdown position-relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      className="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center bg-white" 
                      type="button"
                      onClick={() => setDropdownModalAbierto(!dropdownModalAbierto)}
                    >
                      <span className="text-truncate">
                        {usuariosModal.length === 0 
                          ? '-- Todos los Ingenieros (Reporte General) --' 
                          : `${usuariosModal.length} ingeniero(s) seleccionado(s)`}
                      </span>
                      <i className={`bi bi-chevron-${dropdownModalAbierto ? 'up' : 'down'}`}></i>
                    </button>
                    
                    {dropdownModalAbierto && (
                      <div className="dropdown-menu show w-100 p-2 shadow mt-1 border-0 rounded-3" style={{ maxHeight: '200px', overflowY: 'auto', position: 'absolute', top: '100%', left: 0, zIndex: 1050 }}>
                        {listaIngenieros.map(nombre => (
                          <div className="form-check mb-2" key={nombre}>
                            <input
                              className="form-check-input cursor-pointer"
                              type="checkbox"
                              id={`modal-check-${nombre.replace(/\s+/g, '-')}`}
                              checked={usuariosModal.includes(nombre)}
                              onChange={(e) => {
                                if (e.target.checked) setUsuariosModal(prev => [...prev, nombre]);
                                else setUsuariosModal(prev => prev.filter(u => u !== nombre));
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label w-100 small" htmlFor={`modal-check-${nombre.replace(/\s+/g, '-')}`} style={{ cursor: 'pointer' }}>
                              {nombre}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <label className="form-label small fw-semibold text-secondary mb-2">Selecciona el periodo a exportar</label>
                
                <div className="d-flex gap-2 flex-wrap mb-3">
                  <button type="button" className="btn btn-sm btn-outline-primary flex-grow-1" onClick={() => establecerRangoRapido(0, 0)}>Hoy</button>
                  <button type="button" className="btn btn-sm btn-outline-primary flex-grow-1" onClick={() => establecerRangoRapido(1, 1)}>Ayer</button>
                  <button type="button" className="btn btn-sm btn-outline-primary flex-grow-1" onClick={() => establecerRangoRapido(7, 0)}>Últimos 7 días</button>
                  <button type="button" className="btn btn-sm btn-outline-primary flex-grow-1" onClick={() => {
                    const hoy = new Date();
                    setFechaInicioModal(obtenerFechaStrLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
                    setFechaFinModal(obtenerFechaStrLocal(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0)));
                  }}>Este Mes</button>
                </div>

                <div className="row g-2 p-3 bg-light rounded border">
                  <div className="col-6">
                    <label className="form-label small fw-semibold mb-1">Fecha de Inicio</label>
                    <input type="date" className="form-control form-control-sm" value={fechaInicioModal} onChange={(e) => setFechaInicioModal(e.target.value)} />
                  </div>
                  <div className="col-6">
                    <label className="form-label small fw-semibold mb-1">Fecha de Fin</label>
                    <input type="date" className="form-control form-control-sm" value={fechaFinModal} onChange={(e) => setFechaFinModal(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="modal-footer border-0 pt-2">
                <button type="button" className="btn btn-light border" onClick={() => setMostrarModalDescarga(false)}>Cancelar</button>
                <button type="button" className="btn asf-btn-primary px-4" onClick={ejecutarDescargaExcel}>
                  <i className="bi bi-download me-2"></i> Descargar .XLSX
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {vistaActual === 'usuarios' && (
        <div className="container py-4 position-relative">
          <div className="mb-3">
            <button className="btn btn-light shadow-sm border" onClick={() => setVistaActual('inicio')}>
              <i className="bi bi-arrow-left fw-bold me-2"></i> Regresar al Panel
            </button>
          </div>
          <TelefonosRegistrados />
        </div>
      )}

      {vistaActual === 'reportes' && (
        <div className="container py-4 position-relative">
          <div className="mb-3">
            <button className="btn btn-light shadow-sm border" onClick={() => setVistaActual('inicio')}>
              <i className="bi bi-arrow-left fw-bold me-2"></i> Regresar al Panel
            </button>
          </div>
          
         <Reportes 
            llamadasRaw={llamadas.map(ll => ({
              usuario: ll.id_dispositivo || 'Desconocido',
              duracion: formatearDuracion(ll.duracion_segundos),
              destinatario: ll.nombre_contacto ? `${ll.nombre_contacto} (${ll.numero_telefono})` : ll.numero_telefono,
              fecha: ll.fecha_hora,
              origen: ll.origen || null
            }))} 
          />
        </div>
      )}
    </>
  );
}