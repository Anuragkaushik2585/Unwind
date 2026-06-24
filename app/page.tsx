"use client"
import { useState } from "react"
export default function Home() {
  const [chatOpen, setChatOpen] = useState(false)
const [messages, setMessages] = useState([
  { role: "bot", text: "Hey! 👋 I'm your Unwind assistant. What are you looking to do this weekend?" }
])
const [input, setInput] = useState("")

const sendMessage = () => {
  if (!input.trim()) return
  setMessages([...messages, { role: "user", text: input }])
  setInput("")
  setTimeout(() => {
    setMessages(prev => [...prev, { role: "bot", text: "Got it! What's your budget and how much time do you have?" }])
  }, 800)
}
  const openForm = () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSe5c93f6-R_nNTrQRHAEc_4-6p6ENp3RvGVPNnP8pIE1BAykw/viewform', '_blank')
  }

  return (
    <div className="bg-[#FAFAF5] min-h-screen font-sans">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="bg-[#0D4A4A] w-9 h-9 rounded-full flex items-center justify-center">
            <span className="text-[#F5A623] text-lg">≋</span>
          </div>
          <span className="text-[#0D4A4A] text-xl font-black">Unwind</span>
        </div>
        <button onClick={openForm} className="bg-[#0D4A4A] text-[#FAFAF5] text-sm font-bold px-5 py-2 rounded-full cursor-pointer border-none">
          Join waitlist
        </button>
      </nav>

      {/* Hero */}
      <div className="relative mx-4 md:mx-6 rounded-2xl overflow-hidden h-[480px] md:h-[580px]">
        <img src="/sanjayvan.jpeg" alt="Delhi experience" className="w-full h-full object-cover brightness-[0.6]"/>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <p className="text-[#F5A623] text-xs font-semibold tracking-widest uppercase mb-5">
            ✦ Delhi NCR · Launching Soon
          </p>
          <h1 className="text-white text-2xl md:text-6xl font-black leading-tight mb-2">
            Stop wasting
          </h1>
          <h1 className="text-[#F5A623] text-2xl md:text-6xl font-black leading-tight mb-2">
            your weekends.
          </h1>
          <h1 className="text-white text-2xl md:text-6xl font-black leading-tight mb-6">
            Start living them.
          </h1>
          <p className="text-white/80 text-sm md:text-lg max-w-md leading-relaxed mb-8">
            Real experiences near you — matched to your time, budget and mood. No planning needed.
          </p>
          <button onClick={openForm} className="bg-[#F5A623] text-[#0D4A4A] font-black px-8 py-4 rounded-full text-base md:text-lg border-none cursor-pointer">
            Join the waitlist →
          </button>
        </div>
      </div>

      {/* Photo strip */}
      <div className="grid grid-cols-3 gap-3 px-4 md:px-6 pt-3">
        <img src="/qutub.jpeg" alt="Qutub Minar" className="w-full h-32 md:h-82 object-cover rounded-2xl"/>
        <img src="/mural.jpeg" alt="Street art" className="w-full h-32 md:h-82 object-cover rounded-2xl"/>
        <img src="/friends.jpeg" alt="Friends" className="w-full h-32 md:h-82 object-cover rounded-2xl"/>
      </div>

      {/* Tagline */}
      <div className="text-center px-6 py-12">
        <p className="text-[#0D4A4A] text-lg md:text-2xl font-bold">Your city. Your vibe. Your weekend.</p>
        <p className="text-gray-400 text-sm mt-2">Free · No spam · Launching in Delhi NCR</p>
      </div>
      {/* Floating chat button */}
<button onClick={() => setChatOpen(true)} className="fixed bottom-6 right-6 bg-[#0D4A4A] text-white px-5 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 border-none cursor-pointer z-50">
  <span>✨</span> Plan my weekend
</button>

{/* Chat window */}
{chatOpen && (
  <div className="fixed bottom-20 right-4 md:right-6 w-[90vw] md:w-96 bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden" style={{height: '480px'}}>
    <div className="bg-[#0D4A4A] px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-[#F5A623] rounded-full flex items-center justify-center text-[#0D4A4A] font-black text-sm">U</div>
        <div>
          <p className="text-white font-bold text-sm">Unwind Assistant</p>
          <p className="text-white/60 text-xs">Online</p>
        </div>
      </div>
      <button onClick={() => setChatOpen(false)} className="text-white/60 hover:text-white text-xl bg-transparent border-none cursor-pointer">✕</button>
    </div>
    <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3">
      {messages.map((msg, i) => (
        <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`px-4 py-2 rounded-2xl text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-[#0D4A4A] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
            {msg.text}
          </div>
        </div>
      ))}
    </div>
    <div className="px-3 py-3 border-t border-gray-100 flex gap-2">
      <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none"/>
      <button onClick={sendMessage} className="bg-[#0D4A4A] text-white w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer text-base">→</button>
    </div>
  </div>
)}

    </div>
  )
}