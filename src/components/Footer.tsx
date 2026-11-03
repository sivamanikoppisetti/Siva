import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950 py-8 mt-20">
      <div className="mx-auto flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Client-Side Privacy: Standard conversions execute locally in your browser sandbox without upload.</span>
        </div>

        <div className="flex items-center gap-4">
          <span>OmniConvert Engine</span>
          <span aria-hidden="true">·</span>
          <span>50+ Formats Supported</span>
          <span aria-hidden="true">·</span>
          <span>Powered by Web APIs & Gemini AI</span>
        </div>
      </div>
    </footer>
  );
};
