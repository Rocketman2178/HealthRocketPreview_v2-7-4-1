import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, MessageSquare, Ticket, Trophy, ArrowLeft, Home, HelpCircle, BarChart, Target } from 'lucide-react';
import { useSupabase } from '../../contexts/SupabaseContext';
import { Card } from '../ui/card';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  icon?: React.ReactNode;
}

export function AdminLayout({ children, title, icon }: AdminLayoutProps) {
  const navigate = useNavigate();
  const { user } = useSupabase();
  const [isAdmin, setIsAdmin] = React.useState(false);
  
  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      // For demo purposes, we'll consider specific users as admins
      const adminEmails = ['admin@healthrocket.app', 'clay@healthrocket.life', 'clay@healthrocket.app', 'derek@healthrocket.life'];
      setIsAdmin(adminEmails.includes(user.email || ''));
    };
    
    checkAdminStatus();
  }, [user]);

  if (!isAdmin) {
    return (
      <Card className="p-4">
        <div className="flex flex-col items-center justify-center gap-2 text-gray-400 p-8">
          <Shield size={32} className="text-orange-500 mb-2" />
          <h3 className="text-xl font-bold text-white">Admin Access Required</h3>
          <p className="text-gray-300 text-center mt-2">
            You need administrator privileges to access this page. Please contact support if you believe this is an error.
          </p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {icon || <Shield className="text-orange-500\" size={24} />}
          <h1 className="text-2xl font-bold text-white">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin')}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Admin</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 hover:text-white transition-colors"
          >
            <Home size={16} />
            <span>Main Dashboard</span>
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="md:col-span-1">
          <Card className="p-4">
            <nav className="space-y-2">
              <button
                onClick={() => navigate('/admin')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  location.pathname === '/admin' || location.pathname === '/admin/dashboard'
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <BarChart size={16} />
                <span>Dashboard</span>
              </button>
              
              <button
                onClick={() => navigate('/admin')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  location.pathname === '/admin/codes' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Ticket size={16} />
                <span>Codes</span>
              </button>
              
              <button
                onClick={() => navigate('/admin/challenges')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  location.pathname === '/admin/challenges' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Target size={16} />
                <span>Challenges</span>
              </button>
              
              <button
                onClick={() => navigate('/admin/quests')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  location.pathname === '/admin/quests' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Target size={16} />
                <span>Quests</span>
              </button>
              
              <button
                onClick={() => navigate('/admin')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  location.pathname === '/admin/users' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Users size={16} />
                <span>Users</span>
              </button>
              
              <button
                onClick={() => navigate('/admin/messages')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  location.pathname === '/admin/contests' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <Trophy size={16} />
                <span>Contests</span>
              </button>
              
              <button
                onClick={() => navigate('/admin/messages')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  location.pathname === '/admin/messages' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <MessageSquare size={16} />
                <span>Player Messages</span>
              </button>
              
              <button
                onClick={() => navigate('/admin/support')}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  location.pathname === '/admin/support' 
                    ? 'bg-orange-500 text-white' 
                    : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <HelpCircle size={16} />
                <span>Support & Feedback</span>
              </button>
            </nav>
          </Card>
        </div>
        <div className="md:col-span-4">
          {children}
        </div>
      </div>
    </div>
  );
}