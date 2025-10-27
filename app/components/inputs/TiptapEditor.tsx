'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Heading from '@tiptap/extension-heading';
import BulletList from '@tiptap/extension-bullet-list';
import ListItem from '@tiptap/extension-list-item';
import TurndownService from 'turndown';
import { marked } from 'marked';
import { useEffect, useMemo } from 'react';
import { FieldErrors } from 'react-hook-form';
import { FaBold, FaItalic, FaHeading, FaListUl } from 'react-icons/fa';

interface TiptapEditorProps {
  id: string;
  label: string;
  value: string; // Markdown string
  onChange: (value: string) => void; // Returns markdown
  disabled?: boolean;
  required?: boolean;
  errors: FieldErrors;
  placeholder?: string;
}

const TiptapEditor: React.FC<TiptapEditorProps> = ({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
  errors,
  placeholder,
}) => {
  const turndownService = useMemo(() => new TurndownService({
    headingStyle: 'atx',
    bulletListMarker: '-',
  }), []);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        bold: false,
        italic: false,
        bulletList: false,
        listItem: false,
      }),
      Bold,
      Italic,
      Heading.configure({ levels: [3] }),
      BulletList,
      ListItem,
    ],
    content: marked.parse(value || '') as string,
    editable: !disabled,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      onChange(markdown);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-neutral max-w-none focus:outline-none',
      },
    },
  });

  // Update editor when value changes externally
  useEffect(() => {
    if (editor && value) {
      const currentMarkdown = turndownService.turndown(editor.getHTML());
      if (value !== currentMarkdown) {
        editor.commands.setContent(marked.parse(value) as string);
      }
    }
  }, [value, editor, turndownService]);

  if (!editor) return null;

  return (
    <div className="w-full">
      <label 
        htmlFor={id}
        className="block text-md font-medium mb-2 text-zinc-700"
      >
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>

      {/* Toolbar */}
      <div className="flex gap-1 p-2 bg-neutral-50 border-2 border-neutral-300 rounded-t-md border-b-0">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          title="Bold"
          className={`p-2 rounded transition ${
            editor.isActive('bold') ? 'bg-white text-black' : 'text-neutral-700 hover:bg-white hover:text-black'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <FaBold size={16} />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          title="Italic"
          className={`p-2 rounded transition ${
            editor.isActive('italic') ? 'bg-white text-black' : 'text-neutral-700 hover:bg-white hover:text-black'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <FaItalic size={16} />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          title="Heading (H3)"
          className={`p-2 rounded transition ${
            editor.isActive('heading', { level: 3 }) ? 'bg-white text-black' : 'text-neutral-700 hover:bg-white hover:text-black'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <FaHeading size={16} />
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          title="Bullet List"
          className={`p-2 rounded transition ${
            editor.isActive('bulletList') ? 'bg-white text-black' : 'text-neutral-700 hover:bg-white hover:text-black'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <FaListUl size={16} />
        </button>
      </div>

      {/* Editor */}
      <div className={`overflow-y-auto bg-white border-2 rounded-b-md rounded-t-none ${
        errors[id] ? 'border-rose-500' : 'border-neutral-300'
      }`} style={{ maxHeight: 'calc(1.5em * 9 + 2rem)' }}>
        <EditorContent
          editor={editor}
          className="p-4"
        />
      </div>

      {errors[id] && (
        <p className="text-rose-500 text-sm mt-1">
          {errors[id]?.message as string || 'This field is required'}
        </p>
      )}
    </div>
  );
};

export default TiptapEditor;

