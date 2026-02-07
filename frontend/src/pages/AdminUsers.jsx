import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitePassword, setInvitePassword] = useState('');
  const [inviteIsAdmin, setInviteIsAdmin] = useState(false);
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId, currentStatus) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ isAdmin: !currentStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers(prev => prev.map(u =>
        u.id === userId ? { ...u, is_admin: !currentStatus } : u
      ));
    } catch (err) {
      alert('Failed to update user: ' + err.message);
    }
  };

  const inviteUser = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          email: inviteEmail,
          password: invitePassword,
          isAdmin: inviteIsAdmin
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers(prev => [data.user, ...prev]);
      setShowInviteForm(false);
      setInviteEmail('');
      setInvitePassword('');
      setInviteIsAdmin(false);
    } catch (err) {
      alert('Failed to create user: ' + err.message);
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-red-600 text-sm mb-4">{error}</p>
        <Link to="/" className="text-blue-600 text-sm hover:underline">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 text-sm">Manage user accounts and admin access</p>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors"
        >
          + Invite User
        </button>
      </div>

      {showInviteForm && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Invite New User</h3>
          <form onSubmit={inviteUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Temporary Password</label>
              <input
                type="text"
                required
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter a temporary password"
              />
              <p className="text-xs text-slate-400 mt-1">Share this password with the user so they can log in</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="inviteIsAdmin"
                checked={inviteIsAdmin}
                onChange={(e) => setInviteIsAdmin(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500"
              />
              <label htmlFor="inviteIsAdmin" className="text-sm text-slate-700">Grant admin privileges</label>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-slate-400 transition-colors"
              >
                {inviting ? 'Creating...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Email</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-slate-600">Joined</th>
              <th className="text-right px-4 py-3 font-semibold text-slate-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="px-4 py-3">
                  <span className="font-medium text-slate-800">{user.email}</span>
                </td>
                <td className="px-4 py-3">
                  {user.is_admin ? (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                      Admin
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                      User
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleAdmin(user.id, user.is_admin)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                      user.is_admin
                        ? 'border-red-200 text-red-600 hover:bg-red-50'
                        : 'border-purple-200 text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    {user.is_admin ? 'Remove Admin' : 'Make Admin'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminUsers;
