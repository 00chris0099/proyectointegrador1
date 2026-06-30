'use client';

import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmarDerivacionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  tramiteIdSeguimiento: string;
  isLoading: boolean;
}

export default function ConfirmarDerivacionModal({
  isOpen,
  onClose,
  onConfirm,
  tramiteIdSeguimiento,
  isLoading,
}: ConfirmarDerivacionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={!isLoading ? onClose : undefined}
        />

        <div className="inline-block w-full max-w-md p-6 my-8 text-left align-bottom transition-all transform bg-white rounded-xl shadow-xl sm:my-8 sm:align-middle">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={22} className="text-orange-500" />
              Confirmar Derivación
            </h2>
            {!isLoading && (
              <button
                onClick={onClose}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="mb-6">
            <p className="text-sm text-gray-600 mb-3">
              ¿Estás seguro de derivar el trámite a Dirección?
            </p>
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="font-mono text-sm font-semibold text-blue-900">
                {tramiteIdSeguimiento}
              </p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              El trámite cambiará de estado a <span className="font-medium text-blue-700">&quot;Derivado a Dirección&quot;</span> y será notificado al personal de Dirección.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Derivando...
                </>
              ) : (
                'Derivar a Dirección'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
