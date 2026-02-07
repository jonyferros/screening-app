import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const STEP_LABELS = {
  1: { title: 'Email 1: Initial Outreach', timing: 'Sent immediately', color: 'blue' },
  2: { title: 'Email 2: Follow-up', timing: 'Sent after 2 days', color: 'amber' },
  3: { title: 'Email 3: Final Touch', timing: 'Sent after 4 days', color: 'slate' }
};

function OutreachSequenceEditor() {
  const { roleId } = useParams();
  const [role, setRole] = useState(null);
  const [templates, setTemplates] = useState([
    { step: 1, subject: '', bodyText: '' },
    { step: 2, subject: '', bodyText: '' },
    { step: 3, subject: '', bodyText: '' }
  ]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [previewStep, setPreviewStep] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, [roleId]);

  const fetchTemplates = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outreach/templates/${roleId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setRole(data.role);
      if (data.templates && data.templates.length > 0) {
        setTemplates(data.templates);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateTemplates = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outreach/templates/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ roleId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTemplates(data.templates);
      setSaved(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const saveTemplates = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outreach/templates/${roleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ templates })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const previewEmail = async (step) => {
    const template = templates.find(t => t.step === step);
    if (!template || !template.bodyText) return;

    setPreviewStep(step);
    setPreviewLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/outreach/templates/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ roleId, step, subject: template.subject, bodyText: template.bodyText })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setPreviewHtml(data.bodyHtml);
    } catch (err) {
      setError(err.message);
    } finally {
      setPreviewLoading(false);
    }
  };

  const updateTemplate = (step, field, value) => {
    setTemplates(prev => prev.map(t =>
      t.step === step ? { ...t, [field]: value } : t
    ));
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (error && !role) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  const hasContent = templates.some(t => t.subject || t.bodyText);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link to={`/outreach/${roleId}`} className="text-sm text-slate-500 hover:text-slate-700 mb-2 inline-block">
          &larr; Back to Outreach
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Outreach Sequence</h1>
            {role && (
              <p className="text-slate-500 text-sm mt-1">
                {role.job_title} at {role.company_name}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={generateTemplates}
              disabled={generating}
              className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {generating ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </span>
              ) : hasContent ? 'Regenerate with AI' : 'Generate with AI'}
            </button>
            <button
              onClick={saveTemplates}
              disabled={saving || saved || !hasContent}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                saved
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400'
              }`}
            >
              {saved ? 'Saved' : saving ? 'Saving...' : 'Save Templates'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
          {error}
          <button onClick={() => setError(null)} className="float-right font-bold">&times;</button>
        </div>
      )}

      {/* Placeholder Variables Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-blue-800 mb-2">Available Placeholders</p>
        <div className="flex flex-wrap gap-3 text-xs text-blue-700">
          <code className="bg-blue-100 px-2 py-1 rounded">{'{{first_name}}'}</code>
          <code className="bg-blue-100 px-2 py-1 rounded">{'{{current_role}}'}</code>
          <code className="bg-blue-100 px-2 py-1 rounded">{'{{current_company}}'}</code>
        </div>
        <p className="text-xs text-blue-600 mt-2">These will be replaced with each candidate's actual information when sending.</p>
      </div>

      {/* Templates */}
      <div className="space-y-6">
        {[1, 2, 3].map((step) => {
          const template = templates.find(t => t.step === step) || { step, subject: '', bodyText: '' };
          const stepInfo = STEP_LABELS[step];

          return (
            <div key={step} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              {/* Step Header */}
              <div className={`px-6 py-4 border-b border-slate-100 bg-${stepInfo.color}-50`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-full bg-${stepInfo.color}-100 text-${stepInfo.color}-700 flex items-center justify-center text-sm font-bold`}>
                      {step}
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-800">{stepInfo.title}</h3>
                      <p className="text-xs text-slate-500">{stepInfo.timing}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => previewEmail(step)}
                    disabled={!template.bodyText || previewLoading}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:text-slate-400"
                  >
                    Preview
                  </button>
                </div>
              </div>

              {/* Step Content */}
              <div className="p-6 space-y-4">
                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Subject Line</label>
                  <input
                    type="text"
                    value={template.subject}
                    onChange={(e) => updateTemplate(step, 'subject', e.target.value)}
                    placeholder="Enter email subject..."
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Body */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Email Body</label>
                  <textarea
                    value={template.bodyText}
                    onChange={(e) => updateTemplate(step, 'bodyText', e.target.value)}
                    placeholder="Enter email content..."
                    rows={8}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Preview Modal */}
      {previewStep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">Email Preview</h3>
                <p className="text-xs text-slate-500">
                  Sample candidate: Alex Johnson (Senior Software Engineer at Tech Corp)
                </p>
              </div>
              <button
                onClick={() => { setPreviewStep(null); setPreviewHtml(''); }}
                className="text-slate-400 hover:text-slate-600 text-xl"
              >
                &times;
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {previewLoading ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">Loading preview...</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg p-6 bg-white text-sm text-slate-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {previewHtml}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OutreachSequenceEditor;
