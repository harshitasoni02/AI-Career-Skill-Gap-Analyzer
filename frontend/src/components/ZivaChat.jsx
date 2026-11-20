// ZivaChat.jsx — Ziva, the floating career assistant, styled per the
// Stitch reference: a primary-blue "Ask Ziva" pill (auto_awesome icon)
// opening a professional chat window. Logic unchanged: messages go to
// /api/ziva/chat; replies come from the Gemini LLM on the backend.
import { useEffect, useRef, useState } from 'react'
import { apiJson } from '../api.js'
import { useUser } from './UserContext.jsx'

const WELCOME = {
  role: 'ziva',
  text: "Hey! I'm Ziva, your personal career companion. I can help you understand your resume, discover skill gaps, explore career opportunities, prepare for interviews, and create your learning roadmap. What would you like to work on today?",
  time: null,
}

export default function ZivaChat() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const boxRef = useRef(null)
  const { user } = useUser()

  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight
  }, [messages, busy, open, minimized])

  function timeNow() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text, time: timeNow() }])
    setBusy(true)
    try {
      const d = await apiJson('/api/ziva/chat', { message: text })
      setMessages((m) => [...m, { role: 'ziva', text: d.reply, time: timeNow() }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'ziva', text: '⚠️ ' + err.message, time: timeNow(), error: true }])
    }
    setBusy(false)
  }

  function clearChat() {
    setMessages([WELCOME])
  }

  // Closed state: the Stitch "Ask Ziva" floating pill.
  if (!open) {
    return (
      <div className="ziva-fab-wrap">
        <button className="ziva-fab" aria-label="Open Ziva chat" onClick={() => setOpen(true)}>
          <span className="msym">auto_awesome</span> Ask Ziva
        </button>
      </div>
    )
  }

  return (
    <div className="ziva-window">
      <div className="ziva-header">
        <div className="ziva-avatar"><span className="msym" style={{ fontSize: 22 }}>auto_awesome</span></div>
        <div>
          <b>Ziva</b>
          <div className="ziva-tagline">Your Intelligent Career Companion</div>
        </div>
        <div className="ziva-header-btns">
          <button title="Clear chat" onClick={clearChat}><span className="msym" style={{ fontSize: 17 }}>delete</span></button>
          <button title="Minimize" onClick={() => setMinimized(true)}><span className="msym" style={{ fontSize: 17 }}>remove</span></button>
          <button title="Close" onClick={() => setOpen(false)}><span className="msym" style={{ fontSize: 17 }}>close</span></button>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="ziva-messages" ref={boxRef}>
            {messages.map((m, i) => (
              <div key={i} className={'ziva-msg ' + (m.role === 'user' ? 'user' : 'bot') + (m.error ? ' ziva-error' : '')}>
                <div className="ziva-bubble">{m.text}</div>
                {m.time && <div className="ziva-time">{m.time}</div>}
              </div>
            ))}
            {busy && (
              <div className="ziva-msg bot">
                <div className="ziva-bubble ziva-typing"><span></span><span></span><span></span></div>
              </div>
            )}
          </div>
          <div className="ziva-input-row">
            <input
              type="text"
              placeholder={user ? 'Ask Ziva anything about your career…' : 'Log in to chat with Ziva…'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send() }}
            />
            <button onClick={send} disabled={busy || !input.trim()} aria-label="Send message">
              <span className="msym">send</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
