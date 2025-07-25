"use client";

import React, { useEffect, useState } from 'react';
import { observationService, speciesService, userService, questionService } from '../api/service';
import Navbar from '../components/common/Navbar';
import { useRouter } from 'next/navigation';

const Admin = () => {
  const [logs, setLogs] = useState([]);
  const [speciesMap, setSpeciesMap] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [questions, setQuestions] = useState([]);

  // For adding a new question - updated to match backend
  const [questionText, setQuestionText] = useState('');
  const [questionType, setQuestionType] = useState('text'); // New field
  const [isRequired, setIsRequired] = useState(true); // Default to true like backend
  const [section, setSection] = useState(''); // New field
  const [orderIndex, setOrderIndex] = useState(0); // New field
  const [dependsOn, setDependsOn] = useState(''); // New field - question text
  const [dependsOnValue, setDependsOnValue] = useState(''); // New field
  const [optionInput, setOptionInput] = useState('');
  const [options, setOptions] = useState([]);
  const [questionSubmitting, setQuestionSubmitting] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in as an admin.');
        router.push('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const [fetchedLogs, fetchedSpecies, fetchedUsers, fetchedQuestions] = await Promise.all([
          observationService.getAllLogs(),
          speciesService.getSpecies(),
          userService.getAllUsers(),
          questionService.getQuestions()
        ]);

        setLogs(fetchedLogs || []);
        setQuestions(fetchedQuestions || []);

        const spMap = {};
        (fetchedSpecies || []).forEach(s => { spMap[s.id] = s.name; });
        setSpeciesMap(spMap);

        const usrMap = {};
        (fetchedUsers || []).forEach(u => { usrMap[u.id] = u.username; });
        setUsersMap(usrMap);

      } catch (err) {
        console.error("Fetch failed", err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          alert('Access denied.');
          router.push('/login');
        } else {
          setError('Failed to load admin data.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleExport = async () => {
    try {
      await observationService.exportCSV();
      alert('CSV download started.');
    } catch {
      alert('CSV export failed.');
    }
  };

  const handleAddOption = () => {
    if (optionInput.trim() !== '') {
      setOptions(prev => [...prev, optionInput.trim()]);
      setOptionInput('');
    }
  };

  const handleRemoveOption = (index) => {
    setOptions(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmitQuestion = async () => {
    if (!questionText.trim()) {
      alert("Please enter the question text.");
      return;
    }

    try {
      setQuestionSubmitting(true);
      
      // Prepare question data according to backend schema
      const questionData = {
        question_text: questionText.trim(),
        question_type: questionType,
        is_required: isRequired,
        section: section.trim() || null,
        order_index: orderIndex,
        depends_on: dependsOn.trim() || null, // Question text, not ID
        depends_on_value: dependsOnValue.trim() || null,
        options: (questionType === 'multiple_choice' || questionType === 'single_choice') && options.length > 0 ? options : null,
        details: null // Could be extended for additional metadata
      };

      const newQuestion = await questionService.createQuestion(questionData);
      
      // Update local questions list
      setQuestions(prev => [...prev, newQuestion]);

      alert("✅ Question added successfully!");
      
      // Reset form
      setQuestionText('');
      setQuestionType('text');
      setIsRequired(true);
      setSection('');
      setOrderIndex(0);
      setDependsOn('');
      setDependsOnValue('');
      setOptions([]);
    } catch (err) {
      console.error("❌ Failed to add question:", err);
      alert(`Failed to add question: ${err.response?.data?.detail || err.message}`);
    } finally {
      setQuestionSubmitting(false);
    }
  };

  const questionTypes = [
    { value: 'text', label: 'Text Input' },
    { value: 'number', label: 'Number Input' },
    { value: 'single_choice', label: 'Single Choice' },
    { value: 'multiple_choice', label: 'Multiple Choice' },
    { value: 'boolean', label: 'Yes/No' },
    { value: 'date', label: 'Date' },
    { value: 'textarea', label: 'Long Text' }
  ];

  return (
    <>
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto bg-green-50 min-h-screen">
        <h2 className="text-3xl font-bold !text-black mb-6">Admin Dashboard</h2>

        <button
          onClick={handleExport}
          className="mb-6 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg shadow"
        >
          Export CSV
        </button>

        <div className="bg-white p-6 mb-8 rounded-xl shadow border border-green-200">
          <h3 className="text-xl font-semibold mb-4 !text-black">Add New Question</h3>

          {/* Question Text */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Question Text *</label>
            <input
              type="text"
              placeholder="Enter your question"
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>

          {/* Question Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Question Type *</label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value)}
              className="w-full p-2 border rounded-md"
            >
              {questionTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Section */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Section (Optional)</label>
            <input
              type="text"
              placeholder="e.g., 'Basic Info', 'Location Details'"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          </div>

          {/* Order Index */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Display Order</label>
            <input
              type="number"
              min="0"
              value={orderIndex}
              onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
              className="w-full p-2 border rounded-md"
            />
          </div>

          {/* Dependencies */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Depends On Question (Optional)</label>
              <input
                type="text"
                placeholder="Enter exact question text"
                value={dependsOn}
                onChange={(e) => setDependsOn(e.target.value)}
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Required Answer Value</label>
              <input
                type="text"
                placeholder="Answer that triggers this question"
                value={dependsOnValue}
                onChange={(e) => setDependsOnValue(e.target.value)}
                className="w-full p-2 border rounded-md"
                disabled={!dependsOn.trim()}
              />
            </div>
          </div>

          {/* Required Checkbox */}
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={() => setIsRequired(!isRequired)}
              className="mr-2"
            />
            <label className="text-sm">Required Question</label>
          </div>

          {/* Options (for choice questions) */}
          {(questionType === 'single_choice' || questionType === 'multiple_choice') && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Options</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Add option"
                  value={optionInput}
                  onChange={(e) => setOptionInput(e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                />
                <button
                  onClick={handleAddOption}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  Add Option
                </button>
              </div>
              {options.length > 0 && (
                <div className="space-y-1">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{opt}</span>
                      <button
                        onClick={() => handleRemoveOption(idx)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleSubmitQuestion}
            disabled={questionSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
          >
            {questionSubmitting ? 'Submitting...' : 'Submit Question'}
          </button>
        </div>

        {/* Existing Questions List */}
        {questions.length > 0 && (
          <div className="bg-white p-6 mb-8 rounded-xl shadow border border-green-200">
            <h3 className="text-xl font-semibold mb-4 !text-black">Existing Questions</h3>
            <div className="space-y-3">
              {questions.map((q, idx) => (
                <div key={q.id} className="border-l-4 border-green-500 pl-4 py-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{q.question_text}</p>
                      <div className="text-sm text-gray-600 space-x-4">
                        <span>Type: {q.question_type}</span>
                        <span>Order: {q.order_index}</span>
                        {q.section && <span>Section: {q.section}</span>}
                        <span>{q.is_required ? 'Required' : 'Optional'}</span>
                      </div>
                      {q.depends_on && (
                        <p className="text-xs text-blue-600 mt-1">
                          Depends on: "{q.depends_on}" = "{q.depends_on_value}"
                        </p>
                      )}
                      {q.options && (
                        <p className="text-xs text-gray-500 mt-1">
                          Options: {(() => {
                            try {
                              const parsedOptions = JSON.parse(q.options);
                              return Array.isArray(parsedOptions) ? parsedOptions.join(', ') : 'Invalid options format';
                            } catch (e) {
                              return 'Invalid JSON in options';
                            }
                          })()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Species Logs */}
        {loading ? (
          <p className="text-gray-700 text-lg">Loading...</p>
        ) : error ? (
          <p className="text-red-600 text-lg">{error}</p>
        ) : logs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {logs.map(log => (
              <div
                key={log.id}
                className="bg-white p-5 rounded-xl shadow hover:shadow-lg border border-green-100 transition-shadow"
              >
                <h3 className="text-xl font-bold !text-black mb-2">
                  {speciesMap[log.species_id] || 'Unknown Species'}
                </h3>
                <p className="text-sm text-gray-700"><strong>User:</strong> {usersMap[log.user_id] || 'Unknown'}</p>
                <p className="text-sm text-gray-700"><strong>Location:</strong> {log.location_name || 'N/A'}</p>
                <p className="text-sm text-gray-700">
                  <strong>Lat:</strong> {log.location_latitude ?? 'N/A'},
                  <strong> Lng:</strong> {log.location_longitude ?? 'N/A'}
                </p>
                <p className="text-sm text-gray-700"><strong>Notes:</strong> {log.notes || 'N/A'}</p>
                <p className="text-sm text-gray-700"><strong>Created At:</strong> {new Date(log.created_at).toLocaleString()}</p>
                <p className="text-sm text-gray-700"><strong>Verified:</strong> {log.verified ? '✅' : '❌'}</p>
                {Array.isArray(log.answers) && log.answers.length > 0 && (
                  <div className="mt-3 bg-green-100 p-3 rounded-md text-sm">
                    <h4 className="font-semibold mb-1 text-green-900">Answers:</h4>
                    {log.answers.map(a => (
                      <p key={a.id || `${log.id}-${a.question_id}`}>
                        <strong>{a.question_text || `Q${a.question_id}`}:</strong> {a.answer_text}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 text-lg">No species logs found.</p>
        )}
      </div>
    </>
  );
};

export default Admin;