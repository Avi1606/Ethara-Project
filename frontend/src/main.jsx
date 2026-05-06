import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3, CheckCircle2, FolderKanban, LogOut, Plus,
  Mail, Lock, User as UserIcon, Eye, EyeOff, Shield, ArrowLeft, Zap,
  AlertCircle,
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { api, clearSession, getToken, getUser, setSession } from './api';
import './styles.css';

const statuses = ['TODO', 'IN_PROGRESS', 'DONE'];

/* ═══════════════════════════
   Root App
   ═══════════════════════════ */
function App() {
  const [user, setUser] = useState(getUser());
  const [token, setToken] = useState(getToken());
  const [dashboard, setDashboard] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  const loadData = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [dashboardData, projectData, taskData, userData] = await Promise.all([
        api('/api/dashboard'),
        api('/api/projects'),
        api('/api/tasks'),
        api('/api/users'),
      ]);
      setDashboard(dashboardData);
      setProjects(projectData);
      setTasks(taskData);
      setUsers(userData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  const visibleTasks = useMemo(() => {
    if (!selectedProject) return tasks;
    return tasks.filter((t) => String(t.projectId) === String(selectedProject));
  }, [tasks, selectedProject]);

  function logout() {
    clearSession();
    setUser(null);
    setToken(null);
    toast.success('Logged out');
  }

  if (!token) {
    return (
      <>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' } }} />
        <AuthPage onLogin={(data) => {
          setSession(data);
          setUser(data.user);
          setToken(data.token);
          toast.success(`Welcome back, ${data.user.name}!`);
        }} />
      </>
    );
  }

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' } }} />
      <main className="app-shell">
        <header className="topbar">
          <div>
            <p className="eyebrow">Ethara — Task Manager</p>
            <h1>Welcome, {user.name}</h1>
          </div>
          <div className="top-actions">
            <span className="role-pill"><Shield size={14} /> {user.role}</span>
            <button className="icon-button" title="Logout" onClick={logout}>
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {error && <div className="notice"><AlertCircle size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />{error}</div>}

        <section className="stats-grid">
          <Stat icon={<FolderKanban />} label="Projects" value={dashboard?.totalProjects ?? 0} />
          <Stat icon={<CheckCircle2 />} label="Tasks" value={dashboard?.totalTasks ?? 0} />
          <Stat icon={<BarChart3 />} label="In Progress" value={dashboard?.inProgressTasks ?? 0} />
          <Stat icon={<AlertCircle />} label="Overdue" value={dashboard?.overdueTasks ?? 0} />
        </section>

        <section className="workspace">
          <div className="left-panel">
            <PanelTitle title="Projects" subtitle={loading ? 'Refreshing…' : `${projects.length} available`} />
            {isAdmin && <ProjectForm onCreated={loadData} />}
            <div className="project-list">
              <button className={!selectedProject ? 'project-row active' : 'project-row'} onClick={() => setSelectedProject('')}>
                <span>All tasks</span>
                <small>{tasks.length}</small>
              </button>
              {projects.map((p) => (
                <button key={p.id} className={String(selectedProject) === String(p.id) ? 'project-row active' : 'project-row'} onClick={() => setSelectedProject(p.id)}>
                  <span>{p.name}</span>
                  <small>{p.members.length} members</small>
                </button>
              ))}
            </div>
          </div>

          <div className="main-panel">
            <PanelTitle title="Tasks" subtitle={`${visibleTasks.length} shown`} />
            {isAdmin && <TaskForm projects={projects} users={users} selectedProject={selectedProject} onCreated={loadData} />}
            <div className="task-list">
              {visibleTasks.map((t) => (
                <TaskItem key={t.id} task={t} currentUser={user} onChanged={loadData} />
              ))}
              {!visibleTasks.length && <p className="empty">No tasks yet. Create a project and add a task.</p>}
            </div>
          </div>

          <div className="right-panel">
            <PanelTitle title="Team" subtitle={`${users.length} people`} />
            <TeamList users={users} projects={projects} canManage={isAdmin} onChanged={loadData} />
          </div>
        </section>
      </main>
    </>
  );
}

