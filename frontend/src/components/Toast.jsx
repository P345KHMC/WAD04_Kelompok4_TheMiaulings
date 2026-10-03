import { createContext, useContext, useState } from "react";

// Notifikasi kecil di pojok layar. Pakai: const toast = useToast(); toast("Tersimpan"); toast("Gagal", "error")
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);

  function tampil(pesan, jenis = "ok") {
    setToast({ pesan, jenis });
    setTimeout(() => setToast(null), 4000);
  }

  return (
    <ToastContext.Provider value={tampil}>
      {children}
      {toast && <div className={`toast toast-${toast.jenis}`} role="status">{toast.pesan}</div>}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
