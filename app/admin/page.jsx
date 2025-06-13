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

  // For adding a new question
  const [questionText, setQuestionText] = useState('');
  const [isRequired, setIsRequired] = useState(false);
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

  const handleSubmitQuestion = async () => {
    if (!questionText.trim()) {
      alert("Please enter the question text.");
      return;
    }

    try {
      setQuestionSubmitting(true);
      await questionService.addQuestion({
        question_text: questionText.trim(),
        is_required: isRequired,
        options: options.length > 0 ? options : null,
      });

      alert("✅ Question added successfully!");
      setQuestionText('');
      setIsRequired(false);
      setOptions([]);
    } catch (err) {
      console.error("❌ Failed to add question:", err);
      alert("Failed to add question. Please try again.");
    } finally {
      setQuestionSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <div className="p-6 max-w-7xl mx-auto bg-green-50 min-h-screen">
        <h2 className="text-3xl font-bold text-green-900 mb-6">Admin Dashboard</h2>

        <button
          onClick={handleExport}
          className="mb-6 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg shadow"
        >
          Export CSV
        </button>

        <div className="bg-white p-6 mb-8 rounded-xl shadow border border-green-200">
          <h3 className="text-xl font-semibold mb-4">Add New Question</h3>

          <input
            type="text"
            placeholder="Question text"
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full mb-3 p-2 border rounded-md"
          />

          <div className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={isRequired}
              onChange={() => setIsRequired(!isRequired)}
              className="mr-2"
            />
            <label className="text-sm">Required</label>
          </div>

          <div className="mb-3">
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Add option"
                value={optionInput}
                onChange={(e) => setOptionInput(e.target.value)}
                className="flex-1 p-2 border rounded-md"
              />
              <button
                onClick={handleAddOption}
                className="bg-blue-600 text-white px-4 py-2 rounded-md"
              >
                Add Option
              </button>
            </div>
            {options.length > 0 && (
              <ul className="list-disc list-inside text-sm text-gray-700">
                {options.map((opt, idx) => (
                  <li key={idx}>{opt}</li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={handleSubmitQuestion}
            disabled={questionSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg"
          >
            {questionSubmitting ? 'Submitting...' : 'Submit Question'}
          </button>
        </div>

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
                <h3 className="text-xl font-bold text-green-800 mb-2">
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
