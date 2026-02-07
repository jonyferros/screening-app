import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';

function CandidateUpload() {
  const { roleId } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [gmailConnected, setGmailConnected] = useState(true);

  useEffect(() => {
    fetchRole();
  }, [roleId]);

  const fetchRole = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };

      const [roleRes, gmailRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/api/roles/${roleId}`, { headers }),
        fetch(`${import.meta.env.VITE_API_URL}/api/gmail/status`, { headers })
      ]);

      const roleData = await roleRes.json();
      const gmailData = await gmailRes.json();

      setRole(roleData.role);
      setGmailConnected(gmailData.connected);
    } catch (err) {
      console.error('Failed to load role:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected && (selected.name.endsWith('.csv') || selected.type === 'text/csv' || selected.type === 'application/vnd.ms-excel')) {
      setFile(selected);
      setResult(null);
    } else {
      alert('Please select a CSV file');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('csv', file);
      formData.append('roleId', roleId);

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outreach/candidates/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ success: false, error: data.error, details: data.details });
      } else {
        setResult({ success: true, ...data });
      }
    } catch (err) {
      setResult({ success: false, error: 'Failed to upload file' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-sm mb-3">Role not found.</p>
        <Link to="/outreach" className="text-blue-600 text-sm hover:underline">Back to Outreach</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-6">
        <Link to={`/outreach/${roleId}`} className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block">← Back to {role.job_title}</Link>
        <h1 className="text-2xl font-bold text-slate-800">Upload Candidates</h1>
        <p className="text-slate-500">Add candidates for outreach via CSV</p>
      </div>

      {/* Gmail Warning */}
      {!gmailConnected && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-amber-500 text-xl">⚠️</span>
            <div>
              <p className="text-sm font-semibold text-amber-800">Gmail not connected</p>
              <p className="text-sm text-amber-700 mt-1">
                Candidates will be queued but emails won't send until you{' '}
                <Link to="/settings" className="underline hover:text-amber-800">connect Gmail</Link>.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CSV Format Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
        <h3 className="text-sm font-semibold text-blue-800 mb-2">CSV Format</h3>
        <p className="text-sm text-blue-700 mb-3">
          Required columns: <strong>first_name</strong>, <strong>last_name</strong>, and <strong>email</strong> (or <strong>linkedin_url</strong>).
          Optional: country, current_job_title, current_employer.
        </p>
        <code className="block bg-white border border-blue-200 rounded px-3 py-2 text-xs text-blue-800 font-mono whitespace-pre-line">
          first_name,last_name,email,country,current_job_title,current_employer
        </code>
        <p className="text-xs text-blue-600 mt-3">
          Country is used for GDPR compliance. Candidates without email but with a LinkedIn URL will be queued for manual outreach.
        </p>
      </div>

      {/* Upload Area */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="cursor-pointer"
          >
            <svg className="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-slate-600 font-medium mb-1">
              {file ? file.name : 'Click to select CSV file'}
            </p>
            <p className="text-slate-400 text-sm">or drag and drop</p>
          </label>
        </div>

        {file && (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-slate-600">{file.name}</span>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Uploading…' : 'Upload & Start Sequence'}
            </button>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className={`rounded-xl p-5 ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          {result.success ? (
            <>
              <h3 className="text-sm font-semibold text-green-800 mb-2">Upload Complete</h3>
              <div className="space-y-1 text-sm text-green-700">
                <p><strong>{result.inserted}</strong> candidates added successfully</p>
                {result.duplicates > 0 && (
                  <p><strong>{result.duplicates}</strong> duplicates skipped</p>
                )}
                {result.errors > 0 && (
                  <p><strong>{result.errors}</strong> rows had errors</p>
                )}
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => navigate(`/outreach/${roleId}`)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  View Candidates
                </button>
                <button
                  onClick={() => { setFile(null); setResult(null); }}
                  className="px-4 py-2 bg-white border border-green-300 text-green-700 rounded-lg text-sm font-semibold hover:bg-green-50 transition-colors"
                >
                  Upload More
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-sm font-semibold text-red-800 mb-2">Upload Failed</h3>
              <p className="text-sm text-red-700">{result.error}</p>
              {result.details && result.details.length > 0 && (
                <ul className="mt-2 text-xs text-red-600 list-disc list-inside">
                  {result.details.slice(0, 5).map((err, i) => (
                    <li key={i}>Row {err.row}: {err.error}</li>
                  ))}
                  {result.details.length > 5 && (
                    <li>...and {result.details.length - 5} more errors</li>
                  )}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      {/* Example Download */}
      <div className="mt-6 text-center">
        <a
          href={`data:text/csv;charset=utf-8,first_name,last_name,email,country,current_job_title,current_employer%0AJohn,Doe,john@example.com,United States,Software Engineer,Google%0AJane,Smith,jane@example.com,Germany,Product Manager,SAP`}
          download="example_candidates.csv"
          className="text-sm text-slate-500 hover:text-slate-700 underline"
        >
          Download example CSV
        </a>
      </div>
    </div>
  );
}

export default CandidateUpload;
