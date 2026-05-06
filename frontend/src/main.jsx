import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart3,
  CheckCircle2,
  FolderKanban,
  LogOut,
  Plus,
  Users,
} from 'lucide-react';
import { api, clearSession, getToken, getUser, setSession } from './api';
import './styles.css';

const statuses = ['TODO', 'IN_PROGRESS', 'DONE'];

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

  async function loadData() {
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
  }

  useEffect(() => {
    loadData();
  }, [token]);

  const visibleTasks = useMemo(() => {
    if (!selectedProject) return tasks;
    return tasks.filter((task) => String(task.projectId) === String(selectedProject));
  }, [tasks, selectedProject]);

  function logout() {
    clearSession();
    setUser(null);
    setToken(null);
  }

  if (!token) {
    return (
      <AuthPage
        onLogin={(data) => {
          setSession(data);
          setUser(data.user);
          setToken(data.token);
        }}
      />
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Team Task Manager</p>
          <h1>Welcome, {user.name}</h1>
        </div>
        <div className="top-actions">
          <span className="role-pill">{user.role}</span>
          <button className="icon-button" title="Logout" onClick={logout}>
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {error && <div className="notice">{error}</div>}

      <section className="stats-grid">
        <Stat icon={<FolderKanban />} label="Projects" value={dashboard?.totalProjects ?? 0} />
        <Stat icon={<CheckCircle2 />} label="Tasks" value={dashboard?.totalTasks ?? 0} />
        <Stat icon={<BarChart3 />} label="In progress" value={dashboard?.inProgressTasks ?? 0} />
        <Stat icon={<Users />} label="Overdue" value={dashboard?.overdueTasks ?? 0} />
      </section>

      <section className="workspace">
        <div className="left-panel">
          <PanelTitle title="Projects" subtitle={loading ? 'Refreshing...' : `${projects.length} available`} />
          {isAdmin && <ProjectForm onCreated={loadData} />}
          <div className="project-list">
            <button
              className={!selectedProject ? 'project-row active' : 'project-row'}
              onClick={() => setSelectedProject('')}
            >
              <span>All tasks</span>
              <small>{tasks.length}</small>
            </button>
            {projects.map((project) => (
              <button
                key={project.id}
                className={String(selectedProject) === String(project.id) ? 'project-row active' : 'project-row'}
                onClick={() => setSelectedProject(project.id)}
              >
                <span>{project.name}</span>
                <small>{project.members.length} members</small>
              </button>
            ))}
          </div>
        </div>

        <div className="main-panel">
          <PanelTitle title="Tasks" subtitle={`${visibleTasks.length} shown`} />
          {isAdmin && (
            <TaskForm
              projects={projects}
              users={users}
              selectedProject={selectedProject}
              onCreated={loadData}
            />
          )}
          <div className="task-list">
            {visibleTasks.map((task) => (
              <TaskItem key={task.id} task={task} currentUser={user} onChanged={loadData} />
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
  );
}

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'MEMBER' });
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    try {
      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const body = mode === 'login'
        ? { email: form.email, password: form.password }
        : form;
      const data = await api(path, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      onLogin(data);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <p className="eyebrow">Full-stack assignment</p>
        <h1>Team Task Manager</h1>
        <div className="segmented">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>
            Login
          </button>
          <button type="button" className={mode === 'signup' ? 'active' : ''} onClick={() => setMode('signup')}>
            Signup
          </button>
        </div>
        {mode === 'signup' && (
          <>
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <label>Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </>
        )}
        <label>Email</label>
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <label>Password</label>
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {error && <div className="notice">{error}</div>}
        <button className="primary-button" type="submit">
          {mode === 'login' ? 'Login' : 'Create account'}
        </button>
      </form>
    </main>
  );
}

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

function ProjectForm({ onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  async function submit(event) {
    event.preventDefault();
    await api('/api/projects', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
    setName('');
    setDescription('');
    onCreated();
  }

  return (
    <form className="compact-form" onSubmit={submit}>
      <input placeholder="Project name" value={name} onChange={(e) => setName(e.target.value)} />
      <textarea placeholder="Short description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <button className="secondary-button" type="submit">
        <Plus size={16} /> Project
      </button>
    </form>
  );
}

function TaskForm({ projects, users, selectedProject, onCreated }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    projectId: selectedProject || '',
    assigneeId: '',
    dueDate: '',
  });

  useEffect(() => {
    if (selectedProject) setForm((prev) => ({ ...prev, projectId: selectedProject }));
  }, [selectedProject]);

  async function submit(event) {
    event.preventDefault();
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
  }

  return (
    <form className="task-form" onSubmit={submit}>
      <input placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}>
        <option value="">Project</option>
        {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
      </select>
      <select value={form.assigneeId} onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}>
        <option value="">Assignee</option>
        {users.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
      </select>
      <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
      <textarea placeholder="Task details" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <button className="primary-button" type="submit">
        <Plus size={16} /> Add task
      </button>
    </form>
  );
}

function TaskItem({ task, currentUser, onChanged }) {
  const canUpdate = currentUser.role === 'ADMIN' || currentUser.id === task.assignee.id;

  async function updateStatus(status) {
    await api(`/api/tasks/${task.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    onChanged();
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
          <span>{task.assignee.name}</span>
          <span>{task.dueDate || 'No due date'}</span>
        </div>
      </div>
      {canUpdate && (
        <select value={task.status} onChange={(e) => updateStatus(e.target.value)}>
          {statuses.map((status) => <option key={status} value={status}>{status.replace('_', ' ')}</option>)}
        </select>
      )}
    </article>
  );
}

function TeamList({ users, projects, canManage, onChanged }) {
  const [projectId, setProjectId] = useState('');
  const [userId, setUserId] = useState('');

  async function addMember(event) {
    event.preventDefault();
    if (!projectId || !userId) return;
    await api(`/api/projects/${projectId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId: Number(userId) }),
    });
    setUserId('');
    onChanged();
  }

  return (
    <>
      {canManage && (
        <form className="compact-form" onSubmit={addMember}>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">User</option>
            {users.map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
          <button className="secondary-button" type="submit">
            <Plus size={16} /> Member
          </button>
        </form>
      )}
      <div className="team-list">
        {users.map((member) => (
          <div className="member-row" key={member.id}>
            <strong>{member.name}</strong>
            <span>{member.email}</span>
            <small>{member.role}</small>
          </div>
        ))}
      </div>
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);
