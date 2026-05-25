import { useEffect, useCallback } from "react";

/**
 * useSmartImageDrop
 * Enables three image input methods on top of any page:
 *  1. Paste (Ctrl+V) — reads image from clipboard
 *  2. Drag-and-drop anywhere on the window
 *  3. Normal file input (handled separately by the component)
 *
 * @param {Function} onFile — callback(File) called whenever an image is captured
 * @param {boolean} disabled — pause while uploading
 */
const useSmartImageDrop = (onFile, disabled = false) => {
  const handle = useCallback((file) => {
    if (disabled || !file) return;
    if (!file.type.startsWith("image/")) return;
    onFile(file);
  }, [onFile, disabled]);

  useEffect(() => {
    // ── Paste ──
    const onPaste = (e) => {
      if (disabled) return;
      const items = e.clipboardData?.items || [];
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          handle(item.getAsFile());
          break;
        }
      }
    };

    // ── Drag over (prevent browser default open) ──
    const onDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; };

    // ── Drop anywhere ──
    const onDrop = (e) => {
      e.preventDefault();
      if (disabled) return;
      const file = e.dataTransfer.files?.[0];
      handle(file);
    };

    window.addEventListener("paste", onPaste);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, [handle, disabled]);
};

export default useSmartImageDrop;
