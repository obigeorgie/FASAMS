import FileUpload from './components/FileUpload'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-900 text-white pt-16 pb-24 px-6 text-center shadow-2xl rounded-b-[2.5rem] relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-200 text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            Updated for PAM 155-2 (2026)
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Achieve 100% FASAMS Compliance <br />
            <span className="text-indigo-400">in Seconds.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Stop manual scrubbing. Instantly validate and auto-repair your client intake logs against Florida DCF Standards.
          </p>

          {/* Trust Badges */}
          <div className="flex justify-center gap-8 mt-10 text-sm font-medium text-slate-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              HIPAA Secure
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
              Local Processing
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20 pb-20 flex-grow w-full">
        <FileUpload />
      </div>

      <footer className="py-6 text-center text-slate-500 text-sm">
        Built for SunCoast Region Providers by Nnamdi Okorafor.
      </footer>
    </div>
  )
}

export default App
