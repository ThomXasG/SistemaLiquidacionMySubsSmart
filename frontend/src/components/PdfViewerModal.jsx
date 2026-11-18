import React from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';

export default function PdfViewerModal({ isOpen, onClose, fileUrl, title }) {
  if (!isOpen || !fileUrl) return null;

  const downloadUrl = fileUrl.startsWith('http') ? fileUrl : fileUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/70 backdrop-blur-md">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">{title || 'Visor de Documento'}</h3>
              <p className="text-xs text-slate-500 font-mono truncate max-w-md">{fileUrl}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar
            </a>
            <a
              href={downloadUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir en pestaña
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 p-2 overflow-hidden flex flex-col">
          <iframe
            src={`${downloadUrl}#toolbar=1`}
            title={title}
            className="w-full h-full rounded-xl border border-slate-300 shadow-inner bg-white"
          />
        </div>
      </div>
    </div>
  );
}

