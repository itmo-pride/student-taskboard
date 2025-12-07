import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { DrawObject, Point, Tool } from '../types/board';
import { useWhiteboardSocket } from '../hooks/useWhiteboardSocket';
import { v4 as uuidv4 } from 'uuid';

interface WhiteboardProps {
  boardId: string;
  initialObjects?: DrawObject[];
}

export default function Whiteboard({ boardId, initialObjects = [] }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [objects, setObjects] = useState<DrawObject[]>(initialObjects);
  const [currentTool, setCurrentTool] = useState<Tool>('pen');
  const [currentColor, setCurrentColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  
  const objectIdsRef = useRef<Set<string>>(new Set());

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  
  const handleSync = useCallback((syncedObjects: DrawObject[]) => {
    console.log('Sync received:', syncedObjects.length, 'objects');
    objectIdsRef.current = new Set(syncedObjects.map(obj => obj.id));
    setObjects(syncedObjects);
  }, []);

  const handleDrawFromServer = useCallback((object: DrawObject) => {
    if (objectIdsRef.current.has(object.id)) {
      return;
    }
    objectIdsRef.current.add(object.id);
    setObjects(prev => [...prev, object]);
  }, []);

  const handleDeleteFromServer = useCallback((objectId: string) => {
    objectIdsRef.current.delete(objectId);
    setObjects(prev => prev.filter(obj => obj.id !== objectId));
  }, []);

  const handleClearFromServer = useCallback(() => {
    objectIdsRef.current.clear();
    setObjects([]);
  }, []);

  
  const { isConnected, sendDraw, sendDelete, sendClear } = useWhiteboardSocket({
    boardId,
    onSync: handleSync,
    onDraw: handleDrawFromServer,
    onDelete: handleDeleteFromServer,
    onClear: handleClearFromServer,
  });

  
  useEffect(() => {
    objectIdsRef.current = new Set(objects.map(obj => obj.id));
  }, []);

  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    objects.forEach(obj => drawObject(ctx, obj));

    if (currentPath.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = currentTool === 'eraser' ? '#ffffff' : currentColor;
      ctx.lineWidth = currentTool === 'eraser' ? lineWidth * 3 : lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
    }
  }, [objects, currentPath, currentColor, lineWidth, currentTool]);

  const drawObject = (ctx: CanvasRenderingContext2D, obj: DrawObject) => {
    ctx.strokeStyle = obj.color;
    ctx.fillStyle = obj.color;
    ctx.lineWidth = obj.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (obj.type) {
      case 'path':
        if (obj.points && obj.points.length > 0) {
          ctx.beginPath();
          ctx.moveTo(obj.points[0].x, obj.points[0].y);
          for (let i = 1; i < obj.points.length; i++) {
            ctx.lineTo(obj.points[i].x, obj.points[i].y);
          }
          ctx.stroke();
        }
        break;

      case 'line':
        if (obj.points && obj.points.length >= 2) {
          ctx.beginPath();
          ctx.moveTo(obj.points[0].x, obj.points[0].y);
          ctx.lineTo(obj.points[1].x, obj.points[1].y);
          ctx.stroke();
        }
        break;

      case 'rect':
        if (obj.x !== undefined && obj.y !== undefined && obj.width && obj.height) {
          ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        }
        break;

      case 'circle':
        if (obj.x !== undefined && obj.y !== undefined && obj.radius) {
          ctx.beginPath();
          ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;

      case 'text':
        if (obj.x !== undefined && obj.y !== undefined && obj.text) {
          ctx.font = `${obj.lineWidth * 6}px Arial`;
          ctx.fillText(obj.text, obj.x, obj.y);
        }
        break;
    }
  };

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getMousePos(e);
    setIsDrawing(true);
    setStartPoint(pos);

    if (currentTool === 'pen' || currentTool === 'eraser') {
      setCurrentPath([pos]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const pos = getMousePos(e);

    if (currentTool === 'pen' || currentTool === 'eraser') {
      setCurrentPath(prev => [...prev, pos]);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const pos = getMousePos(e);
    setIsDrawing(false);

    let newObject: DrawObject | null = null;
    const objectId = uuidv4();

    switch (currentTool) {
      case 'pen':
        if (currentPath.length > 1) {
          newObject = {
            id: objectId,
            type: 'path',
            points: [...currentPath, pos],
            color: currentColor,
            lineWidth: lineWidth,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
          };
        }
        break;

      case 'eraser':
        if (currentPath.length > 1) {
          newObject = {
            id: objectId,
            type: 'path',
            points: [...currentPath, pos],
            color: '#ffffff',
            lineWidth: lineWidth * 3,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
          };
        }
        break;

      case 'line':
        if (startPoint) {
          newObject = {
            id: objectId,
            type: 'line',
            points: [startPoint, pos],
            color: currentColor,
            lineWidth: lineWidth,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
          };
        }
        break;

      case 'rect':
        if (startPoint) {
          newObject = {
            id: objectId,
            type: 'rect',
            x: Math.min(startPoint.x, pos.x),
            y: Math.min(startPoint.y, pos.y),
            width: Math.abs(pos.x - startPoint.x),
            height: Math.abs(pos.y - startPoint.y),
            color: currentColor,
            lineWidth: lineWidth,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
          };
        }
        break;

      case 'circle':
        if (startPoint) {
          const radius = Math.sqrt(
            Math.pow(pos.x - startPoint.x, 2) + Math.pow(pos.y - startPoint.y, 2)
          );
          newObject = {
            id: objectId,
            type: 'circle',
            x: startPoint.x,
            y: startPoint.y,
            radius: radius,
            color: currentColor,
            lineWidth: lineWidth,
            createdBy: currentUser.id,
            createdAt: new Date().toISOString(),
          };
        }
        break;
    }

    if (newObject) {
      objectIdsRef.current.add(newObject.id);
      setObjects(prev => [...prev, newObject!]);
      sendDraw(newObject);
    }

    setCurrentPath([]);
    setStartPoint(null);
  };

  
  const handleClearClick = () => {
    if (confirm('Clear the entire board?')) {
      objectIdsRef.current.clear();
      setObjects([]);
      sendClear();
    }
  };

  const quickColors = useMemo(() => [
    '#000000', '#ffffff', '#e74c3c', '#e67e22', '#f1c40f',
    '#2ecc71', '#3498db', '#9b59b6', '#1abc9c', '#34495e',
  ], []);

  return (
    <div style={styles.container}>
      <div style={styles.toolbar}>
        <div style={styles.toolGroup}>
          <span style={styles.label}>Tools:</span>
          {(['pen', 'eraser', 'line', 'rect', 'circle'] as Tool[]).map(tool => (
            <button
              key={tool}
              onClick={() => setCurrentTool(tool)}
              style={{
                ...styles.toolButton,
                ...(currentTool === tool ? styles.toolButtonActive : {}),
              }}
              title={tool.charAt(0).toUpperCase() + tool.slice(1)}
            >
              {tool === 'pen' && '✏️'}
              {tool === 'eraser' && '🧹'}
              {tool === 'line' && '📏'}
              {tool === 'rect' && '⬜'}
              {tool === 'circle' && '⭕'}
            </button>
          ))}
        </div>

        <div style={styles.toolGroup}>
          <span style={styles.label}>Color:</span>
          <div style={styles.colorPicker}>
            {quickColors.map(color => (
              <button
                key={color}
                onClick={() => setCurrentColor(color)}
                style={{
                  ...styles.colorButton,
                  backgroundColor: color,
                  border: color === '#ffffff' ? '2px solid #ddd' : '2px solid transparent',
                  ...(currentColor === color ? styles.colorButtonActive : {}),
                }}
              />
            ))}
            <input
              type="color"
              value={currentColor}
              onChange={(e) => setCurrentColor(e.target.value)}
              style={styles.colorInput}
            />
          </div>
        </div>

        <div style={styles.toolGroup}>
          <span style={styles.label}>Size: {lineWidth}</span>
          <input
            type="range"
            min="1"
            max="20"
            value={lineWidth}
            onChange={(e) => setLineWidth(Number(e.target.value))}
            style={styles.slider}
          />
        </div>

        <div style={styles.toolGroup}>
          <button onClick={handleClearClick} style={styles.clearButton}>
            🗑️ Clear All
          </button>
        </div>

        <div style={styles.statusGroup}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: isConnected ? '#2ecc71' : '#e74c3c',
            }}
          />
          <span style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div style={styles.canvasContainer}>
        <canvas
          ref={canvasRef}
          width={1200}
          height={800}
          style={styles.canvas}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#f5f5f5',
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
    padding: '0.75rem 1rem',
    backgroundColor: 'white',
    borderBottom: '1px solid #ddd',
    flexWrap: 'wrap',
  },
  toolGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.85rem',
    color: '#666',
    fontWeight: 500,
  },
  toolButton: {
    width: '36px',
    height: '36px',
    border: '2px solid #ddd',
    borderRadius: '6px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  toolButtonActive: {
    borderColor: '#3498db',
    backgroundColor: '#e8f4f8',
  },
  colorPicker: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  colorButton: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    cursor: 'pointer',
    padding: 0,
  },
  colorButtonActive: {
    transform: 'scale(1.2)',
    boxShadow: '0 0 0 2px #333',
  },
  colorInput: {
    width: '30px',
    height: '24px',
    padding: 0,
    border: 'none',
    cursor: 'pointer',
  },
  slider: {
    width: '100px',
  },
  clearButton: {
    padding: '0.5rem 1rem',
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  statusGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginLeft: 'auto',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  statusText: {
    fontSize: '0.85rem',
    color: '#666',
  },
  canvasContainer: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    justifyContent: 'center',
    padding: '1rem',
  },
  canvas: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    cursor: 'crosshair',
    maxWidth: '100%',
    height: 'auto',
  },
};
