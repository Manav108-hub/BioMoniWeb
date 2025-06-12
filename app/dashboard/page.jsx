"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import AnswerInput from '../components/forms/AnswerInput';
import PhotoPicker from '../components/forms/PhotoPicker';
import { speciesService, observationService, questionService } from '../api/service';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Navbar from '../components/common/Navbar';

const Dashboard = () => {
  const { user } = useAuth();
  const [speciesList, setSpeciesList] = useState([]);
  const [questionList, setQuestionList] = useState([]);
  const [speciesId, setSpeciesId] = useState('');
  const [newSpecies, setNewSpecies] = useState({
    name: '',
    scientific_name: '',
    category: '',
    description: ''
  });
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [answers, setAnswers] = useState({});
  const [photo, setPhoto] = useState(null);
  const [isSubmittingSpecies, setIsSubmittingSpecies] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      const speciesData = await speciesService.getSpecies();
      const questionData = await questionService.getQuestions();
      setSpeciesList(speciesData);
      setQuestionList(questionData);
    };

    if (user) {
      loadOptions();
    }
  }, [user]);

  const handleAnswerChange = (questionId, text) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: text
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await observationService.submitObservation({
        species_id: speciesId,
        location_name: locationName,
        latitude,
        longitude,
        answers: Object.entries(answers).map(([qId, ans]) => ({
          question_id: parseInt(qId),
          answer_text: ans
        }))
      }, photo);

      alert('Observation submitted!');
    } catch (error) {
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
    } catch (err) {
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
          </div>

          <div>
            <h3 className="text-xl font-semibold mb-4 !text-black">Or Add New Species</h3>
            <div className="space-y-4">
              <Input label="Name" value={newSpecies.name} onChange={(val) => setNewSpecies({ ...newSpecies, name: val })} />
              <Input label="Scientific Name" value={newSpecies.scientific_name} onChange={(val) => setNewSpecies({ ...newSpecies, scientific_name: val })} />
              <Input label="Category" value={newSpecies.category} onChange={(val) => setNewSpecies({ ...newSpecies, category: val })} />
              <Input label="Description" value={newSpecies.description} onChange={(val) => setNewSpecies({ ...newSpecies, description: val })} />
              <Button title={isSubmittingSpecies ? "Submitting..." : "Add Species"} onClick={handleNewSpeciesSubmit} disabled={isSubmittingSpecies} />
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

          <div className="space-y-6">
            {questionList.map(q => (
              <AnswerInput
                key={q.id}
                question={q}
                value={answers[q.id] || ''}
                onChange={handleAnswerChange}
              />
            ))}
          </div>

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