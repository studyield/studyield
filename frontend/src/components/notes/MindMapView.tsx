import { useMemo, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import type { Note } from '@/types';
import { cn } from '@/lib/utils';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Target,
  Tag,
  Sparkles,
  X,
  Search,
  Eye,
  ChevronRight,
  ChevronDown,
  FileText,
  Play,
  RotateCcw,
  Download,
  Layers,
  GitBranch,
  Circle,
  Brain,
  Lightbulb,
  BookOpen,
  Network,
  TreeDeciduous,
  LayoutGrid,
  List,
  FolderTree,
} from 'lucide-react';

interface MindMapViewProps {
  notes: Note[];
  onNoteClick: (noteId: string) => void;
  onClose: () => void;
}

// Types
interface ConceptNode {
  id: string;
  label: string;
  type: 'root' | 'note' | 'heading' | 'concept' | 'tag';
  level: number;
  children: ConceptNode[];
  noteId?: string;
  color?: string;
  isExpanded: boolean;
  isHidden: boolean;
  metadata?: {
    sourceType?: string;
    isPinned?: boolean;
    summary?: string;
  };
}

type LayoutType = 'radial' | 'tree' | 'horizontal';
type ViewMode = 'normal' | 'study' | 'focus';
type MapMode = 'single' | 'all';

// Extract headings from markdown content
function extractHeadings(content: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match) {
      headings.push({
        level: match[1].length,
        text: match[2].trim(),
      });
    }
  }

  return headings;
}

// Extract bullet points from markdown
function extractBulletPoints(content: string): { level: number; text: string }[] {
  const bullets: { level: number; text: string }[] = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Match bullet points with various indentation
    const match = line.match(/^(\s*)([-*+]|\d+\.)\s+(.+)$/);
    if (match) {
      const indent = match[1].length;
      const level = Math.floor(indent / 2) + 1; // Convert indent to level
      bullets.push({
        level,
        text: match[3].trim(),
      });
    }
  }

  return bullets;
}

// Build mind map from a SINGLE note (Markmap style)
function buildSingleNoteMindMap(note: Note): ConceptNode {
  const root: ConceptNode = {
    id: 'root',
    label: note.title,
    type: 'root',
    level: 0,
    children: [],
    noteId: note.id,
    isExpanded: true,
    isHidden: false,
    color: getSourceColor(note.sourceType),
  };

  // Extract headings
  const headings = extractHeadings(note.content);
  const bullets = extractBulletPoints(note.content);

  // Build hierarchy from headings
  const headingStack: ConceptNode[] = [root];

  headings.forEach((heading, idx) => {
    const node: ConceptNode = {
      id: `h-${idx}`,
      label: heading.text,
      type: 'heading',
      level: heading.level,
      children: [],
      noteId: note.id,
      isExpanded: true,
      isHidden: false,
    };

    // Find parent based on heading level
    while (headingStack.length > 1 && headingStack[headingStack.length - 1].level >= heading.level) {
      headingStack.pop();
    }

    headingStack[headingStack.length - 1].children.push(node);
    headingStack.push(node);
  });

  // If no headings, try bullet points
  if (headings.length === 0 && bullets.length > 0) {
    const bulletStack: ConceptNode[] = [root];

    bullets.forEach((bullet, idx) => {
      const node: ConceptNode = {
        id: `b-${idx}`,
        label: bullet.text,
        type: 'concept',
        level: bullet.level,
        children: [],
        noteId: note.id,
        isExpanded: true,
        isHidden: false,
      };

      // Find parent based on bullet level
      while (bulletStack.length > bullet.level) {
        bulletStack.pop();
      }

      if (bulletStack.length > 0) {
        bulletStack[bulletStack.length - 1].children.push(node);
      } else {
        root.children.push(node);
      }
      bulletStack.push(node);
    });
  }

  // If still no structure, extract key concepts
  if (root.children.length === 0) {
    const concepts = extractKeyConcepts(note.content, 6);
    concepts.forEach((concept, idx) => {
      root.children.push({
        id: `c-${idx}`,
        label: concept,
        type: 'concept',
        level: 1,
        children: [],
        noteId: note.id,
        isExpanded: true,
        isHidden: false,
      });
    });
  }

  return root;
}

