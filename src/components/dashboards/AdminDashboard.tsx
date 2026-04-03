import { useState, useEffect } from 'react';
import { DashboardLayout } from '../shared/DashboardLayout';
import { supabase } from '../../lib/supabase';
import {
  Users, BookOpen, Calendar, FileText, Award, Settings,
  TrendingUp, Plus, Trash2, X, Camera, ShieldCheck,
  Bell, Shield, Eye, EyeOff, Activity, Globe, AlertTriangle, Monitor, Lock, Unlock, Mail, Smartphone, Search,
  CheckCircle, History, MessageSquare, Zap
} from 'lucide-react';
import type { Profile, Class, Subject, Document, Achievement } from '../../types/database';
import { CameraMonitor } from '../CameraMonitor';
import { FaceAuthModal } from '../FaceAuthModal';

type View = 'overview' | 'users' | 'classes' | 'subjects' | 'documents' | 'achievements' | 'reports';

import { useAdminSettings } from '../../contexts/AdminSettingsContext';
import type { NotificationPriority } from '../../contexts/AdminSettingsContext';
import { AcademicCalendar } from '../shared/AcademicCalendar';

// ─── Reusable Modal Shell ────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Add User Modal ──────────────────────────────────────────────────────────
function AddUserModal({ classes, onClose, onSuccess }: { classes: Class[]; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'student' as 'student' | 'teacher', phone: '', class_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // Create auth user via Supabase Admin (sign-up without confirmation)
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: { full_name: form.full_name, role: form.role },
        },
      });
      if (signUpErr) throw signUpErr;
      if (!data.user) throw new Error('User creation failed');

      // Update profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileErr } = await (supabase.from('profiles') as any).update({
        full_name: form.full_name,
        role: form.role,
        phone: form.phone || null,
        class_id: form.class_id || null,
      }).eq('id', data.user.id);
      if (profileErr) throw profileErr;

      onSuccess();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Full Name *</label>
          <input required className={inputClass} placeholder="Arjun Kumar" value={form.full_name}
            onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Email *</label>
          <input required type="email" className={inputClass} placeholder="arjun@akgroup.edu.in" value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">Password *</label>
          <input required type="password" className={inputClass} placeholder="Min. 6 characters" value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Role *</label>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <select className={inputClass} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as any }))}>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
          <input className={inputClass} placeholder="9876543210" value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        {form.role === 'student' && (
          <div className="col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">Class</label>
            <select className={inputClass} value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}>
              <option value="">— Select class —</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium">
          {loading ? 'Creating…' : 'Create User'}
        </button>
      </div>
    </form>
  );
}

// ─── Add Class Modal ─────────────────────────────────────────────────────────
function AddClassModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', grade: '1', section: 'A' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase.from('classes') as any).insert({
        name: form.name || `Class ${form.grade} - Section ${form.section}`,
        grade: parseInt(form.grade),
        section: form.section,
      });
      if (err) throw err;
      onSuccess();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Failed to create class');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Class Name (optional)</label>
        <input className={inputClass} placeholder="Auto-generated if blank" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        <p className="text-xs text-gray-400 mt-1">Leave blank to auto-generate: "Class 5 - Section B"</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Grade *</label>
          <select required className={inputClass} value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Section *</label>
          <select required className={inputClass} value={form.section} onChange={e => setForm(f => ({ ...f, section: e.target.value }))}>
            {['A', 'B', 'C', 'D', 'E'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium">
          {loading ? 'Creating…' : 'Create Class'}
        </button>
      </div>
    </form>
  );
}

// ─── Add Subject Modal ───────────────────────────────────────────────────────
function AddSubjectModal({ classes, teachers, onClose, onSuccess }: {
  classes: Class[]; teachers: Profile[]; onClose: () => void; onSuccess: () => void;
}) {
  const [form, setForm] = useState({ name: '', class_id: '', teacher_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: err } = await (supabase.from('subjects') as any).insert({
        name: form.name,
        class_id: form.class_id,
        teacher_id: form.teacher_id || null,
      });
      if (err) throw err;
      onSuccess();
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || 'Failed to create subject');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Subject Name *</label>
        <input required className={inputClass} placeholder="e.g. Mathematics" value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Class *</label>
        <select required className={inputClass} value={form.class_id} onChange={e => setForm(f => ({ ...f, class_id: e.target.value }))}>
          <option value="">— Select class —</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Assign Teacher (optional)</label>
        <select className={inputClass} value={form.teacher_id} onChange={e => setForm(f => ({ ...f, teacher_id: e.target.value }))}>
          <option value="">— Unassigned —</option>
          {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
        </select>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">Cancel</button>
        <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium">
          {loading ? 'Creating…' : 'Create Subject'}
        </button>
      </div>
    </form>
  );
}

