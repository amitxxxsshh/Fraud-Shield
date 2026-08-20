import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { SecurePaySimulatorPage } from './pages/SecurePaySimulatorPage';
import { DemoScenariosPage } from './pages/DemoScenariosPage';
import { VoiceAnalyzerPage } from './pages/VoiceAnalyzerPage';
import { MessageAnalyzerPage } from './pages/MessageAnalyzerPage';
import { TransactionsPage } from './pages/TransactionsPage';
import { RiskEventsPage } from './pages/RiskEventsPage';
import { FeedbackPage } from './pages/FeedbackPage';
import { ModelInspectorPage } from './pages/ModelInspectorPage';
import { PrivacyCenterPage } from './pages/PrivacyCenterPage';
import { useWebSocket } from './hooks/useWebSocket';

export const App: React.FC = () => {
  const { isConnected, lastEvent } = useWebSocket();

  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
        <Navbar wsConnected={isConnected} />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
            <Routes>
              <Route path="/" element={<DashboardPage lastEvent={lastEvent} />} />
              <Route path="/simulator" element={<SecurePaySimulatorPage />} />
              <Route path="/scenarios" element={<DemoScenariosPage />} />
              <Route path="/voice" element={<VoiceAnalyzerPage />} />
              <Route path="/messages" element={<MessageAnalyzerPage />} />
              <Route path="/transactions" element={<TransactionsPage />} />
              <Route path="/risk-events" element={<RiskEventsPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/model" element={<ModelInspectorPage />} />
              <Route path="/privacy" element={<PrivacyCenterPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;
