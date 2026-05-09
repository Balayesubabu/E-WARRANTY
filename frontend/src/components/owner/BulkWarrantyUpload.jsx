import { useState } from 'react';
import { motion } from 'motion/react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import { generateWarrantyCodes } from '../../services/warrantyCodeService';

export function BulkWarrantyUpload() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // Parse CSV file
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target.result;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            toast.error('CSV must have at least a header row and one data row');
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const rows = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length < 3) continue;

            const row = {};
            headers.forEach((header, idx) => {
              row[header] = values[idx] || '';
            });
            rows.push({ row: i + 1, data: row });
          }

          setParsedRows(rows);
          setFile(selectedFile);
          setUploadResult(null);
          toast.success(`File parsed: ${rows.length} product(s) found`);
        } catch {
          toast.error('Failed to parse CSV file');
        }
      };
      reader.readAsText(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file || parsedRows.length === 0) {
      toast.error('Please select a valid CSV file first');
      return;
    }

    setIsUploading(true);

    const result = {
      total: parsedRows.length,
      successful: 0,
      failed: 0,
      errors: [],
    };

    for (const item of parsedRows) {
      try {
        const row = item.data;
        const warrantyMonths = parseInt(row['warranty period (months)'] || row['warranty_months'] || '12');
        const warrantyDays = warrantyMonths * 30;
        const readablePeriod = warrantyMonths >= 12
          ? `${Math.floor(warrantyMonths / 12)} Year${warrantyMonths >= 24 ? 's' : ''}`
          : `${warrantyMonths} Month${warrantyMonths > 1 ? 's' : ''}`;

        const payload = {
          product_name: row['product name'] || row['product_name'] || '',
          product_id: row['product id'] || row['product_id'] || '',
          serial_no: row['serial number'] || row['serial_no'] || '',
          warranty_code: row['warranty code prefix'] || row['warranty_code'] || 'WR',
          warranty_days: warrantyDays,
          warranty_period_readable: readablePeriod,
          serial_no_quantity: parseInt(row['quantity'] || row['serial_no_quantity'] || '1'),
          quantity: 1,
          type: ((row['type'] || 'Product').charAt(0).toUpperCase() + (row['type'] || 'Product').slice(1).toLowerCase()),
          other_type: '',
          vehicle_number: '',
          service_id: '',
          factory_item_number: '',
          factory_service_number: '',
          warranty_registration_url: '',
          warranty_from: null,
          warranty_to: null,
          warranty_check: false,
          warranty_check_interval: 0,
          warranty_interval_dates: [],
          warranty_reminder_days: [0, 1, 2, 5, 10],
          terms_and_conditions: row['terms'] ? [row['terms']] : [],
          terms_and_conditions_link: '',
          is_active: true,
          print_type: 'A4',
        };

        if (!payload.product_name) {
          throw new Error('Missing product name');
        }

        await generateWarrantyCodes(payload);
        result.successful++;
      } catch (error) {
        result.failed++;
        result.errors.push({
          row: item.row,
          error: error?.response?.data?.message || error.message || 'Unknown error',
        });
      }
    }

    setUploadResult(result);
    setIsUploading(false);
    
    if (result.failed === 0) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      toast.success(`All ${result.total} warranty code groups created successfully!`);
    } else if (result.successful > 0) {
      toast.warning(`${result.successful} created, ${result.failed} failed`);
    } else {
      toast.error(`All ${result.total} failed. Check the errors below.`);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template content
    const csvContent = 'Product Name,Serial Number,Warranty Code Prefix,Warranty Period (Months),Quantity,Type\n' +
      'iPhone 15 Pro,APL,IP15,12,5,product\n' +
      'MacBook Air M2,MBA,MBA,24,3,product\n' +
      'Car Service Plan,,CSP,6,10,vehicle\n';
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'warranty_bulk_upload_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template downloaded successfully');
  };

  return (
    <div className="p-4 lg:p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Instructions */}
        <div className="bg-blue-50 rounded-2xl p-5 border border-blue-100">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-blue-900 mb-2">How to bulk upload</h3>
              <ol className="text-blue-800 text-sm space-y-1 list-decimal list-inside">
                <li>Download the CSV template below</li>
                <li>Fill in: Product Name, Serial Number prefix, Warranty Code Prefix, Warranty Period (Months), Quantity, Type</li>
                <li>Upload the completed CSV file</li>
                <li>Each row will generate warranty codes via the backend</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Download Template */}
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-slate-900">CSV Template</h3>
                <p className="text-slate-500 text-sm">Download sample file</p>
              </div>
            </div>
          </div>
          
          <Button
            onClick={handleDownloadTemplate}
            variant="outline"
            className="w-full"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* Upload Area */}
        <div className="bg-white rounded-2xl p-5 shadow-md">
          <h3 className="text-slate-900 mb-4">Upload CSV File</h3>
          
          <label
            htmlFor="csv-upload"
            className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 rounded-xl hover:border-purple-300 transition-colors cursor-pointer bg-slate-50 hover:bg-purple-50"
          >
            {file ? (
              <div className="text-center">
                <FileText className="w-12 h-12 text-purple-600 mx-auto mb-2" />
                <p className="text-slate-900">{file.name}</p>
                <p className="text-slate-400 text-sm">{(file.size / 1024).toFixed(1)} KB</p>
                <p className="text-purple-600 text-sm mt-2">Click to change file</p>
              </div>
            ) : (
              <div className="text-center">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-900">Click to upload CSV</p>
                <p className="text-slate-400 text-sm">or drag and drop</p>
                <p className="text-slate-400 text-xs mt-2">CSV files only (Max 10MB)</p>
              </div>
            )}
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {file && parsedRows.length > 0 && (
            <div className="mt-4 mb-3 bg-blue-50 rounded-xl p-3 border border-blue-100">
              <p className="text-blue-800 text-sm font-medium">{parsedRows.length} product(s) ready to process</p>
              <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {parsedRows.slice(0, 5).map((item, i) => (
                  <p key={i} className="text-blue-700 text-xs">
                    Row {item.row}: {item.data['product name'] || item.data['product_name'] || 'Unknown'} 
                    {item.data['quantity'] ? ` (x${item.data['quantity']})` : ''}
                  </p>
                ))}
                {parsedRows.length > 5 && (
                  <p className="text-blue-600 text-xs">...and {parsedRows.length - 5} more</p>
                )}
              </div>
            </div>
          )}

          {file && (
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full mt-4 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing {file.name}...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload & Process ({parsedRows.length} products)
                </>
              )}
            </Button>
          )}
        </div>

        {/* Upload Result */}
        {uploadResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 shadow-md"
          >
            <h3 className="text-slate-900 mb-4">Upload Results</h3>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <p className="text-blue-600 text-2xl">{uploadResult.total}</p>
                <p className="text-blue-800 text-sm">Total</p>
              </div>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <p className="text-green-600 text-2xl">{uploadResult.successful}</p>
                <p className="text-green-800 text-sm">Success</p>
              </div>
              <div className="bg-red-50 rounded-xl p-3 text-center">
                <p className="text-red-600 text-2xl">{uploadResult.failed}</p>
                <p className="text-red-800 text-sm">Failed</p>
              </div>
            </div>

            {uploadResult.errors.length > 0 && (
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-slate-900 text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  Errors Found
                </h4>
                <div className="space-y-2">
                  {uploadResult.errors.map((error, index) => (
                    <div key={index} className="bg-red-50 rounded-lg p-3 text-sm">
                      <p className="text-red-900">Row {error.row}</p>
                      <p className="text-red-700">{error.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadResult.failed === 0 && (
              <div className="bg-green-50 rounded-xl p-4 border border-green-100 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-green-900">All warranties created successfully!</p>
                  <p className="text-green-700 text-sm">Your warranties are now active</p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