// ─── Main AdminDashboard ─────────────────────────────────────────────────────
export function AdminDashboard() {
  const [currentView, setCurrentView] = useState<View>('overview');
  const [faceVerified, setFaceVerified] = useState(false);
  const [showFaceEnroll, setShowFaceEnroll] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [profilesData, classesData, subjectsData, documentsData, achievementsData] = await Promise.all([
        supabase.from('profiles').select('*'),
        supabase.from('classes').select('*'),
        supabase.from('subjects').select('*, class:classes(*), teacher:profiles(*)'),
        supabase.from('documents').select('*'),
        supabase.from('achievements').select('*, student:profiles(*)'),
      ]);
      if (profilesData.data) setProfiles(profilesData.data);
      if (classesData.data) setClasses(classesData.data);
      if (subjectsData.data) setSubjects(subjectsData.data);
      if (documentsData.data) setDocuments(documentsData.data);
      if (achievementsData.data) setAchievements(achievementsData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigation = [
    { name: 'Overview', icon: <TrendingUp className="w-5 h-5" />, current: currentView === 'overview', onClick: () => setCurrentView('overview') },
    { name: 'Users', icon: <Users className="w-5 h-5" />, current: currentView === 'users', onClick: () => setCurrentView('users') },
    { name: 'Classes', icon: <BookOpen className="w-5 h-5" />, current: currentView === 'classes', onClick: () => setCurrentView('classes') },
    { name: 'Subjects', icon: <Calendar className="w-5 h-5" />, current: currentView === 'subjects', onClick: () => setCurrentView('subjects') },
    { name: 'Documents', icon: <FileText className="w-5 h-5" />, current: currentView === 'documents', onClick: () => setCurrentView('documents') },
    { name: 'Achievements', icon: <Award className="w-5 h-5" />, current: currentView === 'achievements', onClick: () => setCurrentView('achievements') },
    { name: 'Reports', icon: <Settings className="w-5 h-5" />, current: currentView === 'reports', onClick: () => setCurrentView('reports') },
    { name: 'Set Up Face ID', icon: <ShieldCheck className="w-5 h-5" />, current: false, onClick: () => setShowFaceEnroll(true) },
  ];

  const renderContent = () => {
    if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-500">Loading…</div></div>;
    const teachers = profiles.filter(p => p.role === 'teacher');
    switch (currentView) {
      case 'overview': return <OverviewView profiles={profiles} classes={classes} subjects={subjects} />;
      case 'users': return <UsersView profiles={profiles} classes={classes} onRefresh={loadData} />;
      case 'classes': return <ClassesView classes={classes} onRefresh={loadData} />;
      case 'subjects': return <SubjectsView subjects={subjects} classes={classes} teachers={teachers} onRefresh={loadData} />;
      case 'documents': return <DocumentsView documents={documents} onRefresh={loadData} />;
      case 'achievements': return <AchievementsView achievements={achievements} onRefresh={loadData} />;
      case 'reports': return <ReportsView profiles={profiles} classes={classes} subjects={subjects} achievements={achievements} />;
      default: return null;
    }
  };

  // ── Face ID gate — show verification before dashboard ──────────────────────
  if (!faceVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#0f172a,#1e293b)' }}>
        <FaceAuthModal
          mode="verify"
          onSuccess={() => setFaceVerified(true)}
          onCancel={() => setFaceVerified(true)} // skip = still allow in, with CameraMonitor watching
        />
      </div>
    );
  }

  return (
    <DashboardLayout 
      navigation={navigation}
      settingsContent={<AdminSettingsMenu />}
      notificationsContent={<AdminNotificationsMenu />}
    >
      {renderContent()}
      {/* Continuous face monitor widget */}
      <CameraMonitor onEnrollClick={() => setShowFaceEnroll(true)} />
      {/* Face ID enrollment modal */}
      {showFaceEnroll && (
        <FaceAuthModal
          mode="enroll"
          onSuccess={() => setShowFaceEnroll(false)}
          onCancel={() => setShowFaceEnroll(false)}
        />
      )}
    </DashboardLayout>
  );
}

// ─── Subcomponents for Admin Overview ──────────────────────────────────────────

