import React from 'react';

export default function Dashboard({ score, totalRows, criticalCount, onAutoFix, onDownload, isRepairing, loadingMsg }) {

    // Visual Hierarchy: Group errors by severity [5]
    const statusColor = score === 100 ? "text-green-500" : score > 80 ? "text-yellow-500" : "text-rose-500";
    const ringColor = score === 100 ? "ring-green-500" : "ring-rose-500";
    const bgGradient = score === 100 ? "from-green-50 to-emerald-100" : "from-rose-50 to-orange-50";

    return (
        <div className={`w-full max-w-5xl mx-auto mt-10 p-8 rounded-3xl shadow-xl border border-white/60 backdrop-blur-sm bg-gradient-to-br ${bgGradient}`}>
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-10">
                <div className="text-center md:text-left">
                    <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Compliance Score</h2>
                    <div className={`text-8xl font-black ${statusColor} drop-shadow-sm tracking-tighter`}>{score}%</div>
                    <div className="text-sm font-medium text-slate-400 mt-2">
                        {score === 100 ? "Ready for Submission" : "Risk: High Audit Failure Probability"}
                    </div>
                </div>

                {/* Action Card [6] */}
                <div className="text-right w-full md:w-auto">
                    {score < 100 ? (
                        <button
                            onClick={onAutoFix}
                            disabled={isRepairing}
                            className={`w-full md:w-auto px-8 py-5 rounded-2xl font-bold text-white shadow-lg shadow-indigo-500/30 transform transition-all group overflow-hidden relative ${isRepairing ? "bg-slate-400" : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105"
                                }`}
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isRepairing ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {loadingMsg}
                                    </>
                                ) : (
                                    <>
                                        <span>✨ Auto-Fix {criticalCount} Issues</span>
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </>
                                )}
                            </span>
                        </button>
                    ) : (
                        <button
                            onClick={onDownload}
                            className="w-full md:w-auto px-8 py-5 rounded-2xl font-bold text-white bg-green-500 shadow-lg shadow-green-500/30 hover:bg-green-600 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                            Download XML
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar "Alive" State [7] */}
            <div className="w-full bg-slate-200/50 rounded-full h-4 mb-8 overflow-hidden">
                <div
                    className={`h-4 rounded-full transition-all duration-1000 ease-out shadow-sm ${score === 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-purple-600'}`}
                    style={{ width: `${score}%` }}
                ></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 text-center">
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center group hover:border-slate-200 transition-colors">
                    <div className="mb-2 p-3 bg-slate-50 text-slate-400 rounded-full group-hover:scale-110 transition-transform">📝</div>
                    <div className="text-3xl font-black text-slate-800">{totalRows}</div>
                    <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Records</div>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-rose-100 flex flex-col items-center justify-center group hover:border-rose-200 transition-colors">
                    <div className="mb-2 p-3 bg-rose-50 text-rose-500 rounded-full group-hover:scale-110 transition-transform">⚠️</div>
                    <div className="text-3xl font-black text-rose-500">{criticalCount}</div>
                    <div className="text-xs font-bold text-rose-400 uppercase tracking-wider">Critical Errors</div>
                </div>
                <div className="p-6 bg-white rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center group hover:border-emerald-200 transition-colors">
                    <div className="mb-2 p-3 bg-emerald-50 text-emerald-500 rounded-full group-hover:scale-110 transition-transform">✅</div>
                    <div className="text-3xl font-black text-emerald-500">{totalRows - criticalCount}</div>
                    <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Clean Rows</div>
                </div>
            </div>
        </div>
    );
}
