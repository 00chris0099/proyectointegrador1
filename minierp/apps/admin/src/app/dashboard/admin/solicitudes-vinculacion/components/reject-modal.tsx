'use client';

import { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => void;
  solicitud: {
    id: number;
    alumno: {
      nombres: string;
      apellidos: string;
    };
  } | null;
  isProcessing: boolean;
}

export default function RejectModal({
  isOpen,
  onClose,
  onConfirm,
  solicitud,
  isProcessing,
}: RejectModalProps) {
  const [motivo, setMotivo] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !solicitud) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!motivo.trim()) {
      setError('El motivo es obligatorio');
      return;
    }
    
    if (motivo.trim().length < 10) {
      setError('El motivo debe tener al menos 10 caracteres');
      return;
    }
    
    onConfirm(motivo.trim());
  };

  const handleClose = () => {
    if (!isProcessing) {
      setMotivo('');
      setError('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={20} className="text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Rechazar Solicitud</h3>
              <p className="text-sm text-gray-500">
                {solicitud.alumno.nombres} {solicitud.alumno.apellidos}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-1 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo del rechazo <span className="text-red-500">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => {
                setMotivo(e.target.value);
                setError('');
              }}
              disabled={isProcessing}
              rows={4}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none disabled:bg-gray-100 disabled:cursor-not-allowed ${
                error ? 'border-red-500' : 'border-gray-200'
              }`}
              placeholder="Describe el motivo del rechazo..."
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isProcessing}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Procesando...
                </>
              ) : (
                'Rechazar Solicitud'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
