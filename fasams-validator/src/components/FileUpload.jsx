import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import Ajv from 'ajv';
import schema from '../fasamsSchema.json';
import { functions, httpsCallable } from '../firebaseClient';
import StatusPill from './StatusPill';
import Dashboard from './Dashboard';
import { generateFasamsXML, downloadXML } from '../utils/xmlGenerator';
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
  const [aiSummary, setAiSummary] = useState(null);

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
      const { correctedRows, summary } = result.data;

      const fixed = invalidRows.map((item, index) => ({
        ...item,
        data: item.data,
        fixedData: correctedRows[index],
        isFixed: true,
        errors: {}
      }));

      setInvalidRows(fixed);
      setFixedData(true);
      setAiSummary(summary);
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


  const renderCellDiff = (header, originalRow, fixedRow, isFixed, error) => {
    const originalVal = originalRow[header];
    const fixedVal = fixedRow ? fixedRow[header] : originalVal;

    // If no change, return standard cell
    if (!isFixed || originalVal === fixedVal) {
      return (
        <td key={header} className="p-3 text-slate-600">
          {fixedVal || <span className="text-slate-300 italic">null</span>}
          {error && !isFixed && (
            <span className="block text-xs text-red-500 mt-1 font-medium">{error}</span>
          )}
        </td>
      );
    }

    // Visual Diff: Red Strikethrough -> Green New Value
    return (
      <td key={header} className="p-3 bg-indigo-50/50 border-l-4 border-indigo-200">
        <div className="flex flex-col text-xs">
          <span className="line-through text-red-400 mb-1">{originalVal || 'MISSING'}</span>
          <span className="font-bold text-green-700 bg-green-100 px-1 py-0.5 rounded w-fit">
            {fixedVal}
          </span>
        </div>
      </td>
    );
  };

  const handleDownload = () => {
    // Create a map of rowIndex -> fixed data for O(1) lookup
    const fixedRowsMap = invalidRows.reduce((acc, row) => {
      acc[row.rowIndex] = row.fixedData || row.data;
      return acc;
    }, {});

    const finalData = fileData.map((row, index) => {
      const currentRowIndex = index + 2; // Match logic: rowIndex = index + 2
      return fixedRowsMap[currentRowIndex] || row;
    });

    const xml = generateFasamsXML(finalData);
    downloadXML(xml, `FASAMS_Submission_${new Date().toISOString().slice(0, 10)}.xml`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Upload Section */}
      {/* Upload Section */}
      <div
        className="border-4 border-dashed border-indigo-100 dark:border-indigo-50/50 rounded-3xl p-12 text-center hover:bg-indigo-50/30 transition-colors group cursor-pointer relative overflow-hidden"
      >
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className="relative z-0 pointer-events-none">
          <div className="w-20 h-20 mx-auto bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Upload Client CSV</h3>
          <p className="text-slate-500 max-w-sm mx-auto">
            Drag and drop your file here, or click to browse.
            <br />
            <span className="text-xs text-indigo-400 font-medium mt-2 block">Supports PAM 155-2 V14 Schema</span>
          </p>
        </div>
      </div>

      {error && <div className="p-4 bg-blue-50 text-blue-700 rounded-lg text-center">{error}</div>}

      {/* Dashboard View */}
      {complianceScore !== null && (
        <>
          <Dashboard
            score={complianceScore}
            totalRows={fileData.length}
            criticalCount={invalidRows.length}
            onAutoFix={handleAutoFix}
            onDownload={handleDownload}
            isRepairing={repairing}
            loadingMsg={loadingMessage}
          />

          {aiSummary && (
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 text-indigo-800 text-sm mb-4 animate-fade-in-up">
              <strong>🤖 AI Agent Report:</strong> {aiSummary}
            </div>
          )}
        </>
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
                <tr key={idx} className={item.isFixed ? "bg-green-50/30" : "bg-white"}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.rowIndex}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusPill status={item.isFixed ? 'fixed' : 'error'} />
                  </td>
                  {headers.map(header => (
                    renderCellDiff(header, item.data, item.fixedData, item.isFixed, item.errors[header])
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