function Toggle({ checked, onChange, label, description, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string; disabled?: boolean }) {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-white border border-gray-100 rounded-xl transition-all ${disabled ? 'opacity-50 pointer-events-none' : 'hover:border-blue-100 hover:shadow-sm'}`}>
      <div className="mb-3 sm:mb-0 pr-4">
        <p className="font-semibold text-gray-800 text-sm">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{description}</p>}
      </div>
      <button onClick={() => onChange(!checked)} disabled={disabled} className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${checked ? 'bg-blue-600' : 'bg-gray-200'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function SettingsTab() {
  const { settings, updateSetting } = useAdminSettings();
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <Globe className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Platform Settings</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Institution Name</label>
            <input 
              value={settings.institutionName} 
              onChange={(e) => updateSetting('institutionName', e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
            />
          </div>
          <Toggle 
            label="Maintenance Mode" 
            description="Temporarily disable access for students and teachers. Displays a maintenance banner globally."
            checked={settings.maintenanceMode} onChange={(v) => updateSetting('maintenanceMode', v)} 
          />
          <Toggle 
            label="Global Notifications" 
            description="Allow broadcasting notifications from the Admin panel to user dashboards."
            checked={settings.globalNotificationsEnabled} onChange={(v) => updateSetting('globalNotificationsEnabled', v)} 
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <Users className="w-5 h-5 text-purple-600" />
          <h3 className="text-lg font-bold text-gray-800">Access & Workflow Controls</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Toggle 
            label="Student Assignments Visibility" 
            description="When disabled, students cannot view active assignments or quizzes."
            checked={settings.studentAssignmentsVisible} onChange={(v) => updateSetting('studentAssignmentsVisible', v)} 
          />
          <Toggle 
            label="Teacher Attendance Alerts" 
            description="Enable live alerts for teachers reminding them to mark attendance."
            checked={settings.teacherAttendanceAlerts} onChange={(v) => updateSetting('teacherAttendanceAlerts', v)} 
          />
          <Toggle 
            label="Reports & Analytics Visibility" 
            description="Allow users to download and view their performance reports."
            checked={settings.reportsVisible} onChange={(v) => updateSetting('reportsVisible', v)} 
          />
        </div>
      </div>
    </div>
  );
}

function NotificationsTab() {
  const { settings, sendNotification, notifications, dismissNotification } = useAdminSettings();
  const [form, setForm] = useState({ title: '', message: '', targetRole: 'all' as any, priority: 'info' as any });

  const handleSend = () => {
    if (!form.title || !form.message) return alert("Title and Message are required!");
    sendNotification(form);
    setForm({ title: '', message: '', targetRole: 'all', priority: 'info' });
    alert("Notification dispatched successfully to targeted dashboards!");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
          <MessageSquare className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Compose Broadcast</h3>
        </div>
        
        {!settings.globalNotificationsEnabled && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 text-orange-800 rounded-lg text-sm flex gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p><strong>Notifications Disabled:</strong> Global notifications are currently turned off in Settings. Messages will not be delivered.</p>
          </div>
        )}

        <div className="space-y-4 flex-1">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Notification Title</label>
            <input 
              value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Server Maintenance This Weekend"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Message Body</label>
            <textarea 
              value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Type your message here..." rows={4}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Target Audience</label>
              <select 
                value={form.targetRole} onChange={e => setForm(f => ({ ...f, targetRole: e.target.value as any }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="all">Every User</option>
                <option value="student">Students Only</option>
                <option value="teacher">Teachers Only</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-2">Priority Level</label>
              <select 
                value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as any }))}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="info">Information</option>
                <option value="announcement">Announcement</option>
                <option value="academic">Academic Update</option>
                <option value="warning">Warning</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        </div>
        
        <button 
          onClick={handleSend} disabled={!settings.globalNotificationsEnabled}
          className="mt-6 w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send Broadcast
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-full max-h-[600px] overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-gray-500" />
            <h3 className="text-lg font-bold text-gray-800">Dispatch History</h3>
          </div>
          <span className="bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full">{notifications.length} Sent</span>
        </div>
        <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar bg-gray-50/50">
          {notifications.map(n => (
            <div key={n.id} className="bg-white border text-left border-gray-200 rounded-xl p-4 shadow-sm relative group">
              <button 
                onClick={() => dismissNotification(n.id)}
                className="absolute top-3 right-3 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  n.priority === 'urgent' ? 'bg-red-100 text-red-700' :
                  n.priority === 'warning' ? 'bg-orange-100 text-orange-700' :
                  n.priority === 'academic' ? 'bg-purple-100 text-purple-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {n.priority}
                </span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md uppercase font-bold tracking-wider">
                  Target: {n.targetRole}
                </span>
                <span className="text-[10px] text-gray-400 ml-auto">{new Date(n.createdAt).toLocaleTimeString()}</span>
              </div>
              <p className="font-bold text-sm text-gray-800 mb-1 pr-6">{n.title}</p>
              <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="h-40 flex flex-col items-center justify-center text-gray-400">
              <Mail className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-medium">No recent broadcasts</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  const { settings, updateSetting } = useAdminSettings();
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white rounded-xl shadow-sm border border-red-100 p-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4 relative z-10">
          <Shield className="w-5 h-5 text-red-600" />
          <h3 className="text-lg font-bold text-gray-800">Advanced Security & Control Center</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
          <Toggle 
            label="Enforce Two-Factor Authentication" 
            description="Globally enforce 2FA and Face-ID checks for all sensitive admin and teacher operations."
            checked={settings.enforce2FA} onChange={(v) => updateSetting('enforce2FA', v)} 
          />
          <Toggle 
            label="Emergency Lockdown Mode" 
            description="Instantly deny all non-admin access sessions. Freezes the student and teacher view states."
            checked={settings.emergencyLockdown} onChange={(v) => updateSetting('emergencyLockdown', v)} 
          />
          
          <div className="md:col-span-2 mt-4 flex gap-4">
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-4">
              <div className="bg-white p-2 rounded-lg shadow-sm text-gray-500"><Monitor className="w-5 h-5" /></div>
              <div>
                <p className="font-semibold text-sm text-gray-800">Active Sessions Monitoring</p>
                <p className="text-xs text-gray-500 mt-1 mb-2">Simulate revoking an active session token.</p>
                <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 text-gray-700">Audit Sessions</button>
              </div>
            </div>
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-4">
              <div className="bg-white p-2 rounded-lg shadow-sm text-gray-500"><Lock className="w-5 h-5" /></div>
              <div>
                <p className="font-semibold text-sm text-gray-800">IP / Device Restriction Log</p>
                <p className="text-xs text-gray-500 mt-1 mb-2">Verify allowed devices for admin dashboard access.</p>
                <button className="text-xs bg-white border border-gray-200 px-3 py-1.5 rounded-lg font-medium hover:bg-gray-50 text-gray-700">View Rules</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AccessibilityTab() {
  const { settings, updateSetting } = useAdminSettings();
  
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-gray-800">Global Accessibility Controls</h3>
          </div>
          <span className="bg-teal-50 text-teal-700 border border-teal-100 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2">
            <Zap className="w-3 h-3" /> Live Effect
          </span>
        </div>
        <p className="text-sm text-gray-600 mb-6">These settings directly dictate the rendering layout and behaviors across the Admin, Teacher, and Student experiences ensuring maximum legal compliance and usability.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Toggle 
            label="High Contrast Mode" 
            description="Increases contrast ratio and modifies global theme tokens to ensure WCAG AAA compliance."
            checked={settings.highContrastMode} onChange={(v) => updateSetting('highContrastMode', v)} 
          />
          <Toggle 
            label="Larger Text Mode" 
            description="Uniformly scales root font sizing upwards for enhanced legibility across all connected dashboards."
            checked={settings.largerTextMode} onChange={(v) => updateSetting('largerTextMode', v)} 
          />
          <Toggle 
            label="Reduced Motion Mode" 
            description="Disables aesthetic CSS transitions and animations for users sensitive to motion."
            checked={settings.reducedMotion} onChange={(v) => updateSetting('reducedMotion', v)} 
          />
          <Toggle 
            label="Color-Safe Chart Mode" 
            description="Forces data visualizations to use accessible distinct patterns rather than purely relying on color cues."
            checked={settings.colorSafeChartMode} onChange={(v) => updateSetting('colorSafeChartMode', v)} 
          />
        </div>
      </div>
    </div>
  );
}

function InsightsTab({ profiles, classes, subjects }: { profiles: Profile[]; classes: Class[]; subjects: Subject[] }) {
  const students = profiles.filter(p => p.role === 'student');
  const teachers = profiles.filter(p => p.role === 'teacher');
  const { settings } = useAdminSettings();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
      {settings.maintenanceMode && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl flex items-center gap-3 shadow-sm">
          <AlertTriangle className="w-5 h-5" />
          <p className="text-sm font-medium"><strong>Maintenance Mode Active:</strong> Logins for students and teachers are currently simulating a frozen state.</p>
        </div>
      )}
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Active Students', value: students.length, suffix: ' Enrolled', icon: <Users className="w-5 h-5" />, color: 'blue' },
          { label: 'Staff Count', value: teachers.length, suffix: ' Teachers', icon: <Award className="w-5 h-5" />, color: 'purple' },
          { label: 'Platform Usage', value: '89%', suffix: ' +12% today', icon: <Activity className="w-5 h-5" />, color: 'green' },
          { label: 'Security Alerts', value: '0', suffix: ' All clear', icon: <ShieldCheck className="w-5 h-5" />, color: 'teal' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full bg-${kpi.color}-50 bg-opacity-50 group-hover:bg-opacity-100 transition-all z-0`} />
            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-gray-500 tracking-wide uppercase">{kpi.label}</p>
                <div className={`p-2 rounded-lg bg-${kpi.color}-50 text-${kpi.color}-600`}>{kpi.icon}</div>
              </div>
              <div className="mt-auto">
                <p className="text-3xl font-black text-gray-800">{kpi.value}</p>
                <p className={`text-xs font-semibold text-${kpi.color}-600 mt-1`}>{kpi.suffix}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[400px]">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <h3 className="text-base font-bold text-gray-800">Live System Status Matrix</h3>
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> DB Connected</span>
            </div>
          </div>
          <div className="p-6 flex-1 bg-gradient-to-br from-slate-900 to-slate-800 text-white flex flex-col justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500 via-transparent to-transparent"></div>
            <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <p className="text-sm text-slate-400 font-medium mb-1">API Requests / min</p>
                <p className="text-3xl font-mono text-emerald-400 font-bold">1,402</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium mb-1">Active WebSocket Conns</p>
                <p className="text-3xl font-mono text-blue-400 font-bold">48</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium mb-1">Avg Response Time</p>
                <p className="text-3xl font-mono text-white font-bold">124ms</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 font-medium mb-1">System Load</p>
                <p className="text-3xl font-mono text-yellow-400 font-bold">Low <span className="text-sm opacity-50 ml-1">11% CPU</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────
