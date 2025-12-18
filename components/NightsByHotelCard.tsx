
import React from 'react';

interface NightsByHotelCardProps {
  data: [string, number][];
}

const NightsByHotelCard: React.FC<NightsByHotelCardProps> = ({ data }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col h-full">
      <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">Noches Reservadas por Hotel</h3>
      <div className="mt-4 overflow-y-auto flex-grow" style={{maxHeight: '120px'}}>
        {data.length > 0 ? (
          <ul className="space-y-3">
            {data.map(([hotel, nights]) => (
              <li key={hotel} className="flex justify-between items-center text-sm">
                <span className="font-medium text-gray-700 dark:text-gray-300 truncate pr-2">{hotel}</span>
                <span className="font-bold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md">{nights.toLocaleString()}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center justify-center h-full">
             <p className="text-gray-500 dark:text-gray-400">No hay datos disponibles.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NightsByHotelCard;