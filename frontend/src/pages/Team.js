import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const ROLE_BADGE = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  staff: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
};

const getInitials = (name) => name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

export default function Team() {
  const { user: currentUser } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'staff' });
  const [inviting, setInviting] = useState(false);
  const [tempPassword, setTempPassword] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  const fetchMembers = async () => {
    try {
      const { data } = await api.get('/team');
      setMembers(data);
    } catch {
      toast.error('Failed to load team');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMembers(); }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    try {
      const { data } = await api.post('/team/invite', form);
      setTempPassword(data.tempPassword);
      toast.success('Team member added!');
      setForm({ name: '', email: '', phone: '', role: 'staff' });
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (id, role) => {
    try {
      await api.put(`/team/${id}/role`, { role });
      toast.success('Role updated');
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update role');
    }
  };

  const handleToggleStatus = async (id, isActive) => {
    try {
      await api.put(`/team/${id}/status`, { isActive });
      toast.success(isActive ? 'Member activated' : 'Member deactivated');
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/team/${deleteId}`);
      toast.success('Member removed');
      setDeleteId(null);
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove member');
    }
  };

  const isAdmin = currentUser?.role === 'admin';

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Team Management</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{members.length} members</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowInvite(true)} className="btn-primary text-sm">
            + Add Member
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: members.length, icon: '👥' },
          { label: 'Admins', value: members.filter(m => m.role === 'admin').length, icon: '👑' },
          { label: 'Staff', value: members.filter(m => m.role === 'staff').length, icon: '🧑‍💼' },
          { label: 'Active', value: members.filter(m => m.isActive !== false).length, icon: '✅' },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-xl font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Member</th>
                <th className="text-left px-4 py-3 font-medium">Contact</th>
                <th className="text-left px-4 py-3 font-medium">Role</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Joined</th>
                {isAdmin && <th className="text-left px-4 py-3 font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">Loading...</td></tr>
              ) : members.map((m) => (
                <tr key={m._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${m.isActive === false ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                        {getInitials(m.name)}
                      </div>
                      <div>
                        <p className="font-medium">{m.name}
                          {m._id === currentUser?._id && <span className="ml-2 text-xs text-gray-400">(you)</span>}
                        </p>
                        <p className="text-xs text-gray-400">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {m.phone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    {isAdmin && m._id !== currentUser?._id ? (
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m._id, e.target.value)}
                        className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-800"
                      >
                        <option value="admin">Admin</option>
                        <option value="staff">Staff</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_BADGE[m.role]}`}>
                        {m.role === 'admin' ? '👑 Admin' : '🧑‍💼 Staff'}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${m.isActive !== false ? 'bg-green-500' : 'bg-red-400'}`} />
                      <span className="text-xs text-gray-500">{m.isActive !== false ? 'Active' : 'Inactive'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3">
                      {m._id !== currentUser?._id && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleStatus(m._id, m.isActive === false)}
                            className={`text-xs px-2 py-1 rounded font-medium ${m.isActive !== false ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                          >
                            {m.isActive !== false ? 'Deactivate' : 'Activate'}
                          </button>
                          <button
                            onClick={() => setDeleteId(m._id)}
                            className="text-xs px-2 py-1 rounded font-medium bg-red-50 text-red-600 hover:bg-red-100"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold">Add Team Member</h2>
              <button onClick={() => { setShowInvite(false); setTempPassword(null); }} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            {tempPassword ? (
              <div className="p-5 text-center space-y-4">
                <div className="text-5xl">🎉</div>
                <h3 className="font-bold text-lg">Member Added!</h3>
                <p className="text-gray-500 text-sm">Share these credentials with the new member:</p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2 text-left">
                  <p className="text-sm"><span className="text-gray-500">Email:</span> <span className="font-medium">{form.email || 'Check above'}</span></p>
                  <p className="text-sm"><span className="text-gray-500">Temp Password:</span> <span className="font-bold text-blue-600 font-mono text-lg">{tempPassword}</span></p>
                </div>
                <p className="text-xs text-gray-400">Ask them to change the password after first login.</p>
                <button onClick={() => { setShowInvite(false); setTempPassword(null); }} className="btn-primary w-full">Done</button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input className="input-field" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email *</label>
                  <input type="email" className="input-field" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input className="input-field" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role *</label>
                  <select className="input-field" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                    <option value="staff">Staff</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowInvite(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" className="btn-primary flex-1" disabled={inviting}>
                    {inviting ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="card max-w-sm w-full text-center space-y-4">
            <p className="text-lg font-semibold">Remove this team member?</p>
            <p className="text-gray-500 text-sm">They will lose access to the system.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={handleDelete} className="btn-danger flex-1">Remove</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
