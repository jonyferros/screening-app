import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Reports() {
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('all');
  const [analytics, setAnalytics] = useState(null);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedRole !== 'all') {
      fetchRoleAnalytics(selectedRole);
    } else {
      computeAggregateAnalytics();
    }
  }, [selectedRole, roles, submissions]);

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

      const rolesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/roles`, { headers });
      const rolesData = await rolesRes.json();
      setRoles(rolesData.roles || []);

      // Fetch all submissions for funnel
      const allSubmissions = [];
      for (const role of (rolesData.roles || [])) {
        try {
          const subRes = await fetch(`${import.meta.env.VITE_API_URL}/api/roles/${role.id}/submissions`, { headers });
          const subData = await subRes.json();
          if (subData.submissions) {
            allSubmissions.push(...subData.submissions.map(s => ({ ...s, roleId: role.id, jobTitle: role.job_title })));
          }
        } catch {}
      }
      setSubmissions(allSubmissions);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const computeSalaryBreakdown = (subs) => {
    const ranges = {
      '< 50k': 0,
      '50k - 75k': 0,
      '75k - 100k': 0,
      '100k - 125k': 0,
      '125k - 150k': 0,
      '150k+': 0
    };

    subs.forEach(s => {
      const salary = parseFloat(s.expected_salary_amount) || 0;
      if (salary < 50000) ranges['< 50k']++;
      else if (salary < 75000) ranges['50k - 75k']++;
      else if (salary < 100000) ranges['75k - 100k']++;
      else if (salary < 125000) ranges['100k - 125k']++;
      else if (salary < 150000) ranges['125k - 150k']++;
      else ranges['150k+']++;
    });

    return Object.entries(ranges)
      .filter(([, count]) => count > 0)
      .map(([range, count]) => ({ range, count }));
  };

  const computeVisaBreakdown = (subs) => {
    const byVisa = {};
    subs.forEach(s => {
      const visa = s.visa_status || 'Not specified';
      byVisa[visa] = (byVisa[visa] || 0) + 1;
    });
    return Object.entries(byVisa)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => ({ status, count }));
  };

  const fetchRoleAnalytics = async (roleId) => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      const [analyticsRes, candidatesRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/outreach/analytics/${roleId}`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/outreach/candidates/${roleId}`, { headers })
      ]);

      const analyticsData = await analyticsRes.json();
      const candidatesData = await candidatesRes.json();

      const candidates = candidatesData.candidates || [];
      const roleSubmissions = submissions.filter(s => s.roleId === roleId);

      setAnalytics({
        totalCandidates: candidates.length,
        emailCandidates: candidates.filter(c => c.email && c.status !== 'linkedin_only').length,
        linkedinOnly: candidates.filter(c => c.status === 'linkedin_only').length,
        active: candidates.filter(c => c.status === 'active').length,
        interested: candidates.filter(c => c.status === 'interested').length,
        notInterested: candidates.filter(c => c.status === 'not_interested').length,
        responded: candidates.filter(c => c.status === 'responded').length,
        screeningsCompleted: roleSubmissions.length,
        screeningsByStatus: {
          passed: roleSubmissions.filter(s => s.ai_score >= 70).length,
          review: roleSubmissions.filter(s => s.ai_score >= 50 && s.ai_score < 70).length,
          failed: roleSubmissions.filter(s => s.ai_score < 50).length
        },
        avgScore: roleSubmissions.length > 0
          ? Math.round(roleSubmissions.reduce((acc, s) => acc + (s.ai_score || 0), 0) / roleSubmissions.length)
          : 0,
        countryBreakdown: computeCountryBreakdown(candidates),
        salaryBreakdown: computeSalaryBreakdown(roleSubmissions),
        visaBreakdown: computeVisaBreakdown(roleSubmissions),
        emailStats: analyticsData.emails || {}
      });
    } catch (err) {
      console.error('Failed to load role analytics:', err);
    }
  };

  const computeAggregateAnalytics = async () => {
    if (roles.length === 0) return;

    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      let allCandidates = [];

      for (const role of roles) {
        try {
          const candidatesRes = await fetch(`${import.meta.env.VITE_API_URL}/api/outreach/candidates/${role.id}`, { headers });
          const candidatesData = await candidatesRes.json();
          allCandidates.push(...(candidatesData.candidates || []));
        } catch {}
      }

      setAnalytics({
        totalCandidates: allCandidates.length,
        emailCandidates: allCandidates.filter(c => c.email && c.status !== 'linkedin_only').length,
        linkedinOnly: allCandidates.filter(c => c.status === 'linkedin_only').length,
        active: allCandidates.filter(c => c.status === 'active').length,
        interested: allCandidates.filter(c => c.status === 'interested').length,
        notInterested: allCandidates.filter(c => c.status === 'not_interested').length,
        responded: allCandidates.filter(c => c.status === 'responded').length,
        screeningsCompleted: submissions.length,
        screeningsByStatus: {
          passed: submissions.filter(s => s.ai_score >= 70).length,
          review: submissions.filter(s => s.ai_score >= 50 && s.ai_score < 70).length,
          failed: submissions.filter(s => s.ai_score < 50).length
        },
        avgScore: submissions.length > 0
          ? Math.round(submissions.reduce((acc, s) => acc + (s.ai_score || 0), 0) / submissions.length)
          : 0,
        countryBreakdown: computeCountryBreakdown(allCandidates),
        salaryBreakdown: computeSalaryBreakdown(submissions),
        visaBreakdown: computeVisaBreakdown(submissions),
        roleBreakdown: roles.map(r => ({
          id: r.id,
          title: r.job_title,
          company: r.company_name,
          candidates: allCandidates.filter(c => c.role_id === r.id).length,
          submissions: submissions.filter(s => s.roleId === r.id).length
        }))
      });
    } catch (err) {
      console.error('Failed to compute aggregate analytics:', err);
    }
  };

  const computeCountryBreakdown = (candidates) => {
    const byCountry = {};
    candidates.forEach(c => {
      const country = c.country || 'Unknown';
      byCountry[country] = (byCountry[country] || 0) + 1;
    });
    return Object.entries(byCountry)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([country, count]) => ({ country, count }));
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-sm">Loading reports...</p>
      </div>
    );
  }

  const funnelData = analytics ? [
    { label: 'Email Outreach', value: analytics.emailCandidates, color: 'bg-blue-500' },
    { label: 'LinkedIn Only', value: analytics.linkedinOnly, color: 'bg-indigo-500' },
    { label: 'Interested', value: analytics.interested, color: 'bg-green-500' },
    { label: 'Screenings Completed', value: analytics.screeningsCompleted, color: 'bg-purple-500' }
  ] : [];

  const maxFunnelValue = Math.max(...funnelData.map(d => d.value), 1);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Talent Intelligence Reports</h1>
          <p className="text-slate-500 text-sm">Pipeline analytics and conversion metrics</p>
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.job_title} - {role.company_name}
            </option>
          ))}
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-3xl font-bold text-slate-800">{analytics?.totalCandidates || 0}</p>
          <p className="text-sm text-slate-500 mt-1">Total Candidates</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-3xl font-bold text-green-600">{analytics?.interested || 0}</p>
          <p className="text-sm text-slate-500 mt-1">Interested</p>
          <p className="text-xs text-slate-400 mt-1">
            {analytics?.totalCandidates > 0
              ? `${Math.round((analytics.interested / analytics.totalCandidates) * 100)}% response rate`
              : '-'}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-3xl font-bold text-purple-600">{analytics?.screeningsCompleted || 0}</p>
          <p className="text-sm text-slate-500 mt-1">Screenings</p>
          <p className="text-xs text-slate-400 mt-1">
            {analytics?.interested > 0
              ? `${Math.round((analytics.screeningsCompleted / analytics.interested) * 100)}% completion`
              : '-'}
          </p>
        </div>
      </div>

      {/* Funnel Visualization */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Recruitment Funnel</h2>
        <div className="space-y-3">
          {funnelData.map((stage, idx) => (
            <div key={stage.label} className="flex items-center gap-4">
              <div className="w-40 text-sm text-slate-600 text-right">{stage.label}</div>
              <div className="flex-1 bg-slate-100 rounded-full h-8 overflow-hidden">
                <div
                  className={`h-full ${stage.color} transition-all flex items-center justify-end pr-3`}
                  style={{ width: `${Math.max((stage.value / maxFunnelValue) * 100, 5)}%` }}
                >
                  <span className="text-white text-sm font-semibold">{stage.value}</span>
                </div>
              </div>
              {idx > 0 && funnelData[idx - 1].value > 0 && (
                <div className="w-16 text-xs text-slate-400 text-right">
                  {Math.round((stage.value / funnelData[idx - 1].value) * 100)}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Salary Expectations */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Salary Expectations</h2>
          {analytics?.salaryBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {analytics.salaryBreakdown.map(({ range, count }) => {
                const maxCount = Math.max(...analytics.salaryBreakdown.map(s => s.count));
                return (
                  <div key={range} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-slate-600 text-right">{range}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all flex items-center justify-end pr-2"
                        style={{ width: `${Math.max((count / maxCount) * 100, 10)}%` }}
                      >
                        <span className="text-white text-xs font-semibold">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 mt-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Based on {submissions.length} screening responses
                </p>
              </div>
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No salary data yet</p>
          )}
        </div>

        {/* Visa Status */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Visa Status Distribution</h2>
          {analytics?.visaBreakdown?.length > 0 ? (
            <div className="space-y-3">
              {analytics.visaBreakdown.map(({ status, count }) => {
                const maxCount = Math.max(...analytics.visaBreakdown.map(v => v.count));
                const colorMap = {
                  'Citizen': 'bg-emerald-500',
                  'Permanent Resident': 'bg-green-500',
                  'Work Visa': 'bg-blue-500',
                  'Student Visa': 'bg-indigo-500',
                  'Requires Sponsorship': 'bg-amber-500',
                  'Not specified': 'bg-slate-400'
                };
                const color = colorMap[status] || 'bg-slate-500';
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-36 text-sm text-slate-600 text-right truncate" title={status}>{status}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                      <div
                        className={`h-full ${color} transition-all flex items-center justify-end pr-2`}
                        style={{ width: `${Math.max((count / maxCount) * 100, 10)}%` }}
                      >
                        <span className="text-white text-xs font-semibold">{count}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No visa data yet</p>
          )}
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Geographic Distribution</h2>
          {analytics?.countryBreakdown?.length > 0 ? (
            <div className="space-y-2">
              {analytics.countryBreakdown.map(({ country, count }) => (
                <div key={country} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{country}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-slate-500 h-2 rounded-full"
                        style={{ width: `${(count / analytics.countryBreakdown[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-slate-800 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">No geographic data</p>
          )}
        </div>

        {/* Role Performance (aggregate view only) */}
        {selectedRole === 'all' && analytics?.roleBreakdown && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Performance by Role</h2>
            {analytics.roleBreakdown.length > 0 ? (
              <div className="space-y-3">
                {analytics.roleBreakdown.slice(0, 5).map(role => (
                  <div key={role.id} className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/outreach/${role.id}`}
                        className="text-sm font-medium text-slate-800 hover:text-blue-600 truncate block"
                      >
                        {role.title}
                      </Link>
                      <p className="text-xs text-slate-400 truncate">{role.company}</p>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-slate-500">{role.candidates} candidates</span>
                      <span className="text-purple-600 font-medium">{role.submissions} screenings</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No role data</p>
            )}
          </div>
        )}
      </div>

      {/* Conversion Metrics */}
      <div className="mt-8 bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-4">Key Conversion Metrics</h2>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-3xl font-bold">
              {analytics?.totalCandidates > 0
                ? `${Math.round((analytics.interested / analytics.totalCandidates) * 100)}%`
                : '—'}
            </p>
            <p className="text-slate-400 text-sm mt-1">Interest Rate</p>
            <p className="text-xs text-slate-500">Candidates → Interested</p>
          </div>
          <div>
            <p className="text-3xl font-bold">
              {analytics?.interested > 0
                ? `${Math.round((analytics.screeningsCompleted / analytics.interested) * 100)}%`
                : '—'}
            </p>
            <p className="text-slate-400 text-sm mt-1">Screening Rate</p>
            <p className="text-xs text-slate-500">Interested → Screened</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;
