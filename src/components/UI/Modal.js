import React, { useEffect } from 'react';
import Button from './Button';

function Modal({ 
  isOpen, 
  onClose, 
  title,
  children,
  footer = null,
  size = 'md',
  closeOnOutsideClick = true,
  className = '' 
}) {
  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);
  
  // モーダル外クリックの処理
  const handleOutsideClick = (e) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  // サイズに応じたモーダル幅の設定
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };
  
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
      onClick={handleOutsideClick}
    >
      <div 
        className={`bg-white rounded-lg shadow-xl w-full ${sizeStyles[size]} transform transition-all duration-300 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* モーダルヘッダー */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            onClick={onClose}
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 8.586l3.293-3.293a1 1 0 111.414 1.414L11.414 10l3.293 3.293a1 1 0 01-1.414 1.414L10 11.414l-3.293 3.293a1 1 0 01-1.414-1.414L8.586 10 5.293 6.707a1 1 0 011.414-1.414L10 8.586z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
        
        {/* モーダル本文 */}
        <div className="p-6">
          {children}
        </div>
        
        {/* モーダルフッター */}
        {footer ? (
          <div className="px-6 py-4 bg-gray-50 border-t rounded-b-lg">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// プリセットモーダル：確認ダイアログ
export function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = '確認', 
  message, 
  confirmText = '確認',
  cancelText = 'キャンセル',
  confirmVariant = 'primary',
  size = 'sm'
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <div className="flex justify-end space-x-2">
          <Button 
            variant="light" 
            onClick={onClose}
          >
            {cancelText}
          </Button>
          <Button 
            variant={confirmVariant} 
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </Button>
        </div>
      }
    >
      <p className="text-gray-700">{message}</p>
    </Modal>
  );
}

// プリセットモーダル：アラート
export function AlertModal({ 
  isOpen, 
  onClose, 
  title = '通知', 
  message, 
  buttonText = 'OK',
  variant = 'primary',
  size = 'sm'
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <div className="flex justify-end">
          <Button 
            variant={variant} 
            onClick={onClose}
          >
            {buttonText}
          </Button>
        </div>
      }
    >
      <p className="text-gray-700">{message}</p>
    </Modal>
  );
}

export default Modal;
