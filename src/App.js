import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';

// Demo imports
import DemoPage from './pages/demo/DemoPage';
import PitchDeckDemo from './pages/demo/PitchDeckDemo';
import ContractorEstimateReadinessDemo from './components/landlord/ContractorEstimateReadinessDemo';

// Survey imports
import InternSurveyPage from './pages/InternSurveyPage';
import SurveyAdminPage from './pages/admin/SurveyAdminPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Demo Routes */}
        <Route path="/demo" element={<DemoPage />} />
        <Route path="/demo/pitchdeck" element={<PitchDeckDemo />} />
        <Route path="/demo/contractor-readiness" element={<ContractorEstimateReadinessDemo />} />
        
        {/* Survey Routes */}
        <Route path="/intern-survey" element={<InternSurveyPage />} />
        <Route path="/admin/surveys" element={<SurveyAdminPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App; 