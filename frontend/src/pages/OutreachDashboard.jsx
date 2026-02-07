import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function OutreachDashboard() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

      const [dashboardRes, gmailRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/outreach/analytics/dashboard`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/gmail/status`, { headers })
      ]);

      const dashboardData = await dashboardRes.json();
      const gmailData = await gmailRes.json();

      setRoles(dashboardData.roles || []);
      setGmailConnected(gmailData.connected);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  const totalCandidates = roles.reduce((sum, r) => sum + r.total_candidates, 0);
  const totalInterested = roles.reduce((sum, r) => sum + r.interested, 0);
  const totalActive = roles.reduce((sum, r) => sum + r.active, 0);

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Outreach</h1>
          <p className="text-slate-500 text-sm">Manage candidate outreach sequences</p>
        </div>
      </div>

      {/* Gmail Warning */}
      {!gmailConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-amber-500 text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Gmail not connected</p>
              <p className="text-sm text-amber-700 mt-1">
                Connect your Gmail in{' '}
                <Link to="/settings" className="underline hover:text-amber-800">Settings</Link>
                {' '}to start sending outreach emails.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Candidates', value: totalCandidates, color: 'blue' },
          { label: 'Active Sequences', value: totalActive, color: 'slate' },
          { label: 'Interested', value: totalInterested, color: 'green' }
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border border-slate-200 rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-3xl font-bold text-${color}-600`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Roles List */}
      <div className="space-y-3">
        {roles.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="text-slate-400 text-sm mb-4">No roles with outreach yet.</p>
            <p className="text-slate-500 text-sm">
              Go to <Link to="/" className="text-blue-600 hover:underline">My Projects</Link> and click "Outreach" on a role to begin.
            </p>
          </div>
        ) : (
          roles.map((role) => (
            <Link
              key={role.role_id}
              to={`/outreach/${role.role_id}`}
              className="block bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{role.job_title}</h3>
                  <p className="text-sm text-slate-500">{role.company_name}</p>
                </div>
                <div className="flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Candidates</p>
                    <p className="text-lg font-semibold text-slate-700">{role.total_candidates}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Interested</p>
                    <p className="text-lg font-semibold text-green-600">{role.interested}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Active</p>
                    <p className="text-lg font-semibold text-blue-600">{role.active}</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default OutreachDashboard;
