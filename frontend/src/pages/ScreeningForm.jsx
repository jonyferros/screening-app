import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function ScreeningForm() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    candidate_name: '',
    candidate_email: '',
    expected_salary_amount: '',
    expected_salary_currency: 'USD',
    current_location: '',
    work_preference: 'Remote',
    visa_status: 'US Citizen',
    visa_sponsorship_details: '',
    availability_type: 'notice_period',
    notice_period_weeks: '',
    availability_start_date: '',
    role_specific_answers: [],
    recruiter_notes: '',
    recruiter_email: ''
  });

  const [honeypot, setHoneypot] = useState('');
  const [captcha, setCaptcha] = useState(() => ({
    a: Math.floor(Math.random() * 15) + 2,
    b: Math.floor(Math.random() * 15) + 2
  }));
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  const newCaptcha = () => {
    setCaptcha({ a: Math.floor(Math.random() * 15) + 2, b: Math.floor(Math.random() * 15) + 2 });
    setCaptchaInput('');
    setCaptchaError(false);
  };

  useEffect(() => {
    fetchRole();
  }, [slug]);

  const fetchRole = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/roles/slug/${slug}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load role');
      setRole(data);

      setFormData(prev => ({
        ...prev,
        role_specific_answers: data.screening_questions.map(q => ({
          question: q,
          answer: ''
        }))
      }));
    } catch (error) {
      alert(error.message || 'Error loading role');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index, value) => {
    const newAnswers = [...formData.role_specific_answers];
    newAnswers[index].answer = value;
    setFormData({ ...formData, role_specific_answers: newAnswers });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (honeypot) return;
    if (parseInt(captchaInput) !== captcha.a + captcha.b) {
      setCaptchaError(true);
      newCaptcha();
      return;
    }

    try {
      const submitData = {
        role_id: role.role_id,
        candidate_name: formData.candidate_name,
        candidate_email: formData.candidate_email,
        expected_salary_amount: parseFloat(formData.expected_salary_amount),
        expected_salary_currency: formData.expected_salary_currency,
        current_location: formData.current_location,
        work_preference: formData.work_preference,
        visa_status: formData.visa_status,
        visa_sponsorship_details: formData.visa_status === 'Requires Sponsorship' ? formData.visa_sponsorship_details : null,
        notice_period_weeks: formData.availability_type === 'notice_period' ? parseInt(formData.notice_period_weeks) : null,
        availability_start_date: formData.availability_type === 'start_date' ? formData.availability_start_date : null,
        role_specific_answers: formData.role_specific_answers,
        recruiter_notes: formData.recruiter_notes,
        recruiter_email: formData.recruiter_email
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/screenings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        navigate('/success');
      }
    } catch (error) {
      alert('Error submitting screening');
    }
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="text-slate-400 text-lg">Loading…</div>
    </div>
  );

  if (!role) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="text-slate-400 text-lg">Role not found</div>
    </div>
  );

  const inputClass = "w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow";
  const selectClass = "w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow appearance-none";
  const labelClass = "block text-sm font-semibold text-slate-700 mb-1.5";
  const sectionTitle = "text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4";

  return (
    <div>
      {/* SquareMoon branded header */}
      <div className="bg-[#0d1b2a] px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          <span className="text-white text-lg font-bold tracking-tight">SquareMoon</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
      <form onSubmit={handleSubmit} className="space-y-4">

        {/* Role intro banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600">📋</span>
            <h2 className="text-sm font-semibold text-blue-800 uppercase tracking-wide">About This Role</h2>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed">{role.role_introduction}</p>
        </div>

        {/* Candidate details */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
          <h2 className={sectionTitle}>💰 Candidate Details</h2>

          {/* Name & Email row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Name</label>
              <input
                type="text"
                required
                value={formData.candidate_name}
                onChange={(e) => setFormData({ ...formData, candidate_name: e.target.value })}
                className={inputClass}
                placeholder="Jane Smith"
              />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                required
                value={formData.candidate_email}
                onChange={(e) => setFormData({ ...formData, candidate_email: e.target.value })}
                className={inputClass}
                placeholder="jane@email.com"
              />
            </div>
          </div>

          {/* Salary row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={labelClass}>Expected Salary</label>
              <input
                type="number"
                required
                value={formData.expected_salary_amount}
                onChange={(e) => setFormData({ ...formData, expected_salary_amount: e.target.value })}
                className={inputClass}
                placeholder="120000"
              />
            </div>
            <div>
              <label className={labelClass}>Currency</label>
              <select
                value={formData.expected_salary_currency}
                onChange={(e) => setFormData({ ...formData, expected_salary_currency: e.target.value })}
                className={selectClass}
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className={labelClass}>Current Location</label>
            <input
              type="text"
              required
              value={formData.current_location}
              onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
              className={inputClass}
              placeholder="Berlin, Germany"
            />
          </div>

          {/* Work preference toggle */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Work Preference</label>
            <div className="flex gap-3">
              {['Remote', 'Hybrid', 'Onsite'].map((pref) => (
                <label
                  key={pref}
                  className={`flex-1 text-center py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                    formData.work_preference === pref
                      ? 'bg-[#0d1b2a] text-white border-[#0d1b2a]'
                      : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    value={pref}
                    checked={formData.work_preference === pref}
                    onChange={(e) => setFormData({ ...formData, work_preference: e.target.value })}
                    className="sr-only"
                  />
                  {pref}
                </label>
              ))}
            </div>
          </div>

          {/* Visa status */}
          <div>
            <label className={labelClass}>Visa Status</label>
            <select
              value={formData.visa_status}
              onChange={(e) => setFormData({ ...formData, visa_status: e.target.value })}
              className={selectClass}
            >
              <option value="US Citizen">US Citizen</option>
              <option value="EU Citizen">EU Citizen</option>
              <option value="Work Permit">Work Permit</option>
              <option value="Requires Sponsorship">Requires Sponsorship</option>
            </select>
          </div>

          {formData.visa_status === 'Requires Sponsorship' && (
            <div>
              <label className={labelClass}>Sponsorship Details</label>
              <input
                type="text"
                value={formData.visa_sponsorship_details}
                onChange={(e) => setFormData({ ...formData, visa_sponsorship_details: e.target.value })}
                className={inputClass}
                placeholder="H1B, needs transfer…"
              />
            </div>
          )}

          {/* Availability */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Availability</label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="notice_period"
                  checked={formData.availability_type === 'notice_period'}
                  onChange={(e) => setFormData({ ...formData, availability_type: e.target.value })}
                  className="accent-blue-600"
                />
                <span className="text-sm text-slate-700">Notice Period</span>
                {formData.availability_type === 'notice_period' && (
                  <div className="flex items-center gap-1.5 ml-auto">
                    <input
                      type="number"
                      required
                      value={formData.notice_period_weeks}
                      onChange={(e) => setFormData({ ...formData, notice_period_weeks: e.target.value })}
                      className="w-20 px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="2"
                    />
                    <span className="text-sm text-slate-500">weeks</span>
                  </div>
                )}
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  value="start_date"
                  checked={formData.availability_type === 'start_date'}
                  onChange={(e) => setFormData({ ...formData, availability_type: e.target.value })}
                  className="accent-blue-600"
                />
                <span className="text-sm text-slate-700">Start Date</span>
                {formData.availability_type === 'start_date' && (
                  <input
                    type="date"
                    required
                    value={formData.availability_start_date}
                    onChange={(e) => setFormData({ ...formData, availability_start_date: e.target.value })}
                    className="ml-auto px-3 py-1.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Screening questions */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <h2 className={sectionTitle}>🎯 Screening Questions</h2>

          <div className="space-y-5">
            {formData.role_specific_answers.map((qa, index) => (
              <div key={index}>
                <label className="flex items-start gap-2.5 mb-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-xs mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-slate-700">{qa.question}</span>
                </label>
                <textarea
                  required
                  value={qa.answer}
                  onChange={(e) => handleAnswerChange(index, e.target.value)}
                  rows="2"
                  className="ml-7.5 w-full max-w-xl px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
                  placeholder="Your answer…"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Recruiter notes */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4">
          <div>
            <h2 className={sectionTitle}>📝 Recruiter Notes</h2>
            <p className="text-xs text-slate-400 -mt-2 mb-3">Optional — add observations, red flags, or cultural fit insights</p>
            <textarea
              value={formData.recruiter_notes}
              onChange={(e) => setFormData({ ...formData, recruiter_notes: e.target.value })}
              rows="4"
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow resize-none"
              placeholder="Strong technical background. Excellent communication…"
            />
          </div>

          <div>
            <label className={labelClass}>Your Email</label>
            <input
              type="email"
              required
              value={formData.recruiter_email}
              onChange={(e) => setFormData({ ...formData, recruiter_email: e.target.value })}
              className={inputClass}
              placeholder="recruiter@example.com"
            />
          </div>
        </div>

        {/* Honeypot — must stay empty */}
        <input type="text" name="website" className="sr-only" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" />

        {/* CAPTCHA */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
          <span className="text-sm text-slate-700 font-medium">{captcha.a} + {captcha.b} =</span>
          <input
            type="text"
            required
            value={captchaInput}
            onChange={(e) => { setCaptchaInput(e.target.value); setCaptchaError(false); }}
            className="w-16 px-3 py-2 border border-slate-300 rounded-lg text-sm text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="?"
          />
          <button type="button" onClick={newCaptcha} className="text-slate-400 hover:text-slate-600 transition-colors text-lg">↻</button>
          {captchaError && <span className="text-red-500 text-xs">Incorrect, try again</span>}
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-3 bg-[#0d1b2a] text-white rounded-xl font-semibold text-sm hover:bg-[#162a40] transition-colors shadow-sm"
        >
          Submit Screening
        </button>
      </form>
      </div>
    </div>
  );
}

export default ScreeningForm;
