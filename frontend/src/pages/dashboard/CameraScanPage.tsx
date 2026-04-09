import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { problemSolverService } from '@/services/problemSolver';
import { useProblemSolverStore } from '@/stores/useProblemSolverStore';
import { motion } from 'framer-motion';
import {
  Camera,
  X,
  Zap,
  RotateCcw,
  Check,
  FlipHorizontal,
  SunMedium,
} from 'lucide-react';

export function CameraScanPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { createAndSolve } = useProblemSolverStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashOn, setFlashOn] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch {
      // Camera access denied
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const captureImage = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopCamera();
    extractTextFromImage(dataUrl);
  };

  const extractTextFromImage = async (dataUrl: string) => {
    setIsExtracting(true);
    try {
      // Convert dataUrl to file for OCR
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      const text = await problemSolverService.extractFromImage(file);
      setExtractedText(text);
    } catch {
      setExtractedText(t('cameraScan.extractionFailed'));
    } finally {
      setIsExtracting(false);
    }
  };

  const retake = () => {
    setCapturedImage(null);
    setExtractedText(null);
    startCamera();
  };

  const flipCamera = () => {
    stopCamera();
    setFacingMode((f) => (f === 'user' ? 'environment' : 'user'));
  };

  const handleConfirm = async () => {
    if (!extractedText) return;
    const sessionId = await createAndSolve(extractedText);
    if (sessionId) {
      navigate(`/dashboard/problem-solver/solve/${sessionId}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between"
        >
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-500" />
              {t('cameraScan.title')}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('cameraScan.subtitle')}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/problem-solver')}
          >
            <X className="w-5 h-5" />
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border overflow-hidden"
        >
          {/* Camera / Captured Image */}
          <div className="relative aspect-[4/3] bg-black">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {/* Viewfinder overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-[80%] h-[60%] border-2 border-white/40 rounded-xl">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-400 rounded-br-lg" />
                  </div>
                </div>
                {/* Camera controls */}
                <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6">
                  <button
                    onClick={() => setFlashOn(!flashOn)}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <SunMedium className={`w-5 h-5 ${flashOn ? 'text-yellow-400' : ''}`} />
                  </button>
                  <button
                    onClick={captureImage}
                    className="w-16 h-16 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <div className="w-14 h-14 rounded-full border-2 border-gray-400" />
                  </button>
                  <button
                    onClick={flipCamera}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  >
                    <FlipHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full h-full object-contain"
              />
            )}
          </div>
          <canvas ref={canvasRef} className="hidden" />

          {/* OCR Preview */}
          {capturedImage && (
            <div className="p-4 border-t border-border">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                {t('cameraScan.extractedText')}
              </h3>
              {isExtracting ? (
                <div className="flex items-center gap-2 py-4 justify-center text-muted-foreground">
                  <Spinner size="sm" />
                  <span className="text-sm">{t('cameraScan.runningOcr')}</span>
                </div>
              ) : extractedText ? (
                <div className="bg-muted/30 rounded-xl p-3 mb-4">
                  <textarea
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    className="w-full bg-transparent text-sm resize-none focus:outline-none min-h-[80px]"
                  />
                </div>
              ) : null}

              <div className="flex gap-3">
                <Button variant="outline" onClick={retake} className="flex-1">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  {t('cameraScan.retake')}
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!extractedText || isExtracting}
                  className="flex-1"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t('cameraScan.solveThis')}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default CameraScanPage;
