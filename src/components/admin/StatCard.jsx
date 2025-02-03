import React from 'react';

const StatCard = ({ title, value, change, unit = '' }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
    <p className="mt-2 text-3xl font-bold text-gray-900">
      {typeof value === 'number' ? value.toLocaleString() : value}
      {unit}
    </p>
    {change && (
      <div className="text-sm text-green-600">
        +{change}% from last week
      </div>
    )}
  </div>
);

export default StatCard;
