import React, { useState } from 'react';
import { Database, ArrowRight, Copy, Check, Download, FileSpreadsheet, Sparkles } from 'lucide-react';
import { csvToJson, jsonToCsv, jsonToYaml, yamlToJson, jsonToXml, toSqlInsert, textToPdfBlob } from '../utils/documentConverter';
import { downloadBlob } from '../utils/zipExporter';

export const DataStudioSection: React.FC = () => {
  const [sourceFormat, setSourceFormat] = useState<'json' | 'csv' | 'yaml'>('json');
  const [targetFormat, setTargetFormat] = useState<'csv' | 'json' | 'yaml' | 'xml' | 'sql' | 'pdf'>('csv');
  const [inputData, setInputData] = useState(`[
  { "id": 1, "name": "Sarah Connor", "role": "Engineer", "active": true, "score": 98.5 },
  { "id": 2, "name": "John Matrix", "role": "Commander", "active": false, "score": 88.0 },
  { "id": 3, "name": "Ellen Ripley", "role": "Officer", "active": true, "score": 95.2 }
]`);
  const [outputData, setOutputData] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSample = (type: 'json' | 'csv' | 'yaml') => {
    setError(null);
    if (type === 'json') {
      setSourceFormat('json');
      setTargetFormat('csv');
      setInputData(`[
  { "id": 1, "product": "Pro Microphone", "category": "Audio", "price": 149.99, "stock": 42 },
  { "id": 2, "product": "4K Webcam", "category": "Video", "price": 89.50, "stock": 18 },
  { "id": 3, "product": "Studio Headphones", "category": "Audio", "price": 199.00, "stock": 65 }
]`);
    } else if (type === 'csv') {
      setSourceFormat('csv');
      setTargetFormat('json');
      setInputData(`city,country,population,founded
Tokyo,Japan,37400000,1603
New York,USA,8336000,1624
London,UK,8982000,43
Sydney,Australia,5312000,1788`);
    } else if (type === 'yaml') {
      setSourceFormat('yaml');
      setTargetFormat('json');
      setInputData(`server:
  port: 8080
  host: "0.0.0.0"
database:
  name: "app_db"
  poolSize: 10
features:
  analytics: true
  caching: false`);
    }
  };

  const handleConvert = () => {
    setError(null);
    try {
      let intermediateJson: any;

      // Step 1: Parse source to JS Object
      if (sourceFormat === 'json') {
        intermediateJson = JSON.parse(inputData);
      } else if (sourceFormat === 'csv') {
        intermediateJson = csvToJson(inputData, ',');
      } else if (sourceFormat === 'yaml') {
        intermediateJson = yamlToJson(inputData);
      }

      // Step 2: Transform to target
      let result = '';
      if (targetFormat === 'json') {
        result = JSON.stringify(intermediateJson, null, 2);
      } else if (targetFormat === 'csv') {
        result = jsonToCsv(intermediateJson, ',');
      } else if (targetFormat === 'yaml') {
        result = jsonToYaml(intermediateJson);
      } else if (targetFormat === 'xml') {
        result = jsonToXml(intermediateJson, 'dataset');
      } else if (targetFormat === 'sql') {
        const records = Array.isArray(intermediateJson) ? intermediateJson : [intermediateJson];
        result = toSqlInsert(records, 'records');
      } else if (targetFormat === 'pdf') {
        const text = typeof intermediateJson === 'string' ? intermediateJson : JSON.stringify(intermediateJson, null, 2);
        const pdfBlob = textToPdfBlob(text, 'Data_Export.pdf');
        downloadBlob(pdfBlob, 'Data_Export.pdf');
        setOutputData('PDF Generated and downloaded to your device!');
        return;
      }

      setOutputData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to convert data structure');
    }
  };

  const handleCopy = () => {
    if (outputData) {
      navigator.clipboard.writeText(outputData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (outputData) {
      const mimeMap: Record<string, string> = {
        csv: 'text/csv',
        json: 'application/json',
        yaml: 'text/yaml',
        xml: 'application/xml',
        sql: 'application/sql',
      };
      const blob = new Blob([outputData], { type: mimeMap[targetFormat] || 'text/plain' });
      downloadBlob(blob, `converted-data.${targetFormat}`);
    }
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5 text-indigo-400" />
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Data & Schema Studio
            </h2>
          </div>
          <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
            Instant live bidirectional conversions between JSON, CSV, YAML, XML, and SQL. Fast, client-side, zero server latency.
          </p>
        </div>

        {/* Preset Samples */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Presets:</span>
          <button
            onClick={() => loadSample('json')}
            className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            JSON Products
          </button>
          <button
            onClick={() => loadSample('csv')}
            className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            CSV Cities
          </button>
          <button
            onClick={() => loadSample('yaml')}
            className="rounded-lg bg-slate-900 border border-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            YAML Config
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-slate-900 border border-slate-800 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-slate-400">Convert from:</span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
            {(['json', 'csv', 'yaml'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setSourceFormat(fmt)}
                className={`px-3 py-1 text-xs font-semibold uppercase rounded-md transition-colors cursor-pointer ${
                  sourceFormat === fmt ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          <ArrowRight className="h-4 w-4 text-slate-600 hidden sm:block" />

          <span className="text-xs text-slate-400">Into:</span>
          <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800 overflow-x-auto">
            {(['csv', 'json', 'yaml', 'xml', 'sql', 'pdf'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setTargetFormat(fmt)}
                className={`px-3 py-1 text-xs font-semibold uppercase rounded-md transition-colors cursor-pointer ${
                  targetFormat === fmt ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleConvert}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-md hover:bg-indigo-500 active:scale-95 transition-all cursor-pointer"
        >
          <span>Run Transformation</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Editor Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Pane */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
            <span className="font-semibold text-white uppercase font-mono">{sourceFormat} Input</span>
            <span className="text-slate-500 tabular-nums font-mono">{inputData.length} chars</span>
          </div>
          <textarea
            rows={16}
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            className="w-full flex-1 rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Output Pane */}
        <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-5 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 text-xs">
            <span className="font-semibold text-white uppercase font-mono">{targetFormat} Output</span>
            {outputData && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded bg-slate-800 px-2 py-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 rounded bg-indigo-600 px-2 py-1 text-white hover:bg-indigo-500 transition-colors cursor-pointer"
                >
                  <Download className="h-3 w-3" />
                  <span>Save</span>
                </button>
              </div>
            )}
          </div>

          <div className="relative flex-1 min-h-[300px]">
            {error ? (
              <div className="h-full rounded-xl bg-rose-950/20 border border-rose-900/40 p-4 text-xs text-rose-300">
                <p className="font-semibold mb-1">Parsing Error:</p>
                <p>{error}</p>
              </div>
            ) : outputData ? (
              <textarea
                readOnly
                rows={16}
                value={outputData}
                className="w-full h-full rounded-xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-indigo-200 focus:outline-none resize-none leading-relaxed"
              />
            ) : (
              <div className="h-full flex items-center justify-center rounded-xl bg-slate-950/50 border border-slate-800/80 p-8 text-center">
                <p className="text-xs text-slate-500">
                  Click "Run Transformation" to view the converted {targetFormat.toUpperCase()} output here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
