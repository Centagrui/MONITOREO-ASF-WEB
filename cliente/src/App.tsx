import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { LoginAdmin } from './LoginAdmin';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState
} from '@tanstack/react-table';

// Modelo de datos de llamadas
export interface Llamada {
  id: number;
  nombre_contacto: string | null;
  numero_telefono: string;
  tipo_llamada: string;
  estado_llamada: string;
  duracion_segundos: number;
  fecha_hora: string;
  id_dispositivo: string;
}

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
    { id: 'fecha_hora', desc: true } // Orden descendente por defecto
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
      columnHelper.accessor('tipo_llamada', {
        header: 'Tipo',
        cell: (info) =>
          info.getValue() === 'SALIENTE' ? (
            <span className="badge asf-badge-magenta">
              <i className="bi bi-telephone-outbound me-1"></i> SALIENTE
            </span>
          ) : (
            <span className="badge bg-secondary">
              {info.getValue()}
            </span>
          )
      }),
      columnHelper.accessor('estado_llamada', {
        header: 'Estado',
        cell: (info) => (
          <span
            className={`badge ${
              info.getValue() === 'CONTESTADA' ? 'asf-badge-green' : 'asf-badge-danger'
            }`}
          >
            {info.getValue()}
          </span>
        )
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
        header: 'Dispositivo / Ingeniero',
        cell: (info) => (
          <span className="badge bg-light text-dark border" style={{ borderColor: 'var(--border)' }}>
            <i className="bi bi-person-badge me-1" style={{ color: 'var(--agro-green)' }}></i>
            {info.getValue() || 'N/A'}
          </span>
        )
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
                  {cargando ? 'Cargando llamadas...' : 'No hay llamadas registradas para este periodo o usuario seleccionado.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Barra de Paginación */}
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
              <option key={size} value={size}>
                Mostrar {size}
              </option>
            ))}
          </select>
        </div>

        <div className="btn-group">
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            « Primero
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            ‹ Anterior
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Siguiente ›
          </button>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            Último »
          </button>
        </div>
      </div>
    </div>
  );
};

const API_URL = `http://${window.location.hostname}:3000/api/llamadas`;
type FiltroFecha = 'TODAS' | 'HOY' | 'ESTE_MES' | 'PERSONALIZADA';

