"use client";

import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  loading = false,
}: ConfirmDialogProps) {
  const footer = (
    <>
      <Button variant="secondary" onClick={onClose} disabled={loading}>
        {cancelText}
      </Button>
      <Button
        variant={variant === "danger" ? "danger" : variant === "warning" ? "primary" : "primary"}
        onClick={onConfirm}
        loading={loading}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" footer={footer}>
      <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
        <div
          style={{
            background: variant === "danger" ? "var(--color-danger-light)" : "var(--color-warning-light)",
            color: variant === "danger" ? "var(--color-danger)" : "var(--color-warning)",
            padding: "0.5rem",
            borderRadius: "0.375rem",
            display: "flex",
            flexShrink: 0,
          }}
        >
          <AlertTriangle size={20} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)", lineHeight: "1.5" }}>
            {description}
          </p>
        </div>
      </div>
    </Modal>
  );
}
