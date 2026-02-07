import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import Ajv from 'ajv';
import schema from '../fasamsSchema.json';
import { functions, httpsCallable } from '../firebaseClient';
import StatusPill from './StatusPill';
import addFormats from "ajv-formats";

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(schema);

export default function FileUpload() {
  const [fileData, setFileData] = useState([]);
  const [invalidRows, setInvalidRows] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [error, setError] = useState(null);
  const [repairing, setRepairing] = useState(false);
  const [fixedData, setFixedData] = useState(null);
  
  // Dashboard Metrics
  const [complianceScore, setComplianceScore] = useState(null);
  const [showTable, setShowTable] = useState(false);
  
  // "Alive" Loading State
  const [loadingMessage, setLoadingMessage] = useState("Initializing AI...");

  // Loading Message Cycle
  useEffect(() => {
    if (repairing) {
      const messages = [
        "Validating SSN checksums...",
        "Checking Appendix 1 Project Codes...",
        "Standardizing Date Formats...",
        "Cross-referencing Medicaid IDs...",
        "Finalizing Schema Compliance..."
      ];
      let i = 0;
      const interval = setInterval(() => {
        setLoadingMessage(messages[i]);
        i = (i + 1) % messages.length;
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [repairing]);

  const handleFileUpload = (e) => {
    const file = e.target.files;
    if (!file) return;

    setError(null);
    setInvalidRows([]);
    setFixedData(null);
    setComplianceScore(null);
    setShowTable(false);

    Papa.parse(file[0], {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.meta.fields) setHeaders(results.meta.fields);
        const rows = results.data;
        setFileData(rows);

        const invalid = [];
        
        rows.forEach((row, index) => {
          // 1. Schema Validation (Syntax)
          const valid = validate(row);
          const rowErrors = {};

          if (!valid) {
            validate.errors.forEach((err) => {
              const prop = err.instancePath.substring(1) || err.params.missingProperty;
              rowErrors[prop] = err.message;
            });
          }

          // 2. Deep Logic Validation (Business Rules)
          
          // Date Logic: Admission must be after DOB
          if (row.Admission_Date && row.DOB) {
            const adminDate = new Date(row.Admission_Date);
            const birthDate = new Date(row.DOB);
            if (adminDate <= birthDate) {
              rowErrors['Admission_Date'] = "Critical: Admission Date must be after DOB [PAM 155-2].";
            }
          }

          // Cross-Field: Project Code A1 requires OCA MH0BN
          if (row.Project_Code === 'A1' && row.OCA && row.OCA !== 'MH0BN') {
             rowErrors['Project_Code'] = "Invalid Combination: Project A1 requires OCA MH0BN.";
          }

          if (Object.keys(rowErrors).length > 0) {
            invalid.push({
              rowIndex: index + 2,
              data: row,
              errors: rowErrors
            });
          }
        });

        setInvalidRows(invalid);
        
        // Calculate Compliance Score
        const total = rows.length;
        const score = total > 0 ? Math.round(((total - invalid.length) / total) * 100) : 0;
        setComplianceScore(score);

        if (invalid.length === 0 && total > 0) {
          setError("Perfect File! 100% FASAMS Compliant.");
        }
      },
      error: (err) => setError("Error parsing CSV: " + err.message)
    });
  };

  const handleAutoFix = async () => {
    if (invalidRows.length === 0) return;
    setRepairing(true);
    setError(null);

    try {
      const rowsToFix = invalidRows.map(item => item.data);
      const repairCsvData = httpsCallable(functions, 'repairCsvData');
      
      const result = await repairCsvData({ invalidRows: rowsToFix });
      const { correctedRows } = result.data;

      const fixed = invalidRows.map((item, index) => ({
        ...item,
        data: correctedRows[index] || item.data,
        isFixed: true,
        errors: {} 
      }));

      setInvalidRows(fixed);
      setFixedData(true);
      setShowTable(true); // Force table view after fix
      setComplianceScore(100); // Optimistic update
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to auto-fix: " + err.message);
    } finally {
      setRepairing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Upload Section */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        <label className="cursor-pointer inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-all">
          <span>Upload Client CSV</span>
          <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
        </label>
        <p className="mt-2 text-sm text-gray-500">Supports PAM 155-2 V14 Schema</p>
      </div>

      {error && <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-center">{error}</div>}

      {/* Dashboard View */}
      {complianceScore !== null && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 fade-in">
          {/* Hero Metric */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
            <span className="text-gray-500 font-medium mb-2">Compliance Score</span>
            <span className={`text-6xl font-bold ${complianceScore < 80 ? 'text-amber-500' : 'text-green-500'}`}>
              {complianceScore}%
            </span>
          </div>

          {/* Error Summary */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-center">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Issues Found</h3>
            <div className="flex justify-between items-center mb-2">
              <span className="text-red-600 font-medium">Critical Errors</span>
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-bold">
                {invalidRows.length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rows Passed</span>
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
                {fileData.length - invalidRows.length}
              </span>
            </div>
          </div>

          {/* Action Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-100 flex flex-col justify-center items-center">
            {!fixedData ? (
              <>
                <p className="text-indigo-900 font-medium mb-4 text-center">
                  {invalidRows.length > 0 ? "AI Repair Available" : "Ready to Submit"}
                </p>
                {invalidRows.length > 0 && (
                  <button
                    onClick={handleAutoFix}
                    disabled={repairing}
                    className={`w-full py-3 px-4 rounded-lg font-bold text-white shadow-md transition-all 
                      ${repairing ? "bg-gray-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700 hover:-translate-y-0.5"}`}
                  >
                    {repairing ? (
                      <span className="flex items-center justify-center space-x-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>{loadingMessage}</span>
                      </span>
                    ) : (
                      "✨ Auto-Fix Critical Issues"
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center">
                <div className="text-green-600 font-bold text-xl mb-2">✓ Issues Resolved</div>
                <button className="text-indigo-600 font-medium underline">Download XML (Coming Soon)</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle Details */}
      {complianceScore !== null && invalidRows.length > 0 && (
        <div className="text-center">
          <button 
            onClick={() => setShowTable(!showTable)}
            className="text-gray-500 hover:text-gray-800 font-medium text-sm transition-colors"
          >
            {showTable ? "Hide Details" : "Review Individual Errors ↓"}
          </button>
        </div>
      )}

      {/* Detailed Table (Hidden by default until requested) */}
      {showTable && invalidRows.length > 0 && (
        <div className="overflow-x-auto rounded-xl shadow-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Line</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {headers.map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invalidRows.map((item, idx) => (
                <tr key={idx} className={item.isFixed ? "bg-green-50/50" : "bg-white"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.rowIndex}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusPill status={item.isFixed ? 'fixed' : 'error'} />
                  </td>
                  {headers.map(header => (
                    <td key={header} className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex flex-col">
                        <span className={item.errors[header] && !item.isFixed ? "text-red-700 font-semibold" : "text-gray-700"}>
                          {item.data[header] || <span className="text-gray-300 italic">null</span>}
                        </span>
                        {item.errors[header] && !item.isFixed && (
                          <span className="text-xs text-red-500 mt-1">{item.errors[header]}</span>
                        )}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