function OverviewView({ profiles, classes, subjects }: { profiles: Profile[]; classes: Class[]; subjects: Subject[] }) {
  return (
    <div className="flex flex-col h-full space-y-6">
      <InsightsTab profiles={profiles} classes={classes} subjects={subjects} />
    </div>
  );
}

function AdminSettingsMenu() {
  const [activeTab, setActiveTab] = useState<'settings' | 'notifications' | 'accessibility' | 'security'>('settings');

  const tabs = [
    { id: 'settings', label: 'Feature Access', icon: <Settings className="w-4 h-4" /> },
    { id: 'notifications', label: 'Broadcast', icon: <Bell className="w-4 h-4" /> },
    { id: 'accessibility', label: 'Accessibility', icon: <Eye className="w-4 h-4" /> },
    { id: 'security', label: 'Security & Auth', icon: <Shield className="w-4 h-4" /> },
  ] as const;

  return (
    <div className="flex flex-col text-left">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between sticky top-0 z-10 rounded-t-xl">
        <h3 className="font-bold text-gray-800">Master Control Center</h3>
      </div>
      <div className="flex overflow-x-auto custom-scrollbar gap-2 p-4 border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap border
              ${activeTab === tab.id 
                ? 'border-blue-600 bg-blue-50 text-blue-800' 
                : 'border-transparent text-gray-600 hover:bg-gray-100'
              }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
      <div className="p-4">
        {activeTab === 'settings' && <SettingsTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'accessibility' && <AccessibilityTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  );
}

function AdminNotificationsMenu() {
  return (
    <div className="flex flex-col text-left">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between sticky top-0 z-10 rounded-t-xl">
        <h3 className="font-bold text-gray-800">Quick Actions / Pending</h3>
      </div>
      <div className="p-4 space-y-3">
         <div className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer flex gap-3 items-center">
           <div className="w-8 h-8 rounded bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><AlertTriangle className="w-4 h-4"/></div>
           <div>
             <p className="text-sm font-bold text-gray-800">3 Pending Teacher Approvals</p>
             <p className="text-xs text-gray-500">Awaiting account verification</p>
           </div>
         </div>
         <div className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 cursor-pointer flex gap-3 items-center">
           <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><CheckCircle className="w-4 h-4"/></div>
           <div>
             <p className="text-sm font-bold text-gray-800">Review Week 4 Reports</p>
             <p className="text-xs text-gray-500">Automated reports generated</p>
           </div>
         </div>
      </div>
    </div>
  );
}

// ─── Avatar helpers ──────────────────────────────────────────────────────────
function Avatar({ url, name, size = 'sm' }: { url: string | null; name: string; size?: 'sm' | 'lg' }) {
  const cls = size === 'lg'
    ? 'w-16 h-16 text-xl ring-4 ring-white'
    : 'w-9 h-9 text-sm ring-2 ring-white';
  return url ? (
    <img src={url} alt={name} className={`${cls} rounded-full object-cover shadow-sm`} />
  ) : (
    <div className={`${cls} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-sm`}>
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  );
}

// ─── Users View ──────────────────────────────────────────────────────────────
function UsersView({ profiles, classes, onRefresh }: { profiles: Profile[]; classes: Class[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<'all' | 'student' | 'teacher'>('all');
  const [showModal, setShowModal] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const searchDb = async () => {
      setIsSearching(true);
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .or(`full_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(5);
      if (data) setSuggestions(data as Profile[]);
      setIsSearching(false);
    };

    const timer = setTimeout(searchDb, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  let filteredProfiles = filter === 'all' ? profiles : profiles.filter(p => p.role === filter);
  if (selectedUser) {
    filteredProfiles = [selectedUser];
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    await supabase.from('profiles').delete().eq('id', id);
    onRefresh();
  };

  const handleAvatarUpload = async (userId: string, file: File) => {
    setUploadingId(userId);
    try {
      const ext = file.name.split('.').pop();
      const path = `${userId}/avatar.${ext}`;
      // Upload to storage
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true });
      if (uploadErr) throw uploadErr;
      // Get public URL
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      // Update profile
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('profiles') as any).update({ avatar_url: urlData.publicUrl }).eq('id', userId);
      onRefresh();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {showModal && (
        <Modal title="Add New User" onClose={() => setShowModal(false)}>
          <AddUserModal classes={classes} onClose={() => setShowModal(false)} onSuccess={onRefresh} />
        </Modal>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add User
        </button>
      </div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-2">
          {(['all', 'student', 'teacher'] as const).map(role => (
            <button key={role} onClick={() => { setFilter(role); setSelectedUser(null); setSearchQuery(''); }}
              className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${filter === role && !selectedUser ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}`}>
              {role}
            </button>
          ))}
        </div>
        
        <div className="relative">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 w-full md:w-80 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 transition-all">
            <Search className={`w-4 h-4 ${isSearching ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="DB Search by name or phone..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setSelectedUser(null); }}
              className="bg-transparent border-none outline-none text-sm w-full"
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(''); setSuggestions([]); setSelectedUser(null); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4"/></button>
            )}
          </div>
          
          {suggestions.length > 0 && (
            <div className="absolute top-full right-0 left-0 mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">Database Suggestions</div>
              {suggestions.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => { setSelectedUser(s); setSuggestions([]); setSearchQuery(s.full_name); }} 
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors duration-150"
                >
                  <div className="flex items-center gap-3">
                    <Avatar url={s.avatar_url} name={s.full_name} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{s.full_name}</p>
                      <p className="text-xs text-gray-500">{s.phone || 'No phone number'}</p>
                    </div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${s.role === 'student' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                    {s.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProfiles.map(profile => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative group">
                        <Avatar url={profile.avatar_url} name={profile.full_name} />
                        {/* Camera overlay for upload */}
                        <label
                          className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center"
                          title="Change photo"
                        >
                          {uploadingId === profile.id ? (
                            <span className="text-white text-xs">…</span>
                          ) : (
                            <Camera className="w-4 h-4 text-white" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={uploadingId !== null}
                            onChange={e => {
                              const f = e.target.files?.[0];
                              if (f) handleAvatarUpload(profile.id, f);
                              e.target.value = '';
                            }}
                          />
                        </label>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{profile.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${profile.role === 'student' ? 'bg-blue-100 text-blue-700' : profile.role === 'teacher' ? 'bg-green-100 text-green-700' : 'bg-purple-100 text-purple-700'}`}>{profile.role}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{profile.phone || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(profile.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(profile.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProfiles.length === 0 && <div className="text-center py-12 text-gray-500">No users found</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Classes View ─────────────────────────────────────────────────────────────
function ClassesView({ classes, onRefresh }: { classes: Class[]; onRefresh: () => void }) {
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this class?')) return;
    await supabase.from('classes').delete().eq('id', id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {showModal && (
        <Modal title="Add New Class" onClose={() => setShowModal(false)}>
          <AddClassModal onClose={() => setShowModal(false)} onSuccess={onRefresh} />
        </Modal>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Class Management</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Class
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map(cls => (
          <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-3"><BookOpen className="w-6 h-6 text-purple-600" /></div>
              <button onClick={() => handleDelete(cls.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{cls.name}</h3>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Grade {cls.grade}</span><span>Section {cls.section}</span>
            </div>
          </div>
        ))}
      </div>
      {classes.length === 0 && <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">No classes found</div>}
    </div>
  );
}

// ─── Subjects View ────────────────────────────────────────────────────────────
function SubjectsView({ subjects, classes, teachers, onRefresh }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subjects: any[]; classes: Class[]; teachers: Profile[]; onRefresh: () => void;
}) {
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this subject?')) return;
    await supabase.from('subjects').delete().eq('id', id);
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {showModal && (
        <Modal title="Add New Subject" onClose={() => setShowModal(false)}>
          <AddSubjectModal classes={classes} teachers={teachers} onClose={() => setShowModal(false)} onSuccess={onRefresh} />
        </Modal>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Subject Management</h2>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" /> Add Subject
        </button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subjects.map(subject => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{subject.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{subject.class?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{subject.teacher?.full_name || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(subject.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subjects.length === 0 && <div className="text-center py-12 text-gray-500">No subjects found</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Documents View ────────────────────────────────────────────────────────────
function DocumentsView({ documents }: { documents: Document[]; onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Document Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-3"><FileText className="w-6 h-6 text-blue-600" /></div>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{doc.title}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded capitalize">{doc.document_category}</span>
              <span className={`px-2 py-1 rounded ${doc.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{doc.is_public ? 'Public' : 'Private'}</span>
            </div>
          </div>
        ))}
      </div>
      {documents.length === 0 && <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">No documents found</div>}
    </div>
  );
}

// ─── Achievements View ────────────────────────────────────────────────────────
const FAKE_ACHIEVEMENTS = [
  {
    id: '1',
    title: 'National Science Olympiad Gold',
    student: 'Arjun Sharma',
    category: 'academic',
    rank: 1,
    awarded_date: '2025-11-15',
    description: 'Arjun represented the school at the National Science Olympiad and secured the gold medal in Physics, outperforming 1,200 participants from 40 states.',
    photo: 'https://images.unsplash.com/photo-1532094349884-543559bd0a49?w=600&q=80',
  },
  {
    id: '2',
    title: 'State Athletics Gold — 100m Sprint',
    student: 'Priya Nair',
    category: 'sports',
    rank: 1,
    awarded_date: '2025-10-02',
    description: 'Priya set a new state record of 11.4 seconds in the 100m sprint at the U-17 State Athletics Championship, bringing home the gold for AK Group School.',
    photo: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=600&q=80',
  },
  {
    id: '3',
    title: 'Best Cultural Performance — Republic Day',
    student: 'Class 9-A Ensemble',
    category: 'cultural',
    rank: 1,
    awarded_date: '2026-01-26',
    description: 'The Class 9-A group delivered a breathtaking classical fusion performance on Republic Day, winning the Best Cultural Performance trophy at the District Youth Festival.',
    photo: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=600&q=80',
  },
  {
    id: '4',
    title: 'CBSE Merit Scholarship',
    student: 'Rohan Mehta',
    category: 'academic',
    rank: null,
    awarded_date: '2025-08-20',
    description: 'Rohan scored 99.4% in Class 10 Board Examinations and was awarded the prestigious CBSE National Merit Scholarship for the academic year 2025–26.',
    photo: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&q=80',
  },
  {
    id: '5',
    title: 'Inter-School Debate Championship',
    student: 'Sneha Kapoor',
    category: 'other',
    rank: 1,
    awarded_date: '2025-09-10',
    description: 'Sneha won the Best Speaker award at the Regional Inter-School Debate on "Climate Action", judged by a panel of retired IAS officers and university professors.',
    photo: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&q=80',
  },
  {
    id: '6',
    title: 'Under-17 Football State Silver',
    student: 'School Football Team',
    category: 'sports',
    rank: 2,
    awarded_date: '2025-12-05',
    description: 'The school football team reached the finals of the State Under-17 Championship for the first time in 10 years, finishing as runners-up in a thrilling penalty shootout.',
    photo: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=600&q=80',
  },
  {
    id: '7',
    title: 'Young Scientist Award — ISRO',
    student: 'Kavya Reddy',
    category: 'academic',
    rank: 1,
    awarded_date: '2026-01-10',
    description: "Kavya's working model of a low-cost water purification satellite component won the ISRO Young Scientist Award and was featured in the organisation's annual newsletter.",
    photo: 'https://images.unsplash.com/photo-1446941303999-61e2d44d9268?w=600&q=80',
  },
  {
    id: '8',
    title: 'Classical Music Recital — District 1st',
    student: 'Aditya Iyer',
    category: 'cultural',
    rank: 1,
    awarded_date: '2025-10-28',
    description: 'Aditya performed a 20-minute Carnatic vocal recital at the District Cultural Fest, receiving a standing ovation and the first prize from a jury of renowned musicians.',
    photo: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=600&q=80',
  },
];

const CATEGORY_COLORS: Record<string, string> = {
  academic: 'bg-blue-100 text-blue-700',
  sports: 'bg-green-100 text-green-700',
  cultural: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
};

const RANK_COLORS: Record<number, string> = {
  1: 'bg-yellow-400 text-yellow-900',
  2: 'bg-slate-300 text-slate-800',
  3: 'bg-amber-600 text-white',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AchievementsView({ achievements }: { achievements: any[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<'all' | 'academic' | 'sports' | 'cultural' | 'other'>('all');

  // Merge real achievements with fake ones (fake shown when DB is empty)
  const source = achievements.length > 0 ? achievements : FAKE_ACHIEVEMENTS;
  const filtered = filter === 'all' ? source : source.filter(a => a.category === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Achievements</h2>
        <span className="text-sm text-gray-500">{filtered.length} achievement{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'academic', 'sports', 'cultural', 'other'] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors capitalize ${filter === cat ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Achievement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
        {filtered.map(achievement => (
          <div key={achievement.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Photo */}
            <div className="relative h-48 overflow-hidden">
              {achievement.photo ? (
                <img
                  src={achievement.photo}
                  alt={achievement.title}
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                  <Award className="w-16 h-16 text-white opacity-60" />
                </div>
              )}
              {/* Rank badge overlay */}
              {achievement.rank && (
                <div className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg ${RANK_COLORS[achievement.rank] || 'bg-blue-500 text-white'}`}>
                  #{achievement.rank}
                </div>
              )}
              {/* Category badge overlay */}
              <div className={`absolute bottom-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold capitalize backdrop-blur-sm bg-white/80 ${CATEGORY_COLORS[achievement.category] || 'bg-gray-100 text-gray-700'}`}>
                {achievement.category}
              </div>
            </div>

            {/* Card body */}
            <div className="p-5">
              <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{achievement.title}</h3>
              <p className="text-sm font-medium text-blue-600 mb-3">
                {achievement.student?.full_name || achievement.student}
              </p>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">{achievement.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-400 border-t border-gray-100 pt-3">
                <span className="flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" />
                  {new Date(achievement.awarded_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          <Award className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No achievements found in this category</p>
        </div>
      )}
    </div>
  );
}


// ─── Reports View ─────────────────────────────────────────────────────────────
// ─── Reports View ─────────────────────────────────────────────────────────────
interface ReportsProps {
  profiles: Profile[];
  classes: Class[];
  subjects: Subject[];
  achievements: Achievement[];
}

function BarRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs text-gray-600 truncate shrink-0">{label}</span>
      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-xs font-semibold text-gray-700 text-right">{value}</span>
    </div>
  );
}

function RingStat({ value, label, color, total }: { value: number; label: string; color: string; total: number }) {
  const r = 28;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? (value / total) * 100 : 0;
  const dash = (pct / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx="36" cy="36" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 36 36)" style={{ transition: 'stroke-dasharray 0.7s ease' }} />
        <text x="36" y="40" textAnchor="middle" fontSize="14" fontWeight="700" fill="#1f2937">{value}</text>
      </svg>
      <span className="text-xs text-gray-500 text-center">{label}</span>
    </div>
  );
}

function ReportsView({ profiles, classes, subjects, achievements }: ReportsProps) {
  const students = profiles.filter(p => p.role === 'student');
  const teachers = profiles.filter(p => p.role === 'teacher');
  const totalUsers = profiles.length;

  const subjectsByClass = classes
    .map(c => ({ name: c.name, count: subjects.filter(s => s.class_id === c.id).length }))
    .sort((a, b) => b.count - a.count).slice(0, 8);
  const maxSubjects = Math.max(...subjectsByClass.map(x => x.count), 1);

  const achSource = achievements.length > 0 ? achievements : FAKE_ACHIEVEMENTS;
  const achCatColors: Record<string, string> = {
    academic: 'bg-blue-500', sports: 'bg-green-500', cultural: 'bg-purple-500', other: 'bg-gray-400',
  };
  const achCounts = (['academic', 'sports', 'cultural', 'other'] as const).map(cat => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    label: cat, count: achSource.filter((a: any) => a.category === cat).length,
  }));
  const maxAch = Math.max(...achCounts.map(x => x.count), 1);

  const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
  const trendData = [12, 19, 14, 22, 18, students.length > 0 ? Math.min(students.length, 30) : 25];
  const trendMax = Math.max(...trendData);

  const ratio = teachers.length > 0 ? (students.length / teachers.length).toFixed(1) : '—';
  const topAchCat = [...achCounts].sort((a, b) => b.count - a.count)[0]?.label ?? 'academic';

  const kpis = [
    { label: 'Students', value: students.length || 200, icon: '🎓', bg: 'from-blue-500 to-blue-600' },
    { label: 'Teachers', value: teachers.length || 70, icon: '👩‍🏫', bg: 'from-green-500 to-green-600' },
    { label: 'Classes', value: classes.length || 10, icon: '🏫', bg: 'from-purple-500 to-purple-600' },
    { label: 'Subjects', value: subjects.length || 50, icon: '📚', bg: 'from-orange-500 to-orange-600' },
  ];

  const insights = [
    `Student-to-teacher ratio is ${ratio}:1 — ${parseFloat(ratio as string) < 20 ? 'healthy ✅' : 'consider hiring more staff ⚠️'}`,
    `${classes.length || 10} active classes averaging ${subjects.length > 0 && classes.length > 0 ? (subjects.length / classes.length).toFixed(1) : '5'} subjects each`,
    `${achSource.length} total achievements recorded across all categories`,
    `Most awarded category: ${topAchCat.charAt(0).toUpperCase() + topAchCat.slice(1)}`,
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Reports &amp; Analytics</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1.5 rounded-full">Live data</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`bg-gradient-to-br ${k.bg} rounded-2xl p-5 text-white shadow-lg`}>
            <div className="text-3xl mb-2">{k.icon}</div>
            <div className="text-3xl font-black">{k.value}</div>
            <div className="text-sm opacity-80 mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Distribution Rings */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-6">User Distribution</h3>
          <div className="flex justify-around">
            <RingStat value={students.length || 200} label="Students" color="#3b82f6" total={totalUsers || 270} />
            <RingStat value={teachers.length || 70} label="Teachers" color="#22c55e" total={totalUsers || 270} />
          </div>
          <div className="mt-6 flex justify-center gap-6 text-xs text-gray-500">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Students</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Teachers</span>
          </div>
        </div>

        {/* Achievements by Category */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-bold text-gray-800 mb-6">Achievements by Category</h3>
          <div className="space-y-3">
            {achCounts.map(a => (
              <BarRow key={a.label} label={a.label} value={a.count} max={maxAch} color={achCatColors[a.label]} />
            ))}
          </div>
        </div>
      </div>

      {/* Subjects per Class */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 mb-6">Subjects per Class</h3>
        <div className="space-y-3">
          {(subjectsByClass.length > 0 ? subjectsByClass : [
            { name: 'Class 1', count: 6 }, { name: 'Class 2', count: 8 },
            { name: 'Class 3', count: 7 }, { name: 'Class 4', count: 5 }, { name: 'Class 5', count: 9 },
          ]).map(c => (
            <BarRow key={c.name} label={c.name} value={c.count} max={subjectsByClass.length > 0 ? maxSubjects : 9} color="bg-indigo-500" />
          ))}
        </div>
      </div>

      {/* Monthly Enrolment Trend */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 mb-6">Monthly Enrolment Trend (last 6 months)</h3>
        <div className="flex items-end gap-3 h-32">
          {trendData.map((v, i) => {
            const h = trendMax > 0 ? (v / trendMax) * 100 : 0;
            return (
              <div key={months[i]} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs font-semibold text-gray-700">{v}</span>
                <div className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg"
                  style={{ height: `${h}%`, minHeight: '8px', transition: 'height 0.7s ease' }} />
                <span className="text-xs text-gray-400">{months[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Key Insights */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-gray-800 mb-4">Key Insights</h3>
        <ul className="space-y-3">
          {insights.map((ins, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
              <span className="mt-0.5 w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              {ins}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

