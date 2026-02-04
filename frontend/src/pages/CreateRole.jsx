import { useState } from 'react';

const PRESET_QUESTIONS = [
  'What is your notice period / when can you start?',
  'What are your salary expectations?',
  'Can you briefly describe your most relevant experience for this role?',
  'Why are you interested in this position?',
  'What are your career goals for the next 2–3 years?',
  'Are you currently interviewing with other companies?',
  'Can you describe a time you handled a tight deadline?',
  'What motivates you most in your work?'
];

function CreateRole() {
  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    job_description: ''
  });
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingIntro, setEditingIntro] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [editValue, setEditValue] = useState('');

  const saveEdit = async (field, value) => {
    const body = field === 'intro'
      ? { role_introduction: value }
      : { screening_questions: result.screening_questions.map((q, i) => i === editingQuestionIndex ? value : q) };

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/roles/${result.role_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      setResult(prev => field === 'intro'
        ? { ...prev, role_introduction: value }
        : { ...prev, screening_questions: prev.screening_questions.map((q, i) => i === editingQuestionIndex ? value : q) }
      );
    } catch {
      alert('Failed to save changes');
    }

    setEditingIntro(false);
    setEditingQuestionIndex(null);
    setEditValue('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/roles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ ...formData, selected_questions: selectedQuestions })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Something went wrong');
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Network error — is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          {/* Success banner */}
          <div className="bg-green-50 border-b border-green-200 px-6 py-4 flex items-center gap-3">
            <div className="w-9 h-9 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold">✓</span>
            </div>
            <h2 className="text-lg font-semibold text-green-800">Screening Created Successfully</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Booking link (share with candidates) */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Booking Link
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}/book/${result.url_slug}`}
                  readOnly
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/book/${result.url_slug}`);
                    alert('Copied!');
                  }}
                  className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Screening form link */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 uppercase tracking-wide mb-2">
                Screening Form
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={result.screening_url}
                  readOnly
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(result.screening_url);
                    alert('Copied!');
                  }}
                  className="px-5 py-2 border border-slate-300 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Role intro */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-slate-600 uppercase tracking-wide">
                  Role Introduction
                </label>
                {!editingIntro && (
                  <button
                    onClick={() => { setEditingIntro(true); setEditValue(result.role_introduction); }}
                    className="text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    ✏️
                  </button>
                )}
              </div>
              {editingIntro ? (
                <div>
                  <textarea
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    rows="4"
                    className="w-full px-4 py-3 border border-blue-400 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => saveEdit('intro', editValue)}
                      className="px-4 py-1.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingIntro(false); setEditValue(''); }}
                      className="px-4 py-1.5 border border-slate-300 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm leading-relaxed">
                  {result.role_introduction}
                </p>
              )}
            </div>

            {/* Questions */}
            <div>
              <label className="block text-sm font-semibold text-slate-600 uppercase tracking-wide mb-3">
                Generated Questions
              </label>
              <ol className="space-y-2">
                {result.screening_questions.map((q, i) => (
                  <li key={i}>
                    {editingQuestionIndex === i ? (
                      <div>
                        <input
                          autoFocus
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full px-4 py-2 border border-blue-400 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => saveEdit('question', editValue)}
                            className="px-4 py-1.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingQuestionIndex(null); setEditValue(''); }}
                            className="px-4 py-1.5 border border-slate-300 text-slate-600 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-3 group">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-slate-700 text-sm flex-1 pt-0.5">{q}</span>
                        <button
                          onClick={() => { setEditingQuestionIndex(i); setEditValue(q); }}
                          className="text-slate-400 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          ✏️
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-slate-800">Create a Screening</h1>
        <p className="text-slate-500 mt-1.5">Paste a job description and we'll generate screening questions.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company Name</label>
            <input
              type="text"
              required
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="TechCorp"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job Title</label>
            <input
              type="text"
              required
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
              placeholder="Senior React Engineer"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job Description</label>
            <textarea
              required
              value={formData.job_description}
              onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
              rows="8"
              placeholder="Senior React Engineer for our SaaS platform. Must have 5+ years React, TypeScript, state management..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Screening Questions</label>
            <p className="text-xs text-slate-400 mb-3">Select questions you want included. AI will only generate the ones you leave unchecked.</p>
            <div className="space-y-2">
              {PRESET_QUESTIONS.map((q) => {
                const checked = selectedQuestions.includes(q);
                return (
                  <label
                    key={q}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      checked ? 'bg-blue-50 border-blue-300' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedQuestions((prev) =>
                          checked ? prev.filter((x) => x !== q) : [...prev, q]
                        )
                      }
                      className="mt-0.5 accent-blue-600"
                    />
                    <span className="text-sm text-slate-700">{q}</span>
                  </label>
                );
              })}
            </div>

            {/* Custom question input */}
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={customQuestion}
                onChange={(e) => setCustomQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customQuestion.trim()) {
                    e.preventDefault();
                    setSelectedQuestions((prev) => [...prev, customQuestion.trim()]);
                    setCustomQuestion('');
                  }
                }}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                placeholder="Add your own question…"
              />
              <button
                type="button"
                onClick={() => {
                  if (customQuestion.trim()) {
                    setSelectedQuestions((prev) => [...prev, customQuestion.trim()]);
                    setCustomQuestion('');
                  }
                }}
                className="px-4 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
              >
                Add
              </button>
            </div>

            {/* Show custom (non-preset) questions as removable tags */}
            {selectedQuestions.filter((q) => !PRESET_QUESTIONS.includes(q)).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedQuestions.filter((q) => !PRESET_QUESTIONS.includes(q)).map((q) => (
                  <span
                    key={q}
                    className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    {q}
                    <button
                      type="button"
                      onClick={() => setSelectedQuestions((prev) => prev.filter((x) => x !== q))}
                      className="text-blue-400 hover:text-blue-600 transition-colors"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white rounded-lg font-semibold text-sm hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Generating Questions…' : 'Generate Screening Link'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateRole;
