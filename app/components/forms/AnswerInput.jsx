"use client";
import React from 'react';
import Input from '../common/Input';

const AnswerInput = ({ question, value, onChange }) => {
  const handleChange = (text) => {
    onChange(question.id, text);
  };

  // Handle multiple selection for checkboxes
  const handleMultipleChange = (option, checked) => {
    let currentValues = [];
    
    // Parse current value if it's a string
    if (typeof value === 'string' && value) {
      try {
        currentValues = JSON.parse(value);
      } catch {
        currentValues = value.split(',').map(v => v.trim()).filter(v => v);
      }
    } else if (Array.isArray(value)) {
      currentValues = value;
    }

    let newValues;
    if (checked) {
      newValues = [...currentValues, option];
    } else {
      newValues = currentValues.filter(v => v !== option);
    }

    // Store as JSON string for consistency
    handleChange(JSON.stringify(newValues));
  };

  // Create the question label with number
  const getQuestionLabel = () => {
    const questionNumber = question.questionNumber ? `${question.questionNumber}. ` : '';
    const requiredMark = question.is_required ? ' *' : '';
    return `${questionNumber}${question.question_text}${requiredMark}`;
  };

  // Get current values for multi-select questions
  const getCurrentValues = () => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    
    try {
      return JSON.parse(value);
    } catch {
      return value.split(',').map(v => v.trim()).filter(v => v);
    }
  };

  // Render based on question type
  switch (question.question_type) {
    case 'multiple_choice':
      // Check if this is a multi-select question
      const isMultiSelect = question.details?.allow_multiple;
      
      if (isMultiSelect) {
        const currentValues = getCurrentValues();
        return (
          <div className="mb-4">
            <label className="block mb-2 font-medium text-gray-700">
              {getQuestionLabel()}
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {question.options.map((option, idx) => (
                <div key={idx} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`${question.id}-option-${idx}`}
                    checked={currentValues.includes(option)}
                    onChange={(e) => handleMultipleChange(option, e.target.checked)}
                    className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label 
                    htmlFor={`${question.id}-option-${idx}`}
                    className="text-sm text-gray-700 cursor-pointer"
                  >
                    {option}
                  </label>
                </div>
              ))}
            </div>
          </div>
        );
      }

      return (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">
            {getQuestionLabel()}
          </label>
          <select 
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
            required={question.is_required}
          >
            <option value="">Select an option</option>
            {question.options.map((option, idx) => (
              <option key={idx} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      );

    case 'yes_no':
      return (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">
            {getQuestionLabel()}
          </label>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => handleChange("Yes")}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                value === "Yes" 
                  ? "bg-green-600 text-white shadow-md" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Yes
            </button>
            <button 
              type="button"
              onClick={() => handleChange("No")}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                value === "No" 
                  ? "bg-red-600 text-white shadow-md" 
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              No
            </button>
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">
            {getQuestionLabel()}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.details?.placeholder || ''}
            required={question.is_required}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
          />
        </div>
      );

    case 'number':
      return (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">
            {getQuestionLabel()}
          </label>
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            min={question.details?.min}
            max={question.details?.max}
            required={question.is_required}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
          />
        </div>
      );

    case 'date':
      return (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">
            {getQuestionLabel()}
          </label>
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            required={question.is_required}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
          />
        </div>
      );

    case 'textarea':
      return (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">
            {getQuestionLabel()}
          </label>
          <textarea
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.details?.placeholder || ''}
            required={question.is_required}
            rows={4}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 resize-vertical"
          />
        </div>
      );

    default:
      return (
        <div className="mb-4">
          <label className="block mb-2 font-medium text-gray-700">
            {getQuestionLabel()}
          </label>
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={question.details?.placeholder || ''}
            required={question.is_required}
            className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
          />
        </div>
      );
  }
};

export default AnswerInput;