import { useState, useEffect } from 'react';
import { DashboardLayout } from '../shared/DashboardLayout';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import {
  Calendar,
  FileText,
  BookOpen,
  Award,
  Upload,
  Download,
  CheckCircle,
  XCircle,
  Clock,
  Trophy,
} from 'lucide-react';
import type { Attendance, Document, Quiz, Achievement } from '../../types/database';

type View = 'overview' | 'attendance' | 'documents' | 'quizzes' | 'achievements';

export function StudentDashboard() {
  const { profile } = useAuth();
  const [currentView, setCurrentView] = useState<View>('overview');
  const [attendance, setAttendance] = useState<any[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
    {
      name: 'Quizzes',
      icon: <BookOpen className="w-5 h-5" />,
      current: currentView === 'quizzes',
      onClick: () => setCurrentView('quizzes'),
    },
    {
      name: 'Achievements',
      icon: <Award className="w-5 h-5" />,
      current: currentView === 'achievements',
      onClick: () => setCurrentView('achievements'),
    },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading...</div>
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
        return <QuizzesView quizzes={quizzes} />;
      case 'achievements':
        return <AchievementsView achievements={achievements} />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout navigation={navigation}>
      {renderContent()}
    </DashboardLayout>
  );
}

function OverviewView({ attendance, achievements, quizzes }: { attendance: any[]; achievements: Achievement[]; quizzes: Quiz[] }) {
  const totalClasses = attendance.length;
  const presentClasses = attendance.filter((a) => a.status === 'present').length;
  const attendancePercent = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Attendance</p>
              <p className="text-3xl font-bold text-blue-600">{attendancePercent}%</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Quizzes</p>
              <p className="text-3xl font-bold text-green-600">{quizzes.length}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Achievements</p>
              <p className="text-3xl font-bold text-yellow-600">{achievements.length}</p>
            </div>
            <div className="bg-yellow-100 rounded-full p-3">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Classes</p>
              <p className="text-3xl font-bold text-gray-700">{totalClasses}</p>
            </div>
            <div className="bg-gray-100 rounded-full p-3">
              <Calendar className="w-6 h-6 text-gray-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Achievements</h3>
        {achievements.length > 0 ? (
          <div className="space-y-3">
            {achievements.slice(0, 3).map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-4 p-3 bg-yellow-50 rounded-lg">
                <Trophy className="w-8 h-8 text-yellow-600" />
                <div>
                  <p className="font-medium text-gray-800">{achievement.title}</p>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
                {achievement.rank && (
                  <div className="ml-auto bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                    #{achievement.rank}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No achievements yet</p>
        )}
      </div>
    </div>
  );
}

function AttendanceView({ attendance }: { attendance: any[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">My Attendance</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {attendance.map((record) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{new Date(record.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{record.period?.subject?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">Period {record.period?.period_number || 'N/A'}</td>
                  <td className="px-6 py-4">
                    {record.status === 'present' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Present
                      </span>
                    )}
                    {record.status === 'absent' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                        <XCircle className="w-3 h-3" />
                        Absent
                      </span>
                    )}
                    {record.status === 'late' && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                        <Clock className="w-3 h-3" />
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
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full capitalize">
                {doc.document_category}
              </span>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{doc.title}</h3>
            <p className="text-sm text-gray-600 mb-4 line-clamp-2">{doc.description}</p>
            <button className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        ))}
      </div>
      {documents.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
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
          <div key={quiz.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-xs px-3 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                Active
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{quiz.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{quiz.description}</p>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {quiz.duration_minutes} min
              </span>
              <span className="font-medium">{quiz.total_marks} marks</span>
            </div>
            <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors font-medium">
              Start Quiz
            </button>
          </div>
        ))}
      </div>
      {quizzes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
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
            className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-sm border border-yellow-200 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="bg-yellow-400 rounded-full p-4">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-gray-800">{achievement.title}</h3>
                  {achievement.rank && (
                    <div className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                      Rank #{achievement.rank}
                    </div>
                  )}
                </div>
                <p className="text-gray-700 mb-3">{achievement.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="capitalize px-3 py-1 bg-white rounded-full">{achievement.category}</span>
                  <span>{new Date(achievement.awarded_date).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      {achievements.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          No achievements yet. Keep up the good work!
        </div>
      )}
    </div>
  );
}
