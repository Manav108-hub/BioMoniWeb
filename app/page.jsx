"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '../app/components/common/Navbar';
import AboutCard from '../app/components/cards/AboutCard';
import QuestionList from '../app/components/cards/QuestionList';
import { useAuth } from '../app/context/AuthContext';
import { questionService } from '../app/api/service';

const HomePage = () => {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const data = await questionService.getQuestions();
        setQuestions(data.questions || []);
      } catch (error) {
        console.error('Failed to load questions:', error);
      }
    };

    loadQuestions();
  }, []);

  return (
    <>
      <Navbar />
      <div className="py-12 bg-white min-h-screen">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <section className="mb-10">
            <AboutCard customClass="bg-green-50" />
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold mb-4 !text-black">Latest Questions</h2>
            <QuestionList questions={questions} />
          </section>

          {!user && (
            <section className="bg-white shadow-lg rounded-lg p-6 border border-gray-200">
              <h3 className="text-xl font-semibold !text-black mb-2">Get Started</h3>
              <p className="text-gray-700 mb-4">
                Create an account or log in to start submitting biodiversity observations.
              </p>
              <div className="flex gap-4">
                <Link
                  href="/login"
                  className="btn btn-primary"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="btn btn-secondary"
                >
                  Sign Up
                </Link>
              </div>
            </section>
          )}

          {user && (
            <section className="bg-green-50 border-l-4 border-green-500 p-6 rounded-md mt-6 shadow">
              <p className="text-green-700 text-lg">
                Welcome back, <strong>{user.username}</strong>! You can start submitting observations now.
              </p>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default HomePage;