export default function App() {
  // Manejo de sesión
  const [adminAutenticado, setAdminAutenticado] = useState<string | null>(() => {
    return sessionStorage.getItem('admin_sesion');
  });

  const cerrarSesion = () => {
    sessionStorage.removeItem('admin_sesion');
    setAdminAutenticado(null);
  };

  const [llamadas, setLlamadas] = useState<Llamada[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Filtros: Usuario/Ingeniero y Fechas
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>('');
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('TODAS');
  const [fechaEspecifica, setFechaEspecifica] = useState<string>('');

  // Modal de descarga Excel
  const [mostrarModalDescarga, setMostrarModalDescarga] = useState<boolean>(false);
  const [modoDescarga, setModoDescarga] = useState<'dia' | 'rango'>('dia');
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

  // Obtener lista única y ordenada de ingenieros registrados
  const listaIngenieros = useMemo(() => {
    const nombres = llamadas
      .map((ll) => (ll.id_dispositivo || '').trim())
      .filter((nombre) => nombre.length > 0);
    return Array.from(new Set(nombres)).sort();
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

  // Filtrado compuesto: Usuario/Ingeniero + Rango de Fechas
  const llamadasFiltradas = llamadas.filter((ll) => {
    const coincideUsuario =
      !usuarioSeleccionado ||
      (ll.id_dispositivo && ll.id_dispositivo.toLowerCase() === usuarioSeleccionado.toLowerCase());

    const coincideFecha = coincideConFiltroFecha(ll.fecha_hora);
    return coincideUsuario && coincideFecha;
  });

  // KPIs dinámicos calculados según el usuario seleccionado y el rango de fecha
  const totalLlamadas = llamadasFiltradas.length;
  const salientes = llamadasFiltradas.filter((ll) => ll.tipo_llamada === 'SALIENTE').length;
  const contestadas = llamadasFiltradas.filter((ll) => ll.estado_llamada === 'CONTESTADA').length;
  const segundosTotales = llamadasFiltradas.reduce((acc, curr) => acc + (curr.duracion_segundos || 0), 0);
  const minutosTotales = Math.floor(segundosTotales / 60);

  // Proceso de exportación a archivo Excel (.xlsx) respetando el usuario seleccionado
  const ejecutarDescargaExcel = () => {
    if (modoDescarga === 'dia' && !fechaInicioModal) {
      alert('Por favor selecciona una fecha');
      return;
    }
    if (modoDescarga === 'rango' && (!fechaInicioModal || !fechaFinModal)) {
      alert('Por favor selecciona la fecha de inicio y fin');
      return;
    }

    const datosExportar = llamadas.filter((ll) => {
      // Filtrar por el usuario actual si hay uno seleccionado
      if (usuarioSeleccionado && ll.id_dispositivo?.toLowerCase() !== usuarioSeleccionado.toLowerCase()) {
        return false;
      }

      const f = new Date(ll.fecha_hora);
      if (isNaN(f.getTime())) return false;
      const fechaLlamadaStr = obtenerFechaStrLocal(f);

      if (modoDescarga === 'dia') {
        return fechaLlamadaStr === fechaInicioModal;
      } else {
        return fechaLlamadaStr >= fechaInicioModal && fechaLlamadaStr <= fechaFinModal;
      }
    });

    if (datosExportar.length === 0) {
      alert('No se encontraron llamadas para los criterios y usuario seleccionado.');
      return;
    }

    const filasExcel = datosExportar.map((item) => ({
      'ID': item.id,
      'Contacto': item.nombre_contacto || 'Desconocido',
      'Número Telefónico': item.numero_telefono,
      'Tipo': item.tipo_llamada,
      'Estado': item.estado_llamada,
      'Duración': formatearDuracion(item.duracion_segundos),
      'Duración (Segundos)': item.duracion_segundos,
      'Fecha y Hora': formatearFecha(item.fecha_hora),
      'Dispositivo': item.id_dispositivo || 'N/A'
    }));

    const hoja = XLSX.utils.json_to_sheet(filasExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Reporte Llamadas');

    const usuarioSufijo = usuarioSeleccionado ? `_${usuarioSeleccionado.replace(/\s+/g, '_')}` : '_GENERAL';
    const fechaSufijo = modoDescarga === 'dia' ? fechaInicioModal : `${fechaInicioModal}_al_${fechaFinModal}`;
    XLSX.writeFile(libro, `Reporte_Llamadas${usuarioSufijo}_${fechaSufijo}.xlsx`);
    setMostrarModalDescarga(false);
  };

  if (!adminAutenticado) {
    return <LoginAdmin onLoginExitoso={(admin) => setAdminAutenticado(admin)} />;
  }

  return (
    <div className="container py-4">
      {/* Encabezado */}
      <header className="d-flex flex-column flex-md-row justify-content-between align-items-md-center pb-3 mb-4 asf-header">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: 'var(--agro-green-dark)' }}>
            Monitoreo de Llamadas <span style={{ color: 'var(--agro-magenta)' }}>ASF</span>
          </h1>
          <p className="text-muted small mb-0">
            {usuarioSeleccionado
              ? `Visualizando métricas de: ${usuarioSeleccionado}`
              : 'Panel de control general (Todos los ingenieros)'}
          </p>
        </div>

        <div className="d-flex align-items-center gap-2 mt-3 mt-md-0">
          <button
            onClick={() => setMostrarModalDescarga(true)}
            className="btn asf-btn-primary d-inline-flex align-items-center gap-2 shadow-sm"
          >
            <i className="bi bi-file-earmark-excel"></i>
            Descargar Reporte Excel
          </button>

          <button
            onClick={cerrarSesion}
            className="btn btn-outline-danger d-inline-flex align-items-center gap-1 shadow-sm"
            title="Cerrar sesión"
          >
            <i className="bi bi-box-arrow-right"></i>
            Salir
          </button>
        </div>
      </header>

      {/* Tarjetas de Métricas */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-3">
          <div className="asf-card h-100 shadow-sm p-3">
            <span className="small text-uppercase fw-semibold" style={{ color: 'var(--text-secondary)' }}>
              Total Llamadas
            </span>
            <h2 className="display-6 fw-bold mt-2 mb-0" style={{ color: 'var(--agro-green)' }}>
              {totalLlamadas}
            </h2>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="asf-card h-100 shadow-sm p-3">
            <span className="small text-uppercase fw-semibold" style={{ color: 'var(--text-secondary)' }}>
              Salientes
            </span>
            <h2 className="display-6 fw-bold mt-2 mb-0" style={{ color: 'var(--agro-magenta)' }}>
              {salientes}
            </h2>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="asf-card h-100 shadow-sm p-3">
            <span className="small text-uppercase fw-semibold" style={{ color: 'var(--text-secondary)' }}>
              Contestadas
            </span>
            <h2 className="display-6 fw-bold mt-2 mb-0" style={{ color: 'var(--agro-green)' }}>
              {contestadas}
            </h2>
          </div>
        </div>

        <div className="col-12 col-sm-6 col-lg-3">
          <div className="asf-card h-100 shadow-sm p-3">
            <span className="small text-uppercase fw-semibold" style={{ color: 'var(--text-secondary)' }}>
              Minutos Totales
            </span>
            <h2 className="display-6 fw-bold mt-2 mb-0" style={{ color: 'var(--agro-green-dark)' }}>
              {minutosTotales} <span className="fs-6 fw-normal" style={{ color: 'var(--text-secondary)' }}>min</span>
            </h2>
          </div>
        </div>
      </div>

      {/* Filtros Principales */}
      <div className="asf-card p-3 mb-4 shadow-sm">
        <div className="row g-3 align-items-center">
          {/* Selector de Ingeniero / Usuario */}
          <div className="col-12 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-white" style={{ borderColor: 'var(--border)' }}>
                <i className="bi bi-person-fill" style={{ color: 'var(--agro-green)' }}></i>
              </span>
              <select
                className="form-select"
                style={{ borderColor: 'var(--border)', color: 'var(--text)', fontWeight: 500 }}
                value={usuarioSeleccionado}
                onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              >
                <option value="">👤 Todos los Ingenieros (General)</option>
                {listaIngenieros.map((nombre) => (
                  <option key={nombre} value={nombre}>
                    {nombre}
                  </option>
                ))}
              </select>
              {usuarioSeleccionado && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setUsuarioSeleccionado('')}
                  title="Restablecer a general"
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              )}
            </div>
          </div>

          {/* Botones de Rango de Fecha */}
          <div className="col-12 col-md-8 col-lg-5">
            <div className="btn-group w-100" role="group">
              <button
                type="button"
                onClick={() => setFiltroFecha('TODAS')}
                className={`btn btn-sm ${filtroFecha === 'TODAS' ? 'asf-btn-primary' : 'btn-outline-secondary'}`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFiltroFecha('HOY')}
                className={`btn btn-sm ${filtroFecha === 'HOY' ? 'asf-btn-primary' : 'btn-outline-secondary'}`}
              >
                Hoy
              </button>
              <button
                type="button"
                onClick={() => setFiltroFecha('ESTE_MES')}
                className={`btn btn-sm ${filtroFecha === 'ESTE_MES' ? 'asf-btn-primary' : 'btn-outline-secondary'}`}
              >
                Este Mes
              </button>
            </div>
          </div>

          {/* Fecha Específica */}
          <div className="col-12 col-md-4 col-lg-3">
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
                  if (e.target.value) {
                    setFiltroFecha('PERSONALIZADA');
                  } else {
                    setFiltroFecha('TODAS');
                  }
                }}
              />
              {fechaEspecifica && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => {
                    setFechaEspecifica('');
                    setFiltroFecha('TODAS');
                  }}
                  title="Limpiar fecha"
                >
                  <i className="bi bi-x"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Componente TanStack Table */}
      <TablaLlamadasTanStack
        llamadas={llamadasFiltradas}
        cargando={cargando}
        formatearFecha={formatearFecha}
        formatearDuracion={formatearDuracion}
      />

      {/* Modal para Descarga de Excel */}
      {mostrarModalDescarga && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content asf-card p-3">
              <div className="modal-header border-0 pb-1">
                <h5 className="modal-title fw-bold" style={{ color: 'var(--agro-green-dark)' }}>
                  Exportar Llamadas a Excel
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setMostrarModalDescarga(false)}
                ></button>
              </div>

              <div className="modal-body">
                {usuarioSeleccionado && (
                  <div className="alert alert-light border py-2 px-3 mb-3 small">
                    <i className="bi bi-info-circle text-primary me-2"></i>
                    Exportando solo llamadas de: <strong>{usuarioSeleccionado}</strong>
                  </div>
                )}

                <div className="btn-group w-100 mb-3" role="group">
                  <button
                    type="button"
                    className={`btn btn-sm ${modoDescarga === 'dia' ? 'asf-btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setModoDescarga('dia')}
                  >
                    Por Día Específico
                  </button>
                  <button
                    type="button"
                    className={`btn btn-sm ${modoDescarga === 'rango' ? 'asf-btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setModoDescarga('rango')}
                  >
                    Intervalo de Fechas
                  </button>
                </div>

                {modoDescarga === 'dia' ? (
                  <div>
                    <label className="form-label small fw-semibold">Selecciona la fecha:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={fechaInicioModal}
                      onChange={(e) => setFechaInicioModal(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Desde:</label>
                      <input
                        type="date"
                        className="form-control"
                        value={fechaInicioModal}
                        onChange={(e) => setFechaInicioModal(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold">Hasta:</label>
                      <input
                        type="date"
                        className="form-control"
                        value={fechaFinModal}
                        onChange={(e) => setFechaFinModal(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer border-0 pt-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setMostrarModalDescarga(false)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn asf-btn-primary"
                  onClick={ejecutarDescargaExcel}
                >
                  Descargar .XLSX
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}