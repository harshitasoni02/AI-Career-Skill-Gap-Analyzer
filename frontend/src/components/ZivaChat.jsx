// ZivaChat.jsx — Ziva, the floating career companion.
// Messages go to /api/ziva/chat; replies come from Gemini on the backend.
//
// The window has three intentional states:
//   closed     → a single launcher pill (one button, not a button + label)
//   open       → full conversation with a two-button header
//   minimized  → a compact, readable bar; never a tall empty white panel
//
// A tiny, safe markdown renderer handles **bold**, *italic*, numbered lists,
// and bullet lines without using dangerouslySetInnerHTML.
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiJson } from '../api.js'
import { useUser } from './UserContext.jsx'
import Icon from './Icons.jsx'

const WELCOME = {
  role: 'ziva',
  text: "Hello — I'm Ziva, your career companion. Ask me about your score, a skill gap, or what to learn next.",
  time: null,
}

// Strip the tiny markdown subset for the one-line minimized preview and for
// browser tooltips, so raw **asterisks** never leak into the chrome.
function plain(text) {
  return String(text)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[-*]\s+/gm, '')
    .replace(/^\d+[.)]\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function inline(text) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return part
  })
}

function RichText({ text }) {
  const lines = String(text).split('\n')
  return (
    <>
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} style={{ height: 6 }} />

        const bullet = trimmed.match(/^[-*]\s+(.*)$/)
        if (bullet) {
          return (
            <div className="rich-li" key={i}>
              <span>{inline(bullet[1])}</span>
            </div>
          )
        }

        const numbered = trimmed.match(/^(\d+)[.)]\s+(.*)$/)
        if (numbered) {
          return (
            <div className="rich-li rich-li-numbered" key={i}>
              <span className="rich-num">{numbered[1]}.</span>
              <span>{inline(numbered[2])}</span>
            </div>
          )
        }

        const cleaned = trimmed.replace(/^#{1,6}\s+/, '')
        return <p key={i}>{inline(cleaned)}</p>
      })}
    </>
  )
}

