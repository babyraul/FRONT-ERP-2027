import React, { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline'

// Componente para filtro por columna con un diseño más limpio
function Filter({ column, table }) {
  const columnFilterValue = column.getFilterValue()

  return (
    <div className="relative mt-2">
      <MagnifyingGlassIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
      <input
        type="text"
        value={(columnFilterValue ?? '')}
        onChange={e => column.setFilterValue(e.target.value)}
        placeholder={`Buscar...`}
        className="w-full text-xs py-1.5 pl-8 pr-2 border border-slate-200 dark:border-slate-700 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-normal placeholder:text-slate-400"
      />
    </div>
  )
}

export function DataTable({ data, columns, pagination = true }) {
  const [columnFilters, setColumnFilters] = useState([])

  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: pagination ? getPaginationRowModel() : undefined,
    columnResizeMode: 'onChange',
  })

  return (
    <div className="w-full flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-800/60 overflow-hidden transition-all">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    colSpan={header.colSpan}
                    className="relative px-5 py-4 font-semibold text-slate-600 dark:text-slate-300 group align-top"
                    style={{ width: header.getSize() !== 150 ? header.getSize() : 'auto' }}
                  >
                    {header.isPlaceholder ? null : (
                      <div className="flex flex-col h-full justify-between">
                        <div className="flex items-center gap-2 uppercase tracking-wider text-[11px] mb-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </div>
                        {header.column.getCanFilter() ? (
                          <div className="w-full">
                            <Filter column={header.column} table={table} />
                          </div>
                        ) : null}
                      </div>
                    )}
                    
                    {/* Resizer handle */}
                    {header.column.getCanResize() && (
                      <div
                        onMouseDown={header.getResizeHandler()}
                        onTouchStart={header.getResizeHandler()}
                        className={`absolute right-0 top-1/4 h-1/2 w-1.5 cursor-col-resize rounded-full bg-slate-300 dark:bg-slate-600 opacity-0 group-hover:opacity-100 hover:w-2 hover:bg-blue-500 transition-all ${
                          header.column.getIsResizing() ? 'bg-blue-500 opacity-100 w-2' : ''
                        }`}
                      />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors group/row"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-5 py-3.5 text-slate-600 dark:text-slate-300"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 bg-slate-50/30 dark:bg-slate-900/30"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <MagnifyingGlassIcon className="h-8 w-8 opacity-20" />
                    <p>No se encontraron resultados que coincidan con la búsqueda.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-4 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 gap-4">
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-medium bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              Pág {table.getState().pagination.pageIndex + 1} de {table.getPageCount() || 1}
            </span>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Ir a:</span>
              <input
                type="number"
                min="1"
                max={table.getPageCount() || 1}
                defaultValue={table.getState().pagination.pageIndex + 1}
                onChange={e => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0
                  table.setPageIndex(page)
                }}
                className="w-16 border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 text-center bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all"
              />
            </div>
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => {
                table.setPageSize(Number(e.target.value))
              }}
              className="border border-slate-200 dark:border-slate-700 rounded-lg p-1.5 bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/50 outline-none cursor-pointer transition-all"
            >
              {[10, 20, 30, 40, 50].map(pageSize => (
                <option key={pageSize} value={pageSize}>
                  {pageSize} filas
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Primera página"
            >
              <ChevronDoubleLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Página anterior"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Página siguiente"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Última página"
            >
              <ChevronDoubleRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
