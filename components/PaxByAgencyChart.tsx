
import React, { useMemo } from 'react';
import type { BookingRecord } from '../types';

interface PaxByAgencyChartProps {
  data: BookingRecord[];
}

const COLORS = ['bg-sky-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'];

const PaxByAgencyChart: React.FC<PaxByAgencyChartProps> = ({ data }) => {
    const paxByAgency = useMemo(() => {
        const agencyCounts = new Map<string, number>();
        data.forEach(record => {
            const agency = record.agencia || 'Unknown';
            agencyCounts.set(agency, (agencyCounts.get(agency) || 0) + 1);
        });
        
        const counts = Array.from(agencyCounts.entries()).map(([agency, count]) => {
          return [agency, count] as [string, number];
        });
        
        return counts.sort((a, b) => b[1] - a[1]);
    }, [data]);

    const totalBookings = useMemo(() => data.length, [data]);

    return (
        <div>
            <div className="space-y-4">
                {paxByAgency.map(([agency, count], index) => {
                    const percentage = totalBookings > 0 ? (count / totalBookings) * 100 : 0;
                    return (
                        <div key={agency}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{agency}</span>
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
                                    aria-label={`${agency}: ${count} huéspedes`}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default PaxByAgencyChart;
