
import React, { useMemo, useState } from 'react';
import type { BookingRecord } from '../types';

declare global {
  interface Window {
    XLSX: any;
    jspdf: any;
  }
}

interface GuestListTableProps {
  data: BookingRecord[];
}

const GuestListTable: React.FC<GuestListTableProps> = ({ data }) => {
  const [filter, setFilter] = useState('');
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [selectedAgency, setSelectedAgency] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof BookingRecord; direction: 'asc' | 'desc' } | null>(null);

  const uniqueHotels = useMemo(() => {
    const hotels = new Set(data.map(record => record.hotel));
    return ['all', ...Array.from(hotels).sort()];
  }, [data]);

  const uniqueAgencies = useMemo(() => {
    const agencies = new Set(data.map(record => record.agencia).filter(Boolean));
    return ['all', ...Array.from(agencies).sort()];
  }, [data]);
  
  const reservationsWithMultipleHotels = useMemo(() => {
    const bookingsByCode = new Map<string, Set<string>>();
    data.forEach(record => {
        if (!bookingsByCode.has(record.codigoReserva)) {
            bookingsByCode.set(record.codigoReserva, new Set<string>());
        }
        bookingsByCode.get(record.codigoReserva)!.add(record.hotel);
    });

    const highlightedCodes = new Set<string>();
    bookingsByCode.forEach((hotels, code) => {
        if (hotels.size > 1) {
            highlightedCodes.add(code);
        }
    });
    return highlightedCodes;
  }, [data]);

  const processedData = useMemo(() => {
    let filteredRecords = data;
    
    if (selectedHotel !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.hotel === selectedHotel);
    }

    if (selectedAgency !== 'all') {
        filteredRecords = filteredRecords.filter(record => record.agencia === selectedAgency);
    }
    
    if (filter) {
        const lowercasedFilter = filter.toLowerCase();
        filteredRecords = filteredRecords.filter(record => 
            record.nombreCompleto.toLowerCase().includes(lowercasedFilter) ||
            record.pasaporte.toLowerCase().includes(lowercasedFilter) ||
            record.codigoReserva.toLowerCase().includes(lowercasedFilter) ||
            (record.agencia && record.agencia.toLowerCase().includes(lowercasedFilter))
        );
    }

    if (sortConfig !== null) {
      filteredRecords.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    const grouped: { [key: string]: BookingRecord[] } = {};
    filteredRecords.forEach(record => {
      const groupKey = selectedHotel === 'all' ? record.hotel : record.fechaVuelo;
      if (!grouped[groupKey]) {
        grouped[groupKey] = [];
      }
      grouped[groupKey].push(record);
    });

    return Object.entries(grouped).sort((a, b) => a[0].localeCompare(b[0]));
  }, [data, filter, selectedHotel, selectedAgency, sortConfig]);

  const handleSort = (key: keyof BookingRecord) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
    
  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: keyof BookingRecord }) => {
    const isSorting = sortConfig?.key === sortKey;
    const directionIcon = isSorting ? (sortConfig?.direction === 'asc' ? '▲' : '▼') : '';
    
    return (
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
            <button onClick={() => handleSort(sortKey)} className="flex items-center space-x-1 focus:outline-none">
                <span>{label}</span>
                <span className="text-xs">{directionIcon}</span>
            </button>
        </th>
    );
  };
  
  const handleExportExcel = () => {
    if (!window.XLSX) {
      alert('La librería para exportar a Excel no está cargada.');
      return;
    }
    
    const allRecords = processedData.flatMap(([, records]) => records);
    if (allRecords.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const dataToExport = allRecords.map((record, index) => ({
      '#': index + 1,
      'Agencia': record.agencia,
      'Hotel': record.hotel,
      'Reserva': record.codigoReserva,
      'Nombre Completo': record.nombreCompleto,
      'Fecha de Nacimiento': record.fechaNacimiento,
      'Fecha de Vuelo': record.fechaVuelo,
      'Alojamiento': record.alojamiento,
      'Plan de Comidas': record.planDeComidas,
      'Fecha de Entrada': record.fechaInicio,
      'Fecha de Salida': record.fechaFin,
      'Noches': record.noches,
      'Pasaporte': record.pasaporte,
      'Edad': record.edad,
      'Nacionalidad': record.nacionalidad,
    }));
    
    const summaryRow = {
        '#': 'Total',
        'Nombre Completo': `${allRecords.length} registros`,
    };

    const worksheet = window.XLSX.utils.json_to_sheet(dataToExport);
    window.XLSX.utils.sheet_add_json(worksheet, [summaryRow], { origin: -1, skipHeader: true });

    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Huéspedes');
    window.XLSX.writeFile(workbook, 'ListaHuespedes.xlsx');
  };

  const handleExportPdf = () => {
    if (!window.jspdf || !window.jspdf.jsPDF) {
        alert('La librería para exportar a PDF no está cargada.');
        return;
    }

    const doc = new window.jspdf.jsPDF({ orientation: 'landscape', format: 'letter' });
    
    const allRecords = processedData.flatMap(([, records]) => records);
    if (allRecords.length === 0) {
        alert('No hay datos para exportar.');
        return;
    }
    
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(18);
    doc.text('RoomingList 2025', pageWidth / 2, 22, { align: 'center' });

    const tableHeaders = ['#', 'Agencia', 'Hotel', 'Reserva', 'Vuelo', 'Nombre Completo', 'Fec. Nac.', 'Pasaporte', 'Acomodación', 'Noches', 'Estadía', 'Plan de Comidas'];
    
    const tableData = allRecords.map((record, index) => [
        index + 1,
        record.agencia,
        record.hotel,
        record.codigoReserva,
        record.fechaVuelo,
        record.nombreCompleto,
        record.fechaNacimiento,
        record.pasaporte,
        record.alojamiento,
        record.noches,
        `${record.fechaInicio} - ${record.fechaFin}`,
        record.planDeComidas,
    ]);
    
    (doc as any).autoTable({
        head: [tableHeaders],
        body: tableData,
        startY: 28,
        styles: { fontSize: 6 },
        headStyles: { fontSize: 6, fillColor: [30, 41, 59] },
        willDrawCell: (data: any) => {
            if (data.section === 'body') {
                const record = allRecords[data.row.index];
                if (record && reservationsWithMultipleHotels.has(record.codigoReserva)) {
                    doc.setFillColor(254, 252, 232); // Light yellow
                    doc.rect(data.cell.x, data.cell.y, data.cell.width, data.cell.height, 'F');
                }
            }
        },
        didDrawPage: (data: any) => {
            const pageCount = doc.internal.getNumberOfPages();
            const generationDate = new Date().toLocaleString();
            
            doc.setFontSize(8);
            
            const footerText = `Total de Registros: ${allRecords.length} | Reporte Generado: ${generationDate}`;
            doc.text(
                footerText, 
                data.settings.margin.left, 
                doc.internal.pageSize.height - 10
            );
            
            doc.text(
                `Página ${data.pageNumber} de ${pageCount}`,
                doc.internal.pageSize.width - data.settings.margin.right,
                doc.internal.pageSize.height - 10,
                { align: 'right' }
            );
        },
    });

    doc.save('RoomingList_2025.pdf');
  };

  return (
    <div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
            <h3 className="text-xl font-semibold flex-shrink-0">Lista de Huéspedes</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full flex-wrap">
                <select
                    value={selectedHotel}
                    onChange={e => setSelectedHotel(e.target.value)}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    aria-label="Filter by hotel"
                >
                    <option value="all">Todos los Hoteles</option>
                    {uniqueHotels.filter(h => h !== 'all').map(hotel => (
                        <option key={hotel} value={hotel}>{hotel}</option>
                    ))}
                </select>
                <select
                    value={selectedAgency}
                    onChange={e => setSelectedAgency(e.target.value)}
                    className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    aria-label="Filter by agency"
                >
                    <option value="all">Todas las Agencias</option>
                    {uniqueAgencies.filter(a => a !== 'all').map(agency => (
                        <option key={agency} value={agency}>{agency}</option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="Buscar por reserva, nombre, pasaporte o agencia..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
                 <div className="flex items-center gap-2">
                    <button onClick={handleExportExcel} className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">Exportar a Excel</button>
                    <button onClick={handleExportPdf} className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm">Exportar a PDF</button>
                </div>
            </div>
        </div>
      
        <div className="space-y-6">
            {processedData.length > 0 ? processedData.map(([groupTitle, records]) => (
                <div key={groupTitle} className="overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg">
                    <h4 className="text-lg font-bold p-4 bg-gray-100 dark:bg-gray-700">{groupTitle} ({records.length} Huéspedes)</h4>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <SortableHeader label="Agencia" sortKey="agencia" />
                                    <SortableHeader label="Nombre Completo" sortKey="nombreCompleto" />
                                    <SortableHeader label="Reserva" sortKey="codigoReserva" />
                                    <SortableHeader label="Fecha de Vuelo" sortKey="fechaVuelo" />
                                    <SortableHeader label="Pasaporte" sortKey="pasaporte" />
                                    <SortableHeader label="Estadía" sortKey="fechaInicio" />
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Alojamiento</th>
                                    <SortableHeader label="Noches" sortKey="noches" />
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Plan</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {records.map(record => (
                                    <tr 
                                      key={`${record.pasaporte}-${record.fechaInicio}-${record.hotel}`}
                                      className={reservationsWithMultipleHotels.has(record.codigoReserva) ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">{record.agencia}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{record.nombreCompleto}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{record.codigoReserva}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{record.fechaVuelo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{record.pasaporte}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{`${record.fechaInicio} - ${record.fechaFin}`}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{record.alojamiento}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{record.noches}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">{record.planDeComidas}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )) : (
                <div className="text-center py-10">
                    <p className="text-gray-500 dark:text-gray-400">No se encontraron resultados para sus criterios de búsqueda.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default GuestListTable;
