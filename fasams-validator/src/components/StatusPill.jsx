import React from 'react';

export default function StatusPill({ status, message }) {
  // Define styles based on status
  const styles = {
    valid: "bg-green-50 text-green-700 ring-green-600/20",
    error: "bg-red-50 text-red-700 ring-red-600/10",
    fixed: "bg-indigo-50 text-indigo-700 ring-indigo-600/20", // The "Magic" state
  };

  const icons = {
    valid: (
      <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    fixed: (
      <svg className="w-3 h-3 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  };

  const type = status.toLowerCase();
  
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${styles[type] || styles.valid} transition-all duration-300`}>
      {icons[type]}
      {status === 'fixed' ? 'AI Repaired' : status === 'error' ? 'Invalid' : 'Compliant'}
    </span>
  );
}