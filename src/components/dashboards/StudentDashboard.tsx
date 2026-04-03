import { useState, useEffect } from 'react';
import { DashboardLayout } from '../shared/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import {
  Calendar,
  FileText,
  BookOpen,
  Award,
  Trophy,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Shield,
  AlertTriangle,
  Info,
  X
} from 'lucide-react';
import type { Document, Quiz, Achievement } from '../../types/database';
import { AcademicCalendar } from '../shared/AcademicCalendar';
import { useAdminSettings } from '../../contexts/AdminSettingsContext';

type View = 'overview' | 'attendance' | 'documents' | 'quizzes' | 'achievements';

export function StudentDashboard() {
  const { profile } = useAuth();
  const { settings, notifications, dismissNotification } = useAdminSettings();
  const [currentView, setCurrentView] = useState<View>('overview');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attendance, setAttendance] = useState<any[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [attendanceData, documentsData, quizzesData, achievementsData] = await Promise.all([
          supabase.from('attendance').select('*, period:periods(*, subject:subjects(*))').eq('student_id', profile?.id || ''),
          supabase.from('documents').select('*').eq('is_public', true),
          supabase.from('quizzes').select('*').eq('is_active', true),
          supabase.from('achievements').select('*').eq('student_id', profile?.id || ''),
        ]);

        if (attendanceData.data) setAttendance(attendanceData.data);
        if (documentsData.data) setDocuments(documentsData.data);
        if (quizzesData.data) setQuizzes(quizzesData.data);
        if (achievementsData.data) setAchievements(achievementsData.data);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [profile?.id]);

  const navigation = [
    {
      name: 'Overview',
      icon: <Calendar className="w-5 h-5" />,
      current: currentView === 'overview',
      onClick: () => setCurrentView('overview'),
    },
    {
      name: 'Attendance',
      icon: <CheckCircle className="w-5 h-5" />,
      current: currentView === 'attendance',
      onClick: () => setCurrentView('attendance'),
    },
    {
      name: 'Documents & Notes',
      icon: <FileText className="w-5 h-5" />,
      current: currentView === 'documents',
      onClick: () => setCurrentView('documents'),
    },
    ...(settings.studentAssignmentsVisible ? [{
      name: 'Quizzes',
      icon: <BookOpen className="w-5 h-5" />,
      current: currentView === 'quizzes',
      onClick: () => setCurrentView('quizzes'),
    }] : []),
    ...(settings.reportsVisible ? [{
      name: 'Achievements',
      icon: <Award className="w-5 h-5" />,
      current: currentView === 'achievements',
      onClick: () => setCurrentView('achievements'),
    }] : []),
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
            The student portal is temporarily unavailable during scheduled maintenance. Check back shortly.
          </p>
          <div className="animate-pulse flex items-center gap-2 text-orange-600 font-bold bg-orange-50 px-4 py-2 rounded-full border border-orange-200">
            <div className="w-2 h-2 bg-orange-600 rounded-full"></div> Offline Mode
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
        return <OverviewView attendance={attendance} achievements={achievements} quizzes={quizzes} />;
      case 'attendance':
        return <AttendanceView attendance={attendance} />;
      case 'documents':
        return <DocumentsView documents={documents} />;
      case 'quizzes':
        return settings.studentAssignmentsVisible ? <QuizzesView quizzes={quizzes} /> : <div className="text-center p-8">Feature unavailable</div>;
      case 'achievements':
        return settings.reportsVisible ? <AchievementsView achievements={achievements} /> : <div className="text-center p-8">Feature unavailable</div>;
      default:
        return null;
    }
  };

  const visibleNotifications = notifications.filter(n => n.targetRole === 'all' || n.targetRole === 'student');

  return (
    <DashboardLayout navigation={navigation}>
      <div className="flex flex-col gap-4 mb-6">
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
function OverviewView({ attendance, achievements, quizzes: _quizzes }: { attendance: any[]; achievements: Achievement[]; quizzes: Quiz[] }) {
  const totalClasses = attendance.length;
  const presentClasses = attendance.filter((a) => a.status === 'present').length;
  const attendancePercent = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Student Profile</h2>
        <span className="text-sm font-medium text-slate-500">Welcome back!</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="glass-card p-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-400 to-blue-600 p-[3px] ring-4 ring-blue-50/50">
            <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-3xl font-bold text-blue-600">
              S
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">Student Name</h3>
            <p className="text-sm text-gray-500">Grade 10 • Roll No: 1524</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-orange-100/50 text-orange-700 rounded-full text-sm font-bold">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            GPA: 3.8
          </div>
        </div>

        {/* Attendance Stats */}
        <div className="glass-card p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-gray-700">Attendance</h3>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-md">Good</span>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Overall Attendance</span>
                <span className="font-bold text-gray-800">{attendancePercent}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div style={{ width: `${attendancePercent}%` }} className="h-full bg-blue-500 rounded-full"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-blue-50/50 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{presentClasses}</p>
                <p className="text-[10px] text-gray-500 uppercase">Present</p>
              </div>
              <div className="p-2 bg-red-50/50 rounded-lg">
                <p className="text-lg font-bold text-red-500">{totalClasses - presentClasses}</p>
                <p className="text-[10px] text-gray-500 uppercase">Absent</p>
              </div>
              <div className="p-2 bg-gray-50/50 rounded-lg">
                <p className="text-lg font-bold text-gray-600">{totalClasses}</p>
                <p className="text-[10px] text-gray-500 uppercase">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Preview */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-700">Recent Badges</h3>
            <Award className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="space-y-3">
            {achievements.slice(0, 3).map((ach) => (
              <div key={ach.id} className="flex items-center gap-3 p-2 bg-white/50 rounded-lg border border-white/60">
                <div className="p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg text-white shadow-lg shadow-orange-200/50">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{ach.title}</p>
                  <p className="text-xs text-gray-500 truncate">{ach.category}</p>
                </div>
              </div>
            ))}
            {achievements.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No badges yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col">
          {/* Career/Skill Roadmap Placeholder */}
          <div className="glass-card p-6 flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-800">Skill Progress</h3>
              <button className="text-sm text-blue-600 font-medium hover:underline">View Roadmap</button>
            </div>
            <div className="space-y-4">
              {['Mathematics', 'Science', 'English'].map((subject, i) => (
                <div key={subject}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{subject}</span>
                    <span className="font-bold text-blue-600">{90 - i * 5}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div style={{ width: `${90 - i * 5}%` }} className={`h-full rounded-full ${i === 0 ? 'bg-blue-500' : i === 1 ? 'bg-orange-400' : 'bg-green-400'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="lg:col-span-1">
          <AcademicCalendar />
        </div>
      </div>

    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AttendanceView({ attendance }: { attendance: any[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Attendance</h2>

      <div className="glass-card p-1">
        <div className="overflow-x-auto rounded-xl">
          <table className="w-full">
            <thead className="bg-blue-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Period</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-blue-800 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white/40">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{record.period?.subject?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">Period {record.period?.period_number || 'N/A'}</td>
                  <td className="px-6 py-4">
                    {record.status === 'present' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100/80 text-green-700 rounded-full text-xs font-bold shadow-sm">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Present
                      </span>
                    )}
                    {record.status === 'absent' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100/80 text-red-700 rounded-full text-xs font-bold shadow-sm">
                        <XCircle className="w-3.5 h-3.5" />
                        Absent
                      </span>
                    )}
                    {record.status === 'late' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-100/80 text-yellow-700 rounded-full text-xs font-bold shadow-sm">
                        <Clock className="w-3.5 h-3.5" />
                        Late
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {attendance.length === 0 && (
            <div className="text-center py-12 text-gray-500">No attendance records found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentsView({ documents }: { documents: Document[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Documents & Notes</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => (
          <div key={doc.id} className="glass-card p-6 flex flex-col relative group">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-100/50 rounded-xl p-3 text-blue-600">
                <FileText className="w-6 h-6" />
              </div>
              <span className="text-xs px-2 py-1 bg-white/50 border border-white text-gray-500 rounded-md capitalize font-medium">
                {doc.document_category}
              </span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2 truncate">{doc.title}</h3>
            <p className="text-sm text-gray-500 mb-6 flex-1 line-clamp-2">{doc.description}</p>
            <button className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl hover:shadow-md transition-all font-medium text-sm border border-blue-200">
              <Download className="w-4 h-4" />
              Download Material
            </button>
          </div>
        ))}
      </div>
      {documents.length === 0 && (
        <div className="glass-card p-12 text-center text-gray-500">
          No documents available
        </div>
      )}
    </div>
  );
}

function QuizzesView({ quizzes }: { quizzes: Quiz[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Available Quizzes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="glass-card p-0 overflow-hidden flex flex-col">
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-b border-green-100">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/80 rounded-lg p-2 text-green-600 shadow-sm">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-xs px-2 py-1 bg-green-200/50 text-green-800 rounded-md font-bold uppercase tracking-wide">
                  Active
                </span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1">{quiz.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-1">{quiz.description}</p>
            </div>
            <div className="p-6 pt-4 flex-1 flex flex-col">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <Clock className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                  <span className="text-sm font-semibold text-gray-700">{quiz.duration_minutes}m</span>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <Trophy className="w-4 h-4 mx-auto text-gray-400 mb-1" />
                  <span className="text-sm font-semibold text-gray-700">{quiz.total_marks}pts</span>
                </div>
              </div>
              <button className="mt-auto w-full py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-bold shadow-lg shadow-green-500/20">
                Start Quiz
              </button>
            </div>
          </div>
        ))}
      </div>
      {quizzes.length === 0 && (
        <div className="glass-card p-12 text-center text-gray-500">
          No active quizzes available
        </div>
      )}
    </div>
  );
}

function AchievementsView({ achievements }: { achievements: Achievement[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Achievements</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className="glass-card p-6 flex items-start gap-4 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-20 bg-yellow-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-400/20 transition-all"></div>
            <div className="relative bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl p-4 shadow-lg shadow-orange-500/30 text-white">
              <Trophy className="w-8 h-8" />
            </div>
            <div className="flex-1 relative">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-800">{achievement.title}</h3>
                {achievement.rank && (
                  <div className="bg-gray-900 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30">
                    #{achievement.rank}
                  </div>
                )}
              </div>
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">{achievement.description}</p>
              <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded-md uppercase tracking-wide">{achievement.category}</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(achievement.awarded_date).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {achievements.length === 0 && (
        <div className="glass-card p-12 text-center text-gray-500">
          No achievements yet. Keep up the good work!
        </div>
      )}
    </div>
  );
}
