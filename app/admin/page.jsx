"use client";

import React, { useEffect, useState } from 'react';
import { observationService, speciesService, userService } from '../api/service';
import Navbar from '../components/common/Navbar';
import { useRouter } from 'next/navigation'; // For redirection

const Admin = () => {
  const [logs, setLogs] = useState([]);
  const [speciesMap, setSpeciesMap] = useState({});
  const [usersMap, setUsersMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const checkAdminAccessAndFetchData = async () => {
      // First, check if a token exists and if the user is an admin
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You need to be logged in to access the admin dashboard.');
        router.push('/login'); // Redirect to login if no token
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch user profile to verify admin status on client side
        // You might have a dedicated /profile endpoint or check a decoded token
        // For simplicity, let's assume get_current_user in backend validates token and isAdmin.
        // If current_user check fails in backend, admin_required will raise 401/403.

        // The service methods already extract the relevant array from response.data
        const [fetchedLogs, fetchedSpeciesList, fetchedUsersList] = await Promise.all([
          observationService.getAllLogs(), // This now returns directly `species_logs` array
          speciesService.getSpecies(),     // This now returns directly `species` array
          userService.getAllUsers()        // This now returns directly `users` array
        ]);

        console.log("✅ Fetched Logs (Array):", fetchedLogs);
        console.log("✅ Fetched Species (Array):", fetchedSpeciesList);
        console.log("✅ Fetched Users (Array):", fetchedUsersList);

        setLogs(fetchedLogs || []); // Ensure it's an array

        const newSpeciesMap = {};
        (fetchedSpeciesList || []).forEach(s => { // Ensure it's iterable
          newSpeciesMap[s.id] = s.name;
        });
        setSpeciesMap(newSpeciesMap);

        const newUserMap = {};
        (fetchedUsersList || []).forEach(u => { // Ensure it's iterable
          newUserMap[u.id] = u.username;
        });
        setUsersMap(newUserMap);

      } catch (err) {
        console.error("❌ Failed to fetch admin data:", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          alert('Access Denied: You do not have administrator privileges or your session has expired.');
          router.push('/login'); // Redirect if unauthorized/forbidden
        } else {
          setError("Something went wrong while fetching data. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    checkAdminAccessAndFetchData();
  }, [router]); // Add router to dependency array if using router.push

  const handleExport = async () => {
    try {
      await observationService.exportCSV();
      // The service already handles the download, so just a confirmation message
      alert('✅ CSV export initiated. Check your downloads!');
    } catch (error) {
      console.error("❌ Failed to export CSV:", error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this log?')) return;
    try {
      await observationService.deleteLog(id);
      setLogs(prevLogs => prevLogs.filter(log => log.id !== id));
      alert('✅ Log deleted successfully!');
    } catch (err) {
      console.error("❌ Failed to delete log:", err);
      alert('Failed to delete log.');
    }
  };

  const handleVerifyToggle = async (id, currentStatus) => {
    try {
      // observationService.updateLog now directly returns the updated species_log object
      const updatedLog = await observationService.updateLog(id, { verified: !currentStatus });

      if (updatedLog) {
        setLogs(prevLogs =>
          prevLogs.map(log => (log.id === id ? updatedLog : log))
        );
        alert('✅ Verification status updated!');
      } else {
        throw new Error("Invalid response for updateLog - updated log not found.");
      }
    } catch (err) {
      console.error("❌ Failed to update verification status:", err);
      alert('Failed to update verification status.');
    }
  };

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

        {loading ? (
          <p className="text-gray-700 text-lg">Loading data...</p>
        ) : error ? (
          <p className="text-red-600 text-lg">{error}</p>
        ) : logs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {logs.map(log => (
              <div
                key={log.id}
                className="bg-white p-5 rounded-xl shadow hover:shadow-lg border border-green-100 transition-shadow"
              >
                <h3 className="text-xl font-bold !text-black mb-1">
                  {speciesMap[log.species_id] || 'Unknown Species'}
                </h3>
                <p className="text-sm text-gray-700"><strong>User:</strong> {usersMap[log.user_id] || 'Unknown User'}</p>
                <p className="text-sm text-gray-700"><strong>Location:</strong> {log.location_name || 'N/A'}</p>
                <p className="text-sm text-gray-700">
                  <strong>Lat:</strong> {log.location_latitude !== null ? log.location_latitude : 'N/A'},
                  <strong> Lng:</strong> {log.location_longitude !== null ? log.location_longitude : 'N/A'}
                </p>
                <p className="text-sm text-gray-700"><strong>Notes:</strong> {log.notes || 'N/A'}</p>
                <p className="text-sm text-gray-700"><strong>Created At:</strong> {new Date(log.created_at).toLocaleString()}</p>
                <p className="text-sm text-gray-700"><strong>Verified:</strong> {log.verified ? '✅ Yes' : '❌ No'}</p>

                {log.answers && Array.isArray(log.answers) && log.answers.length > 0 && (
                  <div className="mt-3 bg-green-100 p-3 rounded-md text-sm">
                    <h4 className="font-semibold mb-1 text-green-900">Answers:</h4>
                    {log.answers.map(answer => (
                      // Ensure answer.id is unique, otherwise use index only as last resort
                      <p key={answer.id || `${log.id}-${answer.question_id}`}>
                        <strong>{answer.question?.question_text || `Question ${answer.question_id}`}:</strong> {answer.answer_text}
                      </p>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => handleDelete(log.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-md"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => handleVerifyToggle(log.id, log.verified)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-1 rounded-md"
                  >
                    {log.verified ? 'Unverify' : 'Verify'}
                  </button>
                </div>
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