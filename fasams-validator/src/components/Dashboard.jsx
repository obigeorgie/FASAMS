import React from 'react';

export default function Dashboard({ score, totalRows, criticalCount, onAutoFix, onDownload, isRepairing, loadingMsg }) {

    // Visual Hierarchy: Group errors by severity [5]
    const statusColor = score === 100 ? "text-green-600" : score > 80 ? "text-yellow-600" : "text-red-600";
    const ringColor = score === 100 ? "ring-green-500" : "ring-red-500";

    return (
        <div className="w-full max-w-4xl mx-auto mt-8 p-6 bg-white rounded-2xl shadow-xl border border-slate-100">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Compliance Score</h2>
                    <div className={`text-6xl font-black ${statusColor} mt-2`}>{score}%</div>
                </div>

                {/* Action Card [6] */}
                <div className="text-right">
                    {score < 100 ? (
                        <button
                            onClick={onAutoFix}
                            disabled={isRepairing}
                            className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg transform transition-all ${isRepairing ? "bg-slate-400" : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105 animate-pulse"
                                }`}
                        >
                            {isRepairing ? loadingMsg : `✨ Auto-Fix ${criticalCount} Critical Errors`}
                        </button>
                    ) : (
                        <button
                            onClick={onDownload}
                            className="px-8 py-4 rounded-xl font-bold text-white bg-green-600 shadow-lg hover:bg-green-700 hover:-translate-y-1 transition-all"
                        >
                            Download Official XML
                        </button>
                    )}
                </div>
            </div>

            {/* Progress Bar "Alive" State [7] */}
            <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden">
                <div
                    className={`h-3 rounded-full transition-all duration-1000 ${score === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                    style={{ width: `${score}%` }}
                ></div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-8 text-center">
                <div className="p-4 bg-slate-50 rounded-lg">
                    <div className="text-2xl font-bold text-slate-800">{totalRows}</div>
                    <div className="text-xs text-slate-500 uppercase">Total Records</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
                    <div className="text-xs text-red-400 uppercase">Critical Blocks</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{totalRows - criticalCount}</div>
                    <div className="text-xs text-green-600 uppercase">Clean Rows</div>
                </div>
            </div>
        </div>
    );
}
