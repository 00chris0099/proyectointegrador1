'use client';

import { useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';

interface ConfirmarObservacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  tramiteIdSeguimiento: string;
  isLoading: boolean;
}

export default function ConfirmarObservacionModal({
  isOpen,
  onClose,
  onConfirm,
  tramiteIdSeguimiento,
  isLoading,
}: ConfirmarObservacionModalProps) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const trimmed = motivo.trim();
    if (trimmed.length < 10) {
      setError('El motivo debe tener al menos 10 caracteres');
      return;
    }
    if (trimmed.length > 500) {
      setError('El motivo no debe exceder los 500 caracteres');
      return;
    }
    setError('');
    onConfirm(trimmed);
  };

  const handleClose = () => {
    if (!isLoading) {
      setMotivo('');
      setError('');
      onClose();
    }
  };

  const handleMotivoChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMotivo(e.target.value);
    if (error) setError('');
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
              <AlertCircle size={22} className="text-orange-500" />
              Observar Trámite
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
              Indica el motivo por el cual el trámite requiere correcciones:
            </p>
            <div className="bg-gray-50 rounded-lg p-2 mb-3">
              <p className="font-mono text-sm font-semibold text-gray-900">
                {tramiteIdSeguimiento}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motivo de observación <span className="text-red-500">*</span>
              </label>
              <textarea
                value={motivo}
                onChange={handleMotivoChange}
                disabled={isLoading}
                placeholder="Ej: Falta el certificado médico adjunto..."
                rows={4}
                className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none disabled:opacity-50 ${
                  error ? 'border-red-300' : 'border-gray-200'
                }`}
              />
              <div className="flex items-center justify-between mt-1">
                {error ? (
                  <p className="text-xs text-red-600">{error}</p>
                ) : (
                  <p className="text-xs text-gray-400">Mínimo 10 caracteres</p>
                )}
                <p className="text-xs text-gray-400">{motivo.length}/500</p>
              </div>
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
              disabled={isLoading || motivo.trim().length < 10}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Observando...
                </>
              ) : (
                'Observar Trámite'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
