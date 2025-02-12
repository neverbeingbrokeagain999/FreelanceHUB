import React, { useEffect, useRef } from 'react';
import {
  Pen, Square, Circle, Type, Image, Eraser,
  Download, Camera, Settings, Users, Trash2
} from 'lucide-react';
import useWhiteboard from '../../hooks/useWhiteboard';
import LoadingSpinner from '../LoadingSpinner';

const tools = [
  { id: 'pen', icon: Pen, label: 'Pen' },
  { id: 'rectangle', icon: Square, label: 'Rectangle' },
  { id: 'circle', icon: Circle, label: 'Circle' },
  { id: 'text', icon: Type, label: 'Text' },
  { id: 'image', icon: Image, label: 'Image' },
  { id: 'eraser', icon: Eraser, label: 'Eraser' }
];

const Whiteboard = ({ whiteboardId }) => {
  const {
    whiteboard,
    elements,
    selectedElement,
    tool,
    color,
    strokeWidth,
    isDrawing,
    collaborators,
    loading,
    error,
    canvasRef,
    setSelectedElement,
    setTool,
    setColor,
    setStrokeWidth,
    setIsDrawing,
    addElement,
    updateElement,
    deleteElement,
    createSnapshot
  } = useWhiteboard(whiteboardId);

  const drawingContextRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Setup canvas
    canvas.width = whiteboard?.settings?.width || 1920;
    canvas.height = whiteboard?.settings?.height || 1080;
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.lineWidth = strokeWidth;
    drawingContextRef.current = context;

    // Draw existing elements
    drawElements();
  }, [canvasRef, whiteboard, color, strokeWidth]);

  const drawElements = () => {
    if (!drawingContextRef.current || !elements) return;

    const context = drawingContextRef.current;
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);

    elements.forEach(element => {
      switch (element.type) {
        case 'path':
          drawPath(context, element);
          break;
        case 'rectangle':
          drawRectangle(context, element);
          break;
        case 'circle':
          drawCircle(context, element);
          break;
        case 'text':
          drawText(context, element);
          break;
        default:
          break;
      }
    });
  };

  const drawPath = (context, element) => {
    const { points, properties } = element;
    if (!points || points.length < 2) return;

    context.beginPath();
    context.strokeStyle = properties.strokeColor;
    context.lineWidth = properties.strokeWidth;
    context.moveTo(points[0].x, points[0].y);

    points.slice(1).forEach(point => {
      context.lineTo(point.x, point.y);
    });

    context.stroke();
  };

  const drawRectangle = (context, element) => {
    const { points, properties } = element;
    if (!points || points.length < 2) return;

    context.beginPath();
    context.strokeStyle = properties.strokeColor;
    context.fillStyle = properties.fillColor;
    context.lineWidth = properties.strokeWidth;

    const [start, end] = points;
    const width = end.x - start.x;
    const height = end.y - start.y;

    if (properties.fillColor !== 'transparent') {
      context.fillRect(start.x, start.y, width, height);
    }
    context.strokeRect(start.x, start.y, width, height);
  };

  const drawCircle = (context, element) => {
    const { points, properties } = element;
    if (!points || points.length < 2) return;

    context.beginPath();
    context.strokeStyle = properties.strokeColor;
    context.fillStyle = properties.fillColor;
    context.lineWidth = properties.strokeWidth;

    const [center, radiusPoint] = points;
    const radius = Math.hypot(
      radiusPoint.x - center.x,
      radiusPoint.y - center.y
    );

    context.arc(center.x, center.y, radius, 0, 2 * Math.PI);
    
    if (properties.fillColor !== 'transparent') {
      context.fill();
    }
    context.stroke();
  };

  const drawText = (context, element) => {
    const { points, properties } = element;
    if (!points || !points.length) return;

    context.font = `${properties.fontSize}px ${properties.fontFamily}`;
    context.fillStyle = properties.strokeColor;
    context.fillText(properties.text, points[0].x, points[0].y);
  };

  const handleMouseDown = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    setIsDrawing(true);

    const newElement = {
      type: tool,
      points: [{ x: offsetX, y: offsetY }],
      properties: {
        strokeColor: color,
        strokeWidth,
        fillColor: 'transparent'
      }
    };

    addElement(newElement);
    setSelectedElement(newElement);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !selectedElement) return;

    const { offsetX, offsetY } = e.nativeEvent;
    const updatedElement = {
      ...selectedElement,
      points: [...selectedElement.points, { x: offsetX, y: offsetY }]
    };

    updateElement(selectedElement._id, updatedElement);
    setSelectedElement(updatedElement);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
    setSelectedElement(null);
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="flex h-full">
      {/* Toolbar */}
      <div className="w-16 bg-gray-800 p-2 flex flex-col items-center space-y-4">
        {tools.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setTool(id)}
            className={`p-2 rounded-lg ${
              tool === id ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700'
            }`}
            title={label}
          >
            <Icon className="w-6 h-6" />
          </button>
        ))}
        
        <hr className="border-gray-600 w-full" />

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer"
          title="Color"
        />

        <input
          type="range"
          min="1"
          max="20"
          value={strokeWidth}
          onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
          className="w-12 rotate-90 my-8"
          title="Stroke Width"
        />

        <button
          onClick={createSnapshot}
          className="text-gray-300 hover:bg-gray-700 p-2 rounded-lg"
          title="Take Snapshot"
        >
          <Camera className="w-6 h-6" />
        </button>

        <button
          onClick={() => {
            const link = document.createElement('a');
            link.download = 'whiteboard.png';
            link.href = canvasRef.current.toDataURL();
            link.click();
          }}
          className="text-gray-300 hover:bg-gray-700 p-2 rounded-lg"
          title="Download"
        >
          <Download className="w-6 h-6" />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-grow overflow-auto bg-gray-900 relative">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="bg-white"
        />
      </div>

      {/* Collaborators */}
      <div className="w-48 bg-gray-800 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-medium">Collaborators</h3>
          <Users className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-2">
          {collaborators.map(collaborator => (
            <div
              key={collaborator.user}
              className="flex items-center text-gray-300 text-sm"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              <span>{collaborator.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Whiteboard;
