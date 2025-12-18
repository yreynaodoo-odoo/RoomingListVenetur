
import React, { useMemo } from 'react';
import type { BookingRecord } from '../types';

interface PaxByHotelChartProps {
  data: BookingRecord[];
}

const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-red-500', 'bg-teal-500'
];

const PaxByHotelChart: React.FC<PaxByHotelChartProps> = ({ data }) => {
  const paxByHotel = useMemo(() => {
    const hotelCounts = new Map<string, number>();
    data.forEach(record => {
        const hotel = record.hotel;
        hotelCounts.set(hotel, (hotelCounts.get(hotel) || 0) + 1);
    });
    
    const counts = Array.from(hotelCounts.entries()).map(([hotel, count]) => {
      return [hotel, count] as [string, number];
    });
    
    return counts.sort((a, b) => b[1] - a[1]);
  }, [data]);

  const totalBookings = useMemo(() => data.length, [data]);

  return (
    <div>
      <div className="space-y-4">
        {paxByHotel.map(([hotel, count], index) => {
          const percentage = totalBookings > 0 ? (count / totalBookings) * 100 : 0;
          return (
            <div key={hotel}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{hotel}</span>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{count} Huéspedes</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                <div
                  className={`${COLORS[index % COLORS.length]} h-4 rounded-full`}
                  style={{ width: `${percentage}%` }}
                  role="progressbar"
                  aria-valuenow={count}
                  aria-valuemin={0}
                  aria-valuemax={totalBookings}
                  aria-label={`${hotel}: ${count} huéspedes`}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PaxByHotelChart;
