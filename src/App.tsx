import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Empowerment from './pages/Empowerment';
import RandomPicker from './pages/tools/RandomPicker';
import ClassroomTimer from './pages/tools/ClassroomTimer';
import GroupScoreboard from './pages/tools/GroupScoreboard';
import TeachingZone from './pages/TeachingZone';
import AdminUpload from './pages/admin/AdminUpload';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="empower" element={<Empowerment />} />
          <Route path="teaching-zone" element={<TeachingZone />} />
        </Route>
        <Route path="/tools/random-picker" element={<RandomPicker />} />
        <Route path="/tools/timer" element={<ClassroomTimer />} />
        <Route path="/tools/scoreboard" element={<GroupScoreboard />} />
        
        {/* Hidden Admin Route */}
        <Route path="/admin/upload" element={<AdminUpload />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;