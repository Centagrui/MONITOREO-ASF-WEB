import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  createColumnHelper,
  SortingState
} from '@tanstack/react-table';

// Modelo de datos de tu base de datos
interface Usuario {
  id: number;
  nombre: string;
  telefono: string | null;
}

const columnHelper = createColumnHelper<Usuario>();

const TelefonosRegistrados: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  
  const [sorting, setSorting] = useState<SortingState>([]);

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        setCargando(true);
        const res = await axios.get<Usuario[]>('https://api2.agrosantafe.com.mx/api/usuarios');
        setUsuarios(res.data);
      } catch (error) {
        console.error('Error al cargar los usuarios:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarUsuarios();
  }, []);

  const columns = useMemo(
    () => [
      columnHelper.accessor('nombre', {
        header: 'Nombre',
        cell: (info) => (
          <span className="text-dark">
            {info.getValue()}
          </span>
        )
      }),
      columnHelper.accessor('telefono', {
        header: 'Telefono',
        cell: (info) => (
          <span className="text-dark">
            {info.getValue() || ""}
          </span>
        )
      })
    ],
    []
  );

  const table = useReactTable({
    data: usuarios,
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
    <div 
      className="container-fluid min-vh-100 d-flex flex-column align-items-center pt-5" 
      style={{ backgroundColor: '#fce4ec' }}
    >
      {/* Título principal */}
      <h1 className="fw-bold mb-4 text-dark" style={{ fontSize: '2.5rem' }}>
        Telfonos Registrados
      </h1>

      <div 
        className="w-100 bg-white shadow-sm overflow-hidden" 
        style={{ maxWidth: '800px', border: '1px solid #dee2e6' }}
      >
        <div className="table-responsive">
          <table className="table table-hover table-bordered align-middle mb-0">
            
            {/* CABECERA CORREGIDA IDÉNTICA A TU DISEÑO */}
            <thead style={{ position: 'sticky', top: 0, zIndex: 1 }}>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    const puedeOrdenar = header.column.getCanSort();
                    const orden = header.column.getIsSorted();

                    return (
                      <th
                        key={header.id}
                        onClick={header.column.getToggleSortingHandler()}
                        className="w-50 text-center align-middle text-white p-4"
                        style={{ 
                          backgroundColor: '#0b6623', // Verde oscuro
                          cursor: puedeOrdenar ? 'pointer' : 'default', 
                          userSelect: 'none',
                          borderBottom: 'none',
                          borderRight: header.id === 'nombre' ? '1px solid #09541d' : 'none'
                        }}
                      >
                        <div className="d-flex align-items-center justify-content-center gap-2 fs-5 fw-bold">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          
                          {/* Flechas de ordenamiento más discretas */}
                          {puedeOrdenar && (
                            <span className="opacity-75 fs-6" style={{ color: '#ffffff' }}>
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
              {cargando ? (
                <tr>
                  <td colSpan={2} className="text-center py-5 text-muted">
                    <div className="spinner-border text-success mb-2" role="status"></div>
                    <br />
                    Cargando directorio...
                  </td>
                </tr>
              ) : table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-4 px-4 text-center border-bottom border-light">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="text-center py-5 text-muted">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="d-flex flex-wrap align-items-center justify-content-between p-3 bg-light border-top gap-2">
          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted">
              Página <strong>{table.getState().pagination.pageIndex + 1}</strong> de{' '}
              <strong>{table.getPageCount() || 1}</strong> ({usuarios.length} registrados)
            </span>
            <select
              className="form-select form-select-sm w-auto"
              value={table.getState().pagination.pageSize}
              onChange={(e) => table.setPageSize(Number(e.target.value))}
            >
              {[10, 20, 50].map((size) => (
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
    </div>
  );
};

export default TelefonosRegistrados;