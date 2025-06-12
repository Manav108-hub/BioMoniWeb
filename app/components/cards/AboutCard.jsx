"use client";
import React from 'react';
import Link from 'next/link';

const AboutCard = () => {
  return (
    <div className="bg-green-100 rounded-lg shadow-md p-6 mb-8 border border-green-300">
      <h2 className="text-2xl font-bold mb-4 !text-black">About This Project</h2>

      <p className="mb-4 text-gray-800">
        This biodiversity tracking app focuses on assessing human-wildlife interactions, particularly human-elephant conflict in Wokha and Mokokchung districts of Nagaland.
      </p>

      <p className="mb-4 text-gray-800">
        The app collects structured data on:
      </p>

      <ul className="list-disc pl-5 space-y-2 mb-4 text-gray-700">
        <li>Socio-economic background of respondents</li>
        <li>Human-elephant conflict patterns</li>
        <li>General human-wildlife conflict</li>
        <li>Conservation awareness and participation</li>
      </ul>

      <p className="mb-4 text-gray-800">
        The system allows users to submit observations with photos, location data, and detailed answers to standardized questions.
      </p>

      <div className="mt-6">
        <Link
          href="/dashboard"
          className="inline-block bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors"
        >
          Start Observation
        </Link>
      </div>
    </div>
  );
};

export default AboutCard;
