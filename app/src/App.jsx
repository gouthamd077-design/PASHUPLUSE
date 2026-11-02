import React, { useState, useEffect } from 'react';
import { I18nProvider } from './i18n';
import { getAuthToken, setAuthToken, apiRequest } from './api/client';
import { runSync } from './sync/syncManager';

// Components
import Navbar from './components/Navbar';
import OfflineBanner from './components/OfflineBanner';
import BottomNav from './components/BottomNav';
import PashuSOSModal from './components/PashuSOSModal';

// Screens
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import AnimalListScreen from './screens/AnimalListScreen';
import AnimalDetailScreen from './screens/AnimalDetailScreen';
import ReportSymptomsScreen from './screens/ReportSymptomsScreen';
import VillageRadarScreen from './screens/VillageRadarScreen';
import MedicineAdherenceScreen from './screens/MedicineAdherenceScreen';
import PashuLearningScreen from './screens/PashuLearningScreen';
import PashuCopilotScreen from './screens/PashuCopilotScreen';
import VetDirectoryScreen from './screens/VetDirectoryScreen';
import VetDashboardScreen from './screens/VetDashboardScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getAuthToken());
  const [currentRole, setCurrentRole] = useState(() => localStorage.getItem('pashupulse_role') || 'farmer');
  const [activeTab, setActiveTab] = useState('home');
  const [selectedAnimalId, setSelectedAnimalId] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isGlobalSosOpen, setIsGlobalSosOpen] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (getAuthToken()) {
        runSync();
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial background sync if already authenticated
    if (getAuthToken() && navigator.onLine) {
      runSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogout = () => {
    setAuthToken(null);
    localStorage.removeItem('pashupulse_phone');
    localStorage.removeItem('pashupulse_user_id');
    localStorage.removeItem('pashupulse_role');
    setIsAuthenticated(false);
    setSelectedAnimalId(null);
    setActiveTab('home');
    setCurrentRole('farmer');
  };

  const handleSwitchRole = async (newRole) => {
    setCurrentRole(newRole);
    localStorage.setItem('pashupulse_role', newRole);
    if (getAuthToken() && navigator.onLine) {
      try {
        await apiRequest('/auth/switch-role', {
          method: 'POST',
          body: JSON.stringify({ role: newRole }),
        });
      } catch (e) {
        // Optimistic local update
      }
    }
  };

  const handleLoginSuccess = (data) => {
    setIsAuthenticated(true);
    if (data?.role) {
      setCurrentRole(data.role);
    }
  };

  return (
    <I18nProvider>
      <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
        <Navbar
          onLogout={isAuthenticated ? handleLogout : null}
          isOnline={isOnline}
          currentRole={currentRole}
          onSwitchRole={handleSwitchRole}
          onTriggerSOS={() => setIsGlobalSosOpen(true)}
        />
        <OfflineBanner isOnline={isOnline} />

        <main className="flex-1 max-w-4xl w-full mx-auto p-4">
          {!isAuthenticated ? (
            <LoginScreen onLoginSuccess={handleLoginSuccess} />
          ) : currentRole === 'veterinarian' ? (
            /* Veterinarian Clinical Dashboard */
            <VetDashboardScreen />
          ) : currentRole === 'admin' ? (
            /* Administrator Dashboard */
            <AdminDashboardScreen />
          ) : selectedAnimalId ? (
            /* Animal Health Record & Timeline */
            <AnimalDetailScreen
              animalId={selectedAnimalId}
              onBack={() => setSelectedAnimalId(null)}
            />
          ) : (
            /* Farmer / User View */
            <>
              {activeTab === 'home' && (
                <HomeScreen onNavigate={(tab) => setActiveTab(tab)} />
              )}
              {activeTab === 'animals' && (
                <AnimalListScreen onSelectAnimal={(id) => setSelectedAnimalId(id)} />
              )}
              {activeTab === 'report' && (
                <ReportSymptomsScreen
                  onCaseCreated={() => setActiveTab('adherence')}
                  onNavigateToVets={() => setActiveTab('vets')}
                />
              )}
              {activeTab === 'radar' && <VillageRadarScreen />}
              {activeTab === 'adherence' && <MedicineAdherenceScreen />}
              {activeTab === 'learning' && <PashuLearningScreen />}
              {activeTab === 'copilot' && <PashuCopilotScreen />}
              {activeTab === 'vets' && <VetDirectoryScreen />}
            </>
          )}
        </main>

        {/* Farmer Bottom Navigation */}
        {isAuthenticated && currentRole === 'farmer' && !selectedAnimalId && (
          <BottomNav activeTab={activeTab} onSelectTab={(tab) => setActiveTab(tab)} />
        )}

        {/* Global Emergency SOS Modal */}
        <PashuSOSModal
          isOpen={isGlobalSosOpen}
          onClose={() => setIsGlobalSosOpen(false)}
        />
      </div>
    </I18nProvider>
  );
}
