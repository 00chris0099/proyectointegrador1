'use client';

import { FileText, Image, Download, Trash2, ExternalLink } from 'lucide-react';
import { DocumentoInfo, formatFileSize, deleteDocumento } from '@/lib/api';
import { useState } from 'react';

interface DocumentListProps {
  documentos: DocumentoInfo[];
  tramiteId: string;
  canDelete: boolean;
  onDeleted: () => void;
}

export default function DocumentList({
  documentos,
  tramiteId,
  canDelete,
  onDeleted,
}: DocumentListProps) {
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const getFileIcon = (mimetype: string) => {
    if (mimetype === 'application/pdf') {
      return <FileText size={20} className="text-red-500" />;
    }
    return <Image size={20} className="text-blue-500" />;
  };

  const handleDelete = async (docId: number) => {
    if (!confirm('¿Estás seguro de eliminar este documento?')) return;

    setDeletingId(docId);
    try {
      await deleteDocumento(tramiteId, docId);
      onDeleted();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar documento');
    } finally {
      setDeletingId(null);
    }
  };

  if (documentos.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <FileText size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-sm">No hay documentos adjuntos</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {documentos.map((doc) => (
        <div
          key={doc.id}
          className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            {getFileIcon(doc.tipoMime)}
            <div>
              <p className="text-sm font-medium text-gray-900">{doc.nombreOriginal}</p>
              <p className="text-xs text-gray-500">
                {formatFileSize(doc.pesoBytes)} · {doc.tipoMime.split('/')[1].toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={doc.urlArchivo}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink size={16} />
            </a>
            <a
              href={doc.urlArchivo}
              download={doc.nombreOriginal}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Descargar"
            >
              <Download size={16} />
            </a>
            {canDelete && (
              <button
                onClick={() => handleDelete(doc.id)}
                disabled={deletingId === doc.id}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                title="Eliminar"
              >
                {deletingId === doc.id ? (
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full" />
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
