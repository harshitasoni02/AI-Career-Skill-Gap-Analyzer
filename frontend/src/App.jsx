// App.jsx — routing + layouts (Stitch design):
//   Home            → white top navbar (Header) + hero layout
//   Login/Register  → standalone split-screen auth pages
//   Everything else → AppLayout (left Sidebar shell)
// The Ziva floating chat pill is mounted globally.
import { Routes, Route } from 'react-router-dom'
import { UserProvider } from './components/UserContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Header from './components/Header.jsx'
import AppLayout from './components/AppLayout.jsx'
import ZivaChat from './components/ZivaChat.jsx'
import Home from './pages/Home.jsx'
import StudentDashboard from './pages/StudentDashboard.jsx'
import StudentResults from './pages/StudentResults.jsx'
import RecruiterDashboard from './pages/RecruiterDashboard.jsx'
import RecruiterResults from './pages/RecruiterResults.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import History from './pages/History.jsx'
import Profile from './pages/Profile.jsx'
import EditProfile from './pages/EditProfile.jsx'
import AccountSettings from './pages/AccountSettings.jsx'

export default function App() {
  return (
    <UserProvider>
      <Routes>
        {/* Home — its own top navbar (Stitch home design) */}
        <Route path="/" element={
          <div className="app">
            <Header />
            <main><Home /></main>
            <footer className="footer">
              AI-Powered Screening &amp; Career Skill Gap Analyzer <b>v2.1 (Stitch UI)</b> —
              scores and rankings support human review and never make automatic hiring
              decisions. No employment outcome is guaranteed.
            </footer>
          </div>
        } />

        {/* Auth — standalone split-screen pages */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Inner pages — sidebar shell */}
        <Route path="/student" element={
          <AppLayout><ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute></AppLayout>
        } />
        <Route path="/student/results" element={
          <AppLayout><ProtectedRoute role="student"><StudentResults /></ProtectedRoute></AppLayout>
        } />
        <Route path="/recruiter" element={
          <AppLayout><ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute></AppLayout>
        } />
        <Route path="/recruiter/results" element={
          <AppLayout><ProtectedRoute role="recruiter"><RecruiterResults /></ProtectedRoute></AppLayout>
        } />
        <Route path="/history" element={<AppLayout><History /></AppLayout>} />
        <Route path="/profile" element={
          <AppLayout><ProtectedRoute requireLogin><Profile /></ProtectedRoute></AppLayout>
        } />
        <Route path="/profile/edit" element={
          <AppLayout><ProtectedRoute requireLogin><EditProfile /></ProtectedRoute></AppLayout>
        } />
        <Route path="/settings" element={
          <AppLayout><ProtectedRoute requireLogin><AccountSettings /></ProtectedRoute></AppLayout>
        } />
      </Routes>
      <ZivaChat />
    </UserProvider>
  )
}
