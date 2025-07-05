import { Routes, Route } from 'react-router-dom';
import { Ticket, Users, Trophy, MessageSquare } from 'lucide-react';
import { CoreDashboard } from './components/dashboard/CoreDashboard';
import { ChallengePage } from './components/dashboard/challenge/ChallengePage';
import { ChatPage } from './components/chat/ChatPage';
import { VitalResponsePage } from './components/common/VitalResponePage';
import { WeeklyActionForm } from './components/dashboard/quest/WeeklyActionForm';
import { QuestProgress } from './components/dashboard/quest/QuestProgress';
import { DeviceConnection } from './components/health/DeviceConnection';
import { SubscriptionSuccess } from './components/subscription/SubscriptionSuccess';
import { PasswordUpdateForm } from './components/auth/PasswordUpdateForm';
import { CodeManager } from './components/admin/CodeManager';
import { MessageManager } from './components/admin/MessageManager';
import { ChallengeDailyForm } from './components/dashboard/challenge/ChallengeDailyForm';
import { CustomChallengeCreator } from './components/dashboard/challenge/CustomChallengeCreator';
import { CustomChallengeProgress } from './components/dashboard/challenge/CustomChallengeProgress';
import { CustomChallengeDailyForm } from './components/dashboard/challenge/CustomChallengeDailyForm';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ChallengeManager } from './components/admin/ChallengeManager';
import { QuestManager } from './components/admin/QuestManager';
import { AdminLayout } from './components/admin/AdminLayout';
import { SupportMessageManager } from './components/admin/SupportMessageManager';

export function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<CoreDashboard />} />
        <Route path='/reset-password' element={<PasswordUpdateForm/>}/>
        <Route path="/challenge/:challengeId" element={<ChallengePage />} />
        <Route path="/quest/:questId" element={<QuestProgress />} />
        <Route path="/quest/:questId/weekly" element={<WeeklyActionForm />} />
        <Route path="/challenge/:challengeId/daily" element={<ChallengeDailyForm />} />
        <Route path="/chat/:chatId" element={<ChatPage />} />
        <Route path='/connect-device' element={<DeviceConnection/>}/>
        <Route path="/custom-challenge/create" element={<CustomChallengeCreator />} />
        <Route path="/custom-challenge/:challengeId" element={<CustomChallengeProgress />} />
        <Route path="/custom-challenge/:challengeId/daily" element={<CustomChallengeDailyForm />} />
        <Route path="/vital-response" element={<VitalResponsePage/>}/>
        <Route path="/subscription/success" element={<SubscriptionSuccess onClose={() => window.location.href = '/'} />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/codes" element={<AdminLayout title="Code Management\" icon={<Ticket className="text-orange-500\" size={24} />}><CodeManager /></AdminLayout>} />
        <Route path="/admin/users" element={<AdminLayout title="User Management\" icon={<Users className="text-orange-500\" size={24} />}><CodeManager /></AdminLayout>} />
        <Route path="/admin/contests" element={<AdminLayout title="Contest Management\" icon={<Trophy className="text-orange-500\" size={24} />}><CodeManager /></AdminLayout>} />
        <Route path="/admin/messages" element={<MessageManager />} />
        <Route path="/admin/challenges" element={<ChallengeManager />} />
        <Route path="/admin/quests" element={<QuestManager />} />
        <Route path="/admin/support" element={<SupportMessageManager />} />
      </Routes>
    </>
  );
}