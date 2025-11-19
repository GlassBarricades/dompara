'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Введите описание...',
  className = '',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2 prose-headings:mt-2 prose-headings:mb-1 prose-p:my-1',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const currentHtml = editor.getHTML();
    // Обновляем только если значение действительно изменилось
    // и это не было изменение из самого редактора
    if (value !== currentHtml) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={`rounded-md border bg-background ${className}`}>
      <div className="border-b p-2 flex gap-1 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-accent ${
            editor.isActive('bold') ? 'bg-accent font-semibold' : ''
          }`}
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-accent ${
            editor.isActive('italic') ? 'bg-accent font-semibold' : ''
          }`}
        >
          <em>I</em>
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-accent ${
            editor.isActive('bulletList') ? 'bg-accent font-semibold' : ''
          }`}
        >
          • Список
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-accent ${
            editor.isActive('orderedList') ? 'bg-accent font-semibold' : ''
          }`}
        >
          1. Список
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`px-2 py-1 text-sm rounded hover:bg-accent ${
            editor.isActive('paragraph') ? 'bg-accent font-semibold' : ''
          }`}
        >
          ¶
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 text-sm rounded hover:bg-accent ${
            editor.isActive('heading', { level: 2 }) ? 'bg-accent font-semibold' : ''
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 text-sm rounded hover:bg-accent ${
            editor.isActive('heading', { level: 3 }) ? 'bg-accent font-semibold' : ''
          }`}
        >
          H3
        </button>
      </div>
      <EditorContent editor={editor} className="min-h-[120px] max-h-[400px] overflow-y-auto" />
    </div>
  );
}

