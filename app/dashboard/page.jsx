"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AnswerInput from '../components/forms/AnswerInput';
import PhotoPicker from '../components/forms/PhotoPicker';
import {
  speciesService,
  observationService,
  questionService,
  mapService
} from '../api/service';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Navbar from '../components/common/Navbar';

const Dashboard = () => {
  const { user } = useAuth();

  const [speciesList, setSpeciesList] = useState([]);
  const [questionList, setQuestionList] = useState([]);
  const [speciesId, setSpeciesId] = useState('');
  const [newSpecies, setNewSpecies] = useState({
    local_name: '',
    scientific_name: '',
    sighting_time: '',
    habitat_type: ''
  });
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [answers, setAnswers] = useState({});
  const [photo, setPhoto] = useState(null);
  const [isSubmittingSpecies, setIsSubmittingSpecies] = useState(false);
  const [speciesImageMap, setSpeciesImageMap] = useState({});

  useEffect(() => {
    const loadOptions = async () => {
      const [speciesData, questionData, speciesImages] = await Promise.all([
        speciesService.getSpecies(),
        questionService.getQuestions(),
        mapService.getSpeciesImages()
      ]);

      // Map species_id → image URL
      const imageMap = {};
      for (const img of speciesImages) {
        if (img.species_id && img.photo_path) {
          imageMap[img.species_id] = img.photo_path;
        }
      }

      setSpeciesList(speciesData);
      setQuestionList(questionData);
      setSpeciesImageMap(imageMap);
    };

    if (user) loadOptions();
  }, [user]);

  const handleAnswerChange = (questionId, text) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: text
    }));
  };

  const SPECIAL_NOT_EMPTY_TOKEN = '*';


  // Fixed function to check if a question should be displayed based on dependencies
  const shouldShowQuestion = (question) => {
    // If no dependency, always show
    if (!question.depends_on || !question.depends_on_value) {
      return true;
    }

    // Find the parent question by ID or question_text
    let parentQuestion;

    // Try to find by depends_on as ID first
    if (typeof question.depends_on === 'number') {
      parentQuestion = questionList.find(q => q.id === question.depends_on);
    } else {
      // Fallback: find by question_text (exact match)
      parentQuestion = questionList.find(q =>
        q.question_text.trim().toLowerCase() === question.depends_on.trim().toLowerCase()
      );
    }

    if (!parentQuestion) {
      console.log(`Parent question not found for: ${question.question_text}`);
      return true; // Show if parent not found
    }

    // Get the answer for the parent question
    const parentAnswer = answers[parentQuestion.id];

    // If no answer yet, don't show dependent question
    if (!parentAnswer) {
      return false;
    }

    // Check if parent answer matches the required value
    if (Array.isArray(question.depends_on_value)) {
      return question.depends_on_value.includes(parentAnswer);
    }

    // For string comparison, normalize both values
    const normalizedParentAnswer = String(parentAnswer).trim().toLowerCase();
    const normalizedRequiredValue = String(question.depends_on_value).trim().toLowerCase();

    if (normalizedRequiredValue === SPECIAL_NOT_EMPTY_TOKEN) {
      return normalizedParentAnswer !== '';
    }
    return normalizedParentAnswer === normalizedRequiredValue;



  };

  // Get filtered questions that should be displayed
  const getVisibleQuestions = () => {
    return questionList
      .filter(shouldShowQuestion)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  };

  // Group questions by section for better organization
  const getQuestionsBySection = () => {
    const visibleQuestions = getVisibleQuestions();
    const sections = {};

    visibleQuestions.forEach((question, index) => {
      const section = question.section || 'General';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push({
        ...question,
        questionNumber: index + 1
      });
    });

    return sections;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await observationService.submitObservation({
        species_id: speciesId,
        location_name: locationName,
        location_latitude: latitude ? parseFloat(latitude) : null,
        location_longitude: longitude ? parseFloat(longitude) : null,
        answers: Object.entries(answers).map(([qId, ans]) => ({
          question_id: parseInt(qId),
          answer_text: ans
        }))
      }, photo);

      alert('Observation submitted!');

      // Reset form after successful submission
      setAnswers({});
      setSpeciesId('');
      setLocationName('');
      setLatitude('');
      setLongitude('');
      setPhoto(null);

    } catch (error) {
      console.error('Submission error:', error);
      alert('Submission failed');
    }
  };

  const handleNewSpeciesSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingSpecies(true);
    try {
      const species = await speciesService.addSpecies(newSpecies);
      setSpeciesList(prev => [...prev, species]);
      setSpeciesId(species.id);
      alert('Species added successfully!');

      // Reset new species form
      setNewSpecies({
        local_name: '',
        scientific_name: '',
        sighting_time: '',
        habitat_type: ''
      });

    } catch (err) {
      console.error('Species submission error:', err);
      alert('Failed to add species');
    } finally {
      setIsSubmittingSpecies(false);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(position.coords.latitude.toString());
        setLongitude(position.coords.longitude.toString());
      },
      (error) => {
        alert("Error getting location: " + error.message);
      }
    );
  };

  const questionsBySection = getQuestionsBySection();

  // Debug: Log current answers and visible questions
  useEffect(() => {
    console.log('Current answers:', answers);
    console.log('Visible questions:', getVisibleQuestions().map(q => q.question_text));
  }, [answers, questionList]);

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-4xl mx-auto bg-green-50 rounded-lg shadow-lg my-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <h2 className="text-3xl font-bold mb-6 !text-black">Add Observation</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium !text-black mb-2">Select Existing Species</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              value={speciesId}
              onChange={(e) => setSpeciesId(parseInt(e.target.value))}
            >
              <option value="">Select</option>
              {speciesList.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {speciesId && speciesImageMap[speciesId] && (
              <div className="mt-4">
                <h4 className="text-sm font-medium !text-black mb-1">Species Image</h4>
                <img
                  src={speciesImageMap[speciesId]}
                  alt="Species"
                  className="w-40 h-auto rounded border"
                />
              </div>
            )}
          </div>

          <div>
            <div>
              <h3 className="text-xl font-semibold mb-4 !text-black">Or Add New Species</h3>
              <div className="space-y-4">
                <Input
                  label="Local Name"
                  value={newSpecies.local_name}
                  onChange={(val) => setNewSpecies({ ...newSpecies, local_name: val })}
                />
                <Input
                  label="Scientific Name"
                  value={newSpecies.scientific_name}
                  onChange={(val) => setNewSpecies({ ...newSpecies, scientific_name: val })}
                />
                <Input
                  label="When have you seen it? (date/month/year or how long ago)"
                  placeholder="e.g., 15/06/2023 or 2 months ago"
                  value={newSpecies.sighting_time}
                  onChange={(val) => setNewSpecies({ ...newSpecies, sighting_time: val })}
                />
                <Input
                  label="Habitat Type (if any)"
                  placeholder="e.g., Forest, Wetland, Urban garden"
                  value={newSpecies.habitat_type}
                  onChange={(val) => setNewSpecies({ ...newSpecies, habitat_type: val })}
                />
                <Button
                  title={isSubmittingSpecies ? "Submitting..." : "Add Species"}
                  onClick={handleNewSpeciesSubmit}
                  disabled={isSubmittingSpecies}
                />
              </div>
            </div>
          </div>

          <hr className="border-t border-gray-300" />

          <div className="space-y-4">
            <Input label="Location Name" value={locationName} onChange={setLocationName} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Latitude" value={latitude} onChange={setLatitude} />
              <Input label="Longitude" value={longitude} onChange={setLongitude} />
            </div>
            <Button title="Get Current Location" onClick={handleGetLocation} />
          </div>

          {/* Render questions by section with conditional logic */}
          {Object.entries(questionsBySection).map(([sectionName, questions]) => (
            <div key={sectionName} className="space-y-6">
              <h3 className="text-xl font-semibold !text-black border-b pb-2">
                {sectionName}
              </h3>
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id || question.order_index}>
                    <AnswerInput
                      question={question}
                      value={answers[question.id] || ''}
                      onChange={handleAnswerChange}
                    />

                    {/* Show additional details or examples if available */}
                    {question.details?.examples && (
                      <p className="text-sm text-gray-600 mt-1">
                        Examples: {question.details.examples}
                      </p>
                    )}

                    {question.details?.note && (
                      <p className="text-sm text-blue-600 mt-1">
                        Note: {question.details.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mt-6">
            <PhotoPicker onPhotoSelect={setPhoto} />
          </div>

          <Button title="Submit Observation" className="mt-4" />
        </form>
      </div>
    </>
  );
};

export default Dashboard;