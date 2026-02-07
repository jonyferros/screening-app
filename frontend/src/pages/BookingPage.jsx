import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function BookingPage() {
  const { slug } = useParams();
  const [slots, setSlots] = useState([]);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [booking, setBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings/slots/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load');
        setSlots(data.slots);
        setRole(data.role);
        if (data.slots.length > 0) setSelectedDate(data.slots[0].date);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  const dates = [...new Set(slots.map(s => s.date))];
  const timesForDate = slots.filter(s => s.date === selectedDate).map(s => s.time);

  const formatDateShort = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatDateLong = (dateStr) => {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const handleBook = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, candidate_name: name, candidate_email: email, booked_date: selectedDate, booked_time: selectedTime })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      setBooking(data.booking);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const Header = () => (
    <div className="bg-[#0d1b2a] px-6 py-4">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <span className="text-white text-lg font-bold tracking-tight">SquareMoon</span>
      </div>
    </div>
  );

  const googleCalendarUrl = (() => {
    if (!booking) return '';
    const [year, month, day] = booking.booked_date.split('-').map(Number);
    const [hour, minute] = booking.booked_time.split(':').map(Number);
    const pad = (n) => String(n).padStart(2, '0');
    const startStr = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
    const endDate = new Date(year, month - 1, day, hour, minute + 15);
    const endStr = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
    const title = `Screening Call — ${role.job_title} at ${role.company_name}`;
    const details = `15-minute screening call for ${role.job_title} at ${role.company_name}.${booking.meet_link ? `\n\nJoin Meeting: ${booking.meet_link}` : ''}`;
    const params = new URLSearchParams({
      text: title,
      dates: `${startStr}/${endStr}`,
      details,
      ...(booking.meet_link ? { location: booking.meet_link } : {})
    });
    return `https://calendar.google.com/calendar/r/eventedit?${params.toString()}`;
  })();

  // Confirmed
  if (booking) {
    return (
      <div>
        <Header />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-green-600 text-2xl font-bold">✓</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Call Booked</h1>
          <p className="text-slate-500 text-sm mb-8">Your screening call has been scheduled. You will be contacted shortly.</p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-6 py-5 text-left inline-block mb-6">
            {[
              { label: 'Date', value: formatDateLong(booking.booked_date) },
              { label: 'Time', value: `${booking.booked_time} ${userTimezone} (15 min)` },
              { label: 'Role', value: `${role.job_title} at ${role.company_name}` }
            ].map(({ label, value }) => (
              <div key={label} className="mb-3 last:mb-0">
                <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm font-semibold text-slate-800 mt-0.5">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {booking.meet_link && (
              <a
                href={booking.meet_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#1a73e8] text-white px-6 py-3 rounded-lg font-semibold text-sm hover:bg-[#1557b0] transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>
                Join Meeting
              </a>
            )}
            <a
              href={googleCalendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              Add to Google Calendar
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div>
        <Header />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <p className="text-slate-400 text-sm">Loading available times…</p>
        </div>
      </div>
    );
  }

  // Error or no slots
  if (error || dates.length === 0) {
    return (
      <div>
        <Header />
        <div className="max-w-lg mx-auto px-4 py-24 text-center">
          <p className="text-slate-500 text-sm">{error || 'No available time slots at the moment. Please try again later.'}</p>
        </div>
      </div>
    );
  }

  // Main booking form
  return (
    <div>
      <Header />
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">{role.job_title}</h1>
          <p className="text-slate-500 text-sm mt-1">{role.company_name} — 15-minute screening call</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
          <form onSubmit={handleBook} className="space-y-6">
            {/* Name + Email */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="Your name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  placeholder="you@email.com"
                />
              </div>
            </div>

            {/* Pick a date */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2.5">Pick a date</label>
              <div className="flex gap-2 flex-wrap">
                {dates.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setSelectedDate(d); setSelectedTime(null); }}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedDate === d
                        ? 'bg-[#0d1b2a] text-white border-[#0d1b2a]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {formatDateShort(d)}
                  </button>
                ))}
              </div>
            </div>

            {/* Pick a time */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Pick a time</label>
              <p className="text-xs text-slate-400 mb-2.5">Times shown in {userTimezone}</p>
              <div className="flex gap-2 flex-wrap">
                {timesForDate.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTime(t)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedTime === t
                        ? 'bg-[#0d1b2a] text-white border-[#0d1b2a]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedDate || !selectedTime || submitting}
              className="w-full py-3 bg-[#0d1b2a] text-white rounded-xl font-semibold text-sm hover:bg-[#162a40] disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              {submitting ? 'Booking…' : 'Book Call'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default BookingPage;
