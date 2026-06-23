"use client"

export default function Home() {
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
        <img src="/qutub.jpeg" alt="Qutub Minar" className="w-full h-32 md:h-52 object-cover rounded-2xl"/>
        <img src="/mural.jpeg" alt="Street art" className="w-full h-32 md:h-52 object-cover rounded-2xl"/>
        <img src="/friends.jpeg" alt="Friends" className="w-full h-32 md:h-52 object-cover rounded-2xl"/>
      </div>

      {/* Tagline */}
      <div className="text-center px-6 py-12">
        <p className="text-[#0D4A4A] text-lg md:text-2xl font-bold">Your city. Your vibe. Your weekend.</p>
        <p className="text-gray-400 text-sm mt-2">Free · No spam · Launching in Delhi NCR</p>
      </div>

    </div>
  )
}