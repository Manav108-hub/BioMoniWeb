"use client";

import React, { useEffect, useState } from 'react';
import LogCard from '../components/cards/LogCard';
import { observationService } from '../api/service';
import Navbar from '../components/common/Navbar';

const History = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const data = await observationService.getUserLogs();
      setLogs(data);
    };

    fetchHistory();
  }, []);

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-7xl mx-auto bg-green-50 min-h-screen">
        <h2 className="text-3xl font-bold !text-black mb-6">Your Observation History</h2>
        {logs.length === 0 ? (
          <p className="text-gray-600 text-lg">No observations yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {logs.map(log => (
              <LogCard key={log.id} log={log} />
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default History;
