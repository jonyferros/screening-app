import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import CreateRole from './pages/CreateRole';
import ScreeningForm from './pages/ScreeningForm';
import Success from './pages/Success';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const [user, setUser] = useState(() => localStorage.getItem('email'));

  const handleLogin = (email) => setUser(email);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setUser(null);
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
          <Route path="/register" element={user ? <Navigate to="/" /> : <Register onLogin={handleLogin} />} />
          <Route path="/" element={user ? <CreateRole /> : <Navigate to="/login" />} />
          <Route path="/screen/:slug" element={<ScreeningForm />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
