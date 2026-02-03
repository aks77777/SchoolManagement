import { useState, useEffect } from 'react';
import { DashboardLayout } from '../shared/DashboardLayout';
import { supabase } from '../../lib/supabase';
import {
  Users,
  BookOpen,
  Calendar,
  FileText,
  Award,
  Settings,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';
import type { Profile, Class, Subject, Document, Achievement } from '../../types/database';

type View = 'overview' | 'users' | 'classes' | 'subjects' | 'documents' | 'achievements' | 'reports';

export function AdminDashboard() {
  const [currentView, setCurrentView] = useState<View>('overview');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
    {
      name: 'Overview',
      icon: <TrendingUp className="w-5 h-5" />,
      current: currentView === 'overview',
      onClick: () => setCurrentView('overview'),
    },
    {
      name: 'Users',
      icon: <Users className="w-5 h-5" />,
      current: currentView === 'users',
      onClick: () => setCurrentView('users'),
    },
    {
      name: 'Classes',
      icon: <BookOpen className="w-5 h-5" />,
      current: currentView === 'classes',
      onClick: () => setCurrentView('classes'),
    },
    {
      name: 'Subjects',
      icon: <Calendar className="w-5 h-5" />,
      current: currentView === 'subjects',
      onClick: () => setCurrentView('subjects'),
    },
    {
      name: 'Documents',
      icon: <FileText className="w-5 h-5" />,
      current: currentView === 'documents',
      onClick: () => setCurrentView('documents'),
    },
    {
      name: 'Achievements',
      icon: <Award className="w-5 h-5" />,
      current: currentView === 'achievements',
      onClick: () => setCurrentView('achievements'),
    },
    {
      name: 'Reports',
      icon: <Settings className="w-5 h-5" />,
      current: currentView === 'reports',
      onClick: () => setCurrentView('reports'),
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
        return <OverviewView profiles={profiles} classes={classes} subjects={subjects} documents={documents} />;
      case 'users':
        return <UsersView profiles={profiles} classes={classes} onRefresh={loadData} />;
      case 'classes':
        return <ClassesView classes={classes} onRefresh={loadData} />;
      case 'subjects':
        return <SubjectsView subjects={subjects} classes={classes} profiles={profiles} onRefresh={loadData} />;
      case 'documents':
        return <DocumentsView documents={documents} onRefresh={loadData} />;
      case 'achievements':
        return <AchievementsView achievements={achievements} onRefresh={loadData} />;
      case 'reports':
        return <ReportsView />;
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

function OverviewView({ profiles, classes, subjects, documents }: {
  profiles: Profile[];
  classes: Class[];
  subjects: Subject[];
  documents: Document[];
}) {
  const students = profiles.filter(p => p.role === 'student');
  const teachers = profiles.filter(p => p.role === 'teacher');
  const admins = profiles.filter(p => p.role === 'admin');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Students</p>
              <p className="text-3xl font-bold mt-1">{students.length}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Total Teachers</p>
              <p className="text-3xl font-bold mt-1">{teachers.length}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Classes</p>
              <p className="text-3xl font-bold mt-1">{classes.length}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Documents</p>
              <p className="text-3xl font-bold mt-1">{documents.length}</p>
            </div>
            <div className="bg-white/20 rounded-full p-3">
              <FileText className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Users</h3>
          <div className="space-y-3">
            {profiles.slice(0, 5).map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{profile.full_name}</p>
                  <p className="text-sm text-gray-500 capitalize">{profile.role}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  profile.role === 'student' ? 'bg-blue-100 text-blue-700' :
                  profile.role === 'teacher' ? 'bg-green-100 text-green-700' :
                  'bg-purple-100 text-purple-700'
                }`}>
                  {profile.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Classes Overview</h3>
          <div className="space-y-3">
            {classes.slice(0, 5).map((cls) => (
              <div key={cls.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-800">{cls.name}</p>
                  <p className="text-sm text-gray-500">Grade {cls.grade} - Section {cls.section}</p>
                </div>
                <BookOpen className="w-5 h-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersView({ profiles, classes, onRefresh }: { profiles: Profile[]; classes: Class[]; onRefresh: () => void }) {
  const [filter, setFilter] = useState<'all' | 'student' | 'teacher' | 'admin'>('all');

  const filteredProfiles = filter === 'all' ? profiles : profiles.filter(p => p.role === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      <div className="flex gap-2">
        {['all', 'student', 'teacher', 'admin'].map((role) => (
          <button
            key={role}
            onClick={() => setFilter(role as any)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${
              filter === role
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            {role}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredProfiles.map((profile) => (
                <tr key={profile.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{profile.full_name}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium capitalize ${
                      profile.role === 'student' ? 'bg-blue-100 text-blue-700' :
                      profile.role === 'teacher' ? 'bg-green-100 text-green-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {profile.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">{profile.phone || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProfiles.length === 0 && (
            <div className="text-center py-12 text-gray-500">No users found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ClassesView({ classes, onRefresh }: { classes: Class[]; onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Class Management</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.map((cls) => (
          <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <BookOpen className="w-6 h-6 text-purple-600" />
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{cls.name}</h3>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Grade {cls.grade}</span>
              <span>Section {cls.section}</span>
            </div>
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          No classes found
        </div>
      )}
    </div>
  );
}

function SubjectsView({ subjects, classes, profiles, onRefresh }: {
  subjects: any[];
  classes: Class[];
  profiles: Profile[];
  onRefresh: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Subject Management</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Subject
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
              {subjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{subject.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{subject.class?.name || 'N/A'}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{subject.teacher?.full_name || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {subjects.length === 0 && (
            <div className="text-center py-12 text-gray-500">No subjects found</div>
          )}
        </div>
      </div>
    </div>
  );
}

function DocumentsView({ documents, onRefresh }: { documents: Document[]; onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Document Management</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex gap-2">
                <button className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{doc.title}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{doc.description}</p>
            <div className="flex items-center justify-between text-xs">
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded capitalize">{doc.document_category}</span>
              <span className={`px-2 py-1 rounded ${doc.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                {doc.is_public ? 'Public' : 'Private'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          No documents found
        </div>
      )}
    </div>
  );
}

function AchievementsView({ achievements, onRefresh }: { achievements: any[]; onRefresh: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Achievement Management</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="w-4 h-4" />
          Add Achievement
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 rounded-full p-3">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">{achievement.title}</h3>
                  <p className="text-sm text-gray-600">{achievement.student?.full_name}</p>
                </div>
              </div>
              {achievement.rank && (
                <span className="bg-yellow-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  #{achievement.rank}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span className="capitalize px-2 py-1 bg-gray-100 rounded">{achievement.category}</span>
              <span>{new Date(achievement.awarded_date).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {achievements.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          No achievements found
        </div>
      )}
    </div>
  );
}

function ReportsView() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Reports & Analytics</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <p>Detailed reports and analytics will be displayed here</p>
      </div>
    </div>
  );
}
