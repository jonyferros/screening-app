import { useState, useEffect } from 'react';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function Settings() {
  const [days, setDays] = useState([0, 1, 2, 3, 4]);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
  }, []);

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
    <div className="max-w-xl mx-auto px-4 py-10">
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
  );
}

export default Settings;
