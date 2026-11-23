import React, { useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

/**
 * Reusable Direct Inline Rich Text Editor powered by Tiptap.
 * Provides floating/inline text editing with Bold, Italic, Lists, and Headings.
 * Preserves clean HTML / text value for backward compatibility.
 */
export function InlineRichText({
  value = '',
  onChange,
  placeholder = 'Click to edit text...',
  className = '',
  style = {},
  isEditable = true,
  singleLine = false,
  as: Tag = 'div'
}) {
  const isUpdatingRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: { depth: 50 },
        heading: { levels: [1, 2, 3, 4] }
      })
    ],
    content: value || '',
    editable: isEditable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        isUpdatingRef.current = true;
        if (singleLine) {
          // Send plain text for single line fields (Title, Proposal Number, Date, Client Name)
          const text = editor.getText();
          onChange(text);
        } else {
          const html = editor.getHTML();
          const cleaned = html === '<p></p>' ? '' : html;
          onChange(cleaned);
        }
      }
    }
  });

  // Sync external changes (e.g. template switch or undo from state)
  useEffect(() => {
    if (!editor) return;
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false;
      return;
    }
    const currentHtml = editor.getHTML();
    if (value !== currentHtml && (value || currentHtml !== '<p></p>')) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) {
    return <Tag className={className} style={style}>{value}</Tag>;
  }

  return (
    <div className={`inline-tiptap-wrapper ${className}`} style={{ position: 'relative', ...style }}>
      {editor.isFocused && (
        <div className="inline-tiptap-toolbar" onMouseDown={(e) => e.preventDefault()}>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
            title="Bold (Ctrl+B)"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
            title="Italic (Ctrl+I)"
          >
            <em>I</em>
          </button>
          {!singleLine && (
            <>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={editor.isActive('bulletList') ? 'is-active' : ''}
                title="Bullet List"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={editor.isActive('orderedList') ? 'is-active' : ''}
                title="Numbered List"
              >
                1. List
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
                title="Heading"
              >
                H3
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
          >
            ↺
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
          >
            ↻
          </button>
        </div>
      )}
      <EditorContent editor={editor} className="inline-tiptap-content" />
    </div>
  );
}

/**
 * Inline Editable Number/Money Cell
 * Used for Rate, Qty, Discounts. Ensures direct editing on page while keeping strict numeric validation
 * and live recalculation without breaking math formulas.
 */
export function InlineNumberCell({
  value = 0,
  onChange,
  prefix = '',
  suffix = '',
  className = '',
  min = 0,
  step = 1,
  style = {}
}) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [tempVal, setTempVal] = React.useState(value);

  React.useEffect(() => {
    setTempVal(value);
  }, [value]);

  const commit = () => {
    setIsEditing(false);
    const parsed = Number(tempVal);
    if (!isNaN(parsed) && parsed !== value) {
      onChange(parsed);
    } else {
      setTempVal(value);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      commit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setTempVal(value);
    }
  };

  if (isEditing) {
    return (
      <input
        type="number"
        autoFocus
        value={tempVal}
        min={min}
        step={step}
        onChange={(e) => setTempVal(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={`inline-number-input ${className}`}
        style={{
          width: '80px',
          padding: '2px 4px',
          fontSize: 'inherit',
          textAlign: 'right',
          borderRadius: '3px',
          border: '1px solid #0284c7',
          outline: 'none',
          ...style
        }}
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      title="Click to edit number"
      className={`inline-number-display ${className}`}
      style={{
        cursor: 'pointer',
        padding: '2px 4px',
        borderRadius: '3px',
        transition: 'background-color 0.15s ease',
        ...style
      }}
    >
      {prefix}{value}{suffix}
    </span>
  );
}
