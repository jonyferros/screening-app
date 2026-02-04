import { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';

function ScreeningDetail() {
  const { roleId } = useParams();
  const location = useLocation();
  const role = location.state?.role;
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/screenings/role/${roleId}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setSubmissions(data.screenings);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [roleId]);

  if (!role) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-sm mb-3">Role not found.</p>
        <Link to="/" className="text-blue-600 text-sm hover:text-blue-700">Back to screenings</Link>
      </div>
    );
  }

  const answers = (submission) => {
    try {
      return Array.isArray(submission.role_specific_answers)
        ? submission.role_specific_answers
        : JSON.parse(submission.role_specific_answers);
    } catch { return []; }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back + header */}
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4 transition-colors">
        ← Back
      </Link>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-800">{role.job_title}</h1>
            <p className="text-slate-500 text-sm mt-0.5">{role.company_name}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
            role.status === 'open' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${role.status === 'open' ? 'bg-green-500' : 'bg-slate-400'}`} />
            {role.status === 'open' ? 'Open' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Submissions */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
          Submissions ({submissions.length})
        </h2>
      </div>

      {loading && (
        <p className="text-slate-400 text-sm py-8 text-center">Loading…</p>
      )}

      {error && (
        <p className="text-red-600 text-sm py-8 text-center">{error}</p>
      )}

      {!loading && !error && submissions.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-10 text-center">
          <p className="text-slate-400 text-sm">No submissions yet.</p>
        </div>
      )}

      {!loading && !error && submissions.length > 0 && (
        <div className="space-y-3">
          {submissions.map((sub) => {
            const isOpen = expanded === sub.id;
            const qa = answers(sub);
            return (
              <div key={sub.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                {/* Summary row */}
                <button
                  onClick={() => setExpanded(isOpen ? null : sub.id)}
                  className="w-full text-left px-5 py-4 flex items-start justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-slate-800">{sub.candidate_name}</span>
                      <span className="text-xs text-slate-400">{sub.candidate_email}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                      <span className="text-xs text-slate-500">{sub.expected_salary_amount} {sub.expected_salary_currency}</span>
                      <span className="text-xs text-slate-500">{sub.work_preference}</span>
                      <span className="text-xs text-slate-500">{sub.current_location}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-xs text-slate-400 whitespace-nowrap">
                      {new Date(sub.submitted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span className="text-slate-400 text-sm">{isOpen ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-slate-100 px-5 py-4 space-y-4">
                    {/* Candidate details grid */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      {[
                        { label: 'Visa Status', value: sub.visa_status },
                        { label: 'Availability', value: sub.notice_period_weeks ? `${sub.notice_period_weeks} weeks notice` : sub.availability_start_date || '—' },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
                          <p className="text-sm text-slate-700 mt-0.5">{value}</p>
                        </div>
                      ))}
                      {sub.visa_sponsorship_details && (
                        <div className="col-span-2">
                          <span className="text-xs text-slate-400 uppercase tracking-wide">Sponsorship Details</span>
                          <p className="text-sm text-slate-700 mt-0.5">{sub.visa_sponsorship_details}</p>
                        </div>
                      )}
                    </div>

                    {/* Q&A */}
                    {qa.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Answers</p>
                        <div className="space-y-3">
                          {qa.map((item, i) => (
                            <div key={i} className="bg-slate-50 rounded-lg px-4 py-3">
                              <p className="text-xs font-semibold text-slate-600 mb-1">{i + 1}. {item.question}</p>
                              <p className="text-sm text-slate-700">{item.answer || '—'}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recruiter notes */}
                    {sub.recruiter_notes && (
                      <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3">
                        <p className="text-xs font-semibold text-blue-600 mb-1">Recruiter Notes</p>
                        <p className="text-sm text-slate-700">{sub.recruiter_notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ScreeningDetail;
