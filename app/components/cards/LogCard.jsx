import React from 'react';

const LogCard = ({ log }) => (
  <div className="bg-green-50 border border-green-200 p-4 rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300">
    <h3 className="font-bold text-xl !text-black mb-6 mb-1">{log.species_name}</h3>
    <p className="text-sm text-gray-600 mb-1">{log.location_name}</p>
    <p className="text-sm text-gray-600">📍 Lat: {log.location_latitude}, Long: {log.location_longitude}</p>
    {log.notes && <p className="mt-2 text-sm italic text-gray-700">{log.notes}</p>}

    {log.photo_path && (
      <img 
        src={`/uploads/${log.photo_path}`} 
        alt="Observation" 
        className="mt-4 w-full h-48 object-cover rounded-md border border-gray-200"
      />
    )}

    <div className="mt-4 space-y-1">
      {log.answers.map(answer => (
        <div key={answer.id} className="text-sm text-gray-800">
          <strong className="text-green-700">{answer.question_text}:</strong> {answer.answer_text}
        </div>
      ))}
    </div>
  </div>
);

export default LogCard;
