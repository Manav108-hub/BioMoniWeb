"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { observationService, speciesService, userService, questionService } from '../api/service';
import Navbar from '../components/common/Navbar';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Constants
const QUESTION_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'number', label: 'Number Input' },
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'boolean', label: 'Yes/No' },
  { value: 'date', label: 'Date' },
  { value: 'textarea', label: 'Long Text' }
];

const INITIAL_QUESTION_STATE = {
  id: null,
  questionText: '',
  questionType: 'text',
  isRequired: true,
  section: '',
  orderIndex: 0,
  dependsOn: '',
  dependsOnValue: '',
  optionInput: '',
  options: []
};

const Admin = () => {
  const router = useRouter();
  const [state, setState] = useState({
    logs: [],
    speciesMap: {},
    usersMap: {},
    questions: [],
    loading: true,
    error: null
  });

  const [questionForm, setQuestionForm] = useState(INITIAL_QUESTION_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check authentication helper
  const checkAuth = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return false;
    }
    return true;
  }, [router]);

  // Fetch all data
  const fetchData = useCallback(async (signal) => {
  if (!checkAuth()) return;

  try {
    setState(prev => ({ ...prev, loading: true, error: null }));

    const [logs, species, users, questions] = await Promise.all([
      observationService.getAllLogs({ signal }),
      speciesService.getSpecies({ signal }),
      userService.getAllUsers({ signal }),
      questionService.getQuestions({ signal })
    ]);

    if (signal.aborted) return;

    const speciesMap = (species || []).reduce((acc, s) => ({
      ...acc,
      [s.id]: s.name
    }), {});

    const usersMap = (users || []).reduce((acc, u) => ({
      ...acc,
      [u.id]: u.username
    }), {});

    setState({
      logs: logs || [],
      speciesMap,
      usersMap,
      questions: questions || [],
      loading: false,
      error: null
    });

  } catch (err) {
    if (err.name === 'AbortError') return; // Prevent setting state if aborted

    console.error("Fetch failed", err);
    const errorMessage = err.response?.status === 401 || err.response?.status === 403
      ? 'Access denied. Redirecting to login...'
      : 'Failed to load admin data.';

    setState(prev => ({ ...prev, loading: false, error: errorMessage }));
    toast.error(errorMessage);

    if (err.response?.status === 401 || err.response?.status === 403) {
      setTimeout(() => router.push('/login'), 2000);
    }
  }
}, [router, checkAuth]);


  useEffect(() => {
  const abortController = new AbortController();
  fetchData(abortController.signal);
  return () => abortController.abort();
}, [fetchData]);


  // Question form handlers
  const handleFormChange = (field, value) => {
    setQuestionForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAddOption = () => {
    if (questionForm.optionInput.trim()) {
      setQuestionForm(prev => ({
        ...prev,
        options: [...prev.options, prev.optionInput.trim()],
        optionInput: ''
      }));
    }
  };

  const handleRemoveOption = (index) => {
    setQuestionForm(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setQuestionForm(INITIAL_QUESTION_STATE);
  };

  // Question CRUD operations
  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    
    if (!questionForm.questionText.trim()) {
      toast.error('Please enter the question text');
      return;
    }

    // Validate choice questions have options
    if ((questionForm.questionType === 'single_choice' || questionForm.questionType === 'multiple_choice') 
        && questionForm.options.length === 0) {
      toast.error('Please add at least one option for choice questions');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const questionData = {
        question_text: questionForm.questionText.trim(),
        question_type: questionForm.questionType,
        is_required: questionForm.isRequired,
        section: questionForm.section.trim() || null,
        order_index: questionForm.orderIndex,
        depends_on: questionForm.dependsOn.trim() || null,
        depends_on_value: questionForm.dependsOnValue.trim() || null,
        options: (questionForm.questionType === 'multiple_choice' || 
                 questionForm.questionType === 'single_choice') && 
                 questionForm.options.length > 0 ? questionForm.options : null,
        details: null
      };

      let updatedQuestions;
      if (questionForm.id) {
        // Update existing question
        const updatedQuestion = await questionService.updateQuestion(questionForm.id, questionData);
        updatedQuestions = state.questions.map(q => 
          q.id === questionForm.id ? updatedQuestion : q
        );
        toast.success('Question updated successfully');
      } else {
        // Create new question
        const newQuestion = await questionService.createQuestion(questionData);
        updatedQuestions = [...state.questions, newQuestion];
        toast.success('Question added successfully');
      }

      setState(prev => ({ ...prev, questions: updatedQuestions }));
      resetForm();

    } catch (err) {
      console.error("Operation failed:", err);
      const errorMsg = err.response?.data?.message || `Failed to ${questionForm.id ? 'update' : 'add'} question`;
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditQuestion = (question) => {
    setQuestionForm({
      id: question.id,
      questionText: question.question_text,
      questionType: question.question_type,
      isRequired: question.is_required,
      section: question.section || '',
      orderIndex: question.order_index,
      dependsOn: question.depends_on || '',
      dependsOnValue: question.depends_on_value || '',
      optionInput: '',
      options: question.options ? (
        typeof question.options === 'string' 
          ? JSON.parse(question.options) 
          : question.options
      ) : []
    });
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;

    try {
      await questionService.deleteQuestion(questionId);
      setState(prev => ({
        ...prev,
        questions: prev.questions.filter(q => q.id !== questionId)
      }));
      toast.success('Question deleted successfully');
    } catch (err) {
      console.error("Delete failed", err);
      const errorMsg = err.response?.data?.message || 'Failed to delete question';
      toast.error(errorMsg);
    }
  };

  // Export handler
  const handleExport = async () => {
    try {
      await observationService.exportCSV();
      toast.success('CSV export started');
    } catch (err) {
      console.error("Export failed", err);
      const errorMsg = err.response?.data?.message || 'CSV export failed';
      toast.error(errorMsg);
    }
  };

  // Safe options parsing helper
  const parseOptions = (options) => {
    if (!options) return '';
    try {
      const parsedOptions = typeof options === 'string' ? JSON.parse(options) : options;
      return Array.isArray(parsedOptions) ? parsedOptions.join(', ') : 'Invalid format';
    } catch {
      return 'Invalid options';
    }
  };

  // Loading and error states
  if (state.loading) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-lg">Loading admin data...</p>
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p className="text-xl">{state.error}</p>
          <button 
            onClick={fetchData}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto bg-green-50 min-h-screen">
        <h2 className="text-3xl font-bold !!text-gray-800 mb-6">Admin Dashboard</h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Question Form */}
            <div className="bg-white p-6 rounded-xl shadow border border-green-200">
              <h3 className="text-xl font-semibold mb-4 !text-gray-800">
                {questionForm.id ? 'Edit Question' : 'Add New Question'}
              </h3>
              
              <form onSubmit={handleSubmitQuestion}>
                {/* Question Text */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Question Text *</label>
                  <input
                    type="text"
                    placeholder="Enter your question"
                    value={questionForm.questionText}
                    onChange={(e) => handleFormChange('questionText', e.target.value)}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                {/* Question Type */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Question Type *</label>
                  <select
                    value={questionForm.questionType}
                    onChange={(e) => handleFormChange('questionType', e.target.value)}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {QUESTION_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Section (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., 'Basic Info', 'Location Details'"
                    value={questionForm.section}
                    onChange={(e) => handleFormChange('section', e.target.value)}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Order Index */}
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Display Order</label>
                  <input
                    type="number"
                    min="0"
                    value={questionForm.orderIndex}
                    onChange={(e) => handleFormChange('orderIndex', parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Dependencies */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Depends On Question (Optional)</label>
                    <input
                      type="text"
                      placeholder="Enter exact question text"
                      value={questionForm.dependsOn}
                      onChange={(e) => handleFormChange('dependsOn', e.target.value)}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Required Answer Value</label>
                    <input
                      type="text"
                      placeholder="Answer that triggers this question"
                      value={questionForm.dependsOnValue}
                      onChange={(e) => handleFormChange('dependsOnValue', e.target.value)}
                      className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      disabled={!questionForm.dependsOn.trim()}
                    />
                  </div>
                </div>

                {/* Required Checkbox */}
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    checked={questionForm.isRequired}
                    onChange={() => handleFormChange('isRequired', !questionForm.isRequired)}
                    className="mr-2"
                    id="required-checkbox"
                  />
                  <label htmlFor="required-checkbox" className="text-sm">Required Question</label>
                </div>

                {/* Options (for choice questions) */}
                {(questionForm.questionType === 'single_choice' || questionForm.questionType === 'multiple_choice') && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Options *</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Add option"
                        value={questionForm.optionInput}
                        onChange={(e) => handleFormChange('optionInput', e.target.value)}
                        className="flex-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOption();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleAddOption}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    {questionForm.options.length > 0 && (
                      <div className="space-y-1">
                        {questionForm.options.map((opt, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="text-sm">{opt}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOption(idx)}
                              className="text-red-600 hover:text-red-800 text-sm transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {isSubmitting ? 'Processing...' : questionForm.id ? 'Update Question' : 'Add Question'}
                  </button>
                  {questionForm.id && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="bg-gray-300 hover:bg-gray-400 !text-gray-800 px-6 py-2 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Questions List */}
            <div className="bg-white p-6 rounded-xl shadow border border-green-200">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold !text-gray-800">Existing Questions ({state.questions.length})</h3>
                <button
                  onClick={handleExport}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow text-sm transition-colors"
                >
                  Export CSV
                </button>
              </div>
              
              {state.questions.length === 0 ? (
                <p className="text-gray-600">No questions found.</p>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {state.questions
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map(q => (
                    <div key={q.id} className="border-l-4 border-green-500 pl-4 py-2 bg-white rounded shadow-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium !text-gray-800">{q.question_text}</p>
                          <div className="text-sm text-gray-600 space-x-4 mt-1">
                            <span>Type: {q.question_type}</span>
                            <span>Order: {q.order_index || 0}</span>
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
                              Options: {parseOptions(q.options)}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-2">
                          <button 
                            onClick={() => handleEditQuestion(q)}
                            className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
                            aria-label={`Edit question: ${q.question_text}`}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteQuestion(q.id)}
                            className="text-red-600 hover:text-red-800 text-sm transition-colors"
                            aria-label={`Delete question: ${q.question_text}`}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Species Logs */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-xl shadow border border-green-200 sticky top-6">
              <h3 className="text-xl font-semibold mb-4 !text-gray-800">Recent Observations ({state.logs.length})</h3>
              
              {state.logs.length === 0 ? (
                <p className="text-gray-600">No observations found.</p>
              ) : (
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {state.logs.map(log => (
                    <div key={log.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <h4 className="font-bold !text-gray-800">
                        {state.speciesMap[log.species_id] || 'Unknown Species'}
                      </h4>
                      <p className="text-sm text-gray-600 mt-1">
                        <strong>User:</strong> {state.usersMap[log.user_id] || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Location:</strong> {log.location_name || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Coordinates:</strong> {log.location_latitude ?? 'N/A'}, {log.location_longitude ?? 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <strong>Date:</strong> {new Date(log.created_at).toLocaleString()}
                      </p>
                      {log.answers && log.answers.length > 0 && (
                        <div className="mt-2 bg-green-50 p-2 rounded text-sm">
                          <h5 className="font-semibold text-green-800">Answers:</h5>
                          {log.answers.map(a => (
                            <p key={a.id} className="truncate">
                              <span className="font-medium">{a.question_text || `Q${a.question_id}`}:</span> {a.answer_text}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Admin;