import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Screenings() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('open');

  const fetchRoles = async () => {
    try {
      const since = localStorage.getItem('lastLogin');
      const url = since
        ? `${import.meta.env.VITE_API_URL}/api/roles?since=${encodeURIComponent(since)}`
        : `${import.meta.env.VITE_API_URL}/api/roles`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load');
      setRoles(data.roles);
      localStorage.setItem('lastLogin', new Date().toISOString());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const toggleStatus = async (role) => {
    const newStatus = role.status === 'open' ? 'closed' : 'open';
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/roles/${role.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      setRoles(prev => prev.map(r => r.id === role.id ? { ...r, status: newStatus } : r));
    } catch {
      alert('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  const filtered = roles.filter(r => r.status === filter);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">My Screenings</h1>
        <Link
          to="/create"
          className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
        >
          + Create
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 mb-5 bg-slate-100 rounded-lg p-1 w-fit">
        {['open', 'closed'].map((f) => {
          const count = roles.filter(r => r.status === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                filter === f
                  ? 'bg-white shadow-sm text-slate-800'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {f} <span className="text-slate-400 font-normal">({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
          <p className="text-slate-400 text-sm mb-4">No {filter} screenings.</p>
          {filter === 'open' && (
            <Link
              to="/create"
              className="inline-block px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
            >
              Create your first screening
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((role) => (
            <div
              key={role.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm flex items-start justify-between gap-4 group"
            >
              {/* Clickable area → detail page */}
              <Link
                to={`/screenings/${role.id}`}
                state={{ role }}
                className="min-w-0 flex-1 p-5 hover:bg-slate-50 transition-colors rounded-l-xl"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-semibold text-slate-800">{role.job_title}</h2>
                  <span className="text-slate-400 text-sm">—</span>
                  <span className="text-slate-500 text-sm">{role.company_name}</span>
                </div>

                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    role.status === 'open'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${role.status === 'open' ? 'bg-green-500' : 'bg-slate-400'}`} />
                    {role.status === 'open' ? 'Open' : 'Closed'}
                  </span>

                  <span className="text-xs text-slate-400">
                    {role.submission_count} {role.submission_count === 1 ? 'submission' : 'submissions'}
                  </span>

                  {role.new_submission_count > 0 && (
                    <span className="text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                      {role.new_submission_count} new
                    </span>
                  )}
                </div>

                <span className="mt-2 inline-block text-xs text-blue-600 truncate max-w-sm">
                  /screen/{role.url_slug}
                </span>
              </Link>

              {/* Close/Reopen button */}
              <div className="p-5 pl-0">
                <button
                  onClick={() => toggleStatus(role)}
                  className={`flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    role.status === 'open'
                      ? 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      : 'border-green-300 text-green-700 hover:bg-green-50'
                  }`}
                >
                  {role.status === 'open' ? 'Close' : 'Reopen'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Screenings;
