import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/ThemeProvider'
import { PlatformLayout } from './components/PlatformLayout'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import EnglishLearning from './pages/EnglishLearning'
import ResearchPage from './pages/ResearchPage'
import Planning from './pages/Planning'
import NotePage from './pages/NotePage'
import MentalHealth from './pages/MentalHealth'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Landing Page - No Layout */}
          <Route path="/" element={<LandingPage />} />

          {/* Platform Routes - With Sidebar Layout */}
          <Route element={<PlatformLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="english" element={<EnglishLearning />} />
            <Route path="research" element={<ResearchPage />} />
            <Route path="planning" element={<Planning />} />
            <Route path="note" element={<NotePage />} />
            <Route path="mental-health" element={<MentalHealth />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
