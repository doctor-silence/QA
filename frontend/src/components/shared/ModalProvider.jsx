import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const ModalContext = createContext(null);

const DEFAULT_ALERT_OPTIONS = {
  title: 'Уведомление',
  description: '',
  confirmLabel: 'OK',
  confirmClassName: '',
};

const DEFAULT_CONFIRM_OPTIONS = {
  title: 'Подтвердите действие',
  description: '',
  confirmLabel: 'Подтвердить',
  cancelLabel: 'Отмена',
  confirmClassName: '',
};

export function ModalProvider({ children }) {
  const [activeModal, setActiveModal] = useState(null);
  const queueRef = useRef([]);
  const resolverRef = useRef(null);

  const openNextModal = useCallback(() => {
    if (queueRef.current.length === 0) {
      setActiveModal(null);
      return;
    }

    const nextModal = queueRef.current.shift();
    resolverRef.current = nextModal.resolve;
    setActiveModal(nextModal);
  }, []);

  const enqueueModal = useCallback((modalConfig) => new Promise((resolve) => {
    queueRef.current.push({ ...modalConfig, resolve, id: `${Date.now()}-${Math.random()}` });

    setActiveModal((currentModal) => {
      if (currentModal) {
        return currentModal;
      }

      const nextModal = queueRef.current.shift();
      if (nextModal) {
        resolverRef.current = nextModal.resolve;
      }
      return nextModal || null;
    });
  }), []);

  const resolveModal = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }

    openNextModal();
  }, [openNextModal]);

  const showAlert = useCallback((options) => enqueueModal({
    type: 'alert',
    ...DEFAULT_ALERT_OPTIONS,
    ...(typeof options === 'string' ? { description: options } : options),
  }), [enqueueModal]);

  const showConfirm = useCallback((options) => enqueueModal({
    type: 'confirm',
    ...DEFAULT_CONFIRM_OPTIONS,
    ...(typeof options === 'string' ? { description: options } : options),
  }), [enqueueModal]);

  const value = useMemo(() => ({ showAlert, showConfirm }), [showAlert, showConfirm]);

  return (
    <ModalContext.Provider value={value}>
      {children}
      <Dialog
        open={!!activeModal}
        onOpenChange={(open) => {
          if (!open && activeModal) {
            resolveModal(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeModal?.title}</DialogTitle>
            {activeModal?.description && (
              <DialogDescription className="whitespace-pre-line">
                {activeModal.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            {activeModal?.type === 'confirm' && (
              <Button variant="outline" onClick={() => resolveModal(false)}>
                {activeModal.cancelLabel}
              </Button>
            )}
            <Button className={activeModal?.confirmClassName} onClick={() => resolveModal(true)}>
              {activeModal?.confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);

  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }

  return context;
}