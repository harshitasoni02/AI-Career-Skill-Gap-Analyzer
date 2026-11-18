// App.jsx — the page router. It decides WHICH page to show for each URL.
// Pages are wrapped in ProtectedRoute so the wrong role sees a friendly
// "restricted" page instead of the tool (the backend also enforces 403).
import { Routes, Route } from 'react-router-dom'
import { UserProvider } from './components/UserContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Header from './components/Header.jsx'
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
import ZivaChat from './components/ZivaChat.jsx'

export default function App() {
  return (
    <UserProvider>
      <div className="app">
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/student" element={
              <ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>
            } />
            <Route path="/student/results" element={
              <ProtectedRoute role="student"><StudentResults /></ProtectedRoute>
            } />
            <Route path="/recruiter" element={
              <ProtectedRoute role="recruiter"><RecruiterDashboard /></ProtectedRoute>
            } />
            <Route path="/recruiter/results" element={
              <ProtectedRoute role="recruiter"><RecruiterResults /></ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute requireLogin><Profile /></ProtectedRoute>
            } />
            <Route path="/profile/edit" element={
              <ProtectedRoute requireLogin><EditProfile /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requireLogin><AccountSettings /></ProtectedRoute>
            } />

            <Route path="/history" element={<History />} />
          </Routes>
        </main>
        <ZivaChat />
        <footer className="footer">
          AI-Powered Screening &amp; Career Skill Gap Analyzer — scores and rankings
          support human review and never make automatic hiring decisions. No
          employment outcome is guaranteed.
        </footer>
      </div>
    </UserProvider>
  )
}
