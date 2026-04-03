import { useAuth } from '../hooks/useAuth';
import { StudentDashboard } from './dashboards/StudentDashboard';
import { TeacherDashboard } from './dashboards/TeacherDashboard';
import { AdminDashboard } from './dashboards/AdminDashboard';

export function Dashboard() {
  const { profile, error } = useAuth(); // Added error destructuring

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-600 mb-4 text-xl font-bold">Database Error</div>
          <p className="text-gray-600 mb-6 font-mono text-sm bg-red-50 p-3 rounded border border-red-200">
            {error.message}
          </p>
          <div className="text-left text-sm text-gray-700 bg-gray-100 p-4 rounded border border-gray-300">
            <strong>To fix this error:</strong>
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Open <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-600 underline">Supabase Dashboard</a></li>
              <li>Go to <strong>SQL Editor</strong></li>
              <li>Run: <code className="bg-gray-200 px-1 rounded">supabase/migrations/20260218_complete_schema_with_trigger.sql</code></li>
              <li>Then run: <code className="bg-gray-200 px-1 rounded">supabase/migrations/20260219_seed_data.sql</code></li>
            </ol>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  switch (profile.role) {
    case 'student':
      return <StudentDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'admin':
      return <AdminDashboard />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-red-600">Invalid role</div>
        </div>
      );
  }
}
