import React, { useState } from 'react';
import Papa from 'papaparse';
import Ajv from 'ajv';
import schema from '../fasamsSchema.json';
import { functions, httpsCallable } from '../firebaseClient';
import StatusPill from './StatusPill';

import addFormats from "ajv-formats"

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

const validate = ajv.compile(schema);

export default function FileUpload() {
    const [invalidRows, setInvalidRows] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [error, setError] = useState(null);
    const [repairing, setRepairing] = useState(false);
    const [fixedData, setFixedData] = useState(null);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setError(null);
        setInvalidRows([]);
        setFixedData(null);
        setHeaders([]);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.meta.fields) {
                    setHeaders(results.meta.fields);
                }

                const rows = results.data;
                const invalid = [];

                rows.forEach((row, index) => {
                    const valid = validate(row);
                    const rowErrors = {};

                    if (!valid) {
                        validate.errors.forEach((err) => {
                            const prop = err.instancePath.substring(1);
                            if (err.keyword === 'required') {
                                rowErrors[err.params.missingProperty] = err.message;
                            } else {
                                rowErrors[prop] = err.message;
                            }
                        });
                    }

                    // --- Custom Validation Rules for Dual Reporting ---

                    // 1. GPRA Mode (Grant_Type = 'SOR')
                    if (row.Grant_Type === 'SOR') {
                        // Requirement: Strict 'Male/Female' sex validation
                        if (row.Sex !== 'Male' && row.Sex !== 'Female') {
                            rowErrors['Sex'] = "GPRA Strict Mode: Sex must be 'Male' or 'Female'.";
                        }

                        // Requirement: Flag missing '6-Month Follow-up' dates if admission was >6 months ago
                        if (row.Admission_Date) {
                            const admissionDate = new Date(row.Admission_Date);
                            const sixMonthsAgo = new Date();
                            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

                            if (admissionDate < sixMonthsAgo) {
                                if (!row['6-Month Follow-up']) {
                                    rowErrors['6-Month Follow-up'] = "Missing 6-Month Follow-up for SOR client admitted >6 months ago.";
                                }
                            }
                        }
                    }

                    // 2. Age Gate (Recovery Housing)
                    // We assume Grant_Type indicates 'Recovery Housing' or similar value
                    if (row.Grant_Type === 'Recovery Housing' || row.Grant_Type === 'GO-14920') { 
                        // Requirement: Flag client row where Age is <18 or >24
                        if (row.Age) {
                            const age = parseInt(row.Age, 10);
                            if (!isNaN(age) && (age < 18 || age > 24)) {
                                rowErrors['Age'] = "Ineligible for Grant GO-14920: Age must be 18-24.";
                            }
                        }
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

                if (invalid.length === 0 && rows.length > 0) {
                    setError("All rows passed validation!");
                } else if (rows.length === 0) {
                    setError("File is empty.");
                }
            },
            error: (err) => {
                setError("Error parsing CSV: " + err.message);
            }
        });
    };

    const handleAutoFix = async () => {
        if (invalidRows.length === 0) return;
        setRepairing(true);
        setError(null);

        try {
            // Extract just the data part for the API
            const rowsToFix = invalidRows.map(item => item.data);

            const repairCsvData = httpsCallable(functions, 'repairCsvData');
            const result = await repairCsvData({ invalidRows: rowsToFix });

            const { correctedRows } = result.data;

            // Update invalidRows with the corrected data and remove errors
            // In a real app we might want to allow reviewing changes.
            // Here we just show them in green.

            const fixed = invalidRows.map((item, index) => ({
                ...item,
                data: correctedRows[index] || item.data, // Fallback if length mismatch
                isFixed: true,
                errors: {} // Clear errors
            }));

            setInvalidRows(fixed);
            setFixedData(true);
            setError("Errors fixed! Review the changes below.");

        } catch (err) {
            console.error(err);
            setError("Failed to auto-fix errors: " + err.message);
        } finally {
            setRepairing(false);
        }
    };

    return (
        <div className="w-full">

            <div className="mb-12 p-8 bg-white rounded-2xl shadow-xl transition-all hover:shadow-2xl border border-gray-100">
                <div className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 rounded-xl p-10 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-500 transition-all duration-300 group">
                    <svg className="w-12 h-12 text-indigo-400 mb-4 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <label className="cursor-pointer bg-indigo-600 text-white font-bold py-3 px-8 rounded-full hover:bg-indigo-700 transition transform hover:-translate-y-1 shadow-md">
                        <span>Select CSV File</span>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                        />
                    </label>
                    <p className="mt-2 text-sm text-gray-500">Supported format: .csv</p>
                </div>
                {error && (
                    <div className={`mt-6 p-4 rounded-lg text-center font-medium ${error.includes("passed") || error.includes("fixed") ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}>
                        {error}
                    </div>
                )}
            </div>

            {invalidRows.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                    <div className={`px-6 py-5 border-b flex justify-between items-center ${fixedData ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                        <h2 className={`text-xl font-bold flex items-center ${fixedData ? 'text-green-700' : 'text-red-700'}`}>
                            {fixedData ? (
                                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                            ) : (
                                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                            )}
                            {fixedData ? `Errors Auto-Fixed (${invalidRows.length})` : `Validation Issues Found (${invalidRows.length})`}
                        </h2>

                        {!fixedData && (
                            <button
                                onClick={handleAutoFix}
                                disabled={repairing}
                                className={`flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all
                    ${repairing ? "opacity-75 cursor-wait" : ""}`}
                            >
                                {repairing ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Fixing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span>
                                        <span>Auto-Fix Errors</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Line</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    {headers.map(header => (
                                        <th key={header} className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {invalidRows.map((item, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-all duration-300">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-700 bg-gray-50/50">
                                            {item.rowIndex}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm bg-white">
                                            {item.isFixed ? (
                                                <StatusPill status="fixed" />
                                            ) : Object.keys(item.errors).length > 0 ? (
                                                <StatusPill status="error" />
                                            ) : (
                                                <StatusPill status="valid" />
                                            )}
                                        </td>
                                        {headers.map(header => {
                                            const hasError = item.errors[header];
                                            const isFixed = item.isFixed;
                                            return (
                                                <td
                                                    key={header}
                                                    className={`px-6 py-4 whitespace-nowrap text-sm transition-colors ${isFixed ? 'bg-green-50 text-green-900 border-green-100' :
                                                        hasError
                                                            ? 'bg-red-50 text-red-900 ring-inset ring-1 ring-red-200'
                                                            : 'text-gray-600'}`
                                                    }
                                                >
                                                    <div className="flex flex-col">
                                                        <span>{item.data[header] || <em className="text-gray-400">null</em>}</span>
                                                        {!isFixed && hasError && (
                                                            <span className="mt-1 text-xs font-medium text-red-600 bg-red-100 px-2 py-0.5 rounded-full inline-block w-fit">
                                                                {hasError}
                                                            </span>
                                                        )}
                                                        {isFixed && hasError && (
                                                            <span className="mt-1 text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full inline-block w-fit">
                                                                Fixed
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
