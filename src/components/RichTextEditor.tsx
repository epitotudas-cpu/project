import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Markdown } from 'tiptap-markdown';
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link2,
  Unlink,
  RemoveFormatting,
  Undo2,
  Redo2,
} from 'lucide-react';
import { sanitizeExternalUrl } from '../lib/urlUtils';

interface RichTextEditorProps {
  value: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  minHeightClass?: string;
  maxLength?: number;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  ariaLabel?: string;
}

function getMarkdownFromEditor(editor: ReturnType<typeof useEditor>): string {
  if (!editor) return '';
  const storage = editor.storage as unknown as { markdown?: { getMarkdown?: () => string } };
  if (storage?.markdown?.getMarkdown) {
    return storage.markdown.getMarkdown();
  }
  return editor.getText();
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Írja be a szöveget...',
  minHeightClass = 'min-h-[120px]',
  maxLength,
  backgroundColor,
  borderColor,
  textColor,
  ariaLabel,
}: RichTextEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        blockquote: false,
        horizontalRule: false,
      }),
      Link.configure({
        openOnClick: false,
        autolink: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank',
          class: 'text-amber-400 underline hover:text-amber-300',
        },
        validate: (href) =>
          Boolean(sanitizeExternalUrl(href, { allowAutoHttps: true, allowRelative: true })),
      }),
      Placeholder.configure({
        placeholder,
      }),
      Markdown.configure({
        html: false,
        tightLists: true,
        bulletListMarker: '-',
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        'aria-label': ariaLabel || placeholder,
        class: `prose prose-invert prose-sm max-w-none w-full px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed focus:outline-none break-words ${minHeightClass}`,
      },
    },
    onUpdate: ({ editor: activeEditor }) => {
      const md = getMarkdownFromEditor(activeEditor);
      onChange(md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    const incoming = value || '';
    const current = getMarkdownFromEditor(editor);
    if (incoming !== current) {
      editor.commands.setContent(incoming, false);
    }
  }, [editor, value]);

  const handleOpenLinkPanel = () => {
    if (!editor) return;
    const existingHref = (editor.getAttributes('link')?.href as string | undefined) || '';
    setLinkUrl(existingHref);
    setLinkError(null);
    setLinkOpen((prev) => !prev);
  };

  const handleApplyLink = () => {
    if (!editor) return;
    const trimmed = linkUrl.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setLinkOpen(false);
      setLinkError(null);
      return;
    }
    const safeUrl = sanitizeExternalUrl(trimmed, {
      allowAutoHttps: true,
      allowRelative: true,
    });
    if (!safeUrl) {
      setLinkError('Csak biztonságos http(s) vagy relatív hivatkozás adható meg.');
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: safeUrl }).run();
    setLinkOpen(false);
    setLinkError(null);
  };

  const handleRemoveLink = () => {
    if (!editor) return;
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setLinkOpen(false);
    setLinkError(null);
  };

  const currentLength = (value || '').length;
  const isOverLimit = typeof maxLength === 'number' && currentLength > maxLength;

  const toolbarBtnClass = (active: boolean, disabled = false) =>
    `p-1.5 rounded-lg border text-xs transition-colors flex items-center justify-center ${
      disabled
        ? 'opacity-35 cursor-not-allowed border-transparent text-slate-500'
        : active
          ? 'bg-amber-400 text-black border-amber-400 font-bold cursor-pointer'
          : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700 cursor-pointer'
    }`;

  return (
    <div className="space-y-1.5">
      <div
        style={{
          backgroundColor: backgroundColor || '#0f172a',
          borderColor: isOverLimit ? '#ef4444' : borderColor || '#334155',
          color: textColor || '#f1f5f9',
        }}
        className="rounded-xl border overflow-clip focus-within:ring-2 focus-within:ring-amber-400/50 transition-shadow"
      >
        {/* Toolbar */}
        <div
          style={{ borderColor: borderColor || '#334155' }}
          className="sticky top-0 z-10 flex flex-wrap items-center gap-1 px-2.5 py-2 bg-slate-900/95 border-b"
        >
          <button
            type="button"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            className={toolbarBtnClass(Boolean(editor?.isActive('bold')))}
            title="Félkövér"
            aria-label="Félkövér"
          >
            <Bold size={14} />
          </button>
          <button
            type="button"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            className={toolbarBtnClass(Boolean(editor?.isActive('italic')))}
            title="Dőlt"
            aria-label="Dőlt"
          >
            <Italic size={14} />
          </button>
          <span className="w-px h-4 bg-slate-700 mx-0.5" />
          <button
            type="button"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            className={toolbarBtnClass(Boolean(editor?.isActive('heading', { level: 2 })))}
            title="Címsor 2"
            aria-label="Címsor 2"
          >
            <Heading2 size={14} />
          </button>
          <button
            type="button"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            className={toolbarBtnClass(Boolean(editor?.isActive('heading', { level: 3 })))}
            title="Címsor 3"
            aria-label="Címsor 3"
          >
            <Heading3 size={14} />
          </button>
          <span className="w-px h-4 bg-slate-700 mx-0.5" />
          <button
            type="button"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            className={toolbarBtnClass(Boolean(editor?.isActive('bulletList')))}
            title="Felsorolás"
            aria-label="Felsorolás"
          >
            <List size={14} />
          </button>
          <button
            type="button"
            disabled={!editor}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            className={toolbarBtnClass(Boolean(editor?.isActive('orderedList')))}
            title="Számozott lista"
            aria-label="Számozott lista"
          >
            <ListOrdered size={14} />
          </button>
          <span className="w-px h-4 bg-slate-700 mx-0.5" />
          <button
            type="button"
            disabled={!editor}
            onClick={handleOpenLinkPanel}
            className={toolbarBtnClass(Boolean(editor?.isActive('link') || linkOpen))}
            title="Hivatkozás beszúrása / szerkesztése"
            aria-label="Hivatkozás"
          >
            <Link2 size={14} />
          </button>
          {editor?.isActive('link') && (
            <button
              type="button"
              onClick={handleRemoveLink}
              className={toolbarBtnClass(false)}
              title="Hivatkozás eltávolítása"
              aria-label="Hivatkozás eltávolítása"
            >
              <Unlink size={14} />
            </button>
          )}
          <button
            type="button"
            disabled={!editor}
            onClick={() => editor?.chain().focus().unsetAllMarks().clearNodes().run()}
            className={toolbarBtnClass(false)}
            title="Formázás törlése"
            aria-label="Formázás törlése"
          >
            <RemoveFormatting size={14} />
          </button>
          <span className="w-px h-4 bg-slate-700 mx-0.5" />
          <button
            type="button"
            disabled={!editor || !editor.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
            className={toolbarBtnClass(false, !editor || !editor.can().undo())}
            title="Visszavonás"
            aria-label="Visszavonás"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            disabled={!editor || !editor.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
            className={toolbarBtnClass(false, !editor || !editor.can().redo())}
            title="Újra"
            aria-label="Újra"
          >
            <Redo2 size={14} />
          </button>
        </div>

        {/* Inline Link Panel */}
        {linkOpen && (
          <div
            style={{ borderColor: borderColor || '#334155' }}
            className="px-3 py-2 bg-slate-900/95 border-b space-y-1.5"
          >
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  setLinkError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyLink();
                  }
                }}
                placeholder="https://pelda.hu/adatlap"
                className="flex-1 bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-400 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-400"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleApplyLink}
                  className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs rounded-lg cursor-pointer"
                >
                  Alkalmaz
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLinkOpen(false);
                    setLinkError(null);
                  }}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  Mégse
                </button>
              </div>
            </div>
            {linkError && <p className="text-[11px] text-red-400 font-semibold">{linkError}</p>}
          </div>
        )}

        {/* Editable WYSIWYG Area */}
        <div
          className={[
            'w-full',
            '[&_.ProseMirror]:outline-none',
            '[&_.ProseMirror_h2]:text-base [&_.ProseMirror_h2]:font-extrabold [&_.ProseMirror_h2]:text-amber-300 [&_.ProseMirror_h2]:mt-2 [&_.ProseMirror_h2]:mb-1',
            '[&_.ProseMirror_h3]:text-sm [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:text-slate-100 [&_.ProseMirror_h3]:mt-2 [&_.ProseMirror_h3]:mb-1',
            '[&_.ProseMirror_p]:my-1',
            '[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ul]:my-1.5',
            '[&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_ol]:my-1.5',
            '[&_.ProseMirror_strong]:font-bold [&_.ProseMirror_strong]:text-white',
            '[&_.ProseMirror_em]:italic',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
            '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          ].join(' ')}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {typeof maxLength === 'number' && (
        <div className="flex items-center justify-between text-[11px]">
          <span className={isOverLimit ? 'text-red-400 font-bold' : 'text-slate-400'}>
            {isOverLimit
              ? `Túllépte a megengedett ${maxLength} karakteres korlátot!`
              : 'Mentett formátum: Markdown'}
          </span>
          <span className={isOverLimit ? 'text-red-400 font-bold' : 'text-slate-400'}>
            {currentLength} / {maxLength} karakter
          </span>
        </div>
      )}
    </div>
  );
}