export default function ZivaChat() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState([WELCOME])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const boxRef = useRef(null)
  const inputRef = useRef(null)
  const { user, loading } = useUser()

  const starters = user?.role === 'recruiter'
    ? [
        'How should I read these scores?',
        'What should I check before deciding?',
        'How do I compare candidates fairly?',
      ]
    : [
        'What does my score mean?',
        'What should I learn first?',
        'How do I close my biggest gap?',
      ]

  const last = messages[messages.length - 1]
  const preview = last
    ? plain(last.role === 'user' ? `You: ${last.text}` : last.text)
    : 'Ask about your career.'

  // Keep the newest message visible.
  useEffect(() => {
    const el = boxRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages, busy, open, minimized])

  // Put the cursor where it belongs when the chat is expanded.
  useEffect(() => {
    if (!open || minimized || !user) return undefined
    const timer = window.setTimeout(() => inputRef.current?.focus(), 80)
    return () => window.clearTimeout(timer)
  }, [open, minimized, user])

  // Escape closes the window without losing the conversation.
  useEffect(() => {
    if (!open) return undefined
    function onKeyDown(event) {
      if (event.key === 'Escape') {
        setOpen(false)
        setMinimized(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  function timeNow() {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function openChat() {
    setOpen(true)
    setMinimized(false)
  }

  function closeChat() {
    setOpen(false)
    setMinimized(false)
  }

  async function send(textOverride) {
    const text = (textOverride ?? input).trim()
    if (!text || busy || !user) return

    setInput('')
    setMessages((m) => [...m, { role: 'user', text, time: timeNow() }])
    setBusy(true)
    try {
      const d = await apiJson('/api/ziva/chat', { message: text })
      setMessages((m) => [...m, { role: 'ziva', text: d.reply, time: timeNow() }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'ziva', text: err.message, time: timeNow(), error: true }])
    } finally {
      setBusy(false)
    }
  }

  function clearChat() {
    if (busy) return
    setMessages([WELCOME])
    setInput('')
  }

  if (!open) {
    return (
      <div className="ziva-fab-wrap">
        <button className="ziva-launcher" aria-label="Open Ziva chat" onClick={openChat}>
          <span className="ziva-launcher-icon" aria-hidden="true">
            <Icon name="spark" size={20} />
            <span className="ziva-launcher-dot" />
          </span>
          <span className="ziva-launcher-copy">
            <b>{messages.length > 1 ? 'Continue with Ziva' : 'Ask Ziva'}</b>
            <small>Career companion</small>
          </span>
        </button>
      </div>
    )
  }

  return (
    <section
      className={'ziva-window' + (minimized ? ' is-minimized' : '')}
      role="dialog"
      aria-label="Ziva career companion"
    >
      <header className="ziva-header">
        <div className="ziva-avatar" aria-hidden="true">
          <Icon name="spark" size={18} />
          <span className="ziva-avatar-dot" />
        </div>
        <div className="ziva-id">
          <b>Ziva</b>
          <span className="ziva-tagline">Career companion</span>
        </div>
        <span className="ziva-live"><i aria-hidden="true" />Online</span>
        <div className="ziva-header-btns">
          {!minimized && (
            <button
              type="button"
              title="Minimize"
              aria-label="Minimize chat"
              onClick={() => setMinimized(true)}
            >
              <Icon name="chevronDown" size={17} />
            </button>
          )}
          <button type="button" title="Close" aria-label="Close chat" onClick={closeChat}>
            <Icon name="close" size={16} />
          </button>
        </div>
      </header>

      {minimized ? (
        <button type="button" className="ziva-mini" onClick={() => setMinimized(false)} aria-label="Expand chat">
          <span className="ziva-mini-copy">
            <b>{messages.length > 1 ? 'Continue conversation' : 'Ask about your career'}</b>
            <small>{preview}</small>
          </span>
          <Icon name="chevronUp" size={17} />
        </button>
      ) : (
        <>
          <div className="ziva-messages" ref={boxRef} role="log" aria-live="polite" aria-label="Conversation with Ziva">
            {messages.map((m, i) => (
              <div
                key={i}
                className={'ziva-msg ' + (m.role === 'user' ? 'user' : 'bot') + (m.error ? ' ziva-error' : '')}
              >
                {m.role === 'ziva' && (
                  <div className="ziva-msg-avatar" aria-hidden="true">
                    <Icon name="spark" size={12} />
                  </div>
                )}
                <div className="ziva-msg-stack">
                  <div className="ziva-bubble">
                    {m.role === 'ziva' ? <RichText text={m.text} /> : m.text}
                  </div>
                  {m.time && <div className="ziva-time">{m.time}</div>}
                </div>
              </div>
            ))}

            {messages.length === 1 && user && !loading && !busy && (
              <div className="ziva-starters">
                <div className="ziva-starters-label">Try asking</div>
                {starters.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="ziva-starter"
                    onClick={() => send(prompt)}
                  >
                    {prompt}
                    <Icon name="arrowUpRight" size={13} />
                  </button>
                ))}
              </div>
            )}

            {messages.length === 1 && !user && !loading && (
              <div className="ziva-guest-hints">
                <div className="ziva-starters-label">Ziva can help with</div>
                <ul>
                  <li>Reading your latest report</li>
                  <li>Finding the shortest path to a role</li>
                  <li>Deciding what to learn next</li>
                </ul>
              </div>
            )}

            {busy && (
              <div className="ziva-msg bot">
                <div className="ziva-msg-avatar" aria-hidden="true">
                  <Icon name="spark" size={12} />
                </div>
                <div className="ziva-msg-stack">
                  <div className="ziva-bubble ziva-typing" aria-label="Ziva is typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div className="ziva-gate">
              <div>
                <b>Connecting…</b>
                <p>Checking your session so Ziva can use the right context.</p>
              </div>
            </div>
          ) : user ? (
            <>
              <form
                className="ziva-input-row"
                onSubmit={(event) => {
                  event.preventDefault()
                  send()
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  aria-label="Message Ziva"
                  placeholder="Ask Ziva about your career…"
                  value={input}
                  maxLength={2000}
                  autoComplete="off"
                  onChange={(event) => setInput(event.target.value)}
                />
                <button type="submit" disabled={busy || !input.trim()} aria-label="Send message">
                  <Icon name="send" size={17} />
                </button>
              </form>
              <div className="ziva-foot">
                <span>Uses your latest saved report when available.</span>
                {messages.length > 1 && (
                  <button type="button" onClick={clearChat} disabled={busy}>
                    New chat
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="ziva-gate">
              <div>
                <b>Log in to talk with Ziva</b>
                <p>Ziva reads your saved report and keeps the conversation in context.</p>
              </div>
              <Link to="/login" className="btn btn-small" onClick={closeChat}>Log in</Link>
            </div>
          )}
        </>
      )}
    </section>
  )
}
