import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';

/**
 * Enhanced, Clean Document Editor powered by Tiptap.
 * Reuses existing content format and save APIs.
 *
 * Features:
 * - Centered white document inside a light-grey workspace (~900px max width).
 * - Compact, sticky toolbar wrapping cleanly on smaller screens.
 * - Bold, Italic, Heading, Bullet List, Numbered List, Undo, Redo, Insert Table.
 * - Dynamic context-aware Table Controls: Add/Delete Row, Add/Delete Column via editor.isActive('table').
 * - Preserves content across Preview, Edit, and Save.
 */
export function TiptapDocumentEditor({
  content = '',
  onChange,
  onSave,
  isEditable = true,
  placeholder = 'Write document content here...'
}) {
  const isUpdatingRef = useRef(false);
  const [, setSelectionTick] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: { depth: 50 },
        heading: { levels: [1, 2, 3, 4] }
      }),
      Table.configure({
        resizable: true
      }),
      TableRow,
      TableHeader,
      TableCell
    ],
    content: content || '',
    editable: isEditable,
    onUpdate: ({ editor }) => {
      if (onChange) {
        isUpdatingRef.current = true;
        const html = editor.getHTML();
        onChange(html === '<p></p>' ? '' : html);
      }
    },
    onSelectionUpdate: () => {
      // Re-render toolbar state when cursor or selection moves
      setSelectionTick((prev) => prev + 1);
    },
    onTransaction: () => {
      setSelectionTick((prev) => prev + 1);
    }
  });

  // Sync external changes safely (e.g. template change or save reloads) without resetting on typing
  useEffect(() => {
    if (!editor) return;
    if (isUpdatingRef.current) {
      isUpdatingRef.current = false;
      return;
    }
    const currentHtml = editor.getHTML();
    if (content !== currentHtml && (content || currentHtml !== '<p></p>')) {
      editor.commands.setContent(content || '', false);
    }
  }, [content, editor]);

  // Update editable mode when prop toggles between Edit and Preview
  useEffect(() => {
    if (editor && editor.isEditable !== isEditable) {
      editor.setEditable(isEditable);
    }
  }, [isEditable, editor]);

  if (!editor) {
    return (
      <div className="tiptap-workspace-container">
        <div className="tiptap-doc-canvas">
          <div dangerouslySetInnerHTML={{ __html: content }} />
        </div>
      </div>
    );
  }

  const isTableActive = editor.isActive('table');

  return (
    <div className="tiptap-workspace-container">
      {/* Sticky Compact Toolbar (Only shown in Edit mode) */}
      {isEditable && (
        <div className="tiptap-sticky-toolbar-wrapper">
          <div className="tiptap-toolbar" role="toolbar" aria-label="Document Formatting">
            {/* History Controls */}
            <div className="tiptap-btn-group">
              <button
                type="button"
                onClick={() => editor.chain().focus().undo().run()}
                disabled={!editor.can().undo()}
                title="Undo (Ctrl+Z)"
                className="tiptap-btn"
              >
                ↺ Undo
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().redo().run()}
                disabled={!editor.can().redo()}
                title="Redo (Ctrl+Y)"
                className="tiptap-btn"
              >
                ↻ Redo
              </button>
            </div>

            <span className="tiptap-divider" />

            {/* Typography Controls */}
            <div className="tiptap-btn-group">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().toggleBold()}
                className={`tiptap-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
                title="Bold (Ctrl+B)"
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().toggleItalic()}
                className={`tiptap-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
                title="Italic (Ctrl+I)"
              >
                <em>I</em>
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`tiptap-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
                title="Heading 2"
              >
                H2
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                className={`tiptap-btn ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
                title="Heading 3"
              >
                H3
              </button>
            </div>

            <span className="tiptap-divider" />

            {/* List Controls */}
            <div className="tiptap-btn-group">
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`tiptap-btn ${editor.isActive('bulletList') ? 'is-active' : ''}`}
                title="Bullet List"
              >
                • List
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`tiptap-btn ${editor.isActive('orderedList') ? 'is-active' : ''}`}
                title="Numbered List"
              >
                1. List
              </button>
            </div>

            <span className="tiptap-divider" />

            {/* Table Controls */}
            <div className="tiptap-btn-group">
              <button
                type="button"
                onClick={() =>
                  editor
                    .chain()
                    .focus()
                    .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                    .run()
                }
                title="Insert 3x3 Table"
                className="tiptap-btn"
              >
                ⊞ Table
              </button>

              {/* Dynamic Context Controls: Active only when cursor is inside a table */}
              {isTableActive && (
                <>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addRowAfter().run()}
                    disabled={!editor.can().addRowAfter()}
                    title="Add Row After"
                    className="tiptap-btn tiptap-table-btn"
                  >
                    + Row
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteRow().run()}
                    disabled={!editor.can().deleteRow()}
                    title="Delete Current Row"
                    className="tiptap-btn tiptap-table-btn text-danger"
                  >
                    - Row
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                    disabled={!editor.can().addColumnAfter()}
                    title="Add Column After"
                    className="tiptap-btn tiptap-table-btn"
                  >
                    + Col
                  </button>
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().deleteColumn().run()}
                    disabled={!editor.can().deleteColumn()}
                    title="Delete Current Column"
                    className="tiptap-btn tiptap-table-btn text-danger"
                  >
                    - Col
                  </button>
                </>
              )}
            </div>

            {/* Optional Save Shortcut */}
            {onSave && (
              <>
                <span className="tiptap-divider" />
                <button
                  type="button"
                  onClick={() => onSave(editor.getHTML())}
                  className="tiptap-btn tiptap-save-btn"
                  title="Save changes"
                >
                  💾 Save
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Centered White Document Canvas */}
      <div className="tiptap-doc-canvas">
        <EditorContent editor={editor} className="tiptap-editor-content" />
      </div>
    </div>
  );
}
