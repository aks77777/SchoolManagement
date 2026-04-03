import { ReactNode, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { GraduationCap, LogOut, Menu, Bell, Search, Settings } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  navigation: Array<{
    name: string;
    icon: ReactNode;
    current: boolean;
    onClick: () => void;
  }>;
  onSettingsClick?: () => void;
  settingsContent?: ReactNode;
  notificationsContent?: ReactNode;
}

export function DashboardLayout({ children, navigation, onSettingsClick, settingsContent, notificationsContent }: DashboardLayoutProps) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen flex text-slate-800 font-sans selection:bg-blue-100">

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`
          fixed lg:sticky top-0 z-50 h-screen w-[280px] shrink-0
          bg-white/80 backdrop-blur-xl border-r border-white/50
          p-6 flex flex-col gap-8
          transition-transform duration-300 ease-in-out shadow-2xl lg:shadow-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo Area */}
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 text-white">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">AK Group</h1>
            <p className="text-xs text-slate-500 font-medium">School Management</p>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-2">
          {navigation.map((item) => (
            <button
              key={item.name}
              onClick={() => {
                item.onClick();
                setSidebarOpen(false);
              }}
              className={`w-full sidebar-link ${item.current ? 'sidebar-link-active' : 'sidebar-link-inactive'}`}
            >
              <div className={`${item.current ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`}>
                {item.icon}
              </div>
              <span>{item.name}</span>
            </button>
          ))}
        </nav>

        {/* User Profile Snippet (Bottom Sidebar) */}
        <div className="pt-6 border-t border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 p-[2px] ring-2 ring-white">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-sm">
                {profile?.full_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.full_name}</p>
            <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
          </div>
          <button onClick={handleSignOut} className="text-slate-400 hover:text-red-500 transition-colors p-2">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>


      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top Header (Floating Glass) */}
        <header className="sticky top-0 z-30 px-6 py-4">
          <div className="glass-panel rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 text-slate-500 hover:text-blue-600 transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="hidden md:flex items-center gap-3 bg-slate-50/80 px-4 py-2 rounded-xl text-slate-500 w-64 border border-transparent focus-within:border-blue-200 focus-within:bg-white transition-all">
                <Search className="w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="bg-transparent border-none outline-none text-sm w-full placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 relative z-50">
              <div className="relative">
                <button onClick={() => { setNotificationsOpen(!notificationsOpen); setSettingsOpen(false); }} className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                  <Bell className="w-5 h-5" />
                  {profile?.role === 'admin' && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>}
                </button>
                {notificationsOpen && notificationsContent && (
                  <>
                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setNotificationsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-[340px] bg-white rounded-xl shadow-2xl shadow-blue-900/10 border border-gray-100 z-50 animate-in fade-in slide-in-from-top-4 max-h-[80vh] overflow-y-auto">
                      {notificationsContent}
                    </div>
                  </>
                )}
              </div>
              
              <div className="relative">
                <button
                  onClick={() => {
                    if (settingsContent) { setSettingsOpen(!settingsOpen); setNotificationsOpen(false); }
                    else if (onSettingsClick) onSettingsClick();
                  }}
                  className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors relative"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </button>
                {settingsOpen && settingsContent && (
                  <>
                    <div className="fixed inset-0 z-40 cursor-default" onClick={() => setSettingsOpen(false)}></div>
                    <div className="absolute right-0 mt-2 w-[480px] bg-white rounded-xl shadow-2xl shadow-blue-900/10 border border-gray-100 z-50 animate-in fade-in slide-in-from-top-4 max-h-[85vh] overflow-y-auto custom-scrollbar">
                      {settingsContent}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 pt-2">
          <div className="max-w-7xl mx-auto space-y-6 animate-fadeIn">
            {children}
          </div>
        </div>
      </main>

    </div>
  );
}
