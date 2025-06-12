"use client";
import React from 'react';
import Input from '../common/Input';
import Button from '../common/Button';

const AnswerInput = ({ question, value, onChange }) => {
  const handleChange = (text) => {
    onChange(question.id, text);
  };

  // Render based on question type
  switch (question.question_type) {
    case 'multiple_choice':
      return (
        <div className="mb-4">
          <label className="block mb-2">{question.question_text}</label>
          <select 
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full p-2 border rounded"
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
          <label className="block mb-2">{question.question_text}</label>
          <div className="flex gap-4">
            <button 
              type="button"
              onClick={() => handleChange("Yes")}
              className={`px-4 py-2 rounded ${value === "Yes" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              Yes
            </button>
            <button 
              type="button"
              onClick={() => handleChange("No")}
              className={`px-4 py-2 rounded ${value === "No" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              No
            </button>
          </div>
        </div>
      );

    case 'text':
      return (
        <Input 
          label={question.question_text}
          value={value}
          onChange={handleChange}
          required={question.is_required}
        />
      );

    case 'number':
      return (
        <Input 
          label={question.question_text}
          value={value}
          onChange={handleChange}
          type="number"
          required={question.is_required}
        />
      );

    case 'checkbox':
      return (
        <div className="mb-4">
          <label className="block mb-2">{question.question_text}</label>
          {question.options.map((option, idx) => (
            <div key={idx} className="flex items-center mb-2">
              <input
                type="checkbox"
                id={`option-${idx}`}
                checked={value?.includes(option)}
                onChange={(e) => {
                  const newValue = e.target.checked 
                    ? [...(value || []), option]
                    : value?.filter(v => v !== option) || [];
                  handleChange(newValue);
                }}
                className="mr-2"
              />
              <label htmlFor={`option-${idx}`}>{option}</label>
            </div>
          ))}
        </div>
      );

    default:
      return null;
  }
};

export default AnswerInput;