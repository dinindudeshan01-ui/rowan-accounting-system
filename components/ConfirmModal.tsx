'use client';

import React from 'react';

type ConfirmModalProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-sm p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-bold text-rowan-navy uppercase tracking-wide mb-3">{title}</h3>
        <p className="text-[13px] text-gray-600 leading-relaxed mb-5">{message}</p>

        <div className="flex justify-end gap-2">
          <button type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-[12px] font-bold text-gray-600 hover:bg-gray-100 transition disabled:opacity-40"
          >
            {cancelLabel}
          </button>
          <button type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-[12px] font-bold text-white transition disabled:opacity-60 ${
              danger ? 'bg-rowan-red hover:bg-rowan-redDark' : 'bg-rowan-navy hover:bg-rowan-navyLight'
            }`}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