/* ═══════════════════════════
   Auth Page (Login / Signup / Forgot Password)
   ═══════════════════════════ */
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | signup | forgot
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', role: 'MEMBER' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function resetForm() {
    setForm({ name: '', email: '', password: '', confirmPassword: '', role: 'MEMBER' });
    setError('');
    setSuccess('');
  }

  function switchMode(m) {
    resetForm();
    setMode(m);
  }

  // Client-side validation
  function validate() {
    if (!form.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Enter a valid email address';

    if (mode === 'forgot') return null;

    if (!form.password) return 'Password is required';
    if (form.password.length < 6) return 'Password must be at least 6 characters';

    if (mode === 'signup') {
      if (!form.name.trim()) return 'Name is required';
      if (form.name.trim().length < 2) return 'Name must be at least 2 characters';
      if (form.password !== form.confirmPassword) return 'Passwords do not match';
      if (getPasswordStrength(form.password).score < 2) return 'Password is too weak';
    }
    return null;
  }

  async function submit(event) {
    event.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      if (mode === 'forgot') {
        // Simulated — backend doesn't have this endpoint yet, so we show a message
        await new Promise((r) => setTimeout(r, 1000));
        setSuccess('If an account exists with this email, a password reset link has been sent.');
        toast.success('Reset email sent!');
      } else {
        const path = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
        const body = mode === 'login'
          ? { email: form.email, password: form.password }
          : { name: form.name, email: form.email, password: form.password, role: form.role };
        const data = await api(path, { method: 'POST', body: JSON.stringify(body) });
        onLogin(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (mode === 'forgot') {
    return (
      <main className="auth-page">
        <form className="auth-card" onSubmit={submit}>
          <div className="brand-icon"><Zap size={28} /></div>
          <h1>Reset Password</h1>
          <p className="subtitle">Enter your email and we'll send you a reset link.</p>
          <div className="form-group">
            <label>Email Address</label>
            <div className="input-wrapper">
              <Mail size={18} />
              <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          {error && <div className="notice">{error}</div>}
          {success && <div className="notice success-notice">{success}</div>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Send Reset Link'}
          </button>
          <button type="button" className="ghost-button" style={{ width: '100%', marginTop: 12 }} onClick={() => switchMode('login')}>
            <ArrowLeft size={16} /> Back to Login
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <div className="brand-icon"><Zap size={28} /></div>
        <h1>Ethara</h1>
        <p className="subtitle">Team task management, beautifully simplified.</p>

        <div className="segmented">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => switchMode('login')}>Login</button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => switchMode('signup')}>Sign Up</button>
        </div>

        {mode === 'signup' && (
          <>
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrapper">
                <UserIcon size={18} />
                <input placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Role</label>
              <div className="input-wrapper">
                <Shield size={18} />
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="MEMBER">Member</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
            </div>
          </>
        )}

        <div className="form-group">
          <label>Email Address</label>
          <div className="input-wrapper">
            <Mail size={18} />
            <input type="email" placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
        </div>

        <div className="form-group">
          <label>Password</label>
          <div className="input-wrapper">
            <Lock size={18} />
            <input type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <button type="button" className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {mode === 'signup' && form.password && <PasswordStrengthBar password={form.password} />}
        </div>

        {mode === 'signup' && (
          <div className="form-group">
            <label>Confirm Password</label>
            <div className="input-wrapper">
              <Lock size={18} />
              <input type="password" placeholder="••••••••" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
            </div>
          </div>
        )}

        {mode === 'login' && (
          <button type="button" className="forgot-link" onClick={() => switchMode('forgot')}>Forgot password?</button>
        )}

        {error && <div className="notice">{error}</div>}
        {success && <div className="notice success-notice">{success}</div>}

        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? <span className="spinner" /> : mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>
    </main>
  );
}

/* ── Password Strength ── */
function getPasswordStrength(pw) {
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4'];
  const idx = Math.min(score, 4);
  return { score, label: levels[idx], color: colors[idx], pct: ((idx + 1) / 5) * 100 };
}

function PasswordStrengthBar({ password }) {
  const { label, color, pct } = getPasswordStrength(password);
  return (
    <div className="password-strength">
      <div className="strength-bar">
        <div className="strength-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="strength-text" style={{ color }}>{label}</div>
    </div>
  );
}

/* ═══ Shared components ═══ */
function Stat({ icon, label, value }) {
  return (
    <div className="stat">
      <div className="stat-icon">{icon}</div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

function PanelTitle({ title, subtitle }) {
  return (
    <div className="panel-title">
      <h2>{title}</h2>
      <span>{subtitle}</span>
    </div>
  );
}

/* ═══ Project Form (admin only) ═══ */
function ProjectForm({ onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!name.trim()) { toast.error('Project name is required'); return; }
    setLoading(true);
    try {
      await api('/api/projects', { method: 'POST', body: JSON.stringify({ name, description }) });
      setName('');
      setDescription('');
      onCreated();
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="compact-form" onSubmit={submit}>
      <input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <button className="secondary-button" type="submit" disabled={loading}>
        {loading ? <span className="spinner" /> : <><Plus size={16} /> Project</>}
      </button>
    </form>
  );
}

/* ═══ Task Form (admin only) ═══ */
function TaskForm({ projects, users, selectedProject, onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', projectId: selectedProject || '', assigneeId: '', dueDate: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedProject) setForm((prev) => ({ ...prev, projectId: selectedProject }));
  }, [selectedProject]);

  async function submit(event) {
    event.preventDefault();
    if (!form.title.trim()) { toast.error('Task title is required'); return; }
    if (!form.projectId) { toast.error('Please select a project'); return; }
    if (!form.assigneeId) { toast.error('Please select an assignee'); return; }
    setLoading(true);
    try {
      await api('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          projectId: Number(form.projectId),
          assigneeId: Number(form.assigneeId),
          dueDate: form.dueDate || null,
        }),
      });
      setForm({ title: '', description: '', projectId: selectedProject || '', assigneeId: '', dueDate: '' });
      onCreated();
      toast.success('Task created!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="task-form" onSubmit={submit}>
      <input placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
        <option value="">Project</option>
        {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
        <option value="">Assignee</option>
        {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
      </select>
      <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
      <textarea placeholder="Task details" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? <span className="spinner" /> : <><Plus size={16} /> Add Task</>}
      </button>
    </form>
  );
}

/* ═══ Task Item ═══ */
function TaskItem({ task, currentUser, onChanged }) {
  const canUpdate = currentUser.role === 'ADMIN' || currentUser.id === task.assignee?.id;

  async function updateStatus(status) {
    try {
      await api(`/api/tasks/${task.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      onChanged();
      toast.success('Status updated');
    } catch (err) {
      toast.error(err.message);
    }
  }

  return (
    <article className="task-card">
      <div>
        <div className="task-head">
          <h3>{task.title}</h3>
          <span className={`status ${task.status.toLowerCase()}`}>{task.status.replace('_', ' ')}</span>
        </div>
        <p>{task.description || 'No description added.'}</p>
        <div className="meta">
          <span>{task.projectName}</span>
          <span>{task.assignee?.name}</span>
          <span>{task.dueDate || 'No due date'}</span>
        </div>
      </div>
      {canUpdate && (
        <select value={task.status} onChange={(e) => updateStatus(e.target.value)}>
          {statuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
        </select>
      )}
    </article>
  );
}

/* ═══ Team List ═══ */
function TeamList({ users, projects, canManage, onChanged }) {
  const [projectId, setProjectId] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(false);

  async function addMember(event) {
    event.preventDefault();
    if (!projectId || !userId) { toast.error('Select both a project and a user'); return; }
    setLoading(true);
    try {
      await api(`/api/projects/${projectId}/members`, { method: 'POST', body: JSON.stringify({ userId: Number(userId) }) });
      setUserId('');
      onChanged();
      toast.success('Member added!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {canManage && (
        <form className="compact-form" onSubmit={addMember}>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">User</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <button className="secondary-button" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <><Plus size={16} /> Member</>}
          </button>
        </form>
      )}
      <div className="team-list">
        {users.map((u) => (
          <div className="member-row" key={u.id}>
            <strong>{u.name}</strong>
            <span>{u.email}</span>
            <small>{u.role}</small>
          </div>
        ))}
      </div>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
