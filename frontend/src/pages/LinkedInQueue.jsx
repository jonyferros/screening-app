import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Not contacted', color: 'bg-slate-100 text-slate-600' },
  { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-700' },
  { value: 'interested', label: 'Interested', color: 'bg-green-100 text-green-700' },
  { value: 'not_interested', label: 'Not Interested', color: 'bg-red-100 text-red-700' },
  { value: 'no_response', label: 'No Response', color: 'bg-amber-100 text-amber-700' }
];

function LinkedInQueue() {
  const { token } = useParams();
  const [queue, setQueue] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, [token]);

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/linkedin-queue/${token}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load queue');
      }

      setQueue(data.queue);
      setCandidates(data.candidates);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (assignmentId, newStatus) => {
    setUpdating(assignmentId);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/linkedin-queue/${token}/candidates/${assignmentId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }
      );

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setCandidates(prev =>
        prev.map(c =>
          c.assignment_id === assignmentId
            ? { ...c, assignment_status: newStatus }
            : c
        )
      );
    } catch (err) {
      alert('Failed to update: ' + err.message);
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 max-w-md text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-800 mb-2">Unable to Load Queue</h1>
          <p className="text-slate-500">{error}</p>
        </div>
      </div>
    );
  }

  const completedCount = candidates.filter(c =>
    ['interested', 'not_interested', 'no_response'].includes(c.assignment_status)
  ).length;

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="18" fill="#001463" />
              <polygon points="18,8 22,14 30,14 24,19 26,27 18,23 10,27 12,19 6,14 14,14" fill="white" />
            </svg>
            <span className="text-lg font-bold text-slate-800">starcircle</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">LinkedIn Outreach Queue</h1>
          <p className="text-slate-500 mt-1">
            {queue.jobTitle} at {queue.companyName}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            Assigned to: {queue.name}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Progress</span>
            <span className="text-sm text-slate-500">{completedCount} / {candidates.length} completed</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${(completedCount / candidates.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Candidates */}
      <div className="max-w-4xl mx-auto px-6 pb-10">
        <div className="space-y-3">
          {candidates.map((candidate, index) => {
            const currentStatus = STATUS_OPTIONS.find(s => s.value === candidate.assignment_status) || STATUS_OPTIONS[0];

            return (
              <div
                key={candidate.assignment_id}
                className="bg-white border border-slate-200 rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-medium text-slate-400">#{index + 1}</span>
                      <h3 className="font-semibold text-slate-800">
                        {candidate.first_name} {candidate.last_name}
                      </h3>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${currentStatus.color}`}>
                        {currentStatus.label}
                      </span>
                    </div>

                    {(candidate.current_job_title || candidate.current_employer) && (
                      <p className="text-sm text-slate-600 mb-2">
                        {candidate.current_job_title}
                        {candidate.current_job_title && candidate.current_employer && ' at '}
                        {candidate.current_employer}
                      </p>
                    )}

                    {candidate.country && (
                      <p className="text-xs text-slate-400">{candidate.country}</p>
                    )}

                    {candidate.linkedin_url && (
                      <a
                        href={candidate.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        Open LinkedIn Profile
                      </a>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => updateStatus(candidate.assignment_id, 'contacted')}
                      disabled={updating === candidate.assignment_id}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        candidate.assignment_status === 'contacted'
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Contacted
                    </button>
                    <button
                      onClick={() => updateStatus(candidate.assignment_id, 'interested')}
                      disabled={updating === candidate.assignment_id}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        candidate.assignment_status === 'interested'
                          ? 'bg-green-100 border-green-300 text-green-700'
                          : 'border-green-200 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      Interested
                    </button>
                    <button
                      onClick={() => updateStatus(candidate.assignment_id, 'not_interested')}
                      disabled={updating === candidate.assignment_id}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        candidate.assignment_status === 'not_interested'
                          ? 'bg-red-100 border-red-300 text-red-700'
                          : 'border-red-200 text-red-600 hover:bg-red-50'
                      }`}
                    >
                      Not Interested
                    </button>
                    <button
                      onClick={() => updateStatus(candidate.assignment_id, 'no_response')}
                      disabled={updating === candidate.assignment_id}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        candidate.assignment_status === 'no_response'
                          ? 'bg-amber-100 border-amber-300 text-amber-700'
                          : 'border-amber-200 text-amber-600 hover:bg-amber-50'
                      }`}
                    >
                      No Response
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {candidates.length === 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-slate-400">No candidates assigned to this queue.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default LinkedInQueue;
