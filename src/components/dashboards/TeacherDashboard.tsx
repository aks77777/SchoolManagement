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
} from 'lucide-react';
import type { Subject, Document, Quiz } from '../../types/database';

type View = 'overview' | 'attendance' | 'documents' | 'quizzes' | 'performance';

export function TeacherDashboard() {
  const { profile } = useAuth();
  const [currentView, setCurrentView] = useState<View>('overview');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
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
        return <OverviewView subjects={subjects} documents={documents} quizzes={quizzes} />;
      case 'attendance':
        return <AttendanceView subjects={subjects} />;
      case 'documents':
        return <DocumentsView documents={documents} subjects={subjects} />;
      case 'quizzes':
        return <QuizzesView quizzes={quizzes} subjects={subjects} />;
      case 'performance':
        return <PerformanceView subjects={subjects} />;
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

function OverviewView({ subjects, documents, quizzes }: { subjects: any[]; documents: Document[]; quizzes: Quiz[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Teacher Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">My Subjects</p>
              <p className="text-3xl font-bold text-blue-600">{subjects.length}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Documents</p>
              <p className="text-3xl font-bold text-green-600">{documents.length}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Quizzes Created</p>
              <p className="text-3xl font-bold text-purple-600">{quizzes.length}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <BookOpen className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">My Subjects</h3>
        <div className="space-y-3">
          {subjects.map((subject) => (
            <div key={subject.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium text-gray-800">{subject.name}</p>
                <p className="text-sm text-gray-600">{subject.class?.name}</p>
              </div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                View Details
              </button>
            </div>
          ))}
          {subjects.length === 0 && (
            <p className="text-gray-500 text-center py-4">No subjects assigned</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AttendanceView({ subjects }: { subjects: any[] }) {
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [periods, setPeriods] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedSubject) {
      loadPeriods();
      loadStudents();
    }
  }, [selectedSubject]);

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

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async () => {
    if (!selectedPeriod) {
      alert('Please select a period');
      return;
    }

    try {
      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        period_id: selectedPeriod,
        date: selectedDate,
        status: attendanceData[student.id] || 'absent',
        marked_by: student.id,
      }));

      const { error } = await supabase.from('attendance').upsert(attendanceRecords);

      if (error) throw error;
      alert('Attendance marked successfully!');
      setAttendanceData({});
    } catch (error) {
      console.error('Error marking attendance:', error);
      alert('Failed to mark attendance');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Mark Attendance</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name} - {subject.class?.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select Period</option>
              {periods.map((period) => (
                <option key={period.id} value={period.id}>
                  Period {period.period_number}
                </option>
              ))}
            </select>
          </div>
        </div>

        {students.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Present</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Absent</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Late</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 text-sm text-gray-900">{student.full_name}</td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          checked={attendanceData[student.id] === 'present'}
                          onChange={() => handleAttendanceChange(student.id, 'present')}
                          className="w-4 h-4 text-green-600 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          checked={attendanceData[student.id] === 'absent'}
                          onChange={() => handleAttendanceChange(student.id, 'absent')}
                          className="w-4 h-4 text-red-600 focus:ring-red-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="radio"
                          name={`attendance-${student.id}`}
                          checked={attendanceData[student.id] === 'late'}
                          onChange={() => handleAttendanceChange(student.id, 'late')}
                          className="w-4 h-4 text-yellow-600 focus:ring-yellow-500"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Submit Attendance
              </button>
            </div>
          </>
        )}

        {selectedSubject && students.length === 0 && (
          <div className="text-center py-12 text-gray-500">No students found in this class</div>
        )}
      </div>
    </div>
  );
}

function DocumentsView({ documents, subjects }: { documents: Document[]; subjects: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Documents</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <Edit className="w-4 h-4" />
              </button>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{doc.title}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="capitalize px-2 py-1 bg-gray-100 rounded">{doc.document_category}</span>
              <span>{doc.is_public ? 'Public' : 'Private'}</span>
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          No documents uploaded yet
        </div>
      )}
    </div>
  );
}

function QuizzesView({ quizzes, subjects }: { quizzes: Quiz[]; subjects: any[] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">My Quizzes</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Create Quiz
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                quiz.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {quiz.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{quiz.title}</h3>
            <p className="text-sm text-gray-600 mb-4">{quiz.description}</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">{quiz.duration_minutes} min</span>
              <span className="font-medium text-purple-600">{quiz.total_marks} marks</span>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                Edit
              </button>
              <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                View Results
              </button>
            </div>
          </div>
        ))}
      </div>

      {quizzes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          No quizzes created yet
        </div>
      )}
    </div>
  );
}

function PerformanceView({ subjects }: { subjects: any[] }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Class Performance</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-600 text-center py-12">
          Performance analytics will be displayed here
        </p>
      </div>
    </div>
  );
}
