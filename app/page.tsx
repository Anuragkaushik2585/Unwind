"use client"
import { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"

export default function Home() {
  const [chatOpen, setChatOpen] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hey! 👋 I'm your Unwind assistant. What are you looking to do this weekend?" }
  ])
  const [input, setInput] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (textToSend?: string) => {
    const textValue = textToSend || input
    if (!textValue.trim()) return
    const newMessages = [...messages, { role: "user", text: textValue }]
    setMessages(newMessages)
    setInput("")
    setIsTyping(true)

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages })
      })

      if (!res.ok) {
        setIsTyping(false)
        setMessages(prev => [...prev, { role: "bot", text: "Sorry, I'm having trouble right now. Try again in a moment!" }])
        return
      }

      setIsTyping(false)
      setMessages(prev => [...prev, { role: "bot", text: "" }])

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        setMessages(prev => {
          const updated = [...prev]
          const lastMsg = updated[updated.length - 1]
          if (lastMsg && lastMsg.role === "bot") {
            updated[updated.length - 1] = {
              role: "bot",
              text: lastMsg.text + chunk
            }
          }
          return updated
        })
      }
    } catch (err) {
      setIsTyping(false)
      console.error("Chat error:", err)
      setMessages(prev => [...prev, { role: "bot", text: "Sorry, I ran into an error. Please try again!" }])
    }
  }

  const openForm = () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSe5c93f6-R_nNTrQRHAEc_4-6p6ENp3RvGVPNnP8pIE1BAykw/viewform', '_blank')
  }

  return (
    <div className="bg-[#FAFAF5] min-h-screen font-sans text-gray-800">

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
          <h1 className="text-white text-3xl md:text-6xl font-black leading-tight mb-2">
            Stop wasting
          </h1>
          <h1 className="text-[#F5A623] text-3xl md:text-6xl font-black leading-tight mb-2">
            your weekends.
          </h1>
          <h1 className="text-white text-3xl md:text-6xl font-black leading-tight mb-6">
            Start living them.
          </h1>
          <p className="text-white/80 text-sm md:text-lg max-w-md leading-relaxed mb-8">
            Real experiences near you — matched to your time, budget and mood. No planning needed.
          </p>
          <div className="relative w-full max-w-md flex items-center bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 py-3 shadow-lg focus-within:bg-white/15 focus-within:border-white/40 transition-all duration-200">
            <input 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setChatOpen(true);
                  sendMessage();
                }
              }} 
              placeholder="Plan my weekend..." 
              className="flex-1 bg-transparent text-white placeholder-white/60 text-sm outline-none pr-10"
            />
            <button 
              onClick={() => {
                setChatOpen(true);
                sendMessage();
              }} 
              className="absolute right-2 bg-[#F5A623] text-[#0D4A4A] w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer text-lg hover:scale-105 active:scale-95 transition-all shadow-md animate-pulse"
            >
              →
            </button>
          </div>
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

      {/* Trending Experiences */}
      <div className="max-w-4xl mx-auto px-6 pb-20 flex flex-col gap-4">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest text-center md:text-left">Trending experiences</span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { img: "/qutub.jpeg", subheading: "Heritage walks", heading: "Qutub Minar", query: "Heritage walks in Qutub Minar" },
            { img: "/mural.jpeg", subheading: "Street art & culture", heading: "Lodhi Colony", query: "Street art & culture in Lodhi Colony" },
            { img: "/friends.jpeg", subheading: "Hang with friends", heading: "Cafe Crawl", query: "Cafe crawls with friends" },
            { img: "/sanjayvan.jpeg", subheading: "Nature escapes", heading: "Sanjay Van", query: "Nature escapes in Sanjay Van" }
          ].map((card, idx) => (
            <button 
              key={idx}
              onClick={() => {
                setChatOpen(true);
                sendMessage(card.query);
              }} 
              className="relative rounded-2xl overflow-hidden h-36 md:h-48 w-full text-left cursor-pointer border-none group active:scale-[0.98] transition-transform duration-150 shadow-md"
            >
              <img 
                src={card.img} 
                alt={card.heading} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {/* Rahee style top blur mask */}
              <div 
                className="absolute top-0 left-0 right-0 h-1/2 pointer-events-none z-10" 
                style={{ 
                  backdropFilter: 'blur(80px)', 
                  WebkitBackdropFilter: 'blur(80px)', 
                  mask: 'linear-gradient(to bottom, black 0%, transparent 100%)', 
                  WebkitMask: 'linear-gradient(to bottom, black 0%, transparent 100%)' 
                }} 
              />
              {/* Gradient backdrop */}
              <div className="absolute inset-0 bg-gradient-to-b from-[#062832]/65 via-transparent to-black/80 group-hover:from-[#062832]/75 group-hover:to-black/85 transition-all duration-200 z-20" />
              
              {/* Center aligned texts */}
              <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-3 z-30">
                <span className="text-white/90 text-[10px] md:text-xs font-semibold tracking-wider uppercase">{card.subheading}</span>
                <span className="text-white text-base md:text-lg font-bold tracking-wide mt-1 drop-shadow-sm">{card.heading}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Floating chat button */}
      <button onClick={() => setChatOpen(true)} className="fixed bottom-6 right-6 bg-[#0D4A4A] text-white px-5 py-3 rounded-full shadow-lg font-bold text-sm flex items-center gap-2 border-none cursor-pointer z-50 hover:scale-105 active:scale-95 transition-all">
        <span>✨</span> Plan my weekend
      </button>

      {/* Chat window */}
      {chatOpen && (
        <div className="fixed inset-0 md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 w-full h-full md:w-[480px] md:h-[80vh] md:max-h-[750px] bg-[#FAFAF5] md:rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 border border-gray-100">
          
          {messages.length === 1 ? (
            /* START SCREEN */
            <>
              {/* Start Screen Header */}
              <div className="px-6 pt-5 pb-2 flex items-center justify-between flex-shrink-0 bg-[#FAFAF5]">
                <button 
                  onClick={() => setChatOpen(false)} 
                  className="text-[#0D4A4A] hover:text-[#0D4A4A]/80 text-2xl bg-transparent border-none cursor-pointer p-1 transition-colors font-bold"
                  aria-label="Back"
                >
                  ←
                </button>
                <div className="flex items-center gap-1.5 opacity-60">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  <span className="text-[10px] font-bold text-[#0D4A4A] uppercase tracking-wider">AI Assistant</span>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-start px-6 pb-6 overflow-y-auto bg-[#FAFAF5] gap-6" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                
                {/* Intro / Brand Welcome */}
                <div className="flex flex-col items-center text-center mt-2 flex-shrink-0">
                  <div className="bg-[#0D4A4A] w-12 h-12 rounded-full flex items-center justify-center shadow-md mb-3">
                    <span className="text-[#F5A623] text-2xl font-black">≋</span>
                  </div>
                  <h2 className="text-[#0D4A4A] text-2xl font-black tracking-tight">Let's plan your weekend</h2>
                  <p className="text-gray-500 text-xs mt-1.5 max-w-xs leading-relaxed">
                    Discover local activities, comedy nights, workshops, and escapes in Delhi NCR based on your mood.
                  </p>
                </div>

                {/* Search Input Card */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <div className="relative flex flex-col bg-white border border-[#0D4A4A]/10 rounded-2xl p-4 h-28 focus-within:ring-2 focus-within:ring-[#0D4A4A]/10 focus-within:border-[#0D4A4A]/30 focus-within:shadow-md transition-all duration-200">
                    <div className="flex gap-2 items-start flex-1 h-full">
                      <span className="text-[#0D4A4A] mt-0.5 text-base flex-shrink-0">✨</span>
                      <textarea 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }} 
                        placeholder="Ask your question here (e.g. Improv Comedy Hauz Khas or Pottery class)..." 
                        className="flex-1 bg-transparent text-sm text-[#0D4A4A] placeholder-[#0D4A4A]/50 outline-none resize-none font-medium h-full"
                      />
                    </div>
                    <button 
                      onClick={() => sendMessage()} 
                      className="absolute bottom-3 right-3 bg-[#0D4A4A] hover:bg-[#0D4A4A]/90 text-white w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer text-lg transition-transform active:scale-95 shadow-sm z-30 font-bold"
                    >
                      →
                    </button>
                  </div>
                  <p className="text-center text-gray-400 text-[10px] md:text-xs">
                    Powered by Google Gemini. <span className="underline cursor-pointer">Privacy Policy</span>
                  </p>
                </div>

                {/* Categorized Suggestions */}
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Choose a vibe to start</span>
                  
                  <div className="flex flex-col gap-3">
                    {[
                      {
                        title: "🌿 Chill & Relaxing",
                        pills: [
                          { label: "Something chill 🌿", query: "Something chill this weekend" },
                          { label: "Pottery workshop 🏺", query: "Pottery workshop in Shahpur Jat" },
                          { label: "Nature escapes 🌲", query: "Sanjay Van nature walk" }
                        ]
                      },
                      {
                        title: "🎉 Social & Lively",
                        pills: [
                          { label: "Comedy Night 🎤", query: "Improv comedy night in Hauz Khas" },
                          { label: "Café crawl ☕", query: "Rooftop café crawl in Hauz Khas" },
                          { label: "Plan with friends 🥳", query: "Plan something fun with friends" }
                        ]
                      },
                      {
                        title: "⛰️ Active & Explore",
                        pills: [
                          { label: "Bike Yamuna Trail 🚴", query: "Bike ride Yamuna Trail" },
                          { label: "Adventure sports ⛰️", query: "Active outdoor experiences" },
                          { label: "Surprise me ✨", query: "Surprise me with something unique" }
                        ]
                      }
                    ].map((category, catIdx) => (
                      <div key={catIdx} className="bg-white border border-[#0D4A4A]/5 rounded-xl p-3.5 shadow-sm flex flex-col gap-2.5">
                        <span className="text-xs font-bold text-[#0D4A4A]">{category.title}</span>
                        <div className="flex flex-wrap gap-1.5">
                          {category.pills.map((pill, pillIdx) => (
                            <button
                              key={pillIdx}
                              onClick={() => sendMessage(pill.query)}
                              className="bg-[#0D4A4A]/5 hover:bg-[#0D4A4A] text-[#0D4A4A] hover:text-white px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition-all duration-150 transform hover:scale-105 active:scale-95 whitespace-nowrap"
                            >
                              {pill.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </>
          ) : (
            /* NORMAL CHAT THREAD */
            <>
              {/* Header */}
              <div className="bg-[#0D4A4A] px-4 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#F5A623] rounded-full flex items-center justify-center text-[#0D4A4A] font-black text-base shadow-inner">U</div>
                  <div>
                    <p className="text-white font-bold text-sm tracking-wide">Unwind Assistant</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                      <p className="text-white/70 text-xs">Online</p>
                    </div>
                  </div>
                </div>
                <button onClick={() => setChatOpen(false)} className="text-white/60 hover:text-white text-xl bg-transparent border-none cursor-pointer p-1 transition-colors">✕</button>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 bg-[#FAFAF5]">
                {messages.map((msg, i) => {
                  const isLast = i === messages.length - 1;
                  let cleanText = msg.text;
                  let options: string[] = [];
                  if (msg.role === 'bot') {
                    const optionsIndex = msg.text.indexOf("Options:");
                    if (optionsIndex !== -1) {
                      cleanText = msg.text.substring(0, optionsIndex).trim();
                      const optionsPart = msg.text.substring(optionsIndex);
                      const regex = /\[([^\]]+)\]/g;
                      let match;
                      while ((match = regex.exec(optionsPart)) !== null) {
                        options.push(match[1]);
                      }
                    }
                  }

                  return (
                    <div key={i} className="flex flex-col gap-2">
                      <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl text-sm max-w-[80%] shadow-sm ${msg.role === 'user' ? 'bg-[#0D4A4A] text-white rounded-br-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                          {msg.role === 'bot' ? (
                            <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed">
                              <ReactMarkdown>{cleanText}</ReactMarkdown>
                            </div>
                          ) : (
                            cleanText
                          )}
                        </div>
                      </div>
                      {isLast && msg.role === 'bot' && options.length > 0 && (
                        <div className="flex flex-wrap gap-2 justify-start px-2 mt-1">
                          {options.map((option, optIdx) => (
                            <button
                              key={optIdx}
                              onClick={() => sendMessage(option)}
                              className="bg-white hover:bg-[#0D4A4A] text-[#0D4A4A] hover:text-white border border-[#0D4A4A]/10 hover:border-[#0D4A4A] px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-sm cursor-pointer transition-all duration-150 transform hover:scale-105 active:scale-95 whitespace-nowrap"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="px-4 py-2.5 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-sm text-sm shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-[#0D4A4A] rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-[#0D4A4A] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#0D4A4A] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="px-4 py-4 border-t border-gray-100 flex gap-2 bg-white flex-shrink-0">
                <input 
                  value={input} 
                  onChange={(e) => setInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()} 
                  placeholder="Type a message..." 
                  className="flex-1 border border-gray-200 rounded-full px-4 py-2.5 text-sm outline-none focus:border-[#0D4A4A] transition-colors text-gray-800"
                />
                <button 
                  onClick={() => sendMessage()} 
                  className="bg-[#0D4A4A] text-white w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer text-base hover:bg-[#0D4A4A]/90 active:scale-95 transition-all flex-shrink-0"
                >
                  →
                </button>
              </div>
            </>
          )}
        </div>
      )}

    </div>
  )
}