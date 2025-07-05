import { useState, useEffect } from 'react';
import { Download, X, Share, Plus, Info, ExternalLink } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface BrowserInfo {
  isIOS: boolean;
  isMacOS: boolean;
  isSafari: boolean;
  isChrome: boolean;
  isFirefox: boolean;
  isStandalone: boolean;
}

export function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({
    isIOS: false,
    isMacOS: false,
    isSafari: false,
    isChrome: false,
    isFirefox: false,
    isStandalone: false
  });
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Detect browser and platform
    const ua = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isMacOSDevice = /Mac/.test(ua) && !(window as any).MSStream;
    const isSafariDevice = /Safari/.test(ua) && !/Chrome/.test(ua);
    const isChromeDevice = /Chrome/.test(ua) && !/Edge/.test(ua);
    const isFirefoxDevice = /Firefox/.test(ua);
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || 
                            (window.navigator as any).standalone;
    
    setBrowserInfo({
      isIOS: isIOSDevice,
      isMacOS: isMacOSDevice,
      isSafari: isSafariDevice,
      isChrome: isChromeDevice,
      isFirefox: isFirefoxDevice,
      isStandalone: isStandaloneMode
    });

    // For browsers that support beforeinstallprompt
    if (!isIOSDevice && !(isMacOSDevice && isSafariDevice)) {
      const handleBeforeInstallPrompt = (e: Event) => {
        // Prevent Chrome 67 and earlier from automatically showing the prompt
        e.preventDefault();
        // Stash the event so it can be triggered later
        setInstallPrompt(e as BeforeInstallPromptEvent);
        // Show our custom install prompt
        setShowPrompt(true);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    } 
    
    // For iOS/Safari, show instructions if not already in standalone mode
    if ((isIOSDevice || (isMacOSDevice && isSafariDevice)) && !isStandaloneMode) {
      // Show iOS/Safari instructions after a delay
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    
    // Show the native install prompt
    await installPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await installPrompt.userChoice;
    
    // User accepted the install
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
    
    // Clear the saved prompt since it can't be used again
    setInstallPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowInstructions(false);
    // Save to localStorage to avoid showing again in this session
    localStorage.setItem('pwaPromptDismissed', 'true');
  };

  const renderInstructions = () => {
    if (browserInfo.isIOS) {
      return (
        <div className="p-4 bg-gray-700 rounded-lg mt-2">
          <h4 className="text-white font-medium mb-2">How to install on iOS:</h4>
          <ol className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>Tap the <Share size={14} className="inline mx-1" /> Share button</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>Scroll down and tap <span className="font-medium">Add to Home Screen</span></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span>Tap <span className="font-medium">Add</span> in the top right</span>
            </li>
          </ol>
        </div>
      );
    } else if (browserInfo.isMacOS && browserInfo.isSafari) {
      return (
        <div className="p-4 bg-gray-700 rounded-lg mt-2">
          <h4 className="text-white font-medium mb-2">How to install on Safari:</h4>
          <ol className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>Click the <Share size={14} className="inline mx-1" /> Share button in the toolbar</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>Select <span className="font-medium">Add to Dock</span></span>
            </li>
          </ol>
        </div>
      );
    } else if (browserInfo.isChrome) {
      return (
        <div className="p-4 bg-gray-700 rounded-lg mt-2">
          <h4 className="text-white font-medium mb-2">How to install on Chrome:</h4>
          <ol className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>Click the <span className="font-medium">Install</span> button above</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>Or click the <Plus size={14} className="inline mx-1" /> icon in the address bar</span>
            </li>
          </ol>
        </div>
      );
    } else if (browserInfo.isFirefox) {
      return (
        <div className="p-4 bg-gray-700 rounded-lg mt-2">
          <h4 className="text-white font-medium mb-2">How to install on Firefox:</h4>
          <ol className="space-y-2 text-sm text-gray-300">
            <li className="flex items-start gap-2">
              <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>Click the menu button (three lines) in the top right</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>Select <span className="font-medium">Install</span></span>
            </li>
          </ol>
        </div>
      );
    } else {
      return (
        <div className="p-4 bg-gray-700 rounded-lg mt-2">
          <h4 className="text-white font-medium mb-2">How to install:</h4>
          <p className="text-sm text-gray-300">Look for an install option in your browser's menu or click the Install button above.</p>
        </div>
      );
    }
  };

  // Don't show if user has dismissed or we're already in standalone mode
  if (!showPrompt || 
      localStorage.getItem('pwaPromptDismissed') === 'true' || 
      browserInfo.isStandalone) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-gray-800 rounded-lg shadow-lg border border-orange-500/30 p-4 animate-bounceIn max-w-md mx-auto">
      <div className="relative">
        <button 
          onClick={handleDismiss}
          className="absolute -top-1 -right-1 text-gray-400 hover:text-gray-300"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-center gap-3 pr-6">
          <Download className="text-orange-500" size={24} />
          
          <div className="flex-1">
            <h3 className="text-white font-medium">Install Health Rocket</h3>
            <p className="text-gray-300 text-xs mt-1">
              {(browserInfo.isIOS || (browserInfo.isMacOS && browserInfo.isSafari)) 
                ? 'Add to Home Screen for the best experience' 
                : 'Install our app for the best experience'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-3">
          <button
            onClick={() => setShowInstructions(!showInstructions)}
            className="text-orange-500 text-xs flex items-center gap-1 hover:text-orange-400 transition-colors ml-1"
          >
            <ExternalLink size={14} />
            <span>{showInstructions ? 'Hide instructions' : 'How to install'}</span>
          </button>
          
          {!(browserInfo.isIOS || (browserInfo.isMacOS && browserInfo.isSafari)) && (
            <button
              onClick={handleInstall}
              className="bg-orange-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              Install
            </button>
          )}
        </div>
        
        {showInstructions && renderInstructions()}
      </div>
    </div>
  );
}