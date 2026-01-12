import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';

const Home = lazy(() => import('./pages/Home'));
const Empowerment = lazy(() => import('./pages/Empowerment'));
const TeachingZone = lazy(() => import('./pages/TeachingZone'));
const HtmlViewer = lazy(() => import('./pages/HtmlViewer'));

const RandomPicker = lazy(() => import('./pages/tools/RandomPicker'));
const ClassroomTimer = lazy(() => import('./pages/tools/ClassroomTimer'));
const GroupScoreboard = lazy(() => import('./pages/tools/GroupScoreboard'));

const AdminUpload = lazy(() => import('./pages/admin/AdminUpload'));
const AdminAI = lazy(() => import('./pages/admin/AdminAI'));
const AdminTools = lazy(() => import('./pages/admin/AdminTools'));
const AdminTeaching = lazy(() => import('./pages/admin/AdminTeaching'));
const TestConnection = lazy(() => import('./pages/TestConnection'));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="w-10 h-10 rounded-full border-4 border-emerald-200 border-t-emerald-500 animate-spin" />
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="empower" element={<Empowerment />} />
            <Route path="teaching-zone" element={<TeachingZone />} />
          </Route>
          <Route path="/tools/random-picker" element={<RandomPicker />} />
          <Route path="/tools/timer" element={<ClassroomTimer />} />
          <Route path="/tools/scoreboard" element={<GroupScoreboard />} />

          {/* HTML Viewer */}
          <Route path="/view" element={<HtmlViewer />} />

          {/* Admin Routes */}
          <Route path="/admin/upload" element={<AdminUpload />} />
          <Route path="/admin/ai" element={<AdminAI />} />
          <Route path="/admin/tools" element={<AdminTools />} />
          <Route path="/admin/teaching" element={<AdminTeaching />} />

          {/* Test Route */}
          <Route path="/test-connection" element={<TestConnection />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
