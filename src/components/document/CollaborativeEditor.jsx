import React, { useEffect, useRef, useState } from 'react';
import { useDocument } from '../../hooks/useDocument';
import { Operation, OP_TYPES } from '../../utils/operationalTransform';
import LoadingSpinner from '../LoadingSpinner';
import { debounce } from 'lodash';
import {
  Bold, Italic, Underline, List, AlignLeft, AlignCenter, 
  AlignRight, Type, Users, Clock, Save
} from 'lucide-react';

const TOOLBAR_BUTTONS = [
  { icon: Bold, action: 'bold', tooltip: 'Bold (Ctrl+B)' },
  { icon: Italic, action: 'italic', tooltip: 'Italic (Ctrl+I)' },
  { icon: Underline, action: 'underline', tooltip: 'Underline (Ctrl+U)' },
  { icon: List, action: 'list', tooltip: 'Bullet List' },
  { icon: AlignLeft, action: 'alignLeft', tooltip: 'Align Left' },
  { icon: AlignCenter, action: 'alignCenter', tooltip: 'Align Center' },
  { icon: AlignRight, action: 'alignRight', tooltip: 'Align Right' }
];

const CollaborativeEditor = ({ documentId }) => {
  const {
    document,
    activeUsers,
    userCursors,
    userSelections,
    currentVersion,
    loading,
    error,
    contentRef,
    applyOperation,
    updateCursor,
    updateSelection
  } = useDocument(documentId);

  const editorRef = useRef(null);
  const [selection, setSelection] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toolbarState, setToolbarState] = useState({
    bold: false,
    italic: false,
    underline: false,
    list: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false
  });

  // Track changes and create operations
  const handleInput = (e) => {
    const target = e.target;
    const newValue = target.value;
    const oldValue = contentRef.current;
    
    // Calculate the difference and create appropriate operations
    let operations = [];
    let i = 0;
    let j = 0;

    while (i < oldValue.length && j < newValue.length) {
      if (oldValue[i] === newValue[j]) {
        i++;
        j++;
        continue;
      }

      // Found a difference
      if (oldValue[i] !== newValue[j]) {
        // Check for insertion
        if (oldValue.slice(i) === newValue.slice(j + 1)) {
          operations.push(Operation.insert(i, newValue[j]));
          j++;
          continue;
        }
        
        // Check for deletion
        if (oldValue.slice(i + 1) === newValue.slice(j)) {
          operations.push(Operation.delete(i, 1));
          i++;
          continue;
        }
      }
    }

    // Handle remaining insertions
    if (j < newValue.length) {
      operations.push(Operation.insert(i, newValue.slice(j)));
    }

    // Handle remaining deletions
    if (i < oldValue.length) {
      operations.push(Operation.delete(i, oldValue.length - i));
    }

    // Apply operations
    operations.forEach(op => {
      applyOperation(op);
    });

    // Update content reference
    contentRef.current = newValue;
  };

  // Handle cursor movement
  const handleCursorMove = debounce((e) => {
    const target = e.target;
    updateCursor({
      position: target.selectionStart,
      line: getCurrentLine(target)
    });
  }, 50);

  // Handle selection
  const handleSelectionChange = debounce((e) => {
    const target = e.target;
    const newSelection = {
      start: target.selectionStart,
      end: target.selectionEnd,
      direction: target.selectionDirection
    };
    setSelection(newSelection);
    updateSelection(newSelection);
  }, 50);

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          toggleStyle('bold');
          break;
        case 'i':
          e.preventDefault();
          toggleStyle('italic');
          break;
        case 'u':
          e.preventDefault();
          toggleStyle('underline');
          break;
        case 's':
          e.preventDefault();
          handleSave();
          break;
        default:
          break;
      }
    }
  };

  // Toggle text style
  const toggleStyle = (style) => {
    if (!selection) return;

    const op = Operation.style(
      selection.start,
      selection.end - selection.start,
      { [style]: !toolbarState[style] }
    );
    applyOperation(op);

    setToolbarState(prev => ({
      ...prev,
      [style]: !prev[style]
    }));
  };

  // Handle save
  const handleSave = debounce(async () => {
    setIsSaving(true);
    try {
      await applyOperation({
        type: OP_TYPES.RETAIN,
        position: 0,
        content: contentRef.current.length.toString(),
        shouldCreateVersion: true,
        message: 'Manual save'
      });
    } finally {
      setIsSaving(false);
    }
  }, 500);

  // Helper to get current line number
  const getCurrentLine = (target) => {
    const value = target.value;
    const lines = value.slice(0, target.selectionStart).split('\n');
    return lines.length;
  };

  // Update toolbar state based on selection
  useEffect(() => {
    if (!selection || selection.start === selection.end) {
      setToolbarState(prev => ({
        ...prev,
        bold: false,
        italic: false,
        underline: false
      }));
      return;
    }

    // Check styles at selection
    const selectedText = contentRef.current.slice(selection.start, selection.end);
    // Here you would check the actual styles applied to the selection
    // This is a simplified example
  }, [selection]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow">
      {/* Toolbar */}
      <div className="flex items-center px-4 py-2 border-b border-gray-200 bg-gray-50">
        <div className="flex space-x-1">
          {TOOLBAR_BUTTONS.map(({ icon: Icon, action, tooltip }) => (
            <button
              key={action}
              onClick={() => toggleStyle(action)}
              className={`p-1.5 rounded hover:bg-gray-200 ${
                toolbarState[action] ? 'bg-gray-200' : ''
              }`}
              title={tooltip}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <div className="mx-4 h-6 border-l border-gray-300" />

        <div className="flex items-center space-x-4 text-sm text-gray-600">
          <div className="flex items-center">
            <Type className="w-4 h-4 mr-1" />
            <span>Arial</span>
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{activeUsers.length} active</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>Auto-saving</span>
          </div>
        </div>

        <div className="flex-grow" />

        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center px-3 py-1 rounded ${
            isSaving
              ? 'bg-gray-100 text-gray-400'
              : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}
        >
          <Save className="w-4 h-4 mr-1" />
          {isSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      {/* Editor */}
      <div className="flex-grow relative">
        <textarea
          ref={editorRef}
          value={contentRef.current || ''}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onSelect={handleSelectionChange}
          onMouseMove={handleCursorMove}
          className="w-full h-full p-4 resize-none focus:outline-none"
          placeholder="Start typing..."
        />

        {/* Cursor overlays */}
        {Object.entries(userCursors).map(([userId, { position, userName }]) => (
          userId !== document.creator._id && (
            <div
              key={userId}
              className="absolute pointer-events-none"
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`
              }}
            >
              <div className="px-2 py-1 text-xs text-white bg-blue-500 rounded">
                {userName}
              </div>
              <div className="w-0.5 h-5 bg-blue-500" />
            </div>
          )
        ))}

        {/* Selection overlays */}
        {Object.entries(userSelections).map(([userId, { selection, userName }]) => (
          userId !== document.creator._id && (
            <div
              key={userId}
              className="absolute pointer-events-none bg-blue-200 opacity-30"
              style={{
                left: `${selection.start}px`,
                width: `${selection.end - selection.start}px`,
                height: '1.2em'
              }}
            />
          )
        ))}
      </div>
    </div>
  );
};

export default CollaborativeEditor;
