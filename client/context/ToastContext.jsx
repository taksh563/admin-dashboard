import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((current) =>
      current.filter((toast) => toast.id !== id)
    );
  }, []);

  const showToast = useCallback(
    ({
      type = "success",
      message,
      duration = 4000,
    }) => {
      const id = Date.now() + Math.random();

      setToasts((current) => [
        ...current,
        {
          id,
          type,
          message,
        },
      ]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }

      return id;
    },
    [removeToast]
  );

  const success = useCallback(
    (message) =>
      showToast({
        type: "success",
        message,
      }),
    [showToast]
  );

  const error = useCallback(
    (message) =>
      showToast({
        type: "error",
        message,
      }),
    [showToast]
  );

  const warning = useCallback(
    (message) =>
      showToast({
        type: "warning",
        message,
      }),
    [showToast]
  );

  const info = useCallback(
    (message) =>
      showToast({
        type: "info",
        message,
      }),
    [showToast]
  );

  return (
    <ToastContext.Provider
      value={{
        showToast,
        success,
        error,
        warning,
        info,
        removeToast,
      }}
    >
      {children}

      <ToastContainer
        toasts={toasts}
        onClose={removeToast}
      />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  onClose,
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[10000] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

function Toast({ toast, onClose }) {
  const config = {
    success: {
      icon: "✓",
      container:
        "border-green-200 bg-green-50 text-green-800",
      iconBg:
        "bg-green-100 text-green-600",
    },

    error: {
      icon: "!",
      container:
        "border-red-200 bg-red-50 text-red-800",
      iconBg:
        "bg-red-100 text-red-600",
    },

    warning: {
      icon: "!",
      container:
        "border-yellow-200 bg-yellow-50 text-yellow-800",
      iconBg:
        "bg-yellow-100 text-yellow-600",
    },

    info: {
      icon: "i",
      container:
        "border-blue-200 bg-blue-50 text-blue-800",
      iconBg:
        "bg-blue-100 text-blue-600",
    },
  };

  const style =
    config[toast.type] || config.info;

  return (
    <div
      role="alert"
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-lg ${style.container}`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${style.iconBg}`}
      >
        {style.icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-5">
          {toast.message}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onClose(toast.id)}
        className="shrink-0 text-lg leading-none opacity-50 hover:opacity-100"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used inside ToastProvider"
    );
  }

  return context;
}