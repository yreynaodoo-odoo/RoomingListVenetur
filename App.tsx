
import React, { useState, useEffect, useMemo } from 'react';
import { processBookingData } from './services/geminiService';
import type { BookingRecord } from './types';
import { OCR_TEXT_PAGE_1, OCR_TEXT_PAGE_2, OCR_TEXT_PAGE_3 } from './constants';
import PaxByHotelChart from './components/PaxByHotelChart';
import PaxByAgencyChart from './components/PaxByAgencyChart';
import PaxUniqueByAgencyChart from './components/PaxUniqueByAgencyChart';
import GuestListTable from './components/GuestListTable';
import StatCard from './components/StatCard';

const App: React.FC = () => {
  const [bookingData, setBookingData] = useState<BookingRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFlightDate, setSelectedFlightDate] = useState<string>('all');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Combinamos las tres páginas de OCR proporcionadas
        const combinedText = `Page 1:\n${OCR_TEXT_PAGE_1}\n\nPage 2:\n${OCR_TEXT_PAGE_2}\n\nPage 3:\n${OCR_TEXT_PAGE_3}`;
        const data = await processBookingData(combinedText);
        
        // 1. Identificar códigos cancelados (último estatus para una reserva)
        const cancelledCodes = new Set<string>();
        data.forEach(record => {
          if (record.estatus.toUpperCase() === 'CANCELLATION') {
            cancelledCodes.add(record.codigoReserva);
          }
        });

        // 2. Filtrar registros activos (que no han sido cancelados)
        const activeRecords = data.filter(record => !cancelledCodes.has(record.codigoReserva));
        
        // 3. Agrupar por código de reserva para asegurar que tomamos la versión más reciente del correo
        const bookingsByCode = new Map<string, BookingRecord[]>();
        activeRecords.forEach(record => {
            const records = bookingsByCode.get(record.codigoReserva) || [];
            records.push(record);
            bookingsByCode.set(record.codigoReserva, records);
        });

        // 4. Obtener la última versión de cada reserva activa basándonos en la fecha/hora del correo
        const finalRecords: BookingRecord[] = [];
        bookingsByCode.forEach(records => {
          if (records.length > 0) {
            const latestTimestamp = Math.max(...records.map(r => new Date(r.fechaHoraCorreo).getTime()));
            const latestRecords = records.filter(r => new Date(r.fechaHoraCorreo).getTime() === latestTimestamp);
            finalRecords.push(...latestRecords);
          }
        });
        
        setBookingData(finalRecords);

      } catch (e) {
        console.error(e);
        setError('No se pudieron procesar los datos de la reserva. El modelo de IA puede estar ocupado o ha ocurrido un error.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const uniqueFlightDates = useMemo(() => {
    const dates = new Set(bookingData.map(record => record.fechaVuelo));
    return ['all', ...Array.from(dates).sort((a: string, b: string) => {
        const parseDate = (d: string) => {
            const parts = d.split('.');
            let year = parseInt(parts[2]);
            if (year < 100) year += 2000;
            return new Date(year, parseInt(parts[1]) - 1, parseInt(parts[0])).getTime();
        };
        return parseDate(a) - parseDate(b);
    })];
  }, [bookingData]);

  const filteredData = useMemo(() => {
    if (selectedFlightDate === 'all') {
      return bookingData;
    }
    return bookingData.filter(record => record.fechaVuelo === selectedFlightDate);
  }, [bookingData, selectedFlightDate]);

  const totalPassengers = useMemo(() => {
    const uniquePassengers = new Set(
      filteredData.map(record => `${record.codigoReserva}-${record.pasaporte}`)
    );
    return uniquePassengers.size;
  }, [filteredData]);
  
  const uniqueHotels = useMemo(() => new Set(filteredData.map(b => b.hotel)).size, [filteredData]);
  const totalHotelBookings = useMemo(() => filteredData.length, [filteredData]);
  
  const paxSolosVeneturMargarita = useMemo(() => {
    const bookingsByCode = new Map<string, BookingRecord[]>();
    filteredData.forEach(record => {
        const records = bookingsByCode.get(record.codigoReserva) || [];
        records.push(record);
        bookingsByCode.set(record.codigoReserva, records);
    });

    let soloTravelersInVenetur = 0;
    
    bookingsByCode.forEach(records => {
        const uniquePassengersInBooking = new Set(records.map(r => r.pasaporte));
        if (uniquePassengersInBooking.size === 1) {
            const staysAtVenetur = records.some(record => 
                record.hotel.toLowerCase().includes('venetur margarita')
            );
            if (staysAtVenetur) {
                soloTravelersInVenetur++;
            }
        }
    });

    return soloTravelersInVenetur;
  }, [filteredData]);

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
      <h2 className="mt-4 text-2xl font-semibold">La IA está Analizando las Reservas...</h2>
      <p className="mt-2 text-lg">Por favor, espere mientras Gemini estructura los datos.</p>
    </div>
  );

  const ErrorState = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-8">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 S-18 0 9 9 0 0118 0z" />
        </svg>
        <h2 className="mt-4 text-2xl font-semibold">Ocurrió un Error</h2>
        <p className="mt-2 text-center">{error}</p>
    </div>
  );

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
      <main className="max-w-7xl mx-auto">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                  <h1 className="text-4xl font-bold tracking-tight text-gray-800 dark:text-white">
                      RoomingList 2025
                  </h1>
                  <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                      Análisis de registros de reservas con IA.
                  </p>
              </div>
              <div className="mt-4 md:mt-0">
                  <label htmlFor="flight-date-filter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Filtrar por Fecha de Vuelo
                  </label>
                  <select
                      id="flight-date-filter"
                      value={selectedFlightDate}
                      onChange={e => setSelectedFlightDate(e.target.value)}
                      className="w-full md:w-auto p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-blue-500 focus:border-blue-500"
                      aria-label="Filter dashboard by flight date"
                  >
                      {uniqueFlightDates.map(date => (
                          <option key={date} value={date}>
                              {date === 'all' ? 'Todas las Fechas de Vuelo' : date}
                          </option>
                      ))}
                  </select>
              </div>
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total de Pasajeros" value={totalPassengers.toString()} />
            <StatCard title="Pax Solos en Venetur Margarita" value={paxSolosVeneturMargarita.toString()} />
            <StatCard title="Hoteles Únicos" value={uniqueHotels.toString()} />
            <StatCard title="Total de Reservas de Hotel" value={totalHotelBookings.toString()} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Estancias por Hotel</h3>
            <PaxByHotelChart data={filteredData} />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Reservas por Agencias</h3>
            <PaxByAgencyChart data={filteredData} />
          </div>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4">Pasajeros por Agencias</h3>
            <PaxUniqueByAgencyChart data={filteredData} />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg overflow-hidden">
          <GuestListTable data={bookingData} />
        </div>
      </main>
    </div>
  );
};

export default App;
