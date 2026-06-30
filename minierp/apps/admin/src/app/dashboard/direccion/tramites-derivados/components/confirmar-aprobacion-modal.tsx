'use client';

import { useState } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';

interface ConfirmarAprobacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (comentario: string) => void;
  tramiteIdSeguimiento: string;
  isLoading: boolean;
}

export default function ConfirmarAprobacionModal({
  isOpen,
  onClose,
  onConfirm,
  tramiteIdSeguimiento,
  isLoading,
}: ConfirmarAprobacionModalProps) {
  const [comentario, setComentario] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(comentario.trim() || 'Trámite aprobado y finalizado');
  };

  const handleClose = () => {
    if (!isLoading) {
      setComentario('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={!isLoading ? handleClose : undefined}
        />

        <div className="inline-block w-full max-w-lg p-6 my-8 text-left align-bottom transition-all transform bg-white rounded-xl shadow-xl sm:my-8 sm:align-middle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <CheckCircle size={22} className="text-green-500" />
              Aprobar Trámite
            </h2>
            {!isLoading && (
              <button
                onClick={handleClose}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              ¿Estás seguro de aprobar y finalizar este trámite?
            </p>
            <div className="bg-green-50 rounded-lg p-2 mb-3">
              <p className="font-mono text-sm font-semibold text-green-900">
                {tramiteIdSeguimiento}
              </p>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              El trámite cambiará a estado <span className="font-medium text-green-700">&quot;Finalizado&quot;</span> y el apoderado recibirá una constancia PDF.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentario (opcional)
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                disabled={isLoading}
                placeholder="Agrega un comentario sobre la aprobación..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Aprobando...
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Aprobar y Finalizar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
