import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  Download, 
  CheckCircle, 
  AlertTriangle, 
  X, 
  FileText, 
  RefreshCw,
  ArrowRight,
  Plus,
  AlertCircle,
  Check,
  FileUp,
  Zap
} from 'lucide-react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * Modern SaaS-style bulk property import component
 * Features: Progressive disclosure, micro-interactions, professional design
 */
const BulkPropertyImport = ({ onImportComplete, onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [results, setResults] = useState({ success: 0, errors: [] });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Required and optional fields
  const REQUIRED_FIELDS = ['address', 'city', 'state', 'zipCode'];
  const OPTIONAL_FIELDS = ['propertyName', 'units', 'propertyType', 'monthlyRent', 'notes'];
  
  // Enhanced sample data with more realistic examples
  const SAMPLE_DATA = [
    {
      propertyName: 'Sunset Apartments Unit 1A',
      address: '123 Main Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      units: '1',
      propertyType: 'Apartment',
      monthlyRent: '2800',
      notes: 'Recently renovated, hardwood floors'
    },
    {
      propertyName: 'Oak Gardens Townhouse',
      address: '456 Oak Avenue',
      city: 'San Francisco',
      state: 'CA', 
      zipCode: '94103',
      units: '1',
      propertyType: 'Townhouse',
      monthlyRent: '3200',
      notes: 'Pet-friendly, garden access'
    },
    {
      propertyName: 'Downtown Loft 3B',
      address: '789 Pine Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94104', 
      units: '1',
      propertyType: 'Loft',
      monthlyRent: '3800',
      notes: 'High ceilings, city views'
    }
  ];

  // Download enhanced template
  const downloadTemplate = useCallback(() => {
    const csv = Papa.unparse(SAMPLE_DATA);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'propagentic_property_template.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Track template download
    if (window.gtag) {
      window.gtag('event', 'template_download', {
        event_category: 'bulk_import',
        event_label: 'property_template'
      });
    }
  }, []);

  // Enhanced drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileUpload({ target: { files: [droppedFile] } });
    }
  }, []);

  // Enhanced file upload with progress simulation
  const handleFileUpload = useCallback((event) => {
    const uploadedFile = event.target.files[0];
    if (!uploadedFile) return;

    const fileExtension = uploadedFile.name.split('.').pop().toLowerCase();
    
    if (!['csv', 'xlsx', 'xls'].includes(fileExtension)) {
      alert('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
      return;
    }

    setFile(uploadedFile);
    setUploadProgress(0);
    
    // Simulate upload progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 100);

    parseFile(uploadedFile, fileExtension, () => {
      setUploadProgress(100);
      clearInterval(progressInterval);
    });
  }, []);

  // Enhanced file parsing with completion callback
  const parseFile = useCallback((file, extension, onComplete) => {
    if (extension === 'csv') {
      Papa.parse(file, {
        complete: (results) => {
          processUploadedData(results.data);
          onComplete && onComplete();
        },
        header: true,
        skipEmptyLines: true
      });
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        processUploadedData(jsonData);
        onComplete && onComplete();
      };
      reader.readAsArrayBuffer(file);
    }
  }, []);

  // Enhanced data processing with better validation
  const processUploadedData = useCallback((rawData) => {
    const validationResults = rawData.map((row, index) => {
      const errors = [];
      const warnings = [];

      // Enhanced validation
      REQUIRED_FIELDS.forEach(field => {
        if (!row[field] || String(row[field]).trim() === '') {
          errors.push(`Missing required field: ${field}`);
        }
      });

      // Enhanced ZIP code validation
      if (row.zipCode && !/^\d{5}(-\d{4})?$/.test(String(row.zipCode).trim())) {
        errors.push('Invalid ZIP code format (use 12345 or 12345-6789)');
      }

      // Enhanced state validation
      if (row.state && String(row.state).trim().length !== 2) {
        errors.push('State must be 2-letter code (e.g., NY, CA)');
      }

      // Enhanced units validation
      if (row.units && (isNaN(Number(row.units)) || Number(row.units) <= 0)) {
        warnings.push('Units should be a positive number');
      }

      // Enhanced rent validation
      if (row.monthlyRent && isNaN(Number(row.monthlyRent))) {
        warnings.push('Monthly rent should be a number');
      }

      // Clean and normalize data
      const cleanedRow = {
        ...row,
        address: String(row.address || '').trim(),
        city: String(row.city || '').trim(),
        state: String(row.state || '').trim().toUpperCase(),
        zipCode: String(row.zipCode || '').trim(),
        propertyName: String(row.propertyName || '').trim(),
        units: row.units ? Math.max(1, Number(row.units)) : 1,
        propertyType: String(row.propertyType || 'Apartment').trim(),
        monthlyRent: row.monthlyRent ? Number(row.monthlyRent) : 0,
        notes: String(row.notes || '').trim()
      };

      return {
        index: index + 1,
        data: cleanedRow,
        isValid: errors.length === 0,
        errors,
        warnings
      };
    });

    setData(rawData);
    setValidationResults(validationResults);
    
    // Auto-advance to preview with animation delay
    setTimeout(() => {
      setStep('preview');
    }, 500);
  }, []);

  // Enhanced bulk import with real-time progress
  const processBulkImport = useCallback(async () => {
    setProcessing(true);
    setStep('processing');

    const validRows = validationResults.filter(row => row.isValid);
    const results = { success: 0, errors: [], importedProperties: [] };

    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const propertyData = {
          name: row.data.propertyName || `Property at ${row.data.address}`,
          address: row.data.address,
          city: row.data.city,
          state: row.data.state,
          zipCode: row.data.zipCode,
          propertyType: row.data.propertyType,
          units: row.data.units,
          monthlyRent: row.data.monthlyRent,
          notes: row.data.notes,
          landlordId: currentUser.uid,
          landlordEmail: userProfile?.email || currentUser.email,
          createdAt: serverTimestamp(),
          status: 'active',
          source: 'bulk_import',
          occupancy: 0,
          isOccupied: false
        };

        const docRef = await addDoc(collection(db, 'properties'), propertyData);
        
        // Add the Firestore-generated ID to our local data
        const propertyWithId = {
          id: docRef.id,
          ...propertyData,
          createdAt: new Date() // Convert for local display
        };
        
        results.importedProperties.push(propertyWithId);
        results.success++;
        
        // Update progress (optional visual feedback)
        setUploadProgress(Math.round(((i + 1) / validRows.length) * 100));
        
      } catch (error) {
        console.error('Error importing property:', error);
        results.errors.push({
          row: row.index,
          address: row.data.address,
          error: error.message
        });
      }
    }

    setResults(results);
    setProcessing(false);
    setStep('complete');

    // Track successful imports
    if (window.gtag) {
      window.gtag('event', 'bulk_property_import_complete', {
        properties_imported: results.success,
        errors_count: results.errors.length,
        user_id: currentUser.uid
      });
    }

    // Call onImportComplete with the actual imported properties
    if (onImportComplete && results.importedProperties.length > 0) {
      onImportComplete(results.importedProperties);
    }
  }, [validationResults, currentUser.uid, userProfile, onImportComplete]);

  // Modern upload step with enhanced design
  const renderUploadStep = () => (
    <div className="text-center space-y-8">
      {/* Hero section */}
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
          <FileUp className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Import Your Properties</h3>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Upload a CSV or Excel file to add multiple properties in seconds
          </p>
        </div>
      </div>

      {/* Enhanced file upload area */}
      <div className="space-y-6">
        <div
          className={`relative cursor-pointer bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed transition-all duration-300 hover:from-blue-50 hover:to-blue-100 hover:border-blue-300 ${
            isDragOver ? 'border-blue-400 bg-blue-50 scale-105' : 'border-gray-300'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
          />
          <div className="px-8 py-12 text-center">
            <div className="space-y-4">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 ${
                isDragOver ? 'bg-blue-500 text-white scale-110' : 'bg-gray-200 text-gray-400'
              }`}>
                <Upload className="h-6 w-6" />
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragOver ? 'Drop your file here' : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  CSV, XLSX, or XLS files only • Max 10MB
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload progress */}
        {file && uploadProgress < 100 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">{file.name}</span>
              <span className="text-blue-600">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Template download */}
        <div className="flex items-center justify-center space-x-4">
          <div className="h-px bg-gray-200 flex-1" />
          <span className="text-sm text-gray-500">or</span>
          <div className="h-px bg-gray-200 flex-1" />
        </div>

        <Button
          onClick={downloadTemplate}
          variant="outline"
          className="inline-flex items-center space-x-2 px-6 py-3 border-gray-300 hover:border-blue-400 hover:text-blue-600 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Download Template</span>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full ml-2">
            Recommended
          </span>
        </Button>
      </div>

      {/* Field requirements */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-500" />
          Field Requirements
        </h4>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-medium text-gray-700 mb-3 flex items-center">
              <div className="w-2 h-2 bg-red-400 rounded-full mr-2" />
              Required Fields
            </h5>
            <ul className="space-y-2 text-sm text-gray-600">
              {REQUIRED_FIELDS.map(field => (
                <li key={field} className="flex items-center">
                  <Check className="h-3 w-3 text-green-500 mr-2" />
                  {field}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h5 className="font-medium text-gray-700 mb-3 flex items-center">
              <div className="w-2 h-2 bg-blue-400 rounded-full mr-2" />
              Optional Fields
            </h5>
            <ul className="space-y-2 text-sm text-gray-600">
              {OPTIONAL_FIELDS.map(field => (
                <li key={field} className="flex items-center">
                  <Plus className="h-3 w-3 text-blue-500 mr-2" />
                  {field}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced preview step
  const renderPreviewStep = () => {
    const validCount = validationResults.filter(r => r.isValid).length;
    const errorCount = validationResults.filter(r => !r.isValid).length;

    return (
      <div className="space-y-6">
        {/* Header with stats */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">Import Preview</h3>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm text-gray-600">Ready to import</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{validCount}</div>
              <div className="text-sm text-gray-600">Valid Properties</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-gray-600">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{file?.size ? Math.round(file.size / 1024) : 0}KB</div>
              <div className="text-sm text-gray-600">File Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{validationResults.length}</div>
              <div className="text-sm text-gray-600">Total Rows</div>
            </div>
          </div>
        </div>

        {/* Enhanced preview table */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Property Name</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">City</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">State</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Issues</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validationResults.map((row) => (
                  <tr key={row.index} className={`hover:bg-gray-50 transition-colors ${
                    row.isValid ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-red-400'
                  }`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {row.isValid ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Valid</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600">
                            <AlertCircle className="h-5 w-5 mr-2" />
                            <span className="text-sm font-medium">Error</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {row.data.propertyName || `Property ${row.index}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.data.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.data.city}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.data.state}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {row.errors.length > 0 && (
                        <div className="space-y-1">
                          {row.errors.map((error, i) => (
                            <div key={i} className="flex items-center text-red-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {error}
                            </div>
                          ))}
                        </div>
                      )}
                      {row.warnings.length > 0 && (
                        <div className="space-y-1">
                          {row.warnings.map((warning, i) => (
                            <div key={i} className="flex items-center text-yellow-600">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {warning}
                            </div>
                          ))}
                        </div>
                      )}
                      {row.isValid && row.errors.length === 0 && row.warnings.length === 0 && (
                        <span className="text-green-600 text-sm">✓ Ready to import</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setStep('upload')}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180" />
            <span>Choose Different File</span>
          </Button>
          
          <div className="flex items-center space-x-3">
            <div className="text-sm text-gray-600">
              {validCount > 0 && `${validCount} properties ready to import`}
            </div>
            <Button
              onClick={processBulkImport}
              disabled={validCount === 0}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
            >
              <Zap className="h-4 w-4" />
              <span>Import {validCount} Properties</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced processing step
  const renderProcessingStep = () => (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg">
          <RefreshCw className="h-8 w-8 text-white animate-spin" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Importing Properties</h3>
          <p className="text-lg text-gray-600">
            Please wait while we add your properties to your account...
          </p>
        </div>
      </div>

      {/* Enhanced progress bar */}
      <div className="max-w-md mx-auto space-y-3">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
            style={{ width: `${uploadProgress}%` }}
          >
            {uploadProgress > 20 && (
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            )}
          </div>
        </div>
        <p className="text-sm text-gray-500">
          {uploadProgress}% complete
        </p>
      </div>

      <div className="bg-blue-50 rounded-2xl p-6 border border-blue-200">
        <div className="flex items-center justify-center space-x-2 text-blue-700">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Processing your data securely...</span>
        </div>
      </div>
    </div>
  );

  // Enhanced complete step
  const renderCompleteStep = () => (
    <div className="text-center space-y-8">
      <div className="space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl shadow-lg">
          <CheckCircle className="h-8 w-8 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Import Successful!</h3>
          <p className="text-lg text-gray-600">
            Your properties have been added to your account
          </p>
        </div>
      </div>
      
      {/* Enhanced results */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">{results.success}</div>
            <div className="text-sm text-gray-600">Properties Imported</div>
            <div className="flex items-center justify-center mt-2">
              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-xs text-green-700">Successfully added</span>
            </div>
          </div>
          
          {results.errors.length > 0 && (
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">{results.errors.length}</div>
              <div className="text-sm text-gray-600">Errors</div>
              <div className="flex items-center justify-center mt-2">
                <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-xs text-red-700">Need attention</span>
              </div>
            </div>
          )}
        </div>
        
        {results.errors.length > 0 && (
          <div className="mt-6 pt-6 border-t border-green-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Error Details:</h4>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {results.errors.map((error, index) => (
                <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-xs text-red-800">
                    <span className="font-medium">Row {error.row}:</span> {error.address}
                  </div>
                  <div className="text-xs text-red-600 mt-1">{error.error}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center space-x-4">
        <Button 
          onClick={() => {
            setStep('upload');
            setFile(null);
            setData([]);
            setValidationResults([]);
            setResults({ success: 0, errors: [] });
            setUploadProgress(0);
          }}
          variant="outline"
          className="px-6 py-3"
        >
          Import More Properties
        </Button>
        <Button 
          onClick={() => {
            onClose && onClose();
          }}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-medium shadow-lg"
        >
          View Dashboard
        </Button>
      </div>
    </div>
  );

  // Enhanced step indicators
  const stepConfig = [
    { key: 'upload', label: 'Upload', icon: Upload },
    { key: 'preview', label: 'Preview', icon: FileText },
    { key: 'processing', label: 'Import', icon: RefreshCw },
    { key: 'complete', label: 'Complete', icon: CheckCircle }
  ];

  const currentStepIndex = stepConfig.findIndex(s => s.key === step);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-8 py-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Bulk Property Import</h2>
              <p className="text-blue-100 mt-1">Add multiple properties quickly and easily</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-xl"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Enhanced progress indicator */}
        <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {stepConfig.map((stepItem, index) => {
              const StepIcon = stepItem.icon;
              const isActive = index === currentStepIndex;
              const isCompleted = index < currentStepIndex;
              const isProcessing = step === 'processing' && stepItem.key === 'processing';
              
              return (
                <div key={stepItem.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-300 ${
                      isActive 
                        ? 'border-blue-500 bg-blue-500 text-white shadow-lg scale-110' 
                        : isCompleted
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                    }`}>
                      <StepIcon className={`h-5 w-5 ${isProcessing ? 'animate-spin' : ''}`} />
                    </div>
                    <span className={`text-xs font-medium mt-2 transition-colors ${
                      isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {stepItem.label}
                    </span>
                  </div>
                  {index < stepConfig.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 transition-all duration-300 ${
                      index < currentStepIndex ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step content */}
        <div className="px-8 py-8 min-h-96">
          {step === 'upload' && renderUploadStep()}
          {step === 'preview' && renderPreviewStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
      </div>
    </div>
  );
};

export default BulkPropertyImport; 