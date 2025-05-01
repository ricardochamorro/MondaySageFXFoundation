'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

interface TemplateColumn {
  id: string;
  name: string;
  type: string;
}

interface TemplateMetadata {
  name: string;
  description: string;
  variables: string[];
}

interface TemplateEditorProps {
  columns: TemplateColumn[];
  onSave: (template: { content: string; metadata: TemplateMetadata }) => void;
}

export function TemplateEditor({ columns, onSave }: TemplateEditorProps) {
  const [content, setContent] = useState('');
  const [metadata, setMetadata] = useState<TemplateMetadata>({
    name: '',
    description: '',
    variables: [],
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source } = result;
    const newContent = content;
    const variable = columns[source.index].name;

    // Insert the variable at the cursor position or at the end
    const cursorPos = document.querySelector('textarea')?.selectionStart || newContent.length;
    const newText =
      newContent.slice(0, cursorPos) + `{{${variable}}}` + newContent.slice(cursorPos);

    setContent(newText);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Template Name</label>
          <input
            type="text"
            value={metadata.name}
            onChange={e => setMetadata({ ...metadata, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <input
            type="text"
            value={metadata.description}
            onChange={e => setMetadata({ ...metadata, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Template Content</label>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          rows={6}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Available Variables</label>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="variables">
            {provided => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="mt-1 grid grid-cols-2 gap-2"
              >
                {columns.map((column, index) => (
                  <Draggable key={column.id} draggableId={column.id} index={index}>
                    {provided => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-gray-50 p-2 rounded-md text-sm text-gray-600 cursor-move hover:bg-gray-100"
                      >
                        {column.name}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => onSave({ content, metadata })}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Save Template
        </button>
      </div>
    </div>
  );
}
