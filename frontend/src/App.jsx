// App.jsx — the page router. It decides WHICH page to show for each URL.
// Pages are wrapped in ProtectedRoute so the wrong role sees a friendly
// "restricted" page instead of the tool (the backend also enforces 403).
import { Routes, Route } from 'react-router-dom'
import { UserProvider } from './components/UserContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
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
import DemoNotice from './pages/DemoNotice.jsx'
import ZivaChat from './components/ZivaChat.jsx'
import { DEMO_MODE } from './config.js'

export default function App() {
  return (
    <UserProvider>
      <div className="app">
        <a className="skip-link" href="#main">Skip to content</a>
        <Header />
        <main id="main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={DEMO_MODE ? <DemoNotice /> : <Login />} />
            <Route path="/register" element={DEMO_MODE ? <DemoNotice /> : <Register />} />

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
              DEMO_MODE ? <DemoNotice /> : <ProtectedRoute requireLogin><Profile /></ProtectedRoute>
            } />
            <Route path="/profile/edit" element={
              DEMO_MODE ? <DemoNotice /> : <ProtectedRoute requireLogin><EditProfile /></ProtectedRoute>
            } />
            <Route path="/settings" element={
              DEMO_MODE ? <DemoNotice /> : <ProtectedRoute requireLogin><AccountSettings /></ProtectedRoute>
            } />

            <Route path="/history" element={DEMO_MODE ? <DemoNotice /> : <History />} />
          </Routes>
        </main>
        <ZivaChat />
        <Footer />
      </div>
    </UserProvider>
  )
}
