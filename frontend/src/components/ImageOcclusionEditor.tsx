import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { OcclusionRegion } from '@/types';
import { Trash2, MousePointer2, Square, RotateCcw, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ImageOcclusionEditorProps {
  imageUrl: string;
  regions: OcclusionRegion[];
  onRegionsChange: (regions: OcclusionRegion[]) => void;
  onImageChange?: (url: string) => void;
}

type Tool = 'draw' | 'select';

let regionIdCounter = 0;

export function ImageOcclusionEditor({ imageUrl, regions, onRegionsChange, onImageChange }: ImageOcclusionEditorProps) {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement>(null);
  const [tool, setTool] = useState<Tool>('draw');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const getRelativePos = useCallback((e: React.MouseEvent<SVGSVGElement>): { x: number; y: number } => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (tool !== 'draw') return;
    const pos = getRelativePos(e);
    setIsDrawing(true);
    setDrawStart(pos);
    setDrawCurrent(pos);
  }, [tool, getRelativePos]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawing) return;
    setDrawCurrent(getRelativePos(e));
  }, [isDrawing, getRelativePos]);

  const handleMouseUp = useCallback(() => {
    if (!isDrawing || !drawStart || !drawCurrent) {
      setIsDrawing(false);
      return;
    }

    const x = Math.min(drawStart.x, drawCurrent.x);
    const y = Math.min(drawStart.y, drawCurrent.y);
    const width = Math.abs(drawCurrent.x - drawStart.x);
    const height = Math.abs(drawCurrent.y - drawStart.y);

    if (width > 2 && height > 2) {
      const newRegion: OcclusionRegion = {
        id: `occ-${++regionIdCounter}-${Date.now()}`,
        x, y, width, height,
        label: `${t('imageOcclusion.region')} ${regions.length + 1}`,
      };
      onRegionsChange([...regions, newRegion]);
      setSelectedId(newRegion.id);
      setEditLabel(newRegion.label || '');
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawCurrent(null);
  }, [isDrawing, drawStart, drawCurrent, regions, onRegionsChange, t]);

  const deleteRegion = useCallback((id: string) => {
    onRegionsChange(regions.filter((r) => r.id !== id));
    if (selectedId === id) setSelectedId(null);
  }, [regions, onRegionsChange, selectedId]);

  const updateLabel = (id: string, label: string) => {
    onRegionsChange(regions.map((r) => r.id === id ? { ...r, label } : r));
  };

  const clearAll = () => {
    onRegionsChange([]);
    setSelectedId(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImageChange) return;
    const reader = new FileReader();
    reader.onload = () => {
      onImageChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId && document.activeElement?.tagName !== 'INPUT') {
          deleteRegion(selectedId);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, deleteRegion]);

  if (!imageUrl) {
    return (
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-green-500/30 hover:bg-green-500/5 transition-all"
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm font-medium">{t('imageOcclusion.uploadImage')}</p>
        <p className="text-xs text-muted-foreground mt-1">{t('imageOcclusion.imageFormats')}</p>
      </div>
    );
  }

  const drawingRect = isDrawing && drawStart && drawCurrent ? {
    x: Math.min(drawStart.x, drawCurrent.x),
    y: Math.min(drawStart.y, drawCurrent.y),
    width: Math.abs(drawCurrent.x - drawStart.x),
    height: Math.abs(drawCurrent.y - drawStart.y),
  } : null;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setTool('draw')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            tool === 'draw' ? 'bg-green-500/10 text-green-600 border border-green-500/30' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <Square className="w-3.5 h-3.5" />
          {t('imageOcclusion.draw')}
        </button>
        <button
          type="button"
          onClick={() => setTool('select')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            tool === 'select' ? 'bg-green-500/10 text-green-600 border border-green-500/30' : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          <MousePointer2 className="w-3.5 h-3.5" />
          {t('imageOcclusion.select')}
        </button>
        <div className="flex-1" />
        {selectedId && (
          <button
            type="button"
            onClick={() => deleteRegion(selectedId)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-500 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {t('imageOcclusion.delete')}
          </button>
        )}
        <button
          type="button"
          onClick={clearAll}
          disabled={regions.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted rounded-lg hover:text-foreground transition-colors disabled:opacity-40"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {t('imageOcclusion.clear')}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted rounded-lg hover:text-foreground transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
      </div>

      {/* Image + SVG overlay */}
      <div className="relative rounded-xl overflow-hidden border border-border bg-black/5">
        <img src={imageUrl} alt="Occlusion base" className="w-full block" draggable={false} />
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: tool === 'draw' ? 'crosshair' : 'default' }}
        >
          {/* Existing regions */}
          {regions.map((r) => (
            <g key={r.id} onClick={(e) => { e.stopPropagation(); setSelectedId(r.id); setEditLabel(r.label || ''); setTool('select'); }}>
              <rect
                x={r.x}
                y={r.y}
                width={r.width}
                height={r.height}
                fill="rgba(34, 197, 94, 0.6)"
                stroke={selectedId === r.id ? '#fff' : 'rgba(34, 197, 94, 0.8)'}
                strokeWidth={selectedId === r.id ? 0.5 : 0.2}
                rx={0.5}
                className="cursor-pointer"
              />
              <text
                x={r.x + r.width / 2}
                y={r.y + r.height / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={Math.min(r.width / 4, r.height / 3, 3)}
                fontWeight="bold"
              >
                ?
              </text>
            </g>
          ))}

          {/* Drawing preview */}
          {drawingRect && (
            <rect
              x={drawingRect.x}
              y={drawingRect.y}
              width={drawingRect.width}
              height={drawingRect.height}
              fill="rgba(34, 197, 94, 0.3)"
              stroke="rgba(34, 197, 94, 0.8)"
              strokeWidth={0.2}
              strokeDasharray="1"
              rx={0.5}
            />
          )}
        </svg>
      </div>

      {/* Selected region label editor */}
      <AnimatePresence>
        {selectedId && tool === 'select' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs text-muted-foreground shrink-0">{t('imageOcclusion.label')}</span>
            <input
              type="text"
              value={editLabel}
              onChange={(e) => { setEditLabel(e.target.value); updateLabel(selectedId, e.target.value); }}
              placeholder={t('imageOcclusion.labelPlaceholder')}
              className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Region count */}
      <p className="text-xs text-muted-foreground">
        {regions.length !== 1 ? t('imageOcclusion.regionCountPlural', { count: regions.length }) : t('imageOcclusion.regionCount', { count: regions.length })}
      </p>
    </div>
  );
}
