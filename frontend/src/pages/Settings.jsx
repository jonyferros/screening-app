import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [days, setDays] = useState([0, 1, 2, 3, 4]);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Gmail OAuth state
  const [gmailStatus, setGmailStatus] = useState(null);
  const [gmailLoading, setGmailLoading] = useState(true);
  const [gmailConnecting, setGmailConnecting] = useState(false);
  const [gmailMessage, setGmailMessage] = useState(null);

  useEffect(() => {
    // Check for Gmail OAuth callback params
    const gmailResult = searchParams.get('gmail');
    if (gmailResult === 'success') {
      setGmailMessage({ type: 'success', text: 'Gmail connected successfully!' });
      setSearchParams({});
      fetchGmailStatus();
    } else if (gmailResult === 'error') {
      setGmailMessage({ type: 'error', text: searchParams.get('message') || 'Failed to connect Gmail' });
      setSearchParams({});
    }
  }, [searchParams]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/availability`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setDays(data.days || []);
        setStartHour(data.start_hour ?? 9);
        setEndHour(data.end_hour ?? 17);
      } catch {}
      finally { setLoading(false); }
    })();
    fetchGmailStatus();
  }, []);

  const fetchGmailStatus = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/status`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      setGmailStatus(data);
    } catch {
      setGmailStatus({ connected: false });
    } finally {
      setGmailLoading(false);
    }
  };

  const connectGmail = async () => {
    setGmailConnecting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/auth-url`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (err) {
      setGmailMessage({ type: 'error', text: 'Failed to start Gmail connection' });
      setGmailConnecting(false);
    }
  };

  const disconnectGmail = async () => {
    if (!confirm('Are you sure you want to disconnect Gmail? This will stop all outreach email sending.')) return;
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/gmail/disconnect`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setGmailStatus({ connected: false });
      setGmailMessage({ type: 'success', text: 'Gmail disconnected' });
    } catch {
      setGmailMessage({ type: 'error', text: 'Failed to disconnect Gmail' });
    }
  };

  const toggleDay = (i) => {
    setDays(prev => prev.includes(i) ? prev.filter(d => d !== i) : [...prev, i].sort((a, b) => a - b));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/availability`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ days, start_hour: startHour, end_hour: endHour })
      });
      if (!res.ok) throw new Error('Failed to save');
      setSaved(true);
    } catch {
      alert('Failed to save availability');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-sm">Loading…</p>
      </div>
    );
  }

  const slotsPerDay = startHour < endHour ? (endHour - startHour) * 4 : 0;

  return (
    <div className="max-w-xl mx-auto px-4 py-10 space-y-8">
      {/* Gmail Message */}
      {gmailMessage && (
        <div className={`p-4 rounded-xl text-sm ${
          gmailMessage.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {gmailMessage.text}
          <button onClick={() => setGmailMessage(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Gmail Integration */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Email Outreach</h1>
        <p className="text-slate-500 text-sm mb-6">Connect your Gmail to send outreach emails to candidates.</p>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          {gmailLoading ? (
            <p className="text-slate-400 text-sm">Checking Gmail status…</p>
          ) : gmailStatus?.connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">Gmail Connected</p>
                  <p className="text-xs text-slate-500">{gmailStatus.gmailAddress}</p>
                </div>
              </div>
              <button
                onClick={disconnectGmail}
                className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                Disconnect Gmail
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">
                Connect your Gmail account to send personalized outreach emails directly from your inbox.
              </p>
              <button
                onClick={connectGmail}
                disabled={gmailConnecting}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {gmailConnecting ? 'Connecting…' : 'Connect Gmail'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Availability</h1>
        <p className="text-slate-500 text-sm mb-6">Set the times when candidates can book screening calls with you.</p>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-6">
          {/* Days */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Available Days</label>
            <div className="flex gap-2">
              {DAYS.map((day, i) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(i)}
                  className={`w-12 h-12 rounded-lg text-sm font-semibold transition-colors ${
                    days.includes(i)
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time window */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">Available Hours</label>
            <div className="flex items-center gap-3">
              <select
                value={startHour}
                onChange={(e) => { setStartHour(Number(e.target.value)); setSaved(false); }}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
              <span className="text-slate-400 text-sm font-medium">to</span>
              <select
                value={endHour}
                onChange={(e) => { setEndHour(Number(e.target.value)); setSaved(false); }}
                className="flex-1 px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              >
                {HOURS.map(h => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {slotsPerDay > 0
                ? `${slotsPerDay} slots per day · 15 minutes each`
                : 'End time must be after start time'}
            </p>
          </div>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || saved || startHour >= endHour}
            className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
              saved
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400 disabled:cursor-not-allowed'
            }`}
          >
            {saved ? 'Saved' : saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;
