import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const STATUS_COLORS = {
  active: 'bg-blue-100 text-blue-700',
  interested: 'bg-green-100 text-green-700',
  not_interested: 'bg-slate-100 text-slate-600',
  responded: 'bg-purple-100 text-purple-700',
  unsubscribed: 'bg-red-100 text-red-600',
  gdpr_anonymized: 'bg-gray-100 text-gray-500',
  linkedin_only: 'bg-indigo-100 text-indigo-700'
};

const STATUS_LABELS = {
  active: 'Active',
  interested: 'Interested',
  not_interested: 'Not Interested',
  responded: 'Responded',
  unsubscribed: 'Unsubscribed',
  gdpr_anonymized: 'GDPR Anonymized',
  linkedin_only: 'LinkedIn Only'
};

function OutreachRoleDetail() {
  const { roleId } = useParams();
  const [role, setRole] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [linkedinQueues, setLinkedinQueues] = useState([]);
  const [showQueueForm, setShowQueueForm] = useState(false);
  const [freelancerName, setFreelancerName] = useState('');
  const [creatingQueue, setCreatingQueue] = useState(false);
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    fetchData();
  }, [roleId]);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

      const [roleRes, candidatesRes, analyticsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/roles/${roleId}`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/outreach/candidates/${roleId}`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/outreach/analytics/${roleId}`, { headers })
      ]);

      const roleData = await roleRes.json();
      const candidatesData = await candidatesRes.json();
      const analyticsData = await analyticsRes.json();

      setRole(roleData.role);
      setCandidates(candidatesData.candidates || []);
      setAnalytics(analyticsData);

      // Try to fetch linkedin queues (admin only, gracefully handle 403)
      try {
        const queuesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/linkedin-queue/${roleId}`, { headers });
        if (queuesRes.ok) {
          const queuesData = await queuesRes.json();
          setLinkedinQueues(queuesData.queues || []);
        }
      } catch {}
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const createLinkedinQueue = async (e) => {
    e.preventDefault();
    setCreatingQueue(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/linkedin-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ roleId, freelancerName })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setLinkedinQueues(prev => [{ ...data.queue, total_assigned: data.queue.candidateCount, pending_count: data.queue.candidateCount }, ...prev]);
      setShowQueueForm(false);
      setFreelancerName('');

      // Copy link to clipboard
      navigator.clipboard.writeText(data.queue.link);
      alert(`Queue created! Link copied to clipboard:\n${data.queue.link}`);
    } catch (err) {
      alert('Failed to create queue: ' + err.message);
    } finally {
      setCreatingQueue(false);
    }
  };

  const deleteQueue = async (queueId) => {
    if (!confirm('Delete this queue? Candidates will be available to assign to other queues.')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/admin/linkedin-queue/${queueId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setLinkedinQueues(prev => prev.filter(q => q.id !== queueId));
    } catch {
      alert('Failed to delete queue');
    }
  };

  const deleteCandidate = async (id) => {
    if (!confirm('Remove this candidate? This will cancel all pending emails.')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/outreach/candidates/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setCandidates(prev => prev.filter(c => c.id !== id));
    } catch {
      alert('Failed to delete candidate');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-sm mb-3">Role not found.</p>
        <Link to="/outreach" className="text-blue-600 text-sm hover:underline">Back to Outreach</Link>
      </div>
    );
  }

  const filteredCandidates = filter === 'all'
    ? candidates
    : candidates.filter(c => c.status === filter);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <Link to="/outreach" className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block">← Back to Outreach</Link>
        <h1 className="text-2xl font-bold text-slate-800">{role.job_title}</h1>
        <p className="text-slate-500">{role.company_name}</p>
      </div>

      {/* Stats */}
      {analytics && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-700">{analytics.candidates?.total_candidates || 0}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{analytics.candidates?.interested || 0}</p>
            <p className="text-xs text-slate-500">Interested</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{analytics.candidates?.active || 0}</p>
            <p className="text-xs text-slate-500">Active</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-slate-500">{analytics.candidates?.not_interested || 0}</p>
            <p className="text-xs text-slate-500">Not Interested</p>
          </div>
        </div>
      )}

      {/* LinkedIn Queue Section (Admin only) */}
      {isAdmin && candidates.filter(c => c.status === 'linkedin_only').length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-semibold text-indigo-900">LinkedIn Outreach Queues</h3>
              <p className="text-xs text-indigo-600">
                {candidates.filter(c => c.status === 'linkedin_only').length} candidates need manual LinkedIn outreach
              </p>
            </div>
            <button
              onClick={() => setShowQueueForm(!showQueueForm)}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              + Create Queue Link
            </button>
          </div>

          {showQueueForm && (
            <form onSubmit={createLinkedinQueue} className="bg-white rounded-lg p-4 mb-3 border border-indigo-200">
              <div className="flex gap-3">
                <input
                  type="text"
                  required
                  value={freelancerName}
                  onChange={(e) => setFreelancerName(e.target.value)}
                  placeholder="Freelancer name (e.g., John Smith)"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={creatingQueue}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:bg-slate-400 transition-colors"
                >
                  {creatingQueue ? 'Creating...' : 'Create & Copy Link'}
                </button>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                This will assign 10 unassigned LinkedIn-only candidates to a new queue link.
              </p>
            </form>
          )}

          {linkedinQueues.length > 0 && (
            <div className="space-y-2">
              {linkedinQueues.map(queue => (
                <div key={queue.id} className="bg-white rounded-lg p-3 border border-indigo-200 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-slate-800">{queue.name}</span>
                    <div className="flex gap-3 text-xs text-slate-500 mt-1">
                      <span>{queue.total_assigned} assigned</span>
                      <span className="text-green-600">{queue.interested_count || 0} interested</span>
                      <span className="text-red-600">{queue.not_interested_count || 0} not interested</span>
                      <span className="text-blue-600">{queue.contacted_count || 0} contacted</span>
                      <span>{queue.pending_count || 0} pending</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const link = `${window.location.origin}/linkedin-queue/${queue.token}`;
                        navigator.clipboard.writeText(link);
                        alert('Link copied to clipboard!');
                      }}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => deleteQueue(queue.id)}
                      className="text-xs text-red-500 hover:text-red-600 font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2 flex-wrap">
          {['all', 'active', 'interested', 'not_interested', 'linkedin_only'].map(status => {
            const count = status === 'all'
              ? candidates.length
              : candidates.filter(c => c.status === status).length;
            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  filter === status
                    ? status === 'linkedin_only' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {status === 'all' ? 'All' : STATUS_LABELS[status]}
                {count > 0 && <span className="ml-1 opacity-70">({count})</span>}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          <Link
            to={`/outreach/${roleId}/sequence`}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Edit Sequence
          </Link>
          <Link
            to={`/outreach/${roleId}/upload`}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            + Upload Candidates
          </Link>
        </div>
      </div>

      {/* Candidates List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {filteredCandidates.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-400 text-sm">
              {filter === 'all' ? 'No candidates yet.' : `No ${STATUS_LABELS[filter]?.toLowerCase()} candidates.`}
            </p>
            {filter === 'all' && (
              <Link
                to={`/outreach/${roleId}/upload`}
                className="mt-4 inline-block text-blue-600 text-sm hover:underline"
              >
                Upload your first batch of candidates
              </Link>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Country</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Reply / Emails</th>
                <th className="text-right px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredCandidates.map(candidate => (
                <tr key={candidate.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800">
                      {candidate.first_name} {candidate.last_name}
                    </span>
                    {candidate.is_gdpr_country && (
                      <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">GDPR</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {candidate.email ? (
                      candidate.email
                    ) : candidate.linkedin_url ? (
                      <a
                        href={candidate.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                        </svg>
                        LinkedIn
                      </a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{candidate.country || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[candidate.status] || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[candidate.status] || candidate.status}
                    </span>
                    {candidate.reply_sentiment && (
                      <span className={`ml-1 inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        candidate.reply_sentiment === 'interested' ? 'bg-green-50 text-green-600' :
                        candidate.reply_sentiment === 'not_interested' ? 'bg-red-50 text-red-600' :
                        'bg-amber-50 text-amber-600'
                      }`}>
                        {candidate.reply_sentiment === 'maybe' ? 'Maybe' : ''}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {candidate.reply_text ? (
                      <span className="text-xs text-slate-500 italic" title={candidate.reply_text}>
                        "{candidate.reply_text.length > 60 ? candidate.reply_text.substring(0, 60) + '...' : candidate.reply_text}"
                      </span>
                    ) : candidate.status === 'linkedin_only' ? (
                      <span className="text-indigo-600 text-xs font-medium">Manual outreach</span>
                    ) : (
                      `${candidate.emails_sent}/3 sent`
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deleteCandidate(candidate.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Remove candidate"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default OutreachRoleDetail;