// Extract key concepts using simple NLP
function extractKeyConcepts(content: string, maxConcepts = 5): string[] {
  // Clean content
  const cleanText = content
    .replace(/<[^>]*>/g, '')
    .replace(/[#*_=[\]()]/g, '')
    .toLowerCase();

  // Split into sentences and extract noun phrases (simplified)
  const words = cleanText.split(/\s+/);
  const wordFreq: Record<string, number> = {};

  // Count word frequency (excluding common words)
  const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'this', 'that', 'these', 'those', 'it', 'its']);

  words.forEach(word => {
    const clean = word.replace(/[^a-z]/g, '');
    if (clean.length > 3 && !stopWords.has(clean)) {
      wordFreq[clean] = (wordFreq[clean] || 0) + 1;
    }
  });

  // Get top concepts
  return Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxConcepts)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

// Build mind map tree from notes
function buildMindMapTree(notes: Note[], studySetTitle = 'Study Set'): ConceptNode {
  const root: ConceptNode = {
    id: 'root',
    label: studySetTitle,
    type: 'root',
    level: 0,
    children: [],
    isExpanded: true,
    isHidden: false,
  };

  // Group notes by tags for better organization
  const tagGroups: Record<string, Note[]> = {};
  const untaggedNotes: Note[] = [];

  notes.forEach(note => {
    if (note.tags.length > 0) {
      note.tags.forEach(tag => {
        if (!tagGroups[tag]) tagGroups[tag] = [];
        tagGroups[tag].push(note);
      });
    } else {
      untaggedNotes.push(note);
    }
  });

  // Create tag group nodes
  Object.entries(tagGroups).forEach(([tag, tagNotes]) => {
    const tagNode: ConceptNode = {
      id: `tag-${tag}`,
      label: `#${tag}`,
      type: 'tag',
      level: 1,
      children: [],
      isExpanded: true,
      isHidden: false,
      color: getTagColor(tag),
    };

    // Add unique notes under this tag
    const addedNoteIds = new Set<string>();
    tagNotes.forEach(note => {
      if (addedNoteIds.has(note.id)) return;
      addedNoteIds.add(note.id);

      const noteNode = createNoteNode(note, 2);
      tagNode.children.push(noteNode);
    });

    root.children.push(tagNode);
  });

  // Add untagged notes directly under root
  if (untaggedNotes.length > 0) {
    const otherNode: ConceptNode = {
      id: 'other',
      label: 'Other Notes',
      type: 'tag',
      level: 1,
      children: untaggedNotes.map(note => createNoteNode(note, 2)),
      isExpanded: true,
      isHidden: false,
      color: '#6b7280',
    };
    root.children.push(otherNode);
  }

  return root;
}

function createNoteNode(note: Note, level: number): ConceptNode {
  const noteNode: ConceptNode = {
    id: `note-${note.id}`,
    label: note.title,
    type: 'note',
    level,
    children: [],
    noteId: note.id,
    isExpanded: false,
    isHidden: false,
    color: getSourceColor(note.sourceType),
    metadata: {
      sourceType: note.sourceType,
      isPinned: note.isPinned,
      summary: note.summary,
    },
  };

  // Extract headings from note content
  const headings = extractHeadings(note.content);
  let currentParent = noteNode;
  let lastLevel = 0;

  headings.forEach((heading, idx) => {
    const headingNode: ConceptNode = {
      id: `heading-${note.id}-${idx}`,
      label: heading.text,
      type: 'heading',
      level: level + heading.level,
      children: [],
      noteId: note.id,
      isExpanded: false,
      isHidden: false,
    };

    if (heading.level <= lastLevel || lastLevel === 0) {
      noteNode.children.push(headingNode);
      currentParent = headingNode;
    } else {
      currentParent.children.push(headingNode);
    }
    lastLevel = heading.level;
  });

  // Extract key concepts if no headings
  if (headings.length === 0) {
    const concepts = extractKeyConcepts(note.content, 4);
    concepts.forEach((concept, idx) => {
      noteNode.children.push({
        id: `concept-${note.id}-${idx}`,
        label: concept,
        type: 'concept',
        level: level + 1,
        children: [],
        noteId: note.id,
        isExpanded: false,
        isHidden: false,
      });
    });
  }

  return noteNode;
}

