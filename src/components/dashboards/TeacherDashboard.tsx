import { useState, useEffect } from 'react';
import { DashboardLayout } from '../shared/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import {
  Users,
  CheckCircle,
  FileText,
  BookOpen,
  Upload,
  Plus,
  Edit,
  BarChart3,
  User,
  GraduationCap,
  Award,
  Video,
  X,
  PieChart,
  Settings,
  Bell,
  Moon,
  Shield,
  Key,
  Smartphone,
  Download,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Profile, Subject, Document, Quiz, AttendanceStatus, Database } from '../../types/database';
import { AcademicCalendar } from '../shared/AcademicCalendar';
import { useAdminSettings } from '../../contexts/AdminSettingsContext';

type View = 'overview' | 'attendance' | 'documents' | 'quizzes' | 'performance' | 'account' | 'settings';

export function TeacherDashboard() {
  const { profile } = useAuth();
  const { settings, notifications, dismissNotification } = useAdminSettings();
  const [currentView, setCurrentView] = useState<View>('overview');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    try {
      const [subjectsData, documentsData, quizzesData] = await Promise.all([
        supabase.from('subjects').select('*, class:classes(*)').eq('teacher_id', profile?.id || ''),
        supabase.from('documents').select('*').eq('uploaded_by', profile?.id || ''),
        supabase.from('quizzes').select('*').eq('created_by', profile?.id || ''),
      ]);

      if (subjectsData.data) setSubjects(subjectsData.data);
      if (documentsData.data) setDocuments(documentsData.data);
      if (quizzesData.data) setQuizzes(quizzesData.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigation = [
    {
      name: 'Overview',
      icon: <BarChart3 className="w-5 h-5" />,
      current: currentView === 'overview',
      onClick: () => setCurrentView('overview'),
    },
    {
      name: 'Mark Attendance',
      icon: <CheckCircle className="w-5 h-5" />,
      current: currentView === 'attendance',
      onClick: () => setCurrentView('attendance'),
    },
    {
      name: 'Documents',
      icon: <FileText className="w-5 h-5" />,
      current: currentView === 'documents',
      onClick: () => setCurrentView('documents'),
    },
    {
      name: 'Quizzes',
      icon: <BookOpen className="w-5 h-5" />,
      current: currentView === 'quizzes',
      onClick: () => setCurrentView('quizzes'),
    },
    {
      name: 'Performance',
      icon: <Users className="w-5 h-5" />,
      current: currentView === 'performance',
      onClick: () => setCurrentView('performance'),
    },
    {
      name: 'My Account',
      icon: <User className="w-5 h-5" />,
      current: currentView === 'account',
      onClick: () => setCurrentView('account'),
    },
  ];

  const renderContent = () => {
    if (settings.maintenanceMode) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in">
          <div className="bg-orange-100 p-6 rounded-full mb-6">
            <Shield className="w-16 h-16 text-orange-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 mb-4">Platform Maintenance</h2>
          <p className="text-lg text-gray-600 max-w-lg mb-8 leading-relaxed">
            The system administrator has placed the platform into maintenance mode. Your dashboard will automatically unlock once the work is complete.
          </p>
          <div className="animate-pulse flex items-center gap-2 text-orange-600 font-bold bg-orange-50 px-4 py-2 rounded-full border border-orange-200">
            <div className="w-2 h-2 bg-orange-600 rounded-full"></div> Awaiting Systems
          </div>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 font-medium">Loading Dashboard...</div>
        </div>
      );
    }

    switch (currentView) {
      case 'overview':
        return <OverviewView subjects={subjects} documents={documents} quizzes={quizzes} />;
      case 'attendance':
        return <AttendanceView subjects={subjects} />;
      case 'documents':
        return <DocumentsView documents={documents} />;
      case 'quizzes':
        return <QuizzesView quizzes={quizzes} />;
      case 'performance':
        return <PerformanceView subjects={subjects} />;
      case 'account':
        return <AccountView profile={profile} subjects={subjects} />;
      case 'settings':
        return <SettingsView />;
      default:
        return null;
    }
  };

  const visibleNotifications = notifications.filter(n => n.targetRole === 'all' || n.targetRole === 'teacher');

  return (
    <DashboardLayout
      navigation={navigation}
      onSettingsClick={() => setCurrentView('settings')}
    >
      <div className="flex flex-col gap-4 mb-6">
        {settings.teacherAttendanceAlerts && !settings.maintenanceMode && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-start gap-4 shadow-sm animate-in slide-in-from-top-4">
            <div className="bg-blue-100 text-blue-600 p-2 rounded-lg shrink-0 mt-0.5">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Action Required: Morning Attendance</p>
              <p className="text-xs text-blue-700/80 mt-1">Please ensure you have marked attendance for your active morning period classes.</p>
            </div>
            <button onClick={() => setCurrentView('attendance')} className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap shadow-sm shadow-blue-500/20">Go to Attendance</button>
          </div>
        )}
        
        {visibleNotifications.map(notification => (
          <div key={notification.id} className="bg-white border text-left border-gray-200 rounded-xl p-4 shadow-sm flex items-start justify-between gap-4 animate-in slide-in-from-top-4 relative overflow-hidden group">
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
               notification.priority === 'urgent' ? 'bg-red-500' :
               notification.priority === 'warning' ? 'bg-orange-500' :
               notification.priority === 'academic' ? 'bg-purple-500' :
               'bg-blue-500'
            }`} />
            <div className="flex items-start gap-4 mx-2">
               <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                 notification.priority === 'urgent' ? 'bg-red-100 text-red-600' :
                 notification.priority === 'warning' ? 'bg-orange-100 text-orange-600' :
                 notification.priority === 'academic' ? 'bg-purple-100 text-purple-600' :
                 'bg-blue-100 text-blue-600'
               }`}>
                 {notification.priority === 'warning' || notification.priority === 'urgent' ? <AlertTriangle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
               </div>
               <div>
                  <p className="font-bold text-sm text-gray-800 flex items-center gap-2">
                    {notification.title}
                    <span className="text-[10px] text-gray-400 font-medium uppercase">{new Date(notification.createdAt).toLocaleTimeString()}</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">{notification.message}</p>
               </div>
            </div>
            <button 
              onClick={() => dismissNotification(notification.id)}
              className="text-gray-400 hover:text-gray-600 p-2 shrink-0 transition-opacity opacity-0 group-hover:opacity-100 bg-gray-50 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {renderContent()}
    </DashboardLayout>
  );
}

const performanceData = [
  { name: 'Week 1', attendance: 85, progress: 60, efficiency: 70 },
  { name: 'Week 2', attendance: 88, progress: 65, efficiency: 75 },
  { name: 'Week 3', attendance: 92, progress: 78, efficiency: 85 },
  { name: 'Week 4', attendance: 90, progress: 85, efficiency: 95 },
  { name: 'Week 5', attendance: 95, progress: 92, efficiency: 110 },
  { name: 'Week 6', attendance: 96, progress: 95, efficiency: 140 },
  { name: 'Week 7', attendance: 98, progress: 98, efficiency: 175 },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OverviewView({ subjects }: { subjects: any[]; documents: Document[]; quizzes: Quiz[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Welcome Back, Teacher!</h2>
        <div className="flex gap-2">
          <select className="bg-white/50 border-none rounded-lg px-3 py-1 text-sm font-medium text-slate-600 focus:ring-0">
            <option>This Year</option>
            <option>Last Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">

        {/* Performance Overview (Large Widget) */}
        <div className="col-span-12 lg:col-span-8 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">AI Performance Overview</h3>
            <span className="text-xs font-medium px-2 py-1 bg-blue-100/50 text-blue-700 rounded-md">Real-time</span>
          </div>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-orange-400 to-orange-500 text-white p-4 rounded-xl flex flex-col items-center justify-center shadow-lg shadow-orange-200 hover:scale-105 transition-transform duration-300">
              <span className="text-3xl font-bold">98%</span>
              <span className="text-xs opacity-90 font-medium">Class Attendance</span>
            </div>
            <div className="bg-gradient-to-br from-yellow-400 to-yellow-500 text-white p-4 rounded-xl flex flex-col items-center justify-center shadow-lg shadow-yellow-200 hover:scale-105 transition-transform duration-300">
              <span className="text-3xl font-bold">24%</span>
              <span className="text-xs opacity-90 font-medium">Pending Tasks</span>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white p-4 rounded-xl flex flex-col items-center justify-center shadow-lg shadow-blue-200 hover:scale-105 transition-transform duration-300">
              <span className="text-3xl font-bold">175%</span>
              <span className="text-xs opacity-90 font-medium">Efficiency Gain</span>
            </div>
          </div>
          <div className="h-64 mt-8 w-full" style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEfficiency" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Area type="monotone" dataKey="efficiency" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorEfficiency)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Status Sidebars */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Assignment Status */}
          <div className="glass-card p-6">
            <h3 className="font-semibold text-lg mb-4">Assignment Status</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 relative h-3 bg-slate-100 rounded-full overflow-hidden">
                <div className="absolute left-0 top-0 h-full w-[85%] bg-blue-600 rounded-full"></div>
              </div>
              <span className="font-bold text-slate-700">85%</span>
            </div>
            <div className="flex justify-between mt-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">85</p>
                <p className="text-xs text-slate-500">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-400">12</p>
                <p className="text-xs text-slate-500">Pending</p>
              </div>
            </div>
          </div>
          
          <AcademicCalendar />
        </div>

        {/* Subjects List */}
        <div className="col-span-12 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-lg">My Subjects</h3>
            <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="p-4 rounded-xl bg-white border border-slate-100 hover:border-blue-200 transition-colors group cursor-pointer shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">{subject.class?.name}</span>
                </div>
                <h4 className="mt-4 font-semibold text-slate-800">{subject.name}</h4>
                <p className="text-xs text-slate-500 mt-1">45 Students • 12 Topics</p>
              </div>
            ))}
            {subjects.length === 0 && (
              <p className="text-slate-500 text-sm">No subjects assigned</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AttendanceView({ subjects }: { subjects: any[] }) {
  const { profile } = useAuth();
  const [selectedSubject, setSelectedSubject] = useState('');
  const getLocalDateString = (d = new Date()) => {
    return new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [students, setStudents] = useState<Profile[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [periods, setPeriods] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, AttendanceStatus>>({});

  const FIXED_SUBJECTS = ['Mathematics', 'Science', 'Social Sciences', 'Telugu', 'Hindi', 'English'];
  const FIXED_PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

  const today = new Date();
  const minDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];
  const maxDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()).toISOString().split('T')[0];

  // Enhanced Mock State
  const generateMockStudents = () => {
    const names = ['Arjun', 'Bhavana', 'Chaitanya', 'Deepika', 'Eshwar', 'Falguni', 'Ganesh', 'Harini', 'Irfan', 'Jaya', 'Kiran', 'Latha', 'Manoj', 'Nisha', 'Omkar'];
    return names.map((name, i) => ({ id: `mock-${i}`, full_name: name, role: 'student' as const, class_id: 'mock-class' }));
  };

  const mockStudents = generateMockStudents();
  const [mockAttendanceData, setMockAttendanceData] = useState<Record<string, AttendanceStatus>>({});
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (selectedSubject) {
      loadPeriods();
      loadStudents();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedSubject && selectedPeriod && selectedDate) {
      loadAttendanceRecords();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject, selectedPeriod, selectedDate]);

  const loadAttendanceRecords = async () => {
    if (!selectedPeriod || !selectedDate) return;
    
    const { data, error } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('period_id', selectedPeriod)
      .eq('date', selectedDate);

    if (!error && data) {
      const attData: Record<string, AttendanceStatus> = {};
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.forEach((record: any) => {
        attData[record.student_id] = record.status as AttendanceStatus;
      });
      setAttendanceData(attData);
    }
  };

  const loadPeriods = async () => {
    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject) return;

    const { data } = await supabase
      .from('periods')
      .select('*')
      .eq('subject_id', selectedSubject);

    if (data) setPeriods(data);
  };

  const loadStudents = async () => {
    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('class_id', subject.class_id)
      .eq('role', 'student');

    if (data) setStudents(data);
  };

  const handleAttendanceChange = (studentId: string, currentStatus: AttendanceStatus) => {
    const newStatus = currentStatus === 'absent' ? 'present' : 'absent';
    setAttendanceData(prev => ({ ...prev, [studentId]: newStatus }));
  };

  const handleMockAttendanceToggle = (studentId: string) => {
    setMockAttendanceData(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'absent' ? 'present' : 'absent'
    }));
  };

  const handleSubmit = async () => {
    if (!selectedPeriod) {
      alert('Please select a period');
      return;
    }

    try {
      const attendanceRecords: Database['public']['Tables']['attendance']['Insert'][] = students.map(student => ({
        student_id: student.id,
        period_id: selectedPeriod,
        date: selectedDate,
        status: (attendanceData[student.id] || 'absent') as AttendanceStatus,
        marked_by: profile?.id || null,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('attendance') as any).upsert(attendanceRecords, {
        onConflict: 'student_id,period_id,date'
      });

      if (error) throw error;
      alert('Attendance marked successfully!');
      setAttendanceData({});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance: ' + (error.message || 'database error'));
    }
  };
  const handleCreatePeriod = async () => {
    if (!selectedSubject) {
      alert('Please select a subject first');
      return;
    }
    const subject = subjects.find(s => s.id === selectedSubject);
    if (!subject) return;

    const numStr = prompt('Enter new period number (e.g. 1, 2, 3):', String(periods.length + 1));
    if (!numStr) return;
    
    // Create a generic period
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('periods') as any).insert({
      class_id: subject.class_id,
      subject_id: selectedSubject,
      period_number: parseInt(numStr) || (periods.length + 1),
      day_of_week: now.getDay() || 7, // 1-7
      start_time: '09:00:00',
      end_time: '10:00:00'
    });

    if (error) {
      if (error.message.includes('row-level security')) {
         alert('Row-Level Security prevents teachers from creating periods. Please ask your administrator to run the SQL command to allow teacher period creation, or have them create the period for you.');
      } else {
         alert('Failed to create period: ' + error.message);
      }
    } else {
      alert('Period created successfully!');
      loadPeriods();
    }
  };

  const handleCreateSubject = async () => {
    const name = prompt('Enter new Subject Name (e.g. Mathematics):');
    if (!name) return;
    
    const className = prompt('Enter Class Name for this subject (e.g. Grade 10A):');
    if (!className) return;

    try {
      // 1. Create a minimal class first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: classData, error: classErr } = await (supabase.from('classes') as any).insert({
        name: className,
        grade: 1,
        section: 'A'
      }).select().single();

      if (classErr) throw classErr;

      // 2. Create the subject
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: subjErr } = await (supabase.from('subjects') as any).insert({
        name,
        class_id: classData.id,
        teacher_id: profile?.id
      });

      if (subjErr) throw subjErr;

      alert('Subject created successfully!');
      window.location.reload();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      if (error?.message?.includes('row-level security')) {
        alert('Row-Level Security Active: Only Administrators can create Classes & Subjects by default. Please ask an Admin, or run the SQL command to allow teacher access.');
      } else {
        alert('Failed to create Subject: ' + (error?.message || 'Database error'));
      }
    }
  };



  const handleMockSubmit = () => {
    if (!selectedPeriod) {
      alert('Please select a period');
      return;
    }
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    setMockAttendanceData({});
  };

  return (
    <div className="space-y-6 relative">
      <h2 className="text-2xl font-bold text-gray-800">Mark Attendance</h2>

      <div className="glass-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <div className="flex gap-2">
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
              >
                <option value="">Select Subject</option>
                {/* Real subjects from DB */}
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} - {subject.class?.name}
                  </option>
                ))}
                {/* Fixed subjects as placeholders if none loaded */}
                {subjects.length === 0 && FIXED_SUBJECTS.map(s => <option key={s} value={s}>{s} (New)</option>)}
              </select>
              <button 
                onClick={handleCreateSubject} 
                className="px-4 py-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors shadow-sm"
                title="Add New Subject"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <div className="flex gap-2">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full px-4 py-3 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
              >
                <option value="">Select Period</option>
                {periods.map((period) => (
                  <option key={period.id} value={period.id}>
                    Period {period.period_number}
                  </option>
                ))}
                {periods.length === 0 && FIXED_PERIODS.map(p => (
                  <option key={`mock-period-${p}`} value={`mock-period-${p}`}>
                    Period {p} (Demo)
                  </option>
                ))}
              </select>
              <button 
                onClick={handleCreatePeriod} 
                className="px-4 py-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition-colors shadow-sm"
                title="Add New Period"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-medium text-gray-700 mb-3">Select Date</label>
          <div className="flex items-center gap-3 overflow-x-auto pb-4 custom-scrollbar">
            {/* Generate last 7 days including today */}
            {[...Array(7)].map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const dateStr = getLocalDateString(d);
              const isSelected = selectedDate === dateStr;
              const isToday = i === 6;
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              const dayMonth = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
              
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex-shrink-0 flex flex-col items-center justify-center min-w-[80px] h-24 rounded-2xl border-2 transition-all duration-300 ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md transform scale-[1.02]' 
                      : 'border-slate-100 bg-white text-slate-500 hover:border-blue-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">{isToday ? 'Today' : dayName}</span>
                  <span className={`text-2xl font-bold mt-1 ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>{d.getDate()}</span>
                  <span className="text-[10px] font-medium opacity-70 mt-1">{dayMonth}</span>
                </button>
              );
            })}
            
            <div className="h-16 w-px bg-gray-200 mx-2 flex-shrink-0"></div>
            
            <div className="relative flex-shrink-0 group">
              <input
                type="date"
                min={minDate}
                max={maxDate}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                title="Choose other date (+/- 1 Year)"
              />
              <div className={`flex flex-col items-center justify-center min-w-[80px] h-24 rounded-2xl border-2 transition-all duration-300 ${
                !([...Array(7)].map((_, i) => getLocalDateString(new Date(new Date().setDate(new Date().getDate() - (6 - i))))).includes(selectedDate))
                  ? 'border-purple-500 bg-purple-50 text-purple-700 shadow-md transform scale-[1.02]'
                  : 'border-slate-100 bg-white text-slate-500 hover:border-purple-200 hover:bg-slate-50'
              }`}>
                <Calendar className={`w-6 h-6 mb-1 ${
                  !([...Array(7)].map((_, i) => getLocalDateString(new Date(new Date().setDate(new Date().getDate() - (6 - i))))).includes(selectedDate))
                    ? 'text-purple-600' : 'text-slate-400 group-hover:text-purple-500'
                }`} />
                <span className="text-[10px] font-semibold uppercase tracking-wider">More</span>
              </div>
            </div>
          </div>
        </div>

        {students.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {students.map((student) => {
                const status = attendanceData[student.id] || 'present';
                return (
                  <div
                    key={student.id}
                    onClick={() => handleAttendanceChange(student.id, status)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 group hover:scale-105 shadow-sm
                      ${status === 'absent' 
                        ? 'bg-red-50 border-red-500 text-red-700' 
                        : 'bg-white border-gray-100 text-gray-700 hover:border-blue-300'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${status === 'absent' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold truncate w-full">{student.full_name}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded
                      ${status === 'absent' ? 'bg-red-200/50' : 'bg-green-100 text-green-700'}`}>
                      {status === 'absent' ? 'Absent' : 'Present'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleSubmit}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all font-bold"
              >
                Submit Attendance
              </button>
            </div>
          </>
        )}

        {selectedSubject && students.length === 0 && (
          <>
            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 text-sm font-medium flex items-center justify-center gap-3">
              <Shield className="w-5 h-5" />
              <span>Database Empty: Showing Demo Student Grid for Classes 1-10 (A, B, C)</span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {mockStudents.map((student) => {
                const status = mockAttendanceData[student.id] || 'present';
                return (
                  <div
                    key={student.id}
                    onClick={() => handleMockAttendanceToggle(student.id)}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer text-center flex flex-col items-center justify-center gap-2 group hover:scale-105 shadow-sm
                      ${status === 'absent' 
                        ? 'bg-red-50 border-red-500 text-red-700' 
                        : 'bg-white border-gray-100 text-gray-700 hover:border-blue-300'}`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${status === 'absent' ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-100'}`}>
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold truncate w-full">{student.full_name}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded
                      ${status === 'absent' ? 'bg-red-200/50' : 'bg-green-100 text-green-700'}`}>
                      {status === 'absent' ? 'Absent' : 'Present'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={handleMockSubmit}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-[1.02] transition-all font-bold"
              >
                Submit Demo Attendance
              </button>
            </div>
          </>
        )}
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="absolute bottom-4 right-4 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 z-50">
          <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-sm">Attendance marked successfully!</p>
            <p className="text-xs text-slate-400">The records have been updated.</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DocumentsView({ documents }: { documents: Document[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Documents</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all shadow-md">
          <Upload className="w-4 h-4" />
          <span>Upload Document</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="glass-card p-6 flex flex-col relative group">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-green-100/50 rounded-xl p-3 text-green-600">
                <FileText className="w-6 h-6" />
              </div>
              <button className="text-gray-400 hover:text-blue-600 transition-colors bg-white/50 p-2 rounded-full hover:bg-white">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 text-lg">{doc.title}</h3>
            <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">{doc.description}</p>
            <div className="flex items-center justify-between text-xs font-medium pt-4 border-t border-gray-100">
              <span className="capitalize px-2 py-1 bg-gray-100 text-gray-600 rounded-md">{doc.document_category}</span>
              <span className={`${doc.is_public ? 'text-green-600' : 'text-orange-500'}`}>{doc.is_public ? 'Public' : 'Private'}</span>
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <>
          <div className="col-span-12 mb-2 p-4 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-800 text-sm font-medium flex items-center justify-center">
            No documents found in database. Showing sample documents.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 'mock1', title: 'Semester Syllabus 2026', description: 'Comprehensive guide covering all modules, reading materials, and project schedules for the upcoming semester.', document_category: 'notes', is_public: true },
              { id: 'mock2', title: 'Midterm Answer Key', description: 'Detailed solutions and grading rubric for the recent midterm examination.', document_category: 'answer_sheet', is_public: false },
              { id: 'mock3', title: 'Physics Chapter 4 Notes', description: 'Student handouts explaining Kinematics and Newton\'s laws of motion.', document_category: 'notes', is_public: true },
            ].map((doc) => (
              <div key={doc.id} className="glass-card p-6 flex flex-col relative group">
                <div className="flex items-start justify-between mb-4">
                  <div className="bg-green-100/50 rounded-xl p-3 text-green-600 group-hover:bg-green-500 group-hover:text-white transition-colors duration-300">
                    <FileText className="w-6 h-6" />
                  </div>
                  <button className="text-gray-400 hover:text-blue-600 transition-colors bg-white/50 p-2 rounded-full hover:bg-white shadow-sm">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2 text-lg">{doc.title}</h3>
                <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">{doc.description}</p>
                <div className="flex items-center justify-between text-xs font-medium pt-4 border-t border-gray-100">
                  <span className="capitalize px-2 py-1 bg-gray-100 text-gray-600 rounded-md">{doc.document_category}</span>
                  <span className={`${doc.is_public ? 'text-green-600' : 'text-orange-500'}`}>{doc.is_public ? 'Public' : 'Private'}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function QuizzesView({ quizzes }: { quizzes: Quiz[] }) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Mock form state
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    duration: 30,
    totalMarks: 50,
    subject: ''
  });

  // Mock Results Data
  const mockQuizResults = [
    { range: '0-20%', students: 2 },
    { range: '21-40%', students: 5 },
    { range: '41-60%', students: 12 },
    { range: '61-80%', students: 25 },
    { range: '81-100%', students: 18 },
  ];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setShowCreateModal(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    // Reset form
    setQuizForm({ title: '', description: '', duration: 30, totalMarks: 50, subject: '' });
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const openResults = (_id: string) => {
    setShowResultsModal(true);
  };

  return (
    <div className="space-y-6 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Quizzes</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Create Quiz</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="glass-card p-6 border-l-4 border-l-purple-500">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100/50 rounded-lg p-3 text-purple-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${quiz.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                {quiz.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{quiz.title}</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{quiz.description}</p>
            <div className="flex items-center justify-between text-sm mb-4">
              <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{quiz.duration_minutes} min</span>
              <span className="font-semibold text-purple-700">{quiz.total_marks} marks</span>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                Edit
              </button>
              <button className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm">
                Results
              </button>
            </div>
          </div>
        ))}
      </div>

      {quizzes.length === 0 && (
        <>
          <div className="col-span-12 mb-2 p-4 bg-purple-50/50 border border-purple-100 rounded-xl text-purple-800 text-sm font-medium flex items-center justify-center">
            No quizzes found in database. Showing sample quizzes.
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { id: 'mq1', title: 'Midterm Physics Review', description: 'Covers chapters 1 through 5. Calculators are allowed.', duration_minutes: 60, total_marks: 100, is_active: true },
              { id: 'mq2', title: 'Pop Quiz: Thermodynamics', description: 'Short quiz evaluating the understanding of the laws of thermodynamics.', duration_minutes: 15, total_marks: 20, is_active: true },
              { id: 'mq3', title: 'End of Year Final', description: 'Comprehensive exam for the entire academic year.', duration_minutes: 120, total_marks: 150, is_active: false },
            ].map((mockQuiz) => (
              <div key={mockQuiz.id} className="glass-card p-6 border-l-4 border-l-purple-500 group relative">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100/50 rounded-lg p-3 text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <span className={`text-xs px-3 py-1 rounded-full font-medium ${mockQuiz.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {mockQuiz.is_active ? 'Active' : 'Draft'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{mockQuiz.title}</h3>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[40px]">{mockQuiz.description}</p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-500 bg-gray-50 px-2 py-1 rounded-md">{mockQuiz.duration_minutes} min</span>
                  <span className="font-semibold text-purple-700">{mockQuiz.total_marks} marks</span>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                    Edit
                  </button>
                  <button
                    onClick={() => openResults(mockQuiz.id)}
                    className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium shadow-sm"
                  >
                    Results
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create Quiz Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" /> Create New Quiz
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quiz Title</label>
                  <input
                    type="text"
                    required
                    value={quizForm.title}
                    onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                    placeholder="e.g. Midterm Physics Exam"
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={quizForm.description}
                    onChange={(e) => setQuizForm({ ...quizForm, description: e.target.value })}
                    placeholder="Brief description of the quiz..."
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Minutes)</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quizForm.duration}
                      onChange={(e) => setQuizForm({ ...quizForm, duration: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={quizForm.totalMarks}
                      onChange={(e) => setQuizForm({ ...quizForm, totalMarks: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-sm font-medium bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/30 transition-all active:scale-95"
                >
                  Create & Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {showResultsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-slate-50/50">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-purple-600" /> Quiz Analytics
              </h3>
              <button
                onClick={() => setShowResultsModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                  <p className="text-sm text-purple-600 font-medium mb-1">Average Score</p>
                  <p className="text-2xl font-bold text-purple-900">76%</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                  <p className="text-sm text-green-600 font-medium mb-1">Highest Score</p>
                  <p className="text-2xl font-bold text-green-900">98%</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-blue-600 font-medium mb-1">Total Submissions</p>
                  <p className="text-2xl font-bold text-blue-900">62</p>
                </div>
              </div>

              {/* Chart */}
              <div className="h-72 w-full mb-8" style={{ position: 'relative' }}>
                <h4 className="text-sm font-bold text-gray-700 mb-4">Score Distribution</h4>
                <div style={{ position: 'absolute', top: '2rem', left: 0, right: 0, bottom: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockQuizResults} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="range" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                      <Tooltip
                        cursor={{ fill: '#f1f5f9' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                      />
                      <Bar dataKey="students" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="px-6 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5">
          <div className="w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="font-medium text-sm">Quiz created successfully!</p>
            <p className="text-xs text-slate-400">You can now add questions to it.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PerformanceView({ subjects }: { subjects: any[] }) {
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || '');

  const mockMarksData = [
    { name: 'John Doe', midterm: 85, final: 92, assignment: 90 },
    { name: 'Alice Smith', midterm: 78, final: 85, assignment: 88 },
    { name: 'Bob Johnson', midterm: 92, final: 95, assignment: 96 },
    { name: 'Emma Wilson', midterm: 65, final: 72, assignment: 80 },
    { name: 'Michael Brown', midterm: 88, final: 90, assignment: 92 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Class Performance & Marks</h2>
        {subjects.length > 0 && (
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-white/50 border-none rounded-lg px-4 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500"
          >
            {subjects.map(sub => (
              <option key={sub.id} value={sub.id}>{sub.name} - {sub.class?.name}</option>
            ))}
          </select>
        )}
      </div>

      <div className="glass-card p-6 w-full">
        <h3 className="font-semibold text-lg mb-6 text-gray-800">Student Marks Distribution</h3>
        <div className="h-80 w-full" style={{ position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockMarksData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMidterm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorFinal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="final" name="Final Exam" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorFinal)" />
                <Area type="monotone" dataKey="midterm" name="Midterm Exam" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMidterm)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Student Name</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Midterm (100)</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Final (100)</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Assignments (100)</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {mockMarksData.map((student, i) => {
              const avg = Math.round((student.midterm + student.final + student.assignment) / 3);
              const grade = avg >= 90 ? 'A' : avg >= 80 ? 'B' : avg >= 70 ? 'C' : 'D';
              return (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{student.midterm}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{student.final}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">{student.assignment}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${grade === 'A' ? 'bg-green-100 text-green-700' : grade === 'B' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {grade}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-blue-600 font-medium cursor-pointer hover:text-blue-800">Edit</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AccountView({ profile, subjects }: { profile: Profile | null, subjects: any[] }) {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className="glass-card p-8 flex items-center gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl -mr-20 -mt-20"></div>

        <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 flex-shrink-0 z-10">
          <img
            src={profile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher"}
            alt="Teacher Avatar"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="z-10 flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile?.full_name || 'Teacher Name'}</h1>
              <p className="text-blue-600 font-medium flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5" /> Senior Department Head • Applied Sciences
              </p>
            </div>
            <button className="px-4 py-2 bg-white/80 border border-gray-200 shadow-sm rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-all">
              <Edit className="w-4 h-4" /> Edit Profile
            </button>
          </div>

          <p className="text-gray-600 text-sm max-w-2xl leading-relaxed">
            Passionate educator with over 10 years of experience in facilitating active learning, fostering student engagement, and integrating modern technologies into the classroom curriculum. Dedicated to creating an inclusive and stimulating academic environment.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Subjects Handled */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" /> Subjects Handled
          </h3>
          <div className="space-y-4">
            {subjects.length > 0 ? subjects.map(sub => (
              <div key={sub.id} className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">{sub.name}</span>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-md">{sub.class?.name || 'Various'}</span>
                </div>
                <span className="text-xs text-slate-500">Advanced Placement • 45 Students</span>
              </div>
            )) : (
              <div className="flex flex-col p-4 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-slate-800">Advanced Physics v2.0</span>
                  <span className="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded-md">Grade 12A</span>
                </div>
                <span className="text-xs text-slate-500">Senior Curriculum • 32 Students</span>
              </div>
            )}
          </div>
        </div>

        {/* Career & Timeline */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-500" /> Career Milestones
          </h3>
          <div className="relative border-l-2 border-orange-100 ml-3 space-y-6">
            <div className="relative pl-6">
              <div className="absolute w-3 h-3 bg-orange-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
              <h4 className="font-semibold text-slate-800 text-sm">Head of Department</h4>
              <p className="text-xs text-orange-600 font-medium mb-1">2022 - Present</p>
              <p className="text-xs text-slate-500">Led the department through curriculum digitization and achieved a 20% increase in student performance.</p>
            </div>
            <div className="relative pl-6">
              <div className="absolute w-3 h-3 bg-blue-400 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
              <h4 className="font-semibold text-slate-800 text-sm">Senior Science Teacher</h4>
              <p className="text-xs text-blue-600 font-medium mb-1">2018 - 2022</p>
              <p className="text-xs text-slate-500">Introduced lab-based interactive modules that improved STEM engagement globally.</p>
            </div>
            <div className="relative pl-6">
              <div className="absolute w-3 h-3 bg-gray-300 rounded-full -left-[7px] top-1.5 ring-4 ring-white"></div>
              <h4 className="font-semibold text-slate-800 text-sm">Joined XYZ Institution</h4>
              <p className="text-xs text-gray-500 font-medium mb-1">2016</p>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="col-span-1 md:col-span-2 glass-card p-6 border-t-4 border-t-purple-500">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Video className="w-5 h-5 text-purple-500" /> Achievements & Certifications
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-100 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-purple-200 text-purple-600 flex items-center justify-center mb-3">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">Teacher of the Year</h4>
              <p className="text-xs text-purple-600">State Level • 2023</p>
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-blue-200 text-blue-600 flex items-center justify-center mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">Advanced Pedagogy Cert</h4>
              <p className="text-xs text-blue-600">Stanford Online • 2021</p>
            </div>
            <div className="p-4 rounded-xl bg-green-50 border border-green-100 flex flex-col items-center justify-center text-center hover:-translate-y-1 transition-transform">
              <div className="w-12 h-12 rounded-full bg-green-200 text-green-600 flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="font-semibold text-slate-800 text-sm mb-1">100% Pass Rate</h4>
              <p className="text-xs text-green-600">AP Physics Board • 2022</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsView() {
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('emailAlerts') !== 'false');
  const [pushNotifications, setPushNotifications] = useState(() => localStorage.getItem('pushNotifications') === 'true');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [showToast, setShowToast] = useState<{ show: boolean, title: string, desc: string }>({ show: false, title: '', desc: '' });

  const notify = (title: string, desc: string) => {
    setShowToast({ show: true, title, desc });
    setTimeout(() => setShowToast({ show: false, title: '', desc: '' }), 3000);
  };

  useEffect(() => {
    localStorage.setItem('emailAlerts', String(emailAlerts));
    localStorage.setItem('pushNotifications', String(pushNotifications));
    localStorage.setItem('theme', theme);

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme, emailAlerts, pushNotifications]);

  return (
    <div className="space-y-6 relative max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8 pb-4 border-b border-gray-100">
        <div className="p-3 bg-indigo-100/50 rounded-xl text-indigo-600">
          <Settings className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Dashboard Settings</h2>
          <p className="text-sm text-gray-500">Manage your preferences, appearance, and account security.</p>
        </div>
      </div>

      {/* Notifications Section */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Bell className="w-5 h-5 text-blue-500" /> Notifications
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
            <div>
              <p className="font-semibold text-gray-800">Email Alerts</p>
              <p className="text-sm text-gray-500 mt-1">Receive daily summaries and student updates.</p>
            </div>
            <button
              onClick={() => {
                setEmailAlerts(!emailAlerts);
                notify('Preferences Updated', `Email alerts turned ${!emailAlerts ? 'ON' : 'OFF'}`);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${emailAlerts ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailAlerts ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
            <div>
              <p className="font-semibold text-gray-800">Push Notifications</p>
              <p className="text-sm text-gray-500 mt-1">Get instantly notified in the browser for important events.</p>
            </div>
            <button
              onClick={() => {
                setPushNotifications(!pushNotifications);
                notify('Preferences Updated', `Push notifications turned ${!pushNotifications ? 'ON' : 'OFF'}`);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pushNotifications ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${pushNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Appearance Section */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Moon className="w-5 h-5 text-indigo-500" /> Appearance
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { id: 'light', label: 'Light Mode' },
            { id: 'dark', label: 'Dark Mode' }
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => {
                setTheme(mode.id);
                notify('Theme Changed', `Appearance set to ${mode.label}`);
              }}
              className={`p-4 rounded-xl border transition-all text-center font-medium ${theme === mode.id
                ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-sm'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Security Section */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-red-500" /> Account & Security
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => notify('Email Sent', 'Password reset instructions dispatched.')}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="p-3 bg-red-50 text-red-600 rounded-lg group-hover:bg-red-100 transition-colors">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Change Password</p>
              <p className="text-xs text-gray-500 mt-1">Send a reset link to your email.</p>
            </div>
          </button>

          <button
            onClick={() => notify('Feature Locked', '2FA configuration is handled by the SysAdmin.')}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Two-Factor Auth</p>
              <p className="text-xs text-gray-500 mt-1">Manage secondary authentication.</p>
            </div>
          </button>

          <button
            onClick={() => notify('Export Started', 'Your data archive is being generated.')}
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors text-left group col-span-1 md:col-span-2"
          >
            <div className="p-3 bg-green-50 text-green-600 rounded-lg group-hover:bg-green-100 transition-colors">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">Export Dashboard Data</p>
              <p className="text-xs text-gray-500 mt-1">Download your performance and attendance archives as CSV.</p>
            </div>
          </button>
        </div>
      </div>

      {/* Dynamic Toast Notifications */}
      {showToast.show && (
        <div className="fixed bottom-4 right-4 bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 z-50 max-w-sm">
          <div className="mt-0.5 w-6 h-6 text-green-400 flex-shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-bold text-sm text-white mb-0.5">{showToast.title}</p>
            <p className="text-xs text-slate-300 leading-snug">{showToast.desc}</p>
          </div>
        </div>
      )}
    </div>
  );
}
