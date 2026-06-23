"use client"
export default function Home() {
  const openForm = () => {
    window.open('https://docs.google.com/forms/d/e/1FAIpQLSe5c93f6-R_nNTrQRHAEc_4-6p6ENp3RvGVPNnP8pIE1BAykw/viewform', '_blank')
  }
  return (
    <div style={{backgroundColor: '#FAFAF5', minHeight: '100vh', fontFamily: 'sans-serif'}}>

      {/* Navbar */}
      <nav style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 48px'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
          <div style={{backgroundColor: '#0D4A4A', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <span style={{color: '#F5A623', fontSize: '20px'}}>≋</span>
          </div>
          <span style={{color: '#0D4A4A', fontSize: '22px', fontWeight: '800'}}>Unwind</span>
        </div>
        <button onClick={openForm} style={{backgroundColor: '#0D4A4A', border: 'none', color: '#FAFAF5', padding: '10px 24px', borderRadius: '999px', cursor: 'pointer', fontSize: '14px', fontWeight: '700'}}>
          Join waitlist
        </button>
      </nav>

      {/* Hero */}
      <div style={{position: 'relative', margin: '0 24px', borderRadius: '24px', overflow: 'hidden', height: '580px'}}>
        <img src="/sanjayvan.jpeg" alt="Delhi experience" style={{width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)'}}/>
        <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 24px'}}>
          <p style={{color: '#F5A623', fontSize: '13px', fontWeight: '600', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px'}}>
            ✦ Delhi NCR · Launching Soon
          </p>
          <h1 style={{color: '#FFFFFF', fontSize: '64px', fontWeight: '900', lineHeight: 1.1, marginBottom: '8px'}}>
            Stop wasting
          </h1>
          <h1 style={{color: '#F5A623', fontSize: '64px', fontWeight: '900', lineHeight: 1.1, marginBottom: '8px'}}>
            your weekends.
          </h1>
          <h1 style={{color: '#FFFFFF', fontSize: '64px', fontWeight: '900', lineHeight: 1.1, marginBottom: '28px'}}>
            Start living them.
          </h1>
          <p style={{color: 'rgba(255,255,255,0.85)', fontSize: '18px', maxWidth: '480px', lineHeight: 1.8, marginBottom: '36px'}}>
            Real experiences near you — matched to your time, budget and mood. No planning needed.
          </p>
          <button onClick={openForm} style={{backgroundColor: '#F5A623', color: '#0D4A4A', fontWeight: '800', padding: '18px 40px', borderRadius: '999px', fontSize: '18px', border: 'none', cursor: 'pointer'}}>
            Join the waitlist →
          </button>
        </div>
      </div>

      {/* Photo strip */}
      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '12px 24px'}}>
        <img src="/qutub.jpeg" alt="Qutub Minar" style={{width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px'}}/>
        <img src="/mural.jpeg" alt="Street art" style={{width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px'}}/>
        <img src="/friends.jpeg" alt="Friends" style={{width: '100%', height: '200px', objectFit: 'cover', borderRadius: '16px'}}/>
      </div>

      {/* Tagline */}
      <div style={{textAlign: 'center', padding: '40px 24px'}}>
        <p style={{color: '#0D4A4A', fontSize: '22px', fontWeight: '700'}}>Your city. Your vibe. Your weekend.</p>
        <p style={{color: '#888', fontSize: '15px', marginTop: '8px'}}>Free · No spam · Launching in Delhi NCR</p>
      </div>

    </div>
  )
}