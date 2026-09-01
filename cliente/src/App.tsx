import axios from 'axios';
import * as XLSX from 'xlsx';
import React, { useState, useEffect } from 'react';
import { Llamada } from './types/llamada';

const API_URL = 'http://localhost:3000/api/llamadas';

type FiltroFecha = 'TODAS' | 'HOY' | '7_DIAS' | 'ESTE_MES' | 'PERSONALIZADA';

export default function App() {
  const [llamadas, setLlamadas] = useState<Llamada[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [filtroTexto, setFiltroTexto] = useState<string>('');
  const [filtroFecha, setFiltroFecha] = useState<FiltroFecha>('TODAS');
  const [fechaEspecifica, setFechaEspecifica] = useState<string>('');

  // Estados para el Modal de Descarga Excel
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
    cargarLlamadas();
    const intervalo = setInterval(cargarLlamadas, 10000);
    return () => clearInterval(intervalo);
  }, []);

  // Formatear duración de segundos a texto m/s
  const formatearDuracion = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const segs = segundos % 60;
    return `${mins}m ${segs}s`;
  };

  // Parsear y formatear fechas con seguridad
  const formatearFecha = (raw: string | number | null | undefined): string => {
    if (!raw) return 'Sin fecha';
    const d = !isNaN(Number(raw)) && typeof raw !== 'boolean'
      ? new Date(Number(raw))
      : new Date(raw);
    if (isNaN(d.getTime())) return 'Sin fecha';

    return d.toLocaleString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  // Convertir fecha de la llamada a YYYY-MM-DD local
  const obtenerFechaStrLocal = (fecha: Date): string => {
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Lógica de filtrado en tabla
  const coincideConFiltroFecha = (rawFecha: string | number) => {
    if (filtroFecha === 'TODAS') return true;

    const fechaLlamada = !isNaN(Number(rawFecha)) && typeof rawFecha !== 'boolean'
      ? new Date(Number(rawFecha))
      : new Date(rawFecha);

    if (isNaN(fechaLlamada.getTime())) return false;

    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const finHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59, 59, 999);

    switch (filtroFecha) {
      case 'HOY':
        return fechaLlamada >= inicioHoy && fechaLlamada <= finHoy;
      case '7_DIAS': {
        const hace7Dias = new Date(inicioHoy);
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        return fechaLlamada >= hace7Dias && fechaLlamada <= finHoy;
      }
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
    const coincideTexto =
      (ll.numero_telefono && ll.numero_telefono.includes(filtroTexto)) ||
      (ll.nombre_contacto && ll.nombre_contacto.toLowerCase().includes(filtroTexto.toLowerCase())) ||
      (ll.id_dispositivo && ll.id_dispositivo.toLowerCase().includes(filtroTexto.toLowerCase()));

    const coincideFecha = coincideConFiltroFecha(ll.fecha_hora);
    return coincideTexto && coincideFecha;
  });

  // KPIs
  const totalLlamadas = llamadasFiltradas.length;
  const salientes = llamadasFiltradas.filter((ll) => ll.tipo_llamada === 'SALIENTE').length;
  const contestadas = llamadasFiltradas.filter((ll) => ll.estado_llamada === 'CONTESTADA').length;
  const segundosTotales = llamadasFiltradas.reduce((acc, curr) => acc + (curr.duracion_segundos || 0), 0);
  const minutosTotales = Math.floor(segundosTotales / 60);

  // Proceso de exportación a archivo Excel (.xlsx)
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
      alert('No se encontraron llamadas en el periodo seleccionado.');
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

    const sufijo = modoDescarga === 'dia' ? fechaInicioModal : `${fechaInicioModal}_al_${fechaFinModal}`;
    XLSX.writeFile(libro, `Reporte_Llamadas_ASF_${sufijo}.xlsx`);
    setMostrarModalDescarga(false);
  };

  return (
    <div className="container py-4">
      {/* Encabezado con solo botón de Descarga */}
      <header className="d-flex flex-column flex-md-row justify-content-between align-items-md-center pb-3 mb-4 asf-header">
        <div>
          <h1 className="h3 fw-bold mb-1" style={{ color: 'var(--agro-green-dark)' }}>
            Monitoreo de Llamadas <span style={{ color: 'var(--agro-magenta)' }}>ASF</span>
          </h1>
          <p className="small mb-0" style={{ color: 'var(--text-secondary)' }}>
            Panel de control y registro operativo
          </p>
        </div>
        
        <button
          onClick={() => setMostrarModalDescarga(true)}
          className="btn asf-btn-primary d-inline-flex align-items-center gap-2 mt-3 mt-md-0 shadow-sm"
        >
          <i className="bi bi-file-earmark-excel"></i>
          Descargar Reporte Excel
        </button>
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

      {/* Filtros: Búsqueda y Fecha en Vivo */}
      <div className="asf-card p-3 mb-4 shadow-sm">
        <div className="row g-3 align-items-center">
          <div className="col-12 col-lg-4">
            <div className="input-group">
              <span className="input-group-text bg-white" style={{ borderColor: 'var(--border)' }}>
                <i className="bi bi-search" style={{ color: 'var(--text-secondary)' }}></i>
              </span>
              <input
                type="text"
                className="form-control"
                style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
                placeholder="Buscar contacto, teléfono o dispositivo..."
                value={filtroTexto}
                onChange={(e) => setFiltroTexto(e.target.value)}
              />
            </div>
          </div>

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
                onClick={() => setFiltroFecha('7_DIAS')}
                className={`btn btn-sm ${filtroFecha === '7_DIAS' ? 'asf-btn-primary' : 'btn-outline-secondary'}`}
              >
                7 días
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

      {/* Tabla de Registros */}
      <div className="asf-card shadow-sm overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="asf-table-header text-uppercase small">
              <tr>
                <th scope="col" className="py-3 px-4">Contacto / Teléfono</th>
                <th scope="col" className="py-3 px-4">Tipo</th>
                <th scope="col" className="py-3 px-4">Estado</th>
                <th scope="col" className="py-3 px-4">Duración</th>
                <th scope="col" className="py-3 px-4">Fecha y Hora</th>
                <th scope="col" className="py-3 px-4">Dispositivo</th>
              </tr>
            </thead>
            <tbody>
              {llamadasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5" style={{ color: 'var(--text-secondary)' }}>
                    {cargando ? 'Cargando llamadas...' : 'No hay llamadas registradas para este periodo.'}
                  </td>
                </tr>
              ) : (
                llamadasFiltradas.map((ll) => (
                  <tr key={ll.id}>
                    <td className="py-3 px-4">
                      <div className="fw-semibold" style={{ color: 'var(--text)' }}>
                        {ll.nombre_contacto || 'Desconocido'}
                      </div>
                      <div className="small" style={{ color: 'var(--text-secondary)' }}>
                        {ll.numero_telefono}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {ll.tipo_llamada === 'SALIENTE' && (
                        <span className="badge asf-badge-magenta">
                          <i className="bi bi-telephone-outbound me-1"></i> SALIENTE
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`badge ${
                          ll.estado_llamada === 'CONTESTADA' ? 'asf-badge-green' : 'asf-badge-danger'
                        }`}
                      >
                        {ll.estado_llamada}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-monospace small" style={{ color: 'var(--text)' }}>
                      {formatearDuracion(ll.duracion_segundos)}
                    </td>
                    <td className="py-3 px-4 small" style={{ color: 'var(--text-secondary)' }}>
                      {formatearFecha(ll.fecha_hora)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge bg-light text-dark border" style={{ borderColor: 'var(--border)' }}>
                        <i className="bi bi-phone me-1" style={{ color: 'var(--agro-green)' }}></i>
                        {ll.id_dispositivo || 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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