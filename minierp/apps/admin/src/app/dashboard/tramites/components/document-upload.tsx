'use client';

import { useState, useRef } from 'react';
import { Upload, X, FileText, Image, Loader2 } from 'lucide-react';

interface DocumentUploadProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export default function DocumentUpload({ onUpload, disabled }: DocumentUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadingIndex, setUploadingIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > 5 * 1024 * 1024) {
      return `El archivo ${file.name} excede el límite de 5MB`;
    }
    if (!['application/pdf', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      return `El archivo ${file.name} no es un formato válido (solo PDF/JPG)`;
    }
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    for (const file of newFiles) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        continue;
      }
      validFiles.push(file);
    }

    setFiles((prev) => [...prev, ...validFiles]);
    setError(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadAll = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        setUploadingIndex(i);
        await onUpload(files[i]);
      }
      setFiles([]);
    } catch (err: any) {
      setError(err.message || 'Error al subir archivos');
    } finally {
      setIsUploading(false);
      setUploadingIndex(-1);
    }
  };

  const getFileIcon = (mimetype: string) => {
    if (mimetype === 'application/pdf') {
      return <FileText size={16} className="text-red-500" />;
    }
    return <Image size={16} className="text-blue-500" />;
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
          disabled
            ? 'border-gray-200 bg-gray-50 cursor-not-allowed'
            : 'border-gray-200 hover:border-blue-400 cursor-pointer'
        }`}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg"
          onChange={handleFileChange}
          className="hidden"
          disabled={disabled}
        />
        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          {disabled ? 'No se pueden agregar documentos' : 'Haz clic para seleccionar archivos'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PDF o JPG, máximo 5MB por archivo</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                uploadingIndex === index
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {getFileIcon(file.type)}
                <span className="text-sm text-gray-700">{file.name}</span>
                <span className="text-xs text-gray-400">({formatSize(file.size)})</span>
                {uploadingIndex === index && (
                  <Loader2 size={14} className="animate-spin text-blue-600" />
                )}
              </div>
              {!isUploading && (
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={handleUploadAll}
            disabled={isUploading || disabled}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Subiendo {uploadingIndex + 1} de {files.length}...
              </>
            ) : (
              <>
                <Upload size={16} />
                Subir {files.length} archivo(s)
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
