import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col justify-between">
      <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <p className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{value}</p>
    </div>
  );
};

export default StatCard;
