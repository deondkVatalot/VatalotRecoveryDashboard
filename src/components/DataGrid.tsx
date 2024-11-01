import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
  ColumnDef,
  SortingState,
  Row
} from '@tanstack/react-table';
import { ArrowUpDown, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { generatePDF } from '../utils/pdf';
import ProgressBar from './ProgressBar';

interface DataGridProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  title?: string;
  onDataChange?: (newData: T[]) => void;
  getRowClassName?: (record: T) => string;
}

export default function DataGrid<T extends { id: string }>({ 
  data = [], 
  columns, 
  pageSize: initialPageSize = 50,
  onPageSizeChange,
  title = 'Data',
  onDataChange,
  getRowClassName
}: DataGridProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const table = useReactTable({
    data: data || [],
    columns,
    state: {
      sorting,
      globalFilter,
      pagination: { pageSize, pageIndex: 0 },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    meta: {
      updateData: (rowIndex: number, columnId: string, value: any) => {
        const newData = [...data];
        newData[rowIndex] = {
          ...newData[rowIndex],
          [columnId]: value
        };
        onDataChange?.(newData);
      }
    }
  });

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    onPageSizeChange?.(newSize);
  };

  const handleExportExcel = () => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      XLSX.writeFile(wb, `${title.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error('Failed to export data');
      console.error('Export error:', error);
    }
  };

  const handleExportPDF = async () => {
    if (!data || data.length === 0) {
      toast.error('No data available to export');
      return;
    }

    if (generating) return;
    
    setGenerating(true);
    setProgress(0);

    try {
      await generatePDF(data, title, setProgress);
      toast.success('PDF generated successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  if (!data || !columns || columns.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No data available to display.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search..."
          className="px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        />
        <div className="flex items-center gap-4">
          <select
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            className="px-4 py-2 border rounded-lg focus:ring-primary focus:border-primary dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={250}>250 per page</option>
            <option value={500}>500 per page</option>
          </select>
          <button
            onClick={handleExportExcel}
            disabled={!data || data.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            Export Excel
          </button>
          <button
            onClick={handleExportPDF}
            disabled={generating || !data || data.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg btn-primary disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            {generating ? 'Generating...' : 'Export PDF'}
          </button>
        </div>
      </div>

      <div className="border dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-sm font-medium text-gray-900 dark:text-white border-b dark:border-gray-700"
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        className={`flex items-center gap-2 ${
                          header.column.getCanSort() ? 'cursor-pointer select-none' : ''
                        }`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getCanSort() && (
                          <ArrowUpDown className="w-4 h-4" />
                        )}
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr 
                key={row.id} 
                className={`border-b dark:border-gray-700 last:border-b-0 ${
                  getRowClassName ? getRowClassName(row.original) : ''
                }`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 text-sm text-gray-900 dark:text-gray-300">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-700 dark:text-gray-300">
          Showing {table.getState().pagination.pageSize} of {data.length} results
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="p-1 rounded-md disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="p-1 rounded-md disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {generating && (
        <div className="fixed inset-x-0 bottom-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg">
          <ProgressBar progress={progress} label="Generating PDF" />
        </div>
      )}
    </div>
  );
}