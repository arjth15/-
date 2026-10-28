import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Eraser, RotateCcw, PenTool, Check } from 'lucide-react';

interface SignaturePadProps {
  signatureUrl: string;
  onSave: (dataUrl: string) => void;
  onClear: () => void;
  inspectorName?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  signatureUrl,
  onSave,
  onClear,
  inspectorName
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [mode, setMode] = useState<'draw' | 'type'>('draw');

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Handle high DPI on iPad Retina displays
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e293b'; // Slate 800 dark ink
    ctx.lineWidth = 2.5;

    // If signature exists, draw it
    if (signatureUrl && signatureUrl.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasDrawn(true);
      };
      img.src = signatureUrl;
    } else {
      ctx.clearRect(0, 0, rect.width, rect.height);
    }
  }, [signatureUrl]);

  useEffect(() => {
    setupCanvas();
    const handleResize = () => setupCanvas();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setupCanvas]);

  const getCoordinates = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    setIsDrawing(true);
    setHasDrawn(true);

    // Save history for undo
    const dpr = window.devicePixelRatio || 1;
    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => [...prev.slice(-10), snap]);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const coords = getCoordinates(e);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setHistory([]);
    onClear();
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const previousState = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    ctx.putImageData(previousState, 0, 0);

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-emerald-600" />
          <span className="font-semibold text-sm text-slate-800">
            ลายมือชื่อผู้ตรวจ (รองรับ Apple Pencil / สัมผัสหน้าจอ iPad)
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={history.length === 0}
            className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center gap-1 transition"
            title="ย้อนกลับ"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ย้อนกลับ</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg flex items-center gap-1 transition"
            title="ล้างลายเซ็น"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>ล้าง</span>
          </button>
        </div>
      </div>

      <div className="relative border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={draw}
          onPointerUp={stopDrawing}
          onPointerLeave={stopDrawing}
          className="w-full h-32 cursor-crosshair touch-signature"
          style={{ touchAction: 'none' }}
        />
        {!hasDrawn && !signatureUrl && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
            <span className="text-xs">ลงลายมือชื่อที่นี่ ด้วยนิ้วมือ หรือ Apple Pencil</span>
            <span className="text-[11px] text-slate-300 mt-0.5">(Sign here)</span>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
        <span>* หากไม่เซ็น ระบบจะเว้นช่องว่างลายเซ็นแบบเส้นจุดตามแบบฟอร์มเดิม</span>
        {hasDrawn && (
          <span className="text-emerald-600 font-medium flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> บันทึกลายมือชื่อแล้ว
          </span>
        )}
      </div>
    </div>
  );
};
