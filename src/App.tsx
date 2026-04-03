import { useState, Component, ReactNode } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { AdminSettingsProvider } from './contexts/AdminSettingsContext';
import { useAuth } from './hooks/useAuth';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { Dashboard } from './components/Dashboard';

// Error boundary to catch and display runtime errors
class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('App crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg w-full">
            <h1 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-700 font-mono text-sm bg-red-50 p-4 rounded border border-red-200 break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <p className="text-gray-500 text-xs mt-4 font-mono whitespace-pre-wrap">
              {this.state.error?.stack?.split('\n').slice(0, 5).join('\n')}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppContent() {
  const { user, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return isSignup
    ? <Signup onNavigateLogin={() => setIsSignup(false)} />
    : <Login onNavigateSignup={() => setIsSignup(true)} />;
}

function App() {
  return (
    <ErrorBoundary>
      <AdminSettingsProvider>
        <LanguageProvider>
          <AuthProvider>
            <ErrorBoundary>
              <AppContent />
            </ErrorBoundary>
          </AuthProvider>
        </LanguageProvider>
      </AdminSettingsProvider>
    </ErrorBoundary>
  );
}

export default App;

