import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Eye, 
  AlertCircle, 
  Loader2, 
  X,
  ExternalLink,
  Check,
  Cloud,
  Info
} from 'lucide-react';
import { fetchMedia, uploadMediaFile, deleteMediaFile, MediaItem } from '../lib/api';
import { useAuth } from '../context/AuthContext';

interface PdfUploaderProps {
  storageKey?: string;
  sectionName?: string;
  defaultTitle?: string;
  onPdfUploaded?: (fileUrl: string) => void;
  onPdfRemoved?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const PdfUploader: React.FC<PdfUploaderProps> = ({
  storageKey = 'listening_skill_pdf',
  sectionName = 'Listening Skills',
  defaultTitle = 'My Listening Activity',
  onPdfUploaded,
  onPdfRemoved,
}) => {
  const { isOwner } = useAuth();
  const [pdfData, setPdfData] = useState<MediaItem | null>(() => {
    try {
      const cached = localStorage.getItem(`cached_media_${storageKey}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);
  const [showInlineViewer, setShowInlineViewer] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastReportedPercentRef = useRef<number>(0);

  const updatePdfState = (item: MediaItem | null) => {
    setPdfData(item);
    try {
      if (item) {
        localStorage.setItem(`cached_media_${storageKey}`, JSON.stringify(item));
      } else {
        localStorage.removeItem(`cached_media_${storageKey}`);
      }
    } catch {}
  };

  // Load persistent PDF from cloud database on mount and keep in sync across devices in the background
  useEffect(() => {
    let active = true;

    const loadPersistedPdf = async () => {
      try {
        const item = await fetchMedia(storageKey);
        if (active && item && item.fileUrl) {
          updatePdfState(item);
          onPdfUploaded?.(item.fileUrl);
        }
      } catch (err) {
        // Silent background sync
      }
    };

    loadPersistedPdf();

    // Auto-refresh when tab gains focus or user returns from another device
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadPersistedPdf();
      }
    };
    window.addEventListener('focus', onVisibilityChange);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Periodic sync
    const interval = setInterval(() => {
      loadPersistedPdf();
    }, 15000);

    return () => {
      active = false;
      window.removeEventListener('focus', onVisibilityChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(interval);
    };
  }, [storageKey]);

  const handleFileProcess = async (file: File) => {
    if (!isOwner) {
      setErrorMessage('Action unauthorized. Only the website owner can upload or replace PDF documents.');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setShowDeleteConfirm(false);
    setLastSelectedFile(file);

    if (isUploading) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage('Please select a valid PDF document.');
      return;
    }

    if (file.size > 200 * 1024 * 1024) {
      setErrorMessage('PDF file exceeds the 200MB limit.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    lastReportedPercentRef.current = 0;

    try {
      const savedItem = await uploadMediaFile(
        file, 
        storageKey, 
        {
          title: defaultTitle,
          description: 'Listening activity worksheet and practice reflections.',
          section: sectionName,
          userId: 'Kaviya',
        },
        (percent) => {
          if (Math.abs(percent - lastReportedPercentRef.current) >= 1 || percent === 100) {
            lastReportedPercentRef.current = percent;
            setUploadProgress(percent);
          }
        }
      );

      updatePdfState(savedItem);
      setSuccessMessage('Saved successfully. Synced across all devices.');
      onPdfUploaded?.(savedItem.fileUrl);
      setLastSelectedFile(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('PDF upload error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to upload PDF to cloud storage.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleReplace = () => {
    if (!isOwner) return;
    fileInputRef.current?.click();
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!isOwner) {
      setErrorMessage('Action unauthorized. Only the website owner can delete PDF documents.');
      return;
    }
    try {
      await deleteMediaFile(storageKey);
      updatePdfState(null);
      setShowInlineViewer(false);
      setSuccessMessage('PDF deleted permanently from cloud storage.');
      onPdfRemoved?.();
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to delete PDF:', err);
      setErrorMessage('Failed to delete PDF from cloud storage.');
    }
  };

  const handleViewPdf = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowInlineViewer(!showInlineViewer);
  };

  return (
    <div className="space-y-3 max-w-xl mx-auto w-full" id={`pdf-uploader-${storageKey}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={handleFileChange}
        className="hidden"
        id="pdf-file-input"
        disabled={isUploading}
      />

      {/* Error alert */}
      {errorMessage && (
        <div className="flex items-center justify-between p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            {lastSelectedFile && isOwner && (
              <button
                type="button"
                onClick={() => handleFileProcess(lastSelectedFile)}
                className="px-2 py-0.5 bg-red-100 hover:bg-red-200 text-red-800 rounded font-medium transition-colors cursor-pointer text-xs"
              >
                Retry
              </button>
            )}
            <button 
              onClick={() => setErrorMessage(null)} 
              className="text-red-500 hover:text-red-700 cursor-pointer text-xs"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Success alert */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-medium">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Uploading indicator */}
      {isUploading && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-5 text-center shadow-xs space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#102A43] mx-auto" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {uploadProgress >= 100 ? 'Finalizing PDF...' : `Uploading... ${uploadProgress}%`}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">Streaming PDF to permanent cloud storage & database</p>
          </div>
          <div className="w-full max-w-xs mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-[#102A43] h-1.5 rounded-full transition-all duration-150 ease-out" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Delete confirmation inline box */}
      {showDeleteConfirm && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-red-800 font-semibold">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>Delete confirmation</span>
          </div>
          <p className="text-red-700 text-[11px]">
            Are you sure you want to permanently delete this PDF from cloud storage? This action cannot be undone.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-50 transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors cursor-pointer"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      {/* When NO PDF uploaded */}
      {!pdfData && !isUploading ? (
        isOwner ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border border-dashed rounded-xl p-6 sm:p-7 text-center transition-colors ${
              isDragging
                ? 'border-slate-800 bg-slate-50'
                : 'border-slate-300 bg-slate-50 hover:bg-white hover:border-slate-400'
            }`}
          >
            <div className="max-w-xs mx-auto space-y-2.5">
              <div className="w-10 h-10 mx-auto rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
                <FileText className="w-5 h-5 text-slate-700" />
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  Upload My Listening Activity
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Drag & drop PDF, or{' '}
                  <span className="text-slate-800 font-medium underline">
                    browse file
                  </span>
                </p>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Cloud persistent storage • Accessible on laptop & mobile
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-dashed rounded-xl p-6 sm:p-7 text-center border-slate-200 bg-slate-50/70">
            <div className="max-w-xs mx-auto space-y-2">
              <div className="w-10 h-10 mx-auto rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-700">
                {defaultTitle}
              </h4>
              <p className="text-xs text-slate-500">
                No PDF document attached yet.
              </p>
              <div className="text-[10px] text-slate-400 font-mono pt-1">
                View-Only Mode
              </div>
            </div>
          </div>
        )
      ) : null}

      {/* When PDF exists: Compact card */}
      {pdfData && !isUploading && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3">
          {/* Card Header & Title */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600 flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-1.5">
                  <span>📄</span>
                  <span>{pdfData.title || defaultTitle}</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Listening skill activity / worksheet document
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded">
                <Cloud className="w-2.5 h-2.5" />
                Cloud Synced
              </span>
              <span className="text-[10px] font-mono uppercase bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded">
                PDF
              </span>
            </div>
          </div>

          {/* File Name & Size info */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs space-y-1 font-mono">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-slate-700">File Name:</span>
              <span className="text-slate-900 font-medium truncate max-w-[260px] sm:max-w-xs" title={pdfData.fileName}>
                {pdfData.fileName}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">File Size:</span>
              <span className="text-slate-600">
                {formatFileSize(pdfData.fileSize)}
              </span>
            </div>
            {pdfData.uploadDate && (
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Upload Date:</span>
                <span className="text-slate-600">
                  {pdfData.uploadDate} {pdfData.uploadTime ? `at ${pdfData.uploadTime}` : ''}
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons: [View PDF] [Replace] [Delete] */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              {/* View PDF: Opens directly in a new browser tab with browser's built-in PDF viewer */}
              <a
                href={pdfData.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                id="view-pdf-btn"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#102A43] hover:bg-[#1A365D] transition-colors cursor-pointer shadow-xs"
                title="Open PDF directly in a new tab"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>View PDF</span>
              </a>

              {/* Preview Inline toggle */}
              <button
                type="button"
                onClick={handleViewPdf}
                id="preview-inline-pdf-btn"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                title="Preview PDF on this page"
              >
                <FileText className="w-3 h-3" />
                <span>{showInlineViewer ? 'Hide Preview' : 'Preview'}</span>
              </button>

              {/* Owner-Only: Replace */}
              {isOwner && (
                <button
                  type="button"
                  onClick={handleReplace}
                  id="replace-pdf-btn"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                  title="Replace PDF"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace</span>
                </button>
              )}
            </div>

            {/* Owner-Only: Delete */}
            {isOwner ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                id="delete-pdf-btn"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                title="Delete PDF"
              >
                <Trash2 className="w-3 h-3" />
                <span>Delete</span>
              </button>
            ) : (
              <div className="text-[11px] text-slate-400 font-mono">
                View Only
              </div>
            )}
          </div>
        </div>
      )}

      {/* Built-in PDF Viewer (Displayed when View PDF is clicked) */}
      {showInlineViewer && pdfData && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm animate-in fade-in duration-200">
          <div className="px-4 py-2.5 bg-[#102A43] text-white flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 truncate">
              <FileText className="w-4 h-4 text-white flex-shrink-0" />
              <span className="font-semibold truncate">{pdfData.fileName}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <a
                href={pdfData.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white/15 hover:bg-white/25 text-white transition-colors"
                title="Open in new browser tab"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">New Tab</span>
              </a>
              <button
                onClick={() => setShowInlineViewer(false)}
                className="p-1 rounded text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                title="Close viewer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="w-full h-[520px] bg-slate-100">
            <iframe
              src={`${pdfData.fileUrl}#view=FitH`}
              title="PDF Viewer"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* Metadata Detail Inspector Drawer / Toggle */}
      {pdfData && (
        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3 h-3" />
            <span>{showDetails ? 'Hide file details' : 'View file metadata'}</span>
          </button>

          {showDetails && (
            <div className="mt-2 text-left bg-white border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 shadow-xs font-mono">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">File ID:</span>
                <span className="text-slate-900 font-semibold">{pdfData.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">User Account:</span>
                <span className="text-slate-900">{pdfData.userId || 'Kaviya'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Section:</span>
                <span className="text-slate-900">{pdfData.section || sectionName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Original Name:</span>
                <span className="text-slate-900 truncate max-w-xs">{pdfData.fileName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">File Size:</span>
                <span className="text-slate-900">{formatFileSize(pdfData.fileSize)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Storage URL:</span>
                <span className="text-slate-900 truncate max-w-xs">{pdfData.fileUrl}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Upload Date:</span>
                <span className="text-slate-900">{pdfData.uploadDate || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Upload Status:</span>
                <span className="text-emerald-700 font-semibold">Saved & Synced</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
