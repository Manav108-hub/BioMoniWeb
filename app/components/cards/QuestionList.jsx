"use client";
import React from 'react';

const QuestionList = ({ questions = [] }) => {
  if (!questions.length) return null;

  // Group questions by part
  const partA = questions.filter(q => q.order_index <= 10);
  const partB = questions.filter(q => q.order_index >= 11 && q.order_index <= 20);
  const partC = questions.filter(q => q.order_index >= 21);

  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h3 className="font-semibold text-lg mb-4">Structured Questionnaire</h3>
      
      <div className="grid md:grid-cols-3 gap-6">
        {/* Part A */}
        <div>
          <h4 className="font-medium mb-2">Part A: Socio-Economic</h4>
          <ul className="space-y-2 text-sm">
            {partA.slice(0, 5).map(q => (
              <li key={q.id} className="text-gray-700">
                {q.question_text}
              </li>
            ))}
            <li className="text-gray-700 font-medium">+ {partA.length - 5} more...</li>
          </ul>
        </div>
        
        {/* Part B */}
        <div>
          <h4 className="font-medium mb-2">Part B: Human-Elephant</h4>
          <ul className="space-y-2 text-sm">
            {partB.slice(0, 5).map(q => (
              <li key={q.id} className="text-gray-700">
                {q.question_text}
              </li>
            ))}
            <li className="text-gray-700 font-medium">+ {partB.length - 5} more...</li>
          </ul>
        </div>
        
        {/* Part C */}
        <div>
          <h4 className="font-medium mb-2">Part C: Other Wildlife</h4>
          <ul className="space-y-2 text-sm">
            {partC.slice(0, 5).map(q => (
              <li key={q.id} className="text-gray-700">
                {q.question_text}
              </li>
            ))}
            <li className="text-gray-700 font-medium">+ {partC.length - 5} more...</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default QuestionList;