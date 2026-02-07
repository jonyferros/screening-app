import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Screenings from './pages/Screenings';
import ScreeningDetail from './pages/ScreeningDetail';
import CreateRole from './pages/CreateRole';
import ScreeningForm from './pages/ScreeningForm';
import BookingPage from './pages/BookingPage';
import Settings from './pages/Settings';
import Success from './pages/Success';
import Login from './pages/Login';
// Register removed - invite only system
import MeetingRoom from './pages/MeetingRoom';
import OutreachDashboard from './pages/OutreachDashboard';
import OutreachRoleDetail from './pages/OutreachRoleDetail';
import CandidateUpload from './pages/CandidateUpload';
import OutreachThankYou from './pages/OutreachThankYou';
import OutreachSequenceEditor from './pages/OutreachSequenceEditor';
import AdminUsers from './pages/AdminUsers';
import LinkedInQueue from './pages/LinkedInQueue';
import Reports from './pages/Reports';

function App() {
  const [user, setUser] = useState(() => localStorage.getItem('email'));
  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('isAdmin') === 'true');

  const handleLogin = (email, admin = false) => {
    setUser(email);
    setIsAdmin(admin);
    localStorage.setItem('isAdmin', admin ? 'true' : 'false');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    localStorage.removeItem('isAdmin');
    setUser(null);
    setIsAdmin(false);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-100">
        {user && (
          <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
            <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg width="30" height="30" viewBox="0 0 36 36" fill="none">
                  <circle cx="18" cy="18" r="18" fill="#001463" />
                  <polygon points="18,8 22,14 30,14 24,19 26,27 18,23 10,27 12,19 6,14 14,14" fill="white" />
                </svg>
                <Link to="/" className="text-lg font-bold text-slate-800 tracking-tight">starcircle</Link>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/" className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors">My Projects</Link>
                <Link to="/outreach" className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors">Outreach</Link>
                <Link to="/reports" className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors">Reports</Link>
                <Link to="/create" className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors">Create</Link>
                <Link to="/settings" className="text-sm text-slate-600 hover:text-slate-800 font-medium transition-colors">Settings</Link>
                {isAdmin && (
                  <Link to="/admin/users" className="text-sm text-purple-600 hover:text-purple-800 font-medium transition-colors">Admin</Link>
                )}
                <span className="text-slate-300">|</span>
                <span className="text-sm text-slate-500">{user}</span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-slate-500 hover:text-slate-700 font-medium transition-colors"
                >
                  Log out
                </button>
              </div>
            </div>
          </nav>
        )}

        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
          <Route path="/register" element={<Navigate to="/login" />} />
          <Route path="/" element={user ? <Screenings /> : <Navigate to="/login" />} />
          <Route path="/screenings/:roleId" element={user ? <ScreeningDetail /> : <Navigate to="/login" />} />
          <Route path="/create" element={user ? <CreateRole /> : <Navigate to="/login" />} />
          <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
          <Route path="/meeting/:bookingId" element={user ? <MeetingRoom /> : <Navigate to="/login" />} />
          <Route path="/outreach" element={user ? <OutreachDashboard /> : <Navigate to="/login" />} />
          <Route path="/outreach/:roleId" element={user ? <OutreachRoleDetail /> : <Navigate to="/login" />} />
          <Route path="/outreach/:roleId/upload" element={user ? <CandidateUpload /> : <Navigate to="/login" />} />
          <Route path="/outreach/:roleId/sequence" element={user ? <OutreachSequenceEditor /> : <Navigate to="/login" />} />
          <Route path="/screen/:slug" element={<ScreeningForm />} />
          <Route path="/book/:slug" element={<BookingPage />} />
          <Route path="/success" element={<Success />} />
          <Route path="/outreach/thank-you" element={<OutreachThankYou />} />
          <Route path="/admin/users" element={user && isAdmin ? <AdminUsers /> : <Navigate to="/" />} />
          <Route path="/reports" element={user ? <Reports /> : <Navigate to="/login" />} />
          <Route path="/linkedin-queue/:token" element={<LinkedInQueue />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
