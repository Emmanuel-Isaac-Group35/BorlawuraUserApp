import React, { createContext, useContext, useState, useCallback } from 'react';

interface AlertOptions {
  title: string;
  message: string;
  type?: 'error' | 'success' | 'warning' | 'info';
  onConfirm?: () => void;
  confirmLabel?: string;
  showCancel?: boolean;
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
  hideAlert: () => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions | null>(null);

  const showAlert = useCallback((opts: AlertOptions) => {
    setOptions(opts);
    setVisible(true);
  }, []);

  const hideAlert = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert }}>
      {children}
      {visible && options && (
        <ErrorOverlay
          visible={visible}
          title={options.title}
          message={options.message}
          type={options.type || 'error'}
          onConfirm={() => {
            options.onConfirm?.();
            hideAlert();
          }}
          onCancel={hideAlert}
          confirmLabel={options.confirmLabel}
          showCancel={options.showCancel}
        />
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within AlertProvider');
  return context;
};

// Internal Import for ErrorOverlay (Circular but managed by the Provider)
import { ErrorOverlay } from '../components/feature/ErrorOverlay';
