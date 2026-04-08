import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  FileText,
  File,
  Image,
  Trash2,
  Download,
  Loader2,
  X,
  AlertCircle,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface Document {
  id: string;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface DocumentsTabProps {
  studySetId: string;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/markdown',
  'image/png',
  'image/jpeg',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) {
    return <Image className="w-8 h-8 text-green-500" />;
  }
  if (mimeType === 'application/pdf') {
    return <FileText className="w-8 h-8 text-red-500" />;
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return <FileText className="w-8 h-8 text-blue-500" />;
  }
  if (mimeType === 'text/markdown') {
    return <FileText className="w-8 h-8 text-purple-500" />;
  }
  return <File className="w-8 h-8 text-muted-foreground" />;
}

export function DocumentsTab({ studySetId }: DocumentsTabProps) {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch documents on mount
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get<Document[]>(
        ENDPOINTS.documents.byStudySet(studySetId)
      );
      setDocuments(response.data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setError(t('documentsTab.failedLoad'));
    } finally {
      setIsLoading(false);
    }
  }, [studySetId]);

  // Initial fetch
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setError(null);
      setIsUploading(true);
      setUploadProgress(0);

      const uploadedDocs: Document[] = [];
      const totalFiles = fileArray.length;
      let completedFiles = 0;

      for (const file of fileArray) {
        // Validate file type
        if (!ALLOWED_TYPES.includes(file.type)) {
          setError(t('documentsTab.fileTypeNotAllowed', { name: file.name }));
          continue;
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          setError(t('documentsTab.fileTooLarge', { name: file.name }));
          continue;
        }

        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('studySetId', studySetId);
          formData.append('title', file.name);

          const response = await api.post<Document>(
            ENDPOINTS.documents.upload,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
              onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                  const fileProgress =
                    (progressEvent.loaded / progressEvent.total) * 100;
                  const overallProgress =
                    ((completedFiles + fileProgress / 100) / totalFiles) * 100;
                  setUploadProgress(Math.round(overallProgress));
                }
              },
            }
          );

          uploadedDocs.push(response.data);
          completedFiles++;
        } catch (err) {
          console.error(`Failed to upload ${file.name}:`, err);
          setError(t('documentsTab.failedUpload', { name: file.name }));
        }
      }

      if (uploadedDocs.length > 0) {
        setDocuments((prev) => [...uploadedDocs, ...prev]);
      }

      setIsUploading(false);
      setUploadProgress(0);
    },
    [studySetId]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (e.dataTransfer.files) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.delete(ENDPOINTS.documents.delete(id));
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      setDeleteId(null);
    } catch (err) {
      console.error('Failed to delete document:', err);
      setError(t('documentsTab.failedDelete'));
    }
  }, []);

  const handleDownload = useCallback(async (doc: Document) => {
    try {
      // Get signed download URL
      const response = await api.get<{ url: string }>(
        ENDPOINTS.documents.downloadUrl(doc.id)
      );
      window.open(response.data.url, '_blank');
    } catch (err) {
      console.error('Failed to get download URL:', err);
      // Fallback to direct URL
      window.open(doc.fileUrl, '_blank');
    }
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 text-center transition-all',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/50',
          isUploading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.md,.png,.jpg,.jpeg"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              {t('documentsTab.uploadingProgress', { progress: uploadProgress })}
            </p>
            <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">{t('documentsTab.uploadDocuments')}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {t('documentsTab.dragAndDrop')}
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              {t('documentsTab.chooseFiles')}
            </Button>
            <p className="text-xs text-muted-foreground mt-3">
              {t('documentsTab.supportedFormats')}
            </p>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto hover:opacity-70"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Documents List */}
      {documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>{t('documentsTab.noDocuments')}</p>
          <p className="text-sm">{t('documentsTab.uploadFirst')}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {documents.map((doc) => (
              <motion.div
                key={doc.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-colors"
              >
                <div className="flex-shrink-0">{getFileIcon(doc.mimeType)}</div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{doc.title}</h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>-</span>
                    <span>
                      {new Date(doc.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {(doc.mimeType.startsWith('image/') ||
                    doc.mimeType === 'application/pdf') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewDoc(doc)}
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(doc.id)}
                    title="Delete"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setDeleteId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-semibold mb-2">{t('documentsTab.deleteDocument')}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('documentsTab.deleteDocumentDesc')}
              </p>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDeleteId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(deleteId)}
                >
                  Delete
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setPreviewDoc(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold truncate">{previewDoc.title}</h3>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(previewDoc)}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    {t('documentsTab.download')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(previewDoc.fileUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    {t('documentsTab.open')}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setPreviewDoc(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/30">
                {previewDoc.mimeType.startsWith('image/') ? (
                  <img
                    src={previewDoc.fileUrl}
                    alt={previewDoc.title}
                    className="max-w-full max-h-full object-contain rounded"
                  />
                ) : previewDoc.mimeType === 'application/pdf' ? (
                  <iframe
                    src={previewDoc.fileUrl}
                    className="w-full h-full min-h-[60vh]"
                    title={previewDoc.title}
                  />
                ) : (
                  <div className="text-center py-12">
                    {getFileIcon(previewDoc.mimeType)}
                    <p className="mt-4 text-muted-foreground">
                      {t('documentsTab.previewNotAvailable')}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => handleDownload(previewDoc)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {t('documentsTab.downloadToView')}
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
