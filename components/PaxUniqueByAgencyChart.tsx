
import React, { useMemo } from 'react';
import type { BookingRecord } from '../types';

interface PaxUniqueByAgencyChartProps {
  data: BookingRecord[];
}

const COLORS = ['bg-indigo-500', 'bg-orange-500', 'bg-cyan-500', 'bg-fuchsia-500'];

const PaxUniqueByAgencyChart: React.FC<PaxUniqueByAgencyChartProps> = ({ data }) => {
    const paxUniqueByAgency = useMemo(() => {
        const agencyUniquePax = new Map<string, Set<string>>();
        
        data.forEach(record => {
            const agency = record.agencia || 'Sin Agencia';
            const paxId = `${record.codigoReserva}-${record.pasaporte}`;
            
            if (!agencyUniquePax.has(agency)) {
                agencyUniquePax.set(agency, new Set());
            }
            agencyUniquePax.get(agency)!.add(paxId);
        });
        
        const counts = Array.from(agencyUniquePax.entries()).map(([agency, paxSet]) => {
          return [agency, paxSet.size] as [string, number];
        });
        
        return counts.sort((a, b) => b[1] - a[1]);
    }, [data]);

    const totalUniquePax = useMemo(() => {
        const globalPaxSet = new Set(data.map(r => `${r.codigoReserva}-${r.pasaporte}`));
        return globalPaxSet.size;
    }, [data]);

    return (
        <div>
            <div className="space-y-4">
                {paxUniqueByAgency.map(([agency, count], index) => {
                    const percentage = totalUniquePax > 0 ? (count / totalUniquePax) * 100 : 0;
                    return (
                        <div key={agency}>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{agency}</span>
                                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{count} Pax</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4">
                                <div
                                    className={`${COLORS[index % COLORS.length]} h-4 rounded-full`}
                                    style={{ width: `${percentage}%` }}
                                    role="progressbar"
                                    aria-valuenow={count}
                                    aria-valuemin={0}
                                    aria-valuemax={totalUniquePax}
                                    aria-label={`${agency}: ${count} pasajeros`}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
            {paxUniqueByAgency.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">No hay datos de agencias.</p>
            )}
        </div>
    );
};

export default PaxUniqueByAgencyChart;
