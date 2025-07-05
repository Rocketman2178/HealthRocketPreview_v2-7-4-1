import { BrowserRouter } from 'react-router-dom';
import { SupabaseProvider } from './contexts/SupabaseContext'; 
import { CosmoProvider } from './contexts/CosmoContext';
import { ModalProvider } from './contexts/ModalContext';
import { StripeProvider } from './contexts/StripeContext';
import AppContent from './components/common/AppContent';
import { PWAInstallPrompt } from './components/ui/pwa-install-prompt';

function App() {
  return (
    <BrowserRouter>
      <SupabaseProvider>
        <StripeProvider>
          <CosmoProvider>
            <ModalProvider>
              <AppContent />
              <PWAInstallPrompt />
            </ModalProvider>
          </CosmoProvider>
        </StripeProvider>
      </SupabaseProvider>
    </BrowserRouter>
  );
}

export default App;