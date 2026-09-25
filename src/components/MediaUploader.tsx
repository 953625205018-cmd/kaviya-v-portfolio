import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Trash2, 
  RefreshCw, 
  Play, 
  Pause, 
  AlertCircle, 
  Check, 
  FileAudio,
  Video,
  Volume2,
  Loader2,
  Cloud,
  Pencil,
  Image as ImageIcon,
  Info,
  Calendar,
  Clock,
  User,
  Layers
} from 'lucide-react';
import { MediaRecord } from '../types';
import { fetchMedia, uploadMediaFile, updateMediaMetadata, deleteMediaFile, MediaItem } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export type StudioTheme = 
  | 'default'
  | 'presentation-stage'
  | 'podcast-studio'
  | 'listening-practice'
  | 'video-resume-studio'
  | 'interview-room';

export type AcceptedTypes = 'video' | 'audio' | 'image' | 'both' | 'video-or-image' | 'all';

interface MediaUploaderProps {
  storageKey: string;
  acceptedTypes: AcceptedTypes;
  uploadTitle: string;
  sectionName?: string;
  defaultTitle?: string;
  defaultDescription?: string;
  badgeLabel?: string;
  sampleVideoUrl?: string;
  sampleAudioUrl?: string;
  sampleImageUrl?: string;
  studioTheme?: StudioTheme;
  onMediaChanged?: (media: MediaRecord | null) => void;
}

function formatBytes(bytes?: number): string {
  if (!bytes || isNaN(bytes)) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const MediaUploader: React.FC<MediaUploaderProps> = ({
  storageKey,
  acceptedTypes,
  uploadTitle,
  sectionName = 'General',
  defaultTitle = '',
  defaultDescription = '',
  badgeLabel = 'Media',
  sampleVideoUrl,
  sampleAudioUrl,
  sampleImageUrl,
  studioTheme = 'default',
  onMediaChanged,
}) => {
  const { isOwner } = useAuth();
  const [media, setMedia] = useState<MediaRecord | null>(() => {
    try {
      const cached = localStorage.getItem(`cached_media_rec_${storageKey}`);
      if (cached) return JSON.parse(cached);
    } catch {}

    // Immediate fallback sample if available so the card renders instantaneously on click
    let fallbackUrl: string | undefined;
    let fallbackType: 'video' | 'audio' | 'image' = 'video';
    if (acceptedTypes === 'audio') {
      fallbackUrl = sampleAudioUrl;
      fallbackType = 'audio';
    } else if (acceptedTypes === 'image') {
      fallbackUrl = sampleImageUrl;
      fallbackType = 'image';
    } else {
      fallbackUrl = sampleVideoUrl || sampleAudioUrl || sampleImageUrl;
      fallbackType = sampleVideoUrl ? 'video' : sampleAudioUrl ? 'audio' : 'image';
    }

    if (fallbackUrl) {
      return {
        id: storageKey,
        type: fallbackType,
        title: defaultTitle || 'Sample Recording',
        description: defaultDescription,
        fileName: `sample_${fallbackType}`,
        mediaBlobUrl: fallbackUrl,
        fileUrl: fallbackUrl,
        isSample: true,
        userId: 'Kaviya',
        section: sectionName,
        uploadStatus: 'saved',
      };
    }
    return null;
  });
  const [rawMetadata, setRawMetadata] = useState<MediaItem | null>(() => {
    try {
      const cached = localStorage.getItem(`cached_media_raw_${storageKey}`);
      if (cached) return JSON.parse(cached);
    } catch {}
    return null;
  });
  const [title, setTitle] = useState(() => {
    try {
      const cached = localStorage.getItem(`cached_media_rec_${storageKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.title) return parsed.title;
      }
    } catch {}
    return defaultTitle;
  });
  const [description, setDescription] = useState(() => {
    try {
      const cached = localStorage.getItem(`cached_media_rec_${storageKey}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.description) return parsed.description;
      }
    } catch {}
    return defaultDescription;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [lastSelectedFile, setLastSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMetadataDetails, setShowMetadataDetails] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const lastReportedPercentRef = useRef<number>(0);

  const handleToggleEdit = () => {
    setIsEditing((prev) => {
      const next = !prev;
      if (next) {
        setTimeout(() => {
          titleInputRef.current?.focus();
        }, 50);
      }
      return next;
    });
  };

  // Load existing persistent media from cloud database in the background without blocking the UI
  useEffect(() => {
    let active = true;

    const loadPersistedMedia = async () => {
      try {
        const cloudItem: MediaItem | null = await fetchMedia(storageKey);

        if (active) {
          if (cloudItem && cloudItem.fileUrl) {
            setRawMetadata(cloudItem);
            const loadedRecord: MediaRecord = {
              id: cloudItem.id || storageKey,
              type: cloudItem.mediaType === 'image' ? 'image' : cloudItem.mediaType === 'audio' ? 'audio' : 'video',
              title: cloudItem.title || defaultTitle || 'Uploaded Media',
              description: cloudItem.description || defaultDescription,
              fileName: cloudItem.fileName || 'uploaded-file',
              fileSize: cloudItem.fileSize,
              fileType: cloudItem.mimeType,
              mediaBlobUrl: cloudItem.fileUrl,
              fileUrl: cloudItem.fileUrl,
              isSample: false,
              userId: cloudItem.userId || 'Kaviya',
              section: cloudItem.section || sectionName,
              uploadDate: cloudItem.uploadDate,
              uploadTime: cloudItem.uploadTime,
              uploadStatus: 'saved',
            };
            setMedia((prev) => {
              if (prev?.fileUrl !== loadedRecord.fileUrl || prev?.fileName !== loadedRecord.fileName || prev?.isSample) {
                return loadedRecord;
              }
              return prev;
            });
            try {
              localStorage.setItem(`cached_media_rec_${storageKey}`, JSON.stringify(loadedRecord));
              if (cloudItem) localStorage.setItem(`cached_media_raw_${storageKey}`, JSON.stringify(cloudItem));
            } catch {}
            setTitle((prev) => prev || loadedRecord.title);
            if (loadedRecord.description) {
              setDescription((prev) => prev || loadedRecord.description);
            }
            onMediaChanged?.(loadedRecord);
          } else {
            // Fallback to sample if provided
            let fallbackUrl: string | undefined;
            let fallbackType: 'video' | 'audio' | 'image' = 'video';

            if (acceptedTypes === 'audio') {
              fallbackUrl = sampleAudioUrl;
              fallbackType = 'audio';
            } else if (acceptedTypes === 'image') {
              fallbackUrl = sampleImageUrl;
              fallbackType = 'image';
            } else {
              fallbackUrl = sampleVideoUrl || sampleAudioUrl || sampleImageUrl;
              fallbackType = sampleVideoUrl ? 'video' : sampleAudioUrl ? 'audio' : 'image';
            }

            if (fallbackUrl) {
              const loadedRecord: MediaRecord = {
                id: storageKey,
                type: fallbackType,
                title: defaultTitle || 'Sample Recording',
                description: defaultDescription,
                fileName: `sample_${fallbackType}`,
                mediaBlobUrl: fallbackUrl,
                fileUrl: fallbackUrl,
                isSample: true,
                userId: 'Kaviya',
                section: sectionName,
                uploadStatus: 'saved',
              };
              setMedia((prev) => (!prev ? loadedRecord : prev));
              setTitle((prev) => prev || loadedRecord.title);
              if (loadedRecord.description) {
                setDescription((prev) => prev || loadedRecord.description);
              }
              onMediaChanged?.(loadedRecord);
            } else {
              setMedia((prev) => (prev?.isSample ? null : prev));
            }
          }
        }
      } catch (err) {
        // Silent background sync
      }
    };

    loadPersistedMedia();

    // Auto-refresh when tab gains focus or user returns from another device
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadPersistedMedia();
      }
    };
    window.addEventListener('focus', onVisibilityChange);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Periodic background sync every 15s to automatically reflect uploads from another device
    const interval = setInterval(() => {
      loadPersistedMedia();
    }, 15000);

    return () => {
      active = false;
      window.removeEventListener('focus', onVisibilityChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(interval);
    };
  }, [storageKey, acceptedTypes, defaultTitle, defaultDescription, sampleVideoUrl, sampleAudioUrl, sampleImageUrl, sectionName]);

  const getAcceptedExtensions = () => {
    switch (acceptedTypes) {
      case 'video':
        return 'video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov';
      case 'audio':
        return 'audio/mp3,audio/wav,audio/ogg,audio/m4a,audio/aac,.mp3,.wav,.ogg,.m4a,.aac';
      case 'image':
        return 'image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif';
      case 'video-or-image':
        return 'video/mp4,video/webm,video/ogg,video/quicktime,image/jpeg,image/png,image/webp,image/gif,.mp4,.webm,.mov,.jpg,.jpeg,.png,.webp';
      case 'both':
        return 'video/mp4,video/webm,video/ogg,video/quicktime,audio/mp3,audio/wav,audio/ogg,audio/m4a,.mp4,.webm,.mov,.mp3,.wav,.ogg,.m4a';
      case 'all':
      default:
        return 'video/mp4,video/webm,video/ogg,video/quicktime,audio/mp3,audio/wav,audio/ogg,audio/m4a,image/jpeg,image/png,image/webp,.mp4,.webm,.mov,.mp3,.wav,.jpg,.jpeg,.png';
    }
  };

  const handleFileProcess = async (file: File) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowDeleteConfirm(false);
    setLastSelectedFile(file);

    // Prevent duplicate uploads while another upload is actively running
    if (isUploading) return;

    if (!isOwner) {
      setErrorMessage('Access Denied: Only the portfolio owner can upload or replace files.');
      return;
    }

    const isVideo = file.type.startsWith('video') || ['.mp4', '.webm', '.mov', '.ogg'].some(ext => file.name.toLowerCase().endsWith(ext));
    const isAudio = file.type.startsWith('audio') || ['.mp3', '.wav', '.ogg', '.m4a', '.aac'].some(ext => file.name.toLowerCase().endsWith(ext));
    const isImage = file.type.startsWith('image') || ['.jpg', '.jpeg', '.png', '.webp', '.gif'].some(ext => file.name.toLowerCase().endsWith(ext));

    if (acceptedTypes === 'video' && !isVideo) {
      setErrorMessage('Please upload a valid video file (MP4, WebM, MOV).');
      return;
    }
    if (acceptedTypes === 'audio' && !isAudio) {
      setErrorMessage('Please upload a valid audio file (MP3, WAV, OGG, M4A).');
      return;
    }
    if (acceptedTypes === 'image' && !isImage) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }
    if (acceptedTypes === 'video-or-image' && !isVideo && !isImage) {
      setErrorMessage('Please upload a valid photo (JPG, PNG) or video (MP4, WebM, MOV).');
      return;
    }
    if (acceptedTypes === 'both' && !isVideo && !isAudio) {
      setErrorMessage('Please upload a valid video or audio file.');
      return;
    }

    if (file.size > 1024 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 1GB limit.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    lastReportedPercentRef.current = 0;

    try {
      const uploadTitleToUse = title.trim() || file.name.replace(/\.[^/.]+$/, '');
      const savedItem = await uploadMediaFile(
        file, 
        storageKey, 
        {
          title: uploadTitleToUse,
          description: description || defaultDescription,
          section: sectionName,
          userId: 'Kaviya',
        },
        (percent) => {
          // Prevent unnecessary re-rendering during upload: throttle by >= 1% change or 100%
          if (Math.abs(percent - lastReportedPercentRef.current) >= 1 || percent === 100) {
            lastReportedPercentRef.current = percent;
            setUploadProgress(percent);
          }
        }
      );

      setRawMetadata(savedItem);
      const actualType: 'video' | 'audio' | 'image' = 
        savedItem.mediaType === 'image' ? 'image' : savedItem.mediaType === 'audio' ? 'audio' : 'video';

      const newRecord: MediaRecord = {
        id: savedItem.id || storageKey,
        type: actualType,
        title: savedItem.title,
        description: savedItem.description,
        fileName: savedItem.fileName,
        fileSize: savedItem.fileSize,
        fileType: savedItem.mimeType,
        mediaBlobUrl: savedItem.fileUrl,
        fileUrl: savedItem.fileUrl,
        isSample: false,
        userId: savedItem.userId || 'Kaviya',
        section: savedItem.section || sectionName,
        uploadDate: savedItem.uploadDate,
        uploadTime: savedItem.uploadTime,
        uploadStatus: 'saved',
      };

      setMedia(newRecord);
      try {
        localStorage.setItem(`cached_media_rec_${storageKey}`, JSON.stringify(newRecord));
        localStorage.setItem(`cached_media_raw_${storageKey}`, JSON.stringify(savedItem));
      } catch {}
      setTitle(newRecord.title);
      setSuccessMessage('Saved successfully. Synced across all devices.');
      onMediaChanged?.(newRecord);
      setLastSelectedFile(null);
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMessage(err instanceof Error ? err.message : 'An error occurred while uploading to cloud storage.');
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const confirmDelete = async () => {
    setShowDeleteConfirm(false);
    if (!isOwner) {
      setErrorMessage('Access Denied: Only the portfolio owner can delete files.');
      return;
    }
    try {
      await deleteMediaFile(storageKey);
      setMedia(null);
      setRawMetadata(null);
      try {
        localStorage.removeItem(`cached_media_rec_${storageKey}`);
        localStorage.removeItem(`cached_media_raw_${storageKey}`);
      } catch {}
      setSuccessMessage('Media deleted permanently from cloud storage.');
      onMediaChanged?.(null);
      setIsPlaying(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error(err);
      setErrorMessage('Could not delete the file from cloud storage.');
    }
  };

  const handleTitleChange = async (newTitle: string) => {
    if (!isOwner) return;
    setTitle(newTitle);
    if (!media) return;
    const updated = { ...media, title: newTitle };
    setMedia(updated);
    if (!media.isSample) {
      try {
        await updateMediaMetadata(storageKey, { title: newTitle });
      } catch (e) {
        console.warn('Failed to update title in cloud DB:', e);
      }
    }
  };

  const handleDescriptionChange = async (newDesc: string) => {
    if (!isOwner) return;
    setDescription(newDesc);
    if (!media) return;
    const updated = { ...media, description: newDesc };
    setMedia(updated);
    if (!media.isSample) {
      try {
        await updateMediaMetadata(storageKey, { description: newDesc });
      } catch (e) {
        console.warn('Failed to update description in cloud DB:', e);
      }
    }
  };

  const togglePlay = () => {
    if (media?.type === 'video' && videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    } else if (media?.type === 'audio' && audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
    }
  };

  const isVideoOrImage = acceptedTypes === 'video' || acceptedTypes === 'video-or-image' || acceptedTypes === 'image';

  return (
    <div className={`space-y-3 ${isVideoOrImage ? 'max-w-[550px] mx-auto w-full' : 'max-w-xl mx-auto w-full'}`} id={`media-uploader-${storageKey}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={getAcceptedExtensions()}
        onChange={handleFileSelect}
        className="hidden"
        id={`file-input-${storageKey}`}
        disabled={isUploading}
      />

      {/* Uploading progress notification */}
      {isUploading && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/90 p-5 text-center shadow-xs space-y-2.5">
          <Loader2 className="w-6 h-6 animate-spin text-[#102A43] mx-auto" />
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {uploadProgress >= 100 ? 'Finalizing upload...' : `Uploading... ${uploadProgress}%`}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">
              {uploadProgress >= 100 
                ? 'Saving to cloud database and generating playback link' 
                : 'Fast streaming upload to permanent cloud storage'}
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-full max-w-xs mx-auto bg-slate-200 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-[#102A43] h-1.5 rounded-full transition-all duration-150 ease-out" 
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Notifications */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <div className="flex items-center gap-2">
            {lastSelectedFile && isOwner && (
              <button
                type="button"
                onClick={() => handleFileProcess(lastSelectedFile)}
                className="px-2.5 py-0.5 bg-red-100 hover:bg-red-200 text-red-800 rounded font-medium transition-colors cursor-pointer text-xs"
              >
                Retry
              </button>
            )}
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-700 text-xs cursor-pointer">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Delete confirmation inline dialog */}
      {showDeleteConfirm && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center gap-2 text-red-800 font-semibold">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>Delete confirmation</span>
          </div>
          <p className="text-red-700 text-[11px]">
            Are you sure you want to permanently delete this uploaded file from cloud storage? This action cannot be undone.
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

      {/* Upload Zone (shown when no media exists and not uploading) */}
      {!media && !isUploading ? (
        isOwner ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border border-dashed rounded-xl ${
              acceptedTypes === 'video' ? 'p-5 sm:p-6' : 'p-6 sm:p-7'
            } text-center transition-colors ${
              isDragging 
                ? 'border-slate-800 bg-slate-50' 
                : 'border-slate-300 bg-slate-50 hover:bg-white hover:border-slate-400'
            }`}
          >
            <div className="max-w-xs mx-auto space-y-2.5">
              <div className="w-10 h-10 mx-auto rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
                {acceptedTypes === 'audio' ? (
                  <Volume2 className="w-5 h-5 text-slate-700" />
                ) : acceptedTypes === 'image' ? (
                  <ImageIcon className="w-5 h-5 text-slate-700" />
                ) : acceptedTypes === 'video' ? (
                  <Video className="w-5 h-5 text-slate-700" />
                ) : (
                  <Upload className="w-5 h-5 text-slate-700" />
                )}
              </div>

              <div>
                <h4 className="text-sm font-semibold text-slate-900">
                  {uploadTitle}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Drag & drop, or{' '}
                  <span className="text-slate-800 font-medium underline">
                    browse file
                  </span>
                </p>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Cloud permanent storage • Accessible on laptop & mobile
              </div>
            </div>
          </div>
        ) : (
          <div
            className={`border border-dashed rounded-xl ${
              acceptedTypes === 'video' ? 'p-5 sm:p-6' : 'p-6 sm:p-7'
            } text-center border-slate-200 bg-slate-50/70`}
          >
            <div className="max-w-xs mx-auto space-y-2">
              <div className="w-10 h-10 mx-auto rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
                {acceptedTypes === 'audio' ? (
                  <Volume2 className="w-5 h-5" />
                ) : acceptedTypes === 'image' ? (
                  <ImageIcon className="w-5 h-5" />
                ) : acceptedTypes === 'video' ? (
                  <Video className="w-5 h-5" />
                ) : (
                  <Upload className="w-5 h-5" />
                )}
              </div>
              <h4 className="text-sm font-semibold text-slate-700">
                {uploadTitle}
              </h4>
              <p className="text-xs text-slate-500">
                No presentation media attached yet.
              </p>
              <div className="text-[10px] text-slate-400 font-mono pt-1">
                View-Only Mode
              </div>
            </div>
          </div>
        )
      ) : media && !isUploading && media.type === 'image' ? (
        /* Image Card */
        <div className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200">
          <div className="w-full max-h-[320px] bg-slate-950 flex items-center justify-center overflow-hidden">
            <img
              src={media.fileUrl || media.mediaBlobUrl}
              alt={media.title || 'Uploaded image'}
              className="max-h-[320px] w-full object-contain"
            />
          </div>

          <div className="p-3.5 sm:p-4 space-y-2.5 bg-white">
            {/* Title & Description */}
            {isOwner ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Title
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isEditing ? 'Auto-saves to cloud' : 'Click to edit'}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={title}
                      onFocus={() => setIsEditing(true)}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter title..."
                      className={`w-full text-sm font-semibold text-slate-900 rounded-lg px-3 py-1.5 pr-8 focus:outline-none transition-all ${
                        isEditing
                          ? 'border border-[#102A43] ring-1 ring-[#102A43] bg-white'
                          : 'border border-slate-300 hover:border-slate-400 bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleToggleEdit}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Description
                    </label>
                  </div>
                  <textarea
                    value={description}
                    onFocus={() => setIsEditing(true)}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    rows={2}
                    placeholder="Add a short description..."
                    className={`w-full text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none transition-all resize-none ${
                      isEditing
                        ? 'border border-[#102A43] ring-1 ring-[#102A43] bg-white'
                        : 'border border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {title || defaultTitle || 'Uploaded Image'}
                </h4>
                {(description || defaultDescription) && (
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {description || defaultDescription}
                  </p>
                )}
              </div>
            )}

            {/* Metadata Preview Pill */}
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 font-mono">
              <span className="truncate max-w-[200px]" title={media.fileName}>
                📁 {media.fileName || 'Image file'}
              </span>
              <span>{formatBytes(media.fileSize)}</span>
              {media.uploadDate && <span>📅 {media.uploadDate}</span>}
            </div>

            {/* Actions: [Edit] [Replace] [Delete] */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {isOwner ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleEdit}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      isEditing
                        ? 'bg-[#102A43] text-white hover:bg-[#1A365D] border border-[#102A43]'
                        : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300'
                    }`}
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{isEditing ? 'Done' : 'Edit'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Replace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 font-mono">
                  View Only
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                  <Cloud className="w-2.5 h-2.5" />
                  Cloud Synced
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {badgeLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : media && !isUploading && media.type === 'video' ? (
        /* Video Card */
        <div className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200">
          <div className="w-full h-[280px] sm:h-[300px] max-h-[320px] bg-black flex items-center justify-center overflow-hidden">
            <video
              ref={videoRef}
              src={media.fileUrl || media.mediaBlobUrl}
              controls
              playsInline
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              className="w-full h-full object-contain"
            >
              Your browser does not support HTML5 video playback.
            </video>
          </div>

          <div className="p-3.5 sm:p-4 space-y-2.5 bg-white">
            {/* Talk Title & Description */}
            {isOwner ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Title
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isEditing ? 'Auto-saves to cloud' : 'Click to edit'}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={title}
                      onFocus={() => setIsEditing(true)}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Enter title..."
                      className={`w-full text-sm font-semibold text-slate-900 rounded-lg px-3 py-1.5 pr-8 focus:outline-none transition-all ${
                        isEditing
                          ? 'border border-[#102A43] ring-1 ring-[#102A43] bg-white'
                          : 'border border-slate-300 hover:border-slate-400 bg-white'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={handleToggleEdit}
                      className="absolute right-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Description
                    </label>
                  </div>
                  <textarea
                    value={description}
                    onFocus={() => setIsEditing(true)}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                    rows={2}
                    placeholder="Add a short description..."
                    className={`w-full text-xs text-slate-700 rounded-lg px-3 py-1.5 focus:outline-none transition-all resize-none ${
                      isEditing
                        ? 'border border-[#102A43] ring-1 ring-[#102A43] bg-white'
                        : 'border border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900 leading-snug">
                  {title || defaultTitle || 'Presentation Video'}
                </h4>
                {(description || defaultDescription) && (
                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                    {description || defaultDescription}
                  </p>
                )}
              </div>
            )}

            {/* Metadata bar */}
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 font-mono">
              <span className="truncate max-w-[200px]" title={media.fileName}>
                📁 {media.fileName || 'Video file'}
              </span>
              <span>{formatBytes(media.fileSize)}</span>
              {media.uploadDate && <span>📅 {media.uploadDate}</span>}
            </div>

            {/* Actions: [Edit] [Replace] [Delete] */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              {isOwner ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleEdit}
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                      isEditing
                        ? 'bg-[#102A43] text-white hover:bg-[#1A365D] border border-[#102A43]'
                        : 'text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300'
                    }`}
                  >
                    <Pencil className="w-3 h-3" />
                    <span>{isEditing ? 'Done' : 'Edit'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Replace</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400 font-mono">
                  View Only
                </div>
              )}

              <div className="flex items-center gap-1.5">
                {!media.isSample && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                    <Cloud className="w-2.5 h-2.5" />
                    Cloud Synced
                  </span>
                )}
                <span className="text-[10px] font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                  {badgeLabel}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : media && !isUploading ? (
        /* Audio Player Showcase */
        <div className="rounded-xl overflow-hidden shadow-xs bg-white border border-slate-200">
          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-white text-slate-700 border border-slate-200">
                {badgeLabel}
              </span>
              <span className="text-xs text-slate-600 font-mono truncate max-w-xs">
                {media.fileName || 'Attached audio'}
              </span>
              {!media.isSample && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded">
                  <Cloud className="w-2.5 h-2.5" />
                  Cloud Synced
                </span>
              )}
            </div>

            {isOwner && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleEdit}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                    isEditing
                      ? 'bg-[#102A43] text-white hover:bg-[#1A365D] border border-[#102A43]'
                      : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-300'
                  }`}
                >
                  <Pencil className="w-3 h-3" />
                  <span>{isEditing ? 'Done' : 'Edit'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-red-600 bg-white hover:bg-red-50 border border-red-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>

          <div className="bg-slate-50 flex items-center justify-center p-6">
            <div className="w-full max-w-md flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 mb-3">
                <FileAudio className="w-6 h-6" />
              </div>
              <audio
                ref={audioRef}
                src={media.fileUrl || media.mediaBlobUrl}
                controls
                preload="metadata"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                className="w-full"
              >
                Your browser does not support audio playback.
              </audio>
            </div>
          </div>

          {/* Title & Description bar */}
          <div className="p-4 bg-white border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#102A43] hover:bg-[#1A365D] text-white text-xs font-medium transition-colors cursor-pointer flex-shrink-0"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
              
              {isOwner ? (
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    value={title}
                    onFocus={() => setIsEditing(true)}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Enter title..."
                    className={`w-full text-sm font-medium text-slate-900 rounded-lg px-3 py-1.5 pr-8 focus:outline-none transition-all ${
                      isEditing
                        ? 'border border-[#102A43] ring-1 ring-[#102A43] bg-white'
                        : 'border border-slate-300 hover:border-slate-400 bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleToggleEdit}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">
                    {title || defaultTitle || 'Attached Audio Track'}
                  </h4>
                </div>
              )}
            </div>

            {/* Metadata bar */}
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2 font-mono">
              <span className="truncate max-w-[200px]" title={media.fileName}>
                📁 {media.fileName || 'Audio file'}
              </span>
              <span>{formatBytes(media.fileSize)}</span>
              {media.uploadDate && <span>📅 {media.uploadDate}</span>}
            </div>
          </div>
        </div>
      ) : null}

      {/* Metadata Detail Inspector Drawer / Toggle */}
      {media && !media.isSample && (
        <div className="text-right">
          <button
            type="button"
            onClick={() => setShowMetadataDetails(!showMetadataDetails)}
            className="text-[11px] text-slate-500 hover:text-slate-800 inline-flex items-center gap-1 cursor-pointer"
          >
            <Info className="w-3 h-3" />
            <span>{showMetadataDetails ? 'Hide file details' : 'View file metadata'}</span>
          </button>

          {showMetadataDetails && (
            <div className="mt-2 text-left bg-white border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 shadow-xs font-mono">
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">File ID:</span>
                <span className="text-slate-900 font-semibold">{media.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">User Account:</span>
                <span className="text-slate-900">{media.userId || 'Kaviya'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Section:</span>
                <span className="text-slate-900">{media.section || sectionName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Original Name:</span>
                <span className="text-slate-900 truncate max-w-xs">{media.fileName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">File Size:</span>
                <span className="text-slate-900">{formatBytes(media.fileSize)}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Storage URL:</span>
                <span className="text-slate-900 truncate max-w-xs">{media.fileUrl}</span>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-1">
                <span className="text-slate-500">Upload Date:</span>
                <span className="text-slate-900">{media.uploadDate || 'N/A'}</span>
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
