import React from 'react';

const Button = ({ title, onClick, loading = false, disabled = false }) => (
  <button
    onClick={onClick}
    disabled={loading || disabled}
    className={`w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {loading ? 'Loading...' : title}
  </button>
);

export default Button;