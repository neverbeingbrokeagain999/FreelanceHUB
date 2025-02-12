import React, { useRef, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import PropTypes from 'prop-types';
import { FaPlay, FaStop, FaSave } from 'react-icons/fa';

const CodeSnippetPlayground = ({
  content,
  language,
  readOnly,
  onContentChange,
  onCursorChange,
  onSelectionChange,
  onExecute,
  remoteCursors,
  remoteSelections,
  executionResult,
  executing
}) => {
  const editorRef = useRef(null);
  const decorationsRef = useRef([]);

  // Handle editor mount
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Set up cursor position tracking
    editor.onDidChangeCursorPosition(e => {
      if (!readOnly && onCursorChange) {
        onCursorChange({
          lineNumber: e.position.lineNumber,
          column: e.position.column
        });
      }
    });

    // Set up selection tracking
    editor.onDidChangeCursorSelection(e => {
      if (!readOnly && onSelectionChange) {
        onSelectionChange({
          startLineNumber: e.selection.startLineNumber,
          startColumn: e.selection.startColumn,
          endLineNumber: e.selection.endLineNumber,
          endColumn: e.selection.endColumn
        });
      }
    });
  };

  // Update content
  const handleContentChange = (value) => {
    if (!readOnly && onContentChange) {
      onContentChange(value);
    }
  };

  // Execute code
  const handleExecute = async () => {
    if (executing || readOnly) return;

    try {
      await onExecute(editorRef.current.getValue());
    } catch (error) {
      console.error('Execution error:', error);
    }
  };

  // Update remote cursors and selections
  useEffect(() => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const monaco = editor.getModel();
    
    // Clear previous decorations
    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);

    // Create new decorations for cursors and selections
    const decorations = [];

    // Add remote cursors
    Object.entries(remoteCursors).forEach(([userId, position]) => {
      decorations.push({
        range: new monaco.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ),
        options: {
          className: `remote-cursor-${userId}`,
          hoverMessage: { value: `${userId}'s cursor` }
        }
      });
    });

    // Add remote selections
    Object.entries(remoteSelections).forEach(([userId, selection]) => {
      decorations.push({
        range: new monaco.Range(
          selection.startLineNumber,
          selection.startColumn,
          selection.endLineNumber,
          selection.endColumn
        ),
        options: {
          className: `remote-selection-${userId}`,
          hoverMessage: { value: `${userId}'s selection` }
        }
      });
    });

    // Apply decorations
    decorationsRef.current = editor.deltaDecorations([], decorations);
  }, [remoteCursors, remoteSelections]);

  return (
    <div className="flex flex-col h-full">
      {/* Editor Toolbar */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {/* Language Indicator */}
          <span className="text-sm text-gray-400 px-2 py-1 rounded bg-gray-700">
            {language}
          </span>

          {/* Status Indicator */}
          {executing && (
            <span className="text-sm text-yellow-400">
              Executing...
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExecute}
            disabled={executing || readOnly}
            className="btn btn-primary btn-sm"
          >
            {executing ? <FaStop /> : <FaPlay />}
            <span className="ml-2">
              {executing ? 'Stop' : 'Run'}
            </span>
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={content}
          onChange={handleContentChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            tabSize: 2,
            wordWrap: 'on'
          }}
          theme="vs-dark"
        />
      </div>

      {/* Execution Results */}
      {executionResult && (
        <div className="bg-gray-800 border-t border-gray-700">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-300 mb-2">
              Execution Results
            </h3>
            <pre className="text-sm bg-gray-900 p-3 rounded text-gray-300 overflow-auto max-h-40">
              {executionResult.error ? (
                <span className="text-red-400">
                  {executionResult.error}
                </span>
              ) : (
                <>
                  <div className="text-gray-400 mb-2">
                    Duration: {executionResult.duration}ms
                    {executionResult.memory && (
                      <> | Memory: {Math.round(executionResult.memory.used / 1024 / 1024)}MB</>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap">
                    {executionResult.output}
                  </div>
                </>
              )}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

CodeSnippetPlayground.propTypes = {
  content: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  readOnly: PropTypes.bool,
  onContentChange: PropTypes.func,
  onCursorChange: PropTypes.func,
  onSelectionChange: PropTypes.func,
  onExecute: PropTypes.func,
  remoteCursors: PropTypes.object,
  remoteSelections: PropTypes.object,
  executionResult: PropTypes.shape({
    output: PropTypes.string,
    error: PropTypes.string,
    duration: PropTypes.number,
    memory: PropTypes.shape({
      used: PropTypes.number,
      limit: PropTypes.number
    })
  }),
  executing: PropTypes.bool
};

CodeSnippetPlayground.defaultProps = {
  readOnly: false,
  remoteCursors: {},
  remoteSelections: {},
  executing: false
};

export default CodeSnippetPlayground;
