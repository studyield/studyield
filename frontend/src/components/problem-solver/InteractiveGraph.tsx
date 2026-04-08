import { useEffect, useRef, useState } from 'react';
import type { GraphData } from '@/services/problemSolver';
import { problemSolverService } from '@/services/problemSolver';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import { LineChart, AlertCircle } from 'lucide-react';

interface InteractiveGraphProps {
  sessionId: string;
}

export function InteractiveGraph({ sessionId }: InteractiveGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const loadGraph = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await problemSolverService.getGraphData(sessionId);
      setGraphData(data);
      setLoaded(true);
    } catch {
      setError('Could not generate graph for this problem');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!graphData || !graphData.canPlot || !containerRef.current) return;

    const renderGraph = async () => {
      try {
        const functionPlot = (await import('function-plot')).default;

        // Clear any existing content
        containerRef.current!.innerHTML = '';

        functionPlot({
          target: containerRef.current!,
          width: containerRef.current!.clientWidth,
          height: 350,
          xAxis: {
            domain: graphData.xRange?.length === 2 ? graphData.xRange as [number, number] : [-10, 10],
          },
          yAxis: {
            domain: graphData.yRange?.length === 2 ? graphData.yRange as [number, number] : [-10, 10],
          },
          grid: graphData.gridLines !== false,
          data: graphData.functions.map((fn) => ({
            fn: fn.expression,
            color: fn.color || '#22c55e',
          })),
        });
      } catch {
        setError('Failed to render graph. The function may not be plottable.');
      }
    };

    renderGraph();
  }, [graphData]);

  if (!loaded && !loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <LineChart className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-3">
          Visualize functions from this problem
        </p>
        <Button variant="outline" size="sm" onClick={loadGraph}>
          <LineChart className="w-4 h-4 mr-2" />
          Generate Graph
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !graphData?.canPlot) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          {error || 'This problem does not contain plottable functions'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <LineChart className="w-4 h-4 text-green-500" />
        <span className="text-sm font-medium">Interactive Graph</span>
        {graphData.functions.length > 0 && (
          <span className="text-xs text-muted-foreground ml-auto">
            {graphData.functions.map(f => f.label || f.expression).join(', ')}
          </span>
        )}
      </div>
      <div ref={containerRef} className="w-full" />
      {graphData.specialPoints && graphData.specialPoints.length > 0 && (
        <div className="px-4 py-3 border-t border-border">
          <p className="text-xs font-medium text-muted-foreground mb-1">Key Points</p>
          <div className="flex flex-wrap gap-2">
            {graphData.specialPoints.map((pt, i) => (
              <span
                key={i}
                className="text-xs px-2 py-1 bg-muted rounded-lg"
              >
                {pt.label}: ({pt.x}, {pt.y})
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