function getSourceColor(sourceType: string): string {
  const colors: Record<string, string> = {
    manual: '#6b7280',
    ai_generated: '#a855f7',
    pdf: '#ef4444',
    youtube: '#dc2626',
    website: '#3b82f6',
    audio: '#10b981',
    handwriting: '#6366f1',
  };
  return colors[sourceType] || '#6b7280';
}

function getTagColor(tag: string): string {
  // Generate consistent color from tag string
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899'];
  return colors[Math.abs(hash) % colors.length];
}

// Calculate positions for different layouts
function calculatePositions(
  node: ConceptNode,
  layout: LayoutType,
  centerX: number,
  centerY: number,
  depth = 0,
  angleStart = 0,
  angleEnd = 2 * Math.PI,
  positions: Map<string, { x: number; y: number }> = new Map()
): Map<string, { x: number; y: number }> {
  if (layout === 'radial') {
    const radius = depth * 120;
    const angle = (angleStart + angleEnd) / 2;
    const x = centerX + radius * Math.cos(angle - Math.PI / 2);
    const y = centerY + radius * Math.sin(angle - Math.PI / 2);
    positions.set(node.id, { x, y });

    const visibleChildren = node.children.filter(c => !c.isHidden && node.isExpanded);
    const angleStep = (angleEnd - angleStart) / Math.max(visibleChildren.length, 1);

    visibleChildren.forEach((child, idx) => {
      calculatePositions(
        child,
        layout,
        centerX,
        centerY,
        depth + 1,
        angleStart + idx * angleStep,
        angleStart + (idx + 1) * angleStep,
        positions
      );
    });
  } else if (layout === 'tree') {
    const yOffset = depth * 100;
    positions.set(node.id, { x: centerX, y: 50 + yOffset });

    const visibleChildren = node.children.filter(c => !c.isHidden && node.isExpanded);
    const totalWidth = visibleChildren.length * 150;
    const startX = centerX - totalWidth / 2 + 75;

    visibleChildren.forEach((child, idx) => {
      calculatePositions(
        child,
        layout,
        startX + idx * 150,
        centerY,
        depth + 1,
        0,
        0,
        positions
      );
    });
  } else {
    // Horizontal
    const xOffset = depth * 180;
    positions.set(node.id, { x: 100 + xOffset, y: centerY });

    const visibleChildren = node.children.filter(c => !c.isHidden && node.isExpanded);
    const totalHeight = visibleChildren.length * 60;
    const startY = centerY - totalHeight / 2 + 30;

    visibleChildren.forEach((child, idx) => {
      calculatePositions(
        child,
        layout,
        centerX,
        startY + idx * 60,
        depth + 1,
        0,
        0,
        positions
      );
    });
  }

  return positions;
}

// Flatten tree for rendering
function flattenTree(node: ConceptNode, list: ConceptNode[] = []): ConceptNode[] {
  if (!node.isHidden) {
    list.push(node);
    if (node.isExpanded) {
      node.children.forEach(child => flattenTree(child, list));
    }
  }
  return list;
}

// Get all connections
function getConnections(node: ConceptNode, connections: { from: string; to: string }[] = []): { from: string; to: string }[] {
  if (!node.isHidden && node.isExpanded) {
    node.children.forEach(child => {
      if (!child.isHidden) {
        connections.push({ from: node.id, to: child.id });
        getConnections(child, connections);
      }
    });
  }
  return connections;
}

// Node component
function MindMapNode({
  node,
  position,
  isSelected,
  viewMode,
  onSelect,
  onToggle,
  onDoubleClick,
}: {
  node: ConceptNode;
  position: { x: number; y: number };
  isSelected: boolean;
  viewMode: ViewMode;
  onSelect: () => void;
  onToggle: () => void;
  onDoubleClick: () => void;
}) {
  const hasChildren = node.children.filter(c => !c.isHidden).length > 0;
  const isStudyHidden = viewMode === 'study' && node.type === 'concept';

  const getNodeSize = () => {
    switch (node.type) {
      case 'root': return { width: 140, height: 50 };
      case 'tag': return { width: 120, height: 40 };
      case 'note': return { width: 160, height: 45 };
      case 'heading': return { width: 140, height: 36 };
      case 'concept': return { width: 100, height: 32 };
      default: return { width: 120, height: 36 };
    }
  };

  const { width, height } = getNodeSize();

  const getNodeStyle = () => {
    const base = 'rounded-xl border-2 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md';

    if (isSelected) {
      return `${base} border-green-500 bg-green-500/10 ring-2 ring-green-500/30`;
    }

    switch (node.type) {
      case 'root':
        return `${base} border-green-500 bg-green-500 text-white font-bold`;
      case 'tag':
        return `${base} border-current bg-current/10`;
      case 'note':
        return `${base} border-border bg-card hover:border-green-500/50`;
      case 'heading':
        return `${base} border-border/50 bg-muted/50`;
      case 'concept':
        return `${base} border-dashed border-purple-500/50 bg-purple-500/5`;
      default:
        return `${base} border-border bg-card`;
    }
  };

  const getIcon = () => {
    switch (node.type) {
      case 'root': return <Network className="w-4 h-4" />;
      case 'tag': return <Tag className="w-3 h-3" />;
      case 'note': return node.metadata?.isPinned ? <Target className="w-3 h-3 text-amber-500" /> : <FileText className="w-3 h-3" />;
      case 'heading': return <ChevronRight className="w-3 h-3" />;
      case 'concept': return <Lightbulb className="w-3 h-3 text-purple-500" />;
      default: return null;
    }
  };

  return (
    <motion.g
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <foreignObject
        x={position.x - width / 2}
        y={position.y - height / 2}
        width={width}
        height={height}
      >
        <div
          className={getNodeStyle()}
          style={{
            width,
            height,
            color: node.color,
            filter: isStudyHidden ? 'blur(8px)' : 'none',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            if (node.noteId) onDoubleClick();
          }}
        >
          {getIcon()}
          <span className={cn(
            'truncate text-center',
            node.type === 'root' ? 'text-sm font-bold' :
            node.type === 'tag' ? 'text-xs font-semibold' :
            node.type === 'note' ? 'text-xs font-medium' : 'text-[10px]'
          )}>
            {isStudyHidden ? '???' : node.label}
          </span>
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-muted border border-border flex items-center justify-center"
            >
              {node.isExpanded ? (
                <ChevronDown className="w-3 h-3" />
              ) : (
                <ChevronRight className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </foreignObject>
    </motion.g>
  );
}

export function MindMapView({ notes, onNoteClick, onClose }: MindMapViewProps) {
  const { t } = useTranslation();
  const [layout, setLayout] = useState<LayoutType>('radial');
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [mapMode, setMapMode] = useState<MapMode>('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string>(notes[0]?.id || '');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tree, setTree] = useState<ConceptNode>(() => buildMindMapTree(notes));
  const [revealedConcepts, setRevealedConcepts] = useState<Set<string>>(new Set());
  const [showNoteSelector, setShowNoteSelector] = useState(false);

  // Get selected note for single mode
  const selectedNote = notes.find(n => n.id === selectedNoteId);

  // Rebuild tree when notes or mode changes
  useEffect(() => {
    if (mapMode === 'single' && selectedNote) {
      setTree(buildSingleNoteMindMap(selectedNote));
    } else {
      setTree(buildMindMapTree(notes));
    }
    // Reset view when switching
    setPan({ x: 0, y: 0 });
    setZoom(1);
    setSelectedNode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notes, mapMode, selectedNote]);

  // Calculate positions
  const positions = useMemo(() => {
    const centerX = 400;
    const centerY = 300;
    return calculatePositions(tree, layout, centerX, centerY);
  }, [tree, layout]);

  // Flatten for rendering
  const nodes = useMemo(() => flattenTree(tree), [tree]);
  const connections = useMemo(() => getConnections(tree), [tree]);

  // Filter by search
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.filter(n => n.label.toLowerCase().includes(q));
  }, [nodes, searchQuery]);

  // Toggle node expansion
  const toggleNode = useCallback((nodeId: string) => {
    setTree(prev => {
      const updateNode = (node: ConceptNode): ConceptNode => {
        if (node.id === nodeId) {
          return { ...node, isExpanded: !node.isExpanded };
        }
        return { ...node, children: node.children.map(updateNode) };
      };
      return updateNode(prev);
    });
  }, []);

  // Expand all
  const expandAll = useCallback(() => {
    setTree(prev => {
      const updateNode = (node: ConceptNode): ConceptNode => ({
        ...node,
        isExpanded: true,
        children: node.children.map(updateNode),
      });
      return updateNode(prev);
    });
  }, []);

  // Collapse all
  const collapseAll = useCallback(() => {
    setTree(prev => {
      const updateNode = (node: ConceptNode, isRoot = false): ConceptNode => ({
        ...node,
        isExpanded: isRoot,
        children: node.children.map(c => updateNode(c, false)),
      });
      return updateNode(prev, true);
    });
  }, []);

  // Mouse handlers for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // Allow drag on background elements (svg, rect, path) but not on nodes (foreignObject/div)
    const tagName = (e.target as HTMLElement).tagName.toLowerCase();
    if (tagName === 'svg' || tagName === 'rect' || tagName === 'path' || e.target === e.currentTarget) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      e.preventDefault();
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(z => Math.min(2, Math.max(0.3, z + delta)));
  }, []);

  // Reveal concept in study mode
  const revealConcept = useCallback((nodeId: string) => {
    setRevealedConcepts(prev => new Set([...prev, nodeId]));
  }, []);

  // Reset study mode
  const resetStudyMode = useCallback(() => {
    setRevealedConcepts(new Set());
  }, []);

  // Export as image
  const handleExport = useCallback(() => {
    const svg = document.querySelector('#mindmap-svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = 1200;
      canvas.height = 800;
      ctx?.fillRect(0, 0, canvas.width, canvas.height);
      ctx?.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.download = 'mindmap.png';
      link.href = canvas.toDataURL();
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, []);

  const selectedNodeData = nodes.find(n => n.id === selectedNode);

  if (notes.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-background flex items-center justify-center"
      >
        <div className="text-center">
          <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">{t('mindMap.noNotesTitle')}</h3>
          <p className="text-muted-foreground mb-6">{t('mindMap.noNotesDescription')}</p>
          <button onClick={onClose} className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600">
            {t('mindMap.close')}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="h-14 bg-card border-b border-border flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-green-500" />
            {t('mindMap.title')}
          </h2>

          {/* Map Mode Toggle */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setMapMode('single')}
              className={cn('px-2 py-1 rounded text-xs font-medium flex items-center gap-1',
                mapMode === 'single' ? 'bg-green-500 text-white shadow-sm' : 'hover:bg-card/50'
              )}
              title={t('mindMap.single')}
            >
              <FileText className="w-3 h-3" />
              {t('mindMap.single')}
            </button>
            <button
              onClick={() => setMapMode('all')}
              className={cn('px-2 py-1 rounded text-xs font-medium flex items-center gap-1',
                mapMode === 'all' ? 'bg-green-500 text-white shadow-sm' : 'hover:bg-card/50'
              )}
              title={t('mindMap.all')}
            >
              <FolderTree className="w-3 h-3" />
              {t('mindMap.all')}
            </button>
          </div>

          {/* Note Selector (for single mode) */}
          {mapMode === 'single' && (
            <div className="relative">
              <button
                onClick={() => setShowNoteSelector(!showNoteSelector)}
                className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg text-sm hover:bg-muted/80"
              >
                <FileText className="w-3.5 h-3.5" />
                <span className="max-w-[150px] truncate">{selectedNote?.title || t('mindMap.selectNote')}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showNoteSelector && (
                <div className="absolute top-full left-0 mt-1 w-64 max-h-64 overflow-auto bg-card border border-border rounded-lg shadow-lg z-10">
                  {notes.map(note => (
                    <button
                      key={note.id}
                      onClick={() => {
                        setSelectedNoteId(note.id);
                        setShowNoteSelector(false);
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-sm flex items-center gap-2 hover:bg-muted',
                        note.id === selectedNoteId && 'bg-green-500/10 text-green-600'
                      )}
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{note.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <span className="text-sm text-muted-foreground">
            {mapMode === 'single' ? t('mindMap.nodes', { count: nodes.length }) : t('mindMap.notesAndNodes', { noteCount: notes.length, nodeCount: nodes.length })}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('mindMap.searchNodes')}
              className="pl-8 pr-3 py-1.5 w-48 text-sm bg-muted rounded-lg border-0 outline-none focus:ring-2 focus:ring-green-500/20"
            />
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Layout switcher */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setLayout('radial')}
              className={cn('p-1.5 rounded', layout === 'radial' ? 'bg-card shadow-sm' : 'hover:bg-card/50')}
              title={t('mindMap.radialLayout')}
            >
              <Circle className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('tree')}
              className={cn('p-1.5 rounded', layout === 'tree' ? 'bg-card shadow-sm' : 'hover:bg-card/50')}
              title={t('mindMap.treeLayout')}
            >
              <TreeDeciduous className="w-4 h-4" />
            </button>
            <button
              onClick={() => setLayout('horizontal')}
              className={cn('p-1.5 rounded', layout === 'horizontal' ? 'bg-card shadow-sm' : 'hover:bg-card/50')}
              title={t('mindMap.horizontalLayout')}
            >
              <GitBranch className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* View mode */}
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('normal')}
              className={cn('p-1.5 rounded flex items-center gap-1', viewMode === 'normal' ? 'bg-card shadow-sm' : 'hover:bg-card/50')}
              title={t('mindMap.normalView')}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode('study'); resetStudyMode(); }}
              className={cn('p-1.5 rounded flex items-center gap-1', viewMode === 'study' ? 'bg-purple-500 text-white shadow-sm' : 'hover:bg-card/50')}
              title={t('mindMap.studyModeRecall')}
            >
              <BookOpen className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Expand/Collapse */}
          <button onClick={expandAll} className="p-1.5 rounded hover:bg-muted" title={t('mindMap.expandAll')}>
            <Layers className="w-4 h-4" />
          </button>
          <button onClick={collapseAll} className="p-1.5 rounded hover:bg-muted" title={t('mindMap.collapseAll')}>
            <LayoutGrid className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border" />

          {/* Zoom */}
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className="p-1.5 rounded hover:bg-muted">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="p-1.5 rounded hover:bg-muted">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 rounded hover:bg-muted" title={t('mindMap.resetView')}>
            <Maximize2 className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-border" />

          {/* Export */}
          <button onClick={handleExport} className="p-1.5 rounded hover:bg-muted" title={t('mindMap.exportImage')}>
            <Download className="w-4 h-4" />
          </button>

          {/* Close */}
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted ml-2">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Study mode banner */}
      {viewMode === 'study' && (
        <div className="bg-purple-500/10 border-b border-purple-500/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-purple-600 font-medium">{t('mindMap.studyMode')}</span>
            <span className="text-xs text-purple-500/70">{t('mindMap.studyModeHint')}</span>
          </div>
          <button
            onClick={resetStudyMode}
            className="flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700"
          >
            <RotateCcw className="w-3 h-3" />
            {t('mindMap.reset')}
          </button>
        </div>
      )}

      {/* Canvas */}
      <div
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <svg
          id="mindmap-svg"
          className="w-full h-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="currentColor" strokeOpacity="0.03" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Connections */}
          {connections.map(conn => {
            const from = positions.get(conn.from);
            const to = positions.get(conn.to);
            if (!from || !to) return null;

            const isHighlighted = selectedNode === conn.from || selectedNode === conn.to;

            return (
              <motion.path
                key={`${conn.from}-${conn.to}`}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                d={`M ${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${from.y} ${to.x} ${to.y}`}
                fill="none"
                stroke={isHighlighted ? 'rgb(34, 197, 94)' : 'currentColor'}
                strokeOpacity={isHighlighted ? 0.6 : 0.15}
                strokeWidth={isHighlighted ? 2 : 1}
              />
            );
          })}

          {/* Nodes */}
          {filteredNodes.map(node => {
            const pos = positions.get(node.id);
            if (!pos) return null;

            const isRevealed = revealedConcepts.has(node.id);
            const effectiveViewMode = isRevealed ? 'normal' : viewMode;

            return (
              <MindMapNode
                key={node.id}
                node={node}
                position={pos}
                isSelected={selectedNode === node.id}
                viewMode={effectiveViewMode}
                onSelect={() => {
                  setSelectedNode(node.id === selectedNode ? null : node.id);
                  if (viewMode === 'study' && node.type === 'concept') {
                    revealConcept(node.id);
                  }
                }}
                onToggle={() => toggleNode(node.id)}
                onDoubleClick={() => node.noteId && onNoteClick(node.noteId)}
              />
            );
          })}
        </svg>
      </div>

      {/* Selected node panel */}
      <AnimatePresence>
        {selectedNodeData && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            className="absolute right-4 top-20 w-72 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-4 border-b border-border">
              <div className="flex items-center gap-2 mb-2">
                {selectedNodeData.type === 'note' && <FileText className="w-4 h-4" />}
                {selectedNodeData.type === 'tag' && <Tag className="w-4 h-4" />}
                {selectedNodeData.type === 'concept' && <Lightbulb className="w-4 h-4 text-purple-500" />}
                {selectedNodeData.type === 'heading' && <ChevronRight className="w-4 h-4" />}
                <span className="text-xs text-muted-foreground uppercase">{selectedNodeData.type}</span>
              </div>
              <h3 className="font-semibold">{selectedNodeData.label}</h3>
            </div>

            {selectedNodeData.metadata?.summary && (
              <div className="p-4 border-b border-border bg-purple-500/5">
                <div className="flex items-center gap-1 mb-1">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  <span className="text-xs text-purple-500 font-medium">{t('mindMap.summary')}</span>
                </div>
                <p className="text-xs text-muted-foreground">{selectedNodeData.metadata.summary}</p>
              </div>
            )}

            <div className="p-4">
              <div className="text-xs text-muted-foreground mb-3">
                {t('mindMap.children', { count: selectedNodeData.children.filter(c => !c.isHidden).length })} · {t('mindMap.level', { level: selectedNodeData.level })}
              </div>

              {selectedNodeData.noteId && (
                <button
                  onClick={() => onNoteClick(selectedNodeData.noteId!)}
                  className="w-full py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {t('mindMap.openNote')}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute left-4 bottom-4 bg-card/90 backdrop-blur border border-border rounded-lg p-3">
        <p className="text-xs font-medium mb-2">
          {mapMode === 'single' ? t('mindMap.singleNoteMode') : t('mindMap.allNotesMode')}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-[10px] text-muted-foreground">
              {mapMode === 'single' ? t('mindMap.noteTitle') : t('mindMap.studySet')}
            </span>
          </div>
          {mapMode === 'all' && (
            <>
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3" />
                <span className="text-[10px] text-muted-foreground">{t('mindMap.tagsCategories')}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-3 h-3" />
                <span className="text-[10px] text-muted-foreground">{t('mindMap.notes')}</span>
              </div>
            </>
          )}
          <div className="flex items-center gap-2">
            <List className="w-3 h-3" />
            <span className="text-[10px] text-muted-foreground">{t('mindMap.headings')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-3 h-3 text-purple-500" />
            <span className="text-[10px] text-muted-foreground">{t('mindMap.keyConcepts')}</span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="absolute left-4 top-20 bg-card/90 backdrop-blur border border-border rounded-lg p-3 text-xs text-muted-foreground space-y-1">
        <p>• <strong>{t('mindMap.instructions.drag')}</strong> {t('mindMap.instructions.dragDesc')}</p>
        <p>• <strong>{t('mindMap.instructions.scroll')}</strong> {t('mindMap.instructions.scrollDesc')}</p>
        <p>• <strong>{t('mindMap.instructions.click')}</strong> {t('mindMap.instructions.clickDesc')}</p>
        <p>• <strong>{t('mindMap.instructions.doubleClick')}</strong> {t('mindMap.instructions.doubleClickDesc')}</p>
        <p>• <strong>{t('mindMap.instructions.expandCollapse')}</strong> {t('mindMap.instructions.expandCollapseDesc')}</p>
      </div>
    </motion.div>
  );
}
