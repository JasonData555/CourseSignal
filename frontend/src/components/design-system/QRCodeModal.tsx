import { useEffect, useRef } from 'react';
import { clsx } from 'clsx';
import { X, Download, Copy } from 'lucide-react';
import { Button } from './Button';
import QRCode from 'qrcode';

interface QRCodeModalProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QRCodeModal({ url, isOpen, onClose }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code when modal opens
  useEffect(() => {
    if (isOpen && canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      }).catch((error) => {
        console.error('Failed to generate QR code:', error);
      });
    }
  }, [isOpen, url]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handleCopyImage = async () => {
    if (canvasRef.current) {
      try {
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
          }
        });
      } catch (error) {
        console.error('Failed to copy image:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-200 z-50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={clsx(
          'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'bg-white rounded-lg shadow-2xl',
          'w-full max-w-md',
          'transition-all duration-300',
          'z-50'
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qrcode-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2
            id="qrcode-modal-title"
            className="text-lg font-semibold text-gray-900"
          >
            QR Code
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <div className="flex justify-center mb-4">
            <canvas
              ref={canvasRef}
              width={256}
              height={256}
              className="border border-gray-200 rounded-lg"
            />
          </div>

          <p className="text-sm text-gray-600 text-center mb-6">
            Scan this QR code to open the tracking link
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={handleDownload}
              fullWidth
            >
              <Download className="w-4 h-4 mr-2" />
              Download PNG
            </Button>
            <Button
              variant="secondary"
              onClick={handleCopyImage}
              fullWidth
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Image
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
