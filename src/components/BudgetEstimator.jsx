import React from 'react';

export const BudgetEstimator = ({ complexity, estimatedHours, estimatedCost, onComplexityChange, onHoursChange, disabled }) => {
  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold mb-2 font-serif">Budget Estimator</h3>
      <div className="mb-2">
        <label htmlFor="complexity" className="block text-gray-700 text-sm font-bold mb-2">Complexity</label>
        <select
          id="complexity"
          name="complexity"
          value={complexity}
          onChange={onComplexityChange}
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div className="mb-2">
        <label htmlFor="estimatedHours" className="block text-gray-700 text-sm font-bold mb-2">Estimated Hours</label>
        <input
          type="number"
          id="estimatedHours"
          name="estimatedHours"
          value={estimatedHours}
          onChange={onHoursChange}
          className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={disabled}
        />
      </div>
      <div className="mt-4">
        <p className="text-gray-700">Estimated Cost: ${estimatedCost}</p>
      </div>
    </div>
  );
};
