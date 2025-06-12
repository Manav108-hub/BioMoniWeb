import React from 'react';

const Input = ({ label, type = "text", value, onChange, error, ...props }) => (
  <div className="mb-4">
    <label className="block mb-2">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full p-2 border rounded ${error ? 'border-red-500' : 'border-gray-300'}`}
      {...props}
    />
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

export default Input;