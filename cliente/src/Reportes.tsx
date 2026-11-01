import { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState
} from '@tanstack/react-table';

export interface LlamadaReporte {
  usuario: string;
  duracion: string;
  destinatario: string;
  fecha: string;
  origen: string | null; 
}

interface ReportesProps {
  llamadasRaw: LlamadaReporte[];
}

interface ConteoUsuario {
  dispositivo: string;
  total: number;
}

const columnHelper = createColumnHelper<ConteoUsuario>();

// Función auxiliar para obtener la fecha local en formato YYYY-MM-DD
const obtenerFechaHoyStr = () => {
  const fecha = new Date();
  const year = fecha.getFullYear();
  const month = String(fecha.getMonth() + 1).padStart(2, '0');
  const day = String(fecha.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const Reportes = ({ llamadasRaw }: ReportesProps) => {
  // === ESTADOS DE LOS FILTROS PRINCIPALES ===
  const [fechaFiltroTabla, setFechaFiltroTabla] = useState<string>(obtenerFechaHoyStr());
  
  // Estados para el nuevo filtro de Grupos en la vista principal
  const [gruposSeleccionadosTabla, setGruposSeleccionadosTabla] = useState<string[]>([]);
  const [dropdownFiltroGrupoAbierto, setDropdownFiltroGrupoAbierto] = useState(false);

  // === ESTADOS DEL MODAL DE EXPORTACIÓN ===
  const [showModal, setShowModal] = useState(false);
  const [tipoFiltroModal, setTipoFiltroModal] = useState('dia');
  const [fechaDiaModal, setFechaDiaModal] = useState(obtenerFechaHoyStr());
  const [fechaInicioModal, setFechaInicioModal] = useState('');
  const [fechaFinModal, setFechaFinModal] = useState('');
  
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  
  const [gruposSeleccionadosModal, setGruposSeleccionadosModal] = useState<string[]>([]);
  const [dropdownGruposModalAbierto, setDropdownGruposModalAbierto] = useState(false);

  // Extraemos la lista única de grupos de los datos en bruto
  const listaGrupos = useMemo(() => {
    const grupos = llamadasRaw
      .map((ll) => (ll.origen || '').trim())
      .filter((grupo) => grupo.length > 0);
    return Array.from(new Set(grupos)).sort();
  }, [llamadasRaw]);

  // Lista global de usuarios (para el modal)
  const usuariosUnicos = useMemo(() => {
    const usuarios = llamadasRaw.map(ll => ll.usuario).filter(u => u);
    return Array.from(new Set(usuarios)).sort();
  }, [llamadasRaw]);


  // === LÓGICA DE LA TABLA PRINCIPAL ===
  const llamadasFiltradasTabla = useMemo(() => {
    let filtradas = llamadasRaw;

    // Filtro por Fecha
    if (fechaFiltroTabla) {
      filtradas = filtradas.filter(ll => {
        const fechaLlamada = new Date(ll.fecha.replace(' ', 'T')).toISOString().split('T')[0];
        return fechaLlamada === fechaFiltroTabla;
      });
    }

    // Filtro por Grupos
    if (gruposSeleccionadosTabla.length > 0) {
      filtradas = filtradas.filter(ll => ll.origen && gruposSeleccionadosTabla.includes(ll.origen));
    }

    return filtradas;
  }, [llamadasRaw, fechaFiltroTabla, gruposSeleccionadosTabla]);

  const conteoPorUsuario = useMemo(() => {
    const conteo = llamadasFiltradasTabla.reduce((acc: Record<string, number>, llamada) => {
      acc[llamada.usuario] = (acc[llamada.usuario] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(conteo).map(([dispositivo, total]) => ({
      dispositivo,
      total
    }));
  }, [llamadasFiltradasTabla]);

  const [sorting, setSorting] = useState<SortingState>([
    { id: 'total', desc: true }
  ]);

  const columns = useMemo(() => [
    columnHelper.accessor('dispositivo', {
      header: 'Usuario / Dispositivo',
      cell: (info) => (
        <span className="fw-semibold" style={{ color: 'var(--text)' }}>
          <i className="bi bi-person-circle me-2 text-secondary"></i>
          {info.getValue()}
        </span>
      )
    }),
    columnHelper.accessor('total', {
      header: 'Total de Llamadas',
      cell: (info) => (
        <span className="badge asf-badge-green fs-6">
          {info.getValue()}
        </span>
      )
    })
  ], []);

  const table = useReactTable({
    data: conteoPorUsuario,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 }
    }
  });


  // === LÓGICA DE EXPORTACIÓN ===
  const handleCheckboxChangeUsuario = (usuario: string, isChecked: boolean) => {
    if (isChecked) {
      setUsuariosSeleccionados(prev => [...prev, usuario]);
    } else {
      setUsuariosSeleccionados(prev => prev.filter(u => u !== usuario));
    }
  };

  const handleDescargar = () => {
    let datosFiltrados = llamadasRaw;
    
    if (usuariosSeleccionados.length > 0) {
      datosFiltrados = datosFiltrados.filter(ll => usuariosSeleccionados.includes(ll.usuario));
    }

    if (gruposSeleccionadosModal.length > 0) {
      datosFiltrados = datosFiltrados.filter(ll => ll.origen && gruposSeleccionadosModal.includes(ll.origen));
    }

    datosFiltrados = datosFiltrados.filter(ll => {
      const fechaLlamada = new Date(ll.fecha.replace(' ', 'T')).toISOString().split('T')[0];
      if (tipoFiltroModal === 'dia' && fechaDiaModal) {
        return fechaLlamada === fechaDiaModal;
      }
      if (tipoFiltroModal === 'intervalo' && fechaInicioModal && fechaFinModal) {
        return fechaLlamada >= fechaInicioModal && fechaLlamada <= fechaFinModal;
      }
      return true;
    });

    if (datosFiltrados.length === 0) {
      alert("No hay llamadas para exportar con estos filtros.");
      return;
    }

    const datosExcel = datosFiltrados.map(ll => ({
      "Contacto": ll.destinatario,
      "Duración": ll.duracion,
      "Dispositivo": ll.usuario,
      "Grupo": ll.origen || "Sin grupo"
    }));

    const hoja = XLSX.utils.json_to_sheet(datosExcel);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Reporte Llamadas");
    XLSX.writeFile(libro, "Reporte_Llamadas.xlsx");
    
    setShowModal(false);
  };

  return (
    <div className="container-fluid px-0 mt-2" onClick={() => {
      setDropdownFiltroGrupoAbierto(false);
      setDropdownOpen(false);
      setDropdownGruposModalAbierto(false);
    }}>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 gap-3">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--agro-green-dark)' }}>
            Reporte de Usuarios
          </h3>
          <p className="text-muted small mb-0">Agrupación de llamadas por dispositivo</p>
        </div>

        <div className="d-flex flex-wrap gap-2 align-items-center">
          
          {/* NUEVO FILTRO DE GRUPO EN LA TABLA PRINCIPAL */}
          <div className="dropdown position-relative" onClick={(e) => e.stopPropagation()}>
            <div className="input-group input-group-sm">
              
              <button
                className="btn form-control text-start d-flex justify-content-between align-items-center bg-white text-dark"
                type="button"
                style={{ borderColor: 'var(--border)', fontWeight: 500, minWidth: '180px' }}
                onClick={() => setDropdownFiltroGrupoAbierto(!dropdownFiltroGrupoAbierto)}
              >
                <span className="text-truncate small">
                  {gruposSeleccionadosTabla.length === 0
                    ? ' Todos los grupos'
                    : `${gruposSeleccionadosTabla.length} grupo(s)`}
                </span>
                <i className={`bi bi-chevron-${dropdownFiltroGrupoAbierto ? 'up' : 'down'} ms-2 text-muted`}></i>
              </button>
              {gruposSeleccionadosTabla.length > 0 && (
                <button
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => setGruposSeleccionadosTabla([])}
                  title="Restablecer grupos"
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              )}
            </div>

            {dropdownFiltroGrupoAbierto && (
              <div className="dropdown-menu show w-100 p-2 shadow mt-1 border-0 rounded-3" style={{ maxHeight: '250px', overflowY: 'auto', position: 'absolute', top: '100%', left: 0, zIndex: 1050 }}>
                {listaGrupos.length > 0 ? (
                  listaGrupos.map(grupo => (
                    <div className="form-check mb-2" key={grupo}>
                      <input
                        className="form-check-input cursor-pointer"
                        type="checkbox"
                        id={`filtro-tabla-grupo-${grupo.replace(/\s+/g, '-')}`}
                        checked={gruposSeleccionadosTabla.includes(grupo)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGruposSeleccionadosTabla(prev => [...prev, grupo]);
                          } else {
                            setGruposSeleccionadosTabla(prev => prev.filter(g => g !== grupo));
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                      <label className="form-check-label w-100 small" htmlFor={`filtro-tabla-grupo-${grupo.replace(/\s+/g, '-')}`} style={{ cursor: 'pointer' }}>
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


          <div className="input-group input-group-sm" style={{ width: 'auto' }}>
            
            <input
              type="date"
              className="form-control"
              style={{ borderColor: 'var(--border)' }}
              value={fechaFiltroTabla}
              onChange={(e) => setFechaFiltroTabla(e.target.value)}
            />
            {fechaFiltroTabla && (
              <button
                className="btn btn-outline-secondary"
                type="button"
                onClick={() => setFechaFiltroTabla('')}
                title="Ver todas las fechas"
              >
                <i className="bi bi-x"></i> Todas
              </button>
            )}
          </div>

          <button className="btn btn-sm asf-btn-primary d-inline-flex align-items-center gap-2 shadow-sm" onClick={(e) => {
            e.stopPropagation();
            setShowModal(true);
          }}>
            <i className="bi bi-file-earmark-excel"></i> Exportar
          </button>
        </div>
      </div>

      <div className="asf-card shadow-sm overflow-hidden mb-4">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 text-center">
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
                        className="py-3 px-4 text-center"
                      >
                        <div className="d-flex align-items-center justify-content-center gap-2">
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
                  <td colSpan={columns.length} className="text-center py-5 text-muted">
                    No hay llamadas registradas para la fecha o grupo seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {conteoPorUsuario.length > 0 && (
          <div className="d-flex flex-wrap align-items-center justify-content-between p-3 border-top gap-2">
            <div className="d-flex align-items-center gap-2">
              <span className="small text-muted">
                Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de{' '}
                <strong>{table.getPageCount() || 1}</strong>
              </span>
              <select
                className="form-select form-select-sm w-auto"
                value={table.getState().pagination.pageSize}
                onChange={(e) => table.setPageSize(Number(e.target.value))}
              >
                {[10, 20, 50].map((size) => (
                  <option key={size} value={size}>Mostrar {size}</option>
                ))}
              </select>
            </div>
            <div className="btn-group">
              <button className="btn btn-outline-secondary btn-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                ‹ Anterior
              </button>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Siguiente ›
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content asf-card border-0 shadow-lg p-2" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header border-0">
                <h5 className="modal-title fw-bold" style={{ color: 'var(--agro-green-dark)' }}>
                  <i className="bi bi-file-earmark-spreadsheet me-2 text-success"></i> Exportar a Excel
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                
                {/* SELECTOR DE GRUPOS EN EL MODAL */}
                <div className="mb-3">
                  <label className="fw-bold text-secondary mb-2 d-block small">Filtrar por Grupo</label>
                  <div className="dropdown position-relative">
                    <button 
                      className="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center" 
                      type="button"
                      onClick={() => {
                        setDropdownGruposModalAbierto(!dropdownGruposModalAbierto);
                        setDropdownOpen(false);
                      }}
                    >
                      <span className="text-truncate">
                        {gruposSeleccionadosModal.length === 0 
                          ? 'Todos los grupos (General)' 
                          : `${gruposSeleccionadosModal.length} grupo(s) seleccionado(s)`}
                      </span>
                      <i className={`bi bi-chevron-${dropdownGruposModalAbierto ? 'up' : 'down'}`}></i>
                    </button>
                    
                    {dropdownGruposModalAbierto && (
                      <div className="dropdown-menu show w-100 p-2 shadow mt-1" style={{ maxHeight: '200px', overflowY: 'auto', position: 'absolute', top: '100%', left: 0, zIndex: 1050 }}>
                        {listaGrupos.map(grupo => (
                          <div className="form-check mb-2" key={grupo}>
                            <input
                              className="form-check-input cursor-pointer"
                              type="checkbox"
                              id={`modal-grupo-${grupo}`}
                              checked={gruposSeleccionadosModal.includes(grupo)}
                              onChange={(e) => {
                                if (e.target.checked) setGruposSeleccionadosModal(prev => [...prev, grupo]);
                                else setGruposSeleccionadosModal(prev => prev.filter(g => g !== grupo));
                              }}
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label w-100 small" htmlFor={`modal-grupo-${grupo}`} style={{ cursor: 'pointer' }}>
                              {grupo}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* SELECTOR DE USUARIOS EN EL MODAL */}
                <div className="mb-4">
                  <label className="fw-bold text-secondary mb-2 d-block small">Selecciona los usuarios</label>
                  <div className="dropdown position-relative">
                    <button 
                      className="btn btn-outline-secondary w-100 text-start d-flex justify-content-between align-items-center" 
                      type="button"
                      onClick={() => {
                        setDropdownOpen(!dropdownOpen);
                        setDropdownGruposModalAbierto(false);
                      }}
                    >
                      <span className="text-truncate">
                        {usuariosSeleccionados.length === 0 
                          ? 'Todos los usuarios (General)' 
                          : `${usuariosSeleccionados.length} usuario(s) seleccionado(s)`}
                      </span>
                      <i className={`bi bi-chevron-${dropdownOpen ? 'up' : 'down'}`}></i>
                    </button>
                    
                    {dropdownOpen && (
                      <div className="dropdown-menu show w-100 p-2 shadow mt-1" style={{ maxHeight: '200px', overflowY: 'auto', position: 'absolute', top: '100%', left: 0, zIndex: 1050 }}>
                        {usuariosUnicos.map(usuario => (
                          <div className="form-check mb-2" key={usuario}>
                            <input
                              className="form-check-input cursor-pointer"
                              type="checkbox"
                              id={`check-${usuario}`}
                              checked={usuariosSeleccionados.includes(usuario)}
                              onChange={(e) => handleCheckboxChangeUsuario(usuario, e.target.checked)}
                              style={{ cursor: 'pointer' }}
                            />
                            <label className="form-check-label w-100 small" htmlFor={`check-${usuario}`} style={{ cursor: 'pointer' }}>
                              {usuario}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <label className="fw-bold text-secondary mb-2 d-block small">Periodo a exportar</label>
                <div className="btn-group w-100 mb-3" role="group">
                  <button 
                    type="button" 
                    className={`btn btn-sm ${tipoFiltroModal === 'dia' ? 'asf-btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setTipoFiltroModal('dia')}
                  >
                    Día Específico
                  </button>
                  <button 
                    type="button" 
                    className={`btn btn-sm ${tipoFiltroModal === 'intervalo' ? 'asf-btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => setTipoFiltroModal('intervalo')}
                  >
                    Rango de Fechas
                  </button>
                </div>

                {tipoFiltroModal === 'dia' ? (
                  <div className="mb-2">
                    <input 
                      type="date" 
                      className="form-control" 
                      value={fechaDiaModal}
                      onChange={(e) => setFechaDiaModal(e.target.value)}
                    />
                  </div>
                ) : (
                  <div className="row g-2">
                    <div className="col-6">
                      <label className="small text-muted">Desde:</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm" 
                        value={fechaInicioModal}
                        onChange={(e) => setFechaInicioModal(e.target.value)}
                      />
                    </div>
                    <div className="col-6">
                      <label className="small text-muted">Hasta:</label>
                      <input 
                        type="date" 
                        className="form-control form-control-sm" 
                        value={fechaFinModal}
                        onChange={(e) => setFechaFinModal(e.target.value)}
                      />
                    </div>
                  </div>
                )}

              </div>
              <div className="modal-footer border-0 pt-0" onClick={() => { setDropdownOpen(false); setDropdownGruposModalAbierto(false); }}>
                <button type="button" className="btn btn-light border" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="button" className="btn asf-btn-primary px-4" onClick={handleDescargar}>
                  <i className="bi bi-download me-2"></i> Descargar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};