import React, { createContext, useContext, useState } from 'react';

const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  const [editorState, setEditorState] = useState({});

  return (
    <EditorContext.Provider value={{ editorState, setEditorState }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditorState = () => {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('You should wrap your component by EditorProvider');
  }
  return context;
};
