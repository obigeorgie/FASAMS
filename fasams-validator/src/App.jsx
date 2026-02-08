import React from 'react';
import FileUpload from './components/FileUpload';

function App() {
  return (
    <div className="min-h-screen font-sans text-slate-900 bg-white">
      {/* Navbar */}
      <nav className="fixed w-full z-50 top-0 start-0 glass-panel border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between mx-auto p-4">
          <a href="#" className="flex items-center space-x-3 rtl:space-x-reverse">
            <span className="self-center text-2xl font-bold whitespace-nowrap text-gradient">FASAMS.ai</span>
          </a>
          <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
            <button type="button" className="text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 font-medium rounded-lg text-sm px-4 py-2 text-center transition-all shadow-lg hover:shadow-indigo-500/30">
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 opacity-30 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-sm font-semibold mb-6 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Updated for PAM 155-2 (2026)
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-slate-900">
            FASAMS Compliance <br />
            <span className="text-gradient">Solved by AI.</span>
          </h1>

          <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
            Stop wrestling with complex state mandates. Instantly validate, auto-repair, and submit your client intake logs with 100% accuracy.
          </p>

          {/* Social Proof / Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 mb-16 opacity-70 grayscale transition hover:grayscale-0 duration-500">
            {["SunCoast Region", "Central Florida", "Big Bend", "South Florida"].map((region) => (
              <span key={region} className="font-semibold text-slate-400 uppercase tracking-widest text-xs">{region}</span>
            ))}
          </div>

          {/* App Interface Container */}
          <div className="relative mx-auto border-gray-200 dark:border-gray-800 bg-white border-[8px] rounded-[2.5rem] h-auto shadow-2xl flex flex-col justify-center items-center overflow-hidden">
             <div className="w-full bg-white rounded-[2rem] overflow-hidden p-8 md:p-12">
                <FileUpload />
             </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Why Providers Choose FASAMS.ai</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Designed specifically for Florida's substance abuse and mental health providers.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Instant Validation", icon: "⚡", desc: "Checks against 500+ PAM 155-2 rules in milliseconds." },
              { title: "AI Auto-Repair", icon: "🤖", desc: "Automatically fixes common errors like date formats and missing codes." },
              { title: "Bank-Level Security", icon: "🔒", desc: "Encryption at rest and in transit. Fully HIPAA compliant processing." },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center bg-white">
          <div className="text-2xl font-bold text-gradient mb-4 md:mb-0">FASAMS.ai</div>
          <div className="text-slate-500 text-sm">
            © 2026 Developed by Nnamdi Okorafor. All rights reserved.
          </div>
          <div className="flex gap-6 mt-4 md:mt-0">
             <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">Privacy</a>
             <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">Terms</a>
             <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
