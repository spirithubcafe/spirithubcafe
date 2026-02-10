import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { cn } from '../../lib/utils';
import { fileUploadService } from '../../services/fileUploadService';
import { apiClient } from '../../services/apiClient';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Undo2,
  Redo2,
  RemoveFormatting,
  Palette,
  Highlighter,
  Eye,
  Pencil,
  Type,
  Minus,
  Subscript,
  Superscript,
  Table,
  IndentIncrease,
  IndentDecrease,
  Upload,
  X,
  Loader2,
  LinkIcon as Link2Icon,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface HtmlEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  dir?: 'ltr' | 'rtl';
  className?: string;
  minHeight?: string;
}

type ViewMode = 'editor' | 'code' | 'preview' | 'split';

// ─── Toolbar Button ─────────────────────────────────────────────────────────
const ToolbarBtn: React.FC<{
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string;
}> = ({ onClick, active, disabled, title, children, className }) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    disabled={disabled}
    title={title}
    className={cn(
      'flex h-8 w-8 items-center justify-center rounded-md text-stone-600 transition-all hover:bg-stone-100 hover:text-stone-900',
      active && 'bg-stone-200 text-stone-900 shadow-inner',
      disabled && 'pointer-events-none opacity-40',
      className
    )}
  >
    {children}
  </button>
);

const ToolbarSep = () => <div className="mx-1 h-6 w-px bg-stone-200" />;

// ─── Floating Portal Popover ─────────────────────────────────────────────────
const FloatingPopover: React.FC<{
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ anchorRef, open, onClose, children }) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    const popW = 380;
    let left = rect.left;
    if (left + popW > window.innerWidth - 16) {
      left = window.innerWidth - popW - 16;
    }
    if (left < 8) left = 8;
    setPos({ top: rect.bottom + 6, left });
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return ReactDOM.createPortal(
    <div
      ref={popoverRef}
      className="fixed z-[9999] rounded-xl border border-stone-200 bg-white p-4 shadow-2xl"
      style={{ top: pos.top, left: pos.left }}
    >
      {children}
    </div>,
    document.body
  );
};

// ─── Color Picker ────────────────────────────────────────────────────────────
const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#cccccc', '#ffffff',
  '#e60000', '#ff9900', '#ffff00', '#008a00', '#0066cc', '#9933ff',
  '#ff4d4d', '#ffad33', '#ffff66', '#33cc33', '#3399ff', '#cc66ff',
  '#ffd6d6', '#ffe8cc', '#ffffcc', '#ccffcc', '#cce5ff', '#e8ccff',
];

const ColorPicker: React.FC<{
  icon: React.ReactNode;
  title: string;
  command: string;
  editorRef: React.RefObject<HTMLDivElement | null>;
}> = ({ icon, title, command, editorRef }) => {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

  const apply = (color: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, color);
    setOpen(false);
  };

  return (
    <div ref={btnRef}>
      <ToolbarBtn onClick={() => setOpen(!open)} title={title} active={open}>
        {icon}
      </ToolbarBtn>
      <FloatingPopover anchorRef={btnRef} open={open} onClose={() => setOpen(false)}>
        <div className="grid grid-cols-6 gap-1.5">
          {COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => apply(c)}
              className="h-7 w-7 rounded-md border border-stone-200 transition-transform hover:scale-110 hover:shadow-md"
              style={{ backgroundColor: c }}
              title={c}
            />
          ))}
        </div>
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => apply('')}
          className="mt-2 w-full rounded-md border border-stone-200 bg-stone-50 px-2 py-1.5 text-xs font-medium text-stone-600 hover:bg-stone-100"
        >
          Remove Color
        </button>
      </FloatingPopover>
    </div>
  );
};

// ─── Main Editor ─────────────────────────────────────────────────────────────
export const HtmlEditor: React.FC<HtmlEditorProps> = ({
  value,
  onChange,
  placeholder,
  dir = 'ltr',
  className,
  minHeight = '200px',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const codeRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const linkBtnRef = useRef<HTMLDivElement>(null);
  const tableBtnRef = useRef<HTMLDivElement>(null);
  const imageBtnRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('editor');
  const [showLinkPopover, setShowLinkPopover] = useState(false);
  const [showTablePopover, setShowTablePopover] = useState(false);
  const [showImagePopover, setShowImagePopover] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const internalUpdate = useRef(false);
  const savedSelection = useRef<Range | null>(null);

  // Save/restore selection for dialogs
  const saveSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelection.current = sel.getRangeAt(0).cloneRange();
    }
  }, []);

  const restoreSelection = useCallback(() => {
    const sel = window.getSelection();
    if (sel && savedSelection.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelection.current);
    }
  }, []);

  // Sync external value → editor
  useEffect(() => {
    if (internalUpdate.current) {
      internalUpdate.current = false;
      return;
    }
    const el = editorRef.current;
    if (el && el.innerHTML !== value) {
      el.innerHTML = value || '';
    }
  }, [value]);

  // Sync editor content when switching view modes (ref re-mounts)
  useEffect(() => {
    if (viewMode === 'editor' || viewMode === 'split') {
      const el = editorRef.current;
      if (el && el.innerHTML !== value) {
        el.innerHTML = value || '';
      }
    }
  }, [viewMode]);

  // Editor input handler
  const handleInput = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    internalUpdate.current = true;
    const html = el.innerHTML;
    onChange(html === '<br>' || html === '<div><br></div>' ? '' : html);
  }, [onChange]);

  // Code editor change
  const handleCodeChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const html = e.target.value;
    onChange(html);
    if (editorRef.current) {
      editorRef.current.innerHTML = html;
    }
  }, [onChange]);

  // Exec command helper
  const exec = useCallback((command: string, val?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, val);
    handleInput();
  }, [handleInput]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey;
    if (!mod) return;
    const map: Record<string, string> = {
      b: 'bold', i: 'italic', u: 'underline',
      z: 'undo', y: 'redo',
    };
    if (e.shiftKey && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      exec('redo');
      return;
    }
    const cmd = map[e.key.toLowerCase()];
    if (cmd) {
      e.preventDefault();
      exec(cmd);
    }
  }, [exec]);

  // Insert link
  const insertLink = useCallback((url: string) => {
    if (!url) return;
    restoreSelection();
    editorRef.current?.focus();
    document.execCommand('createLink', false, url);
    handleInput();
  }, [handleInput, restoreSelection]);

  // Insert table
  const insertTable = useCallback((rows: number, cols: number) => {
    restoreSelection();
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    let html = '<table style="width:100%;border-collapse:collapse;margin:8px 0">';
    for (let r = 0; r < rows; r++) {
      html += '<tr>';
      for (let c = 0; c < cols; c++) {
        const tag = r === 0 ? 'th' : 'td';
        const content = r === 0 ? `Col ${c + 1}` : '&nbsp;';
        html += `<${tag} style="border:1px solid #d1d5db;padding:8px 12px">${content}</${tag}>`;
      }
      html += '</tr>';
    }
    html += '</table><p><br></p>';
    document.execCommand('insertHTML', false, html);
    handleInput();
  }, [handleInput, restoreSelection]);

  // Build full image URL (API returns relative path like /uploads/images/...)
  const getFullImageUrl = useCallback((fileUrl: string) => {
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) return fileUrl;
    const base = (apiClient.defaults.baseURL || '').replace(/\/+$/, '');
    return `${base}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
  }, []);

  // Insert image from file upload
  const handleImageUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setImageUploading(true);
    try {
      const response = await fileUploadService.uploadFile(file, 'products', 'image', 'editor');
      if (response.success && response.fileUrl) {
        const fullUrl = getFullImageUrl(response.fileUrl);
        restoreSelection();
        editorRef.current?.focus();
        const imgHtml = `<img src="${fullUrl}" alt="${file.name}" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0" />`;
        document.execCommand('insertHTML', false, imgHtml);
        handleInput();
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    } finally {
      setImageUploading(false);
      setShowImagePopover(false);
    }
  }, [handleInput, restoreSelection]);

  // Insert image from URL
  const insertImageUrl = useCallback((url: string) => {
    if (!url) return;
    restoreSelection();
    editorRef.current?.focus();
    const imgHtml = `<img src="${url}" alt="" style="max-width:100%;height:auto;border-radius:8px;margin:8px 0" />`;
    document.execCommand('insertHTML', false, imgHtml);
    handleInput();
    setShowImagePopover(false);
  }, [handleInput, restoreSelection]);

  // Handle paste images
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageUpload(file);
        return;
      }
    }
  }, [handleImageUpload]);

  // Handle drop images
  const handleDrop = useCallback((e: React.DragEvent) => {
    const files = e.dataTransfer?.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        handleImageUpload(file);
        return;
      }
    }
  }, [handleImageUpload]);

  const isRtl = dir === 'rtl';
  const showToolbar = viewMode === 'editor' || viewMode === 'split';

  return (
    <div className={cn('overflow-hidden rounded-md border border-stone-300 bg-white shadow-sm transition focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500', className)}>
      {/* Hidden file input for image upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageUpload(file);
          e.target.value = '';
        }}
      />

      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-stone-200 bg-stone-50 px-2 py-1.5">
        {/* View Modes */}
        <div className="flex items-center rounded-lg bg-stone-100 p-0.5">
          {([
            { mode: 'editor' as ViewMode, icon: <Pencil className="h-3.5 w-3.5" />, title: 'Visual Editor' },
            { mode: 'code' as ViewMode, icon: <Code className="h-3.5 w-3.5" />, title: 'HTML Code' },
            { mode: 'split' as ViewMode, icon: <><Pencil className="h-3 w-3" /><Code className="h-3 w-3" /></>, title: 'Split View' },
            { mode: 'preview' as ViewMode, icon: <Eye className="h-3.5 w-3.5" />, title: 'Preview' },
          ]).map(({ mode, icon, title }) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              title={title}
              className={cn(
                'flex h-7 items-center gap-1 rounded-md px-2 text-xs font-medium transition',
                viewMode === mode
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              )}
            >
              {icon}
            </button>
          ))}
        </div>

        {showToolbar && (
          <>
            <ToolbarSep />
            <ToolbarBtn onClick={() => exec('undo')} title="Undo (Ctrl+Z)"><Undo2 className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('redo')} title="Redo (Ctrl+Y)"><Redo2 className="h-4 w-4" /></ToolbarBtn>

            <ToolbarSep />
            <ToolbarBtn onClick={() => exec('formatBlock', '<h1>')} title="Heading 1"><Heading1 className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('formatBlock', '<h2>')} title="Heading 2"><Heading2 className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('formatBlock', '<h3>')} title="Heading 3"><Heading3 className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('formatBlock', '<p>')} title="Paragraph"><Type className="h-4 w-4" /></ToolbarBtn>

            <ToolbarSep />
            <ToolbarBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)"><Bold className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)"><Italic className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)"><Underline className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('strikeThrough')} title="Strikethrough"><Strikethrough className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('subscript')} title="Subscript"><Subscript className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('superscript')} title="Superscript"><Superscript className="h-4 w-4" /></ToolbarBtn>

            <ToolbarSep />
            <ColorPicker icon={<Palette className="h-4 w-4" />} title="Text Color" command="foreColor" editorRef={editorRef} />
            <ColorPicker icon={<Highlighter className="h-4 w-4" />} title="Highlight Color" command="hiliteColor" editorRef={editorRef} />

            <ToolbarSep />
            <ToolbarBtn onClick={() => exec('justifyLeft')} title="Align Left"><AlignLeft className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('justifyCenter')} title="Align Center"><AlignCenter className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('justifyRight')} title="Align Right"><AlignRight className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('justifyFull')} title="Justify"><AlignJustify className="h-4 w-4" /></ToolbarBtn>

            <ToolbarSep />
            <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Bullet List"><List className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('insertOrderedList')} title="Numbered List"><ListOrdered className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('indent')} title="Increase Indent"><IndentIncrease className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('outdent')} title="Decrease Indent"><IndentDecrease className="h-4 w-4" /></ToolbarBtn>

            <ToolbarSep />

            {/* Link */}
            <div ref={linkBtnRef}>
              <ToolbarBtn onClick={() => { saveSelection(); setShowLinkPopover(!showLinkPopover); }} title="Insert Link" active={showLinkPopover}>
                <LinkIcon className="h-4 w-4" />
              </ToolbarBtn>
            </div>
            <ToolbarBtn onClick={() => exec('unlink')} title="Remove Link"><Unlink className="h-4 w-4" /></ToolbarBtn>

            {/* Image */}
            <div ref={imageBtnRef}>
              <ToolbarBtn onClick={() => { saveSelection(); setShowImagePopover(!showImagePopover); }} title="Insert Image" active={showImagePopover} disabled={imageUploading}>
                {imageUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
              </ToolbarBtn>
            </div>

            {/* Table */}
            <div ref={tableBtnRef}>
              <ToolbarBtn onClick={() => { saveSelection(); setShowTablePopover(!showTablePopover); }} title="Insert Table" active={showTablePopover}>
                <Table className="h-4 w-4" />
              </ToolbarBtn>
            </div>

            <ToolbarBtn onClick={() => exec('formatBlock', '<blockquote>')} title="Blockquote"><Quote className="h-4 w-4" /></ToolbarBtn>
            <ToolbarBtn onClick={() => exec('insertHorizontalRule')} title="Horizontal Rule"><Minus className="h-4 w-4" /></ToolbarBtn>

            <ToolbarSep />
            <ToolbarBtn onClick={() => exec('removeFormat')} title="Clear Formatting"><RemoveFormatting className="h-4 w-4" /></ToolbarBtn>
          </>
        )}
      </div>

      {/* ── Portal Popovers ───────────────────────────────────────────── */}
      <LinkPopover anchorRef={linkBtnRef} open={showLinkPopover} onClose={() => setShowLinkPopover(false)} onInsert={insertLink} />
      <ImagePopover anchorRef={imageBtnRef} open={showImagePopover} onClose={() => setShowImagePopover(false)} onUploadClick={() => imageInputRef.current?.click()} onUrlInsert={insertImageUrl} uploading={imageUploading} />
      <TablePopover anchorRef={tableBtnRef} open={showTablePopover} onClose={() => setShowTablePopover(false)} onInsert={insertTable} />

      {/* ── Editor Body ─────────────────────────────────────────────────── */}
      {viewMode === 'editor' && (
        <div
          ref={editorRef}
          contentEditable
          dir={dir}
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onDrop={handleDrop}
          data-placeholder={placeholder}
          className={cn(
            'html-editor-content prose max-w-none px-4 py-3 text-sm text-stone-900 outline-none',
            isRtl && 'text-right font-cairo',
            'empty:before:pointer-events-none empty:before:text-stone-400 empty:before:content-[attr(data-placeholder)]',
          )}
          style={{ minHeight, direction: dir }}
        />
      )}

      {viewMode === 'code' && (
        <textarea
          ref={codeRef}
          value={value}
          onChange={handleCodeChange}
          dir="ltr"
          spellCheck={false}
          className="w-full resize-y bg-stone-900 px-4 py-3 font-mono text-sm text-green-400 outline-none"
          style={{ minHeight }}
        />
      )}

      {viewMode === 'preview' && (
        <div
          dir={dir}
          className={cn(
            'html-editor-content prose max-w-none bg-stone-50 px-4 py-3 text-sm text-stone-700',
            isRtl && 'text-right font-cairo',
          )}
          style={{ minHeight, direction: dir }}
          dangerouslySetInnerHTML={{ __html: value || `<p class="text-stone-400">${placeholder || 'Nothing to preview'}</p>` }}
        />
      )}

      {viewMode === 'split' && (
        <div className="grid grid-cols-2">
          <div
            ref={editorRef}
            contentEditable
            dir={dir}
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            onDrop={handleDrop}
            data-placeholder={placeholder}
            className={cn(
              'html-editor-content prose max-w-none border-e border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none',
              isRtl && 'text-right font-cairo',
              'empty:before:pointer-events-none empty:before:text-stone-400 empty:before:content-[attr(data-placeholder)]',
            )}
            style={{ minHeight, direction: dir }}
          />
          <div
            dir={dir}
            className={cn(
              'html-editor-content prose max-w-none bg-stone-50/50 px-4 py-3 text-sm text-stone-700',
              isRtl && 'text-right font-cairo',
            )}
            style={{ minHeight, direction: dir }}
            dangerouslySetInnerHTML={{ __html: value || `<p class="text-stone-400">${placeholder || 'Nothing to preview'}</p>` }}
          />
        </div>
      )}

      {/* ── Status Bar ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-t border-stone-200 bg-stone-50 px-3 py-1">
        <span className="text-[10px] text-stone-400">{dir === 'rtl' ? 'RTL' : 'LTR'} • HTML</span>
        <span className="text-[10px] text-stone-400">{value.replace(/<[^>]*>/g, '').length} chars</span>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// ── Popover Sub-Components ───────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const LinkPopover: React.FC<{
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  onInsert: (url: string) => void;
}> = ({ anchorRef, open, onClose, onInsert }) => {
  const [url, setUrl] = useState('https://');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setUrl('https://'); setTimeout(() => inputRef.current?.focus(), 50); }
  }, [open]);

  const handleSubmit = () => {
    if (url && url !== 'https://') { onInsert(url); onClose(); }
  };

  return (
    <FloatingPopover anchorRef={anchorRef} open={open} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <LinkIcon className="h-4 w-4" /> Insert Link
        </p>
        <input
          ref={inputRef}
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); if (e.key === 'Escape') onClose(); }}
          className="h-9 w-72 rounded-lg border border-stone-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="https://example.com"
        />
        <div className="flex items-center gap-2 justify-end">
          <button type="button" onClick={onClose} className="h-8 rounded-lg border border-stone-200 bg-white px-4 text-xs font-medium text-stone-600 hover:bg-stone-50">Cancel</button>
          <button type="button" onClick={handleSubmit} className="h-8 rounded-lg bg-blue-600 px-4 text-xs font-medium text-white hover:bg-blue-700">Insert Link</button>
        </div>
      </div>
    </FloatingPopover>
  );
};

const ImagePopover: React.FC<{
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  onUploadClick: () => void;
  onUrlInsert: (url: string) => void;
  uploading: boolean;
}> = ({ anchorRef, open, onClose, onUploadClick, onUrlInsert, uploading }) => {
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [url, setUrl] = useState('');
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (open) { setMode('upload'); setUrl(''); } }, [open]);
  useEffect(() => { if (mode === 'url') setTimeout(() => urlInputRef.current?.focus(), 50); }, [mode]);

  return (
    <FloatingPopover anchorRef={anchorRef} open={open} onClose={onClose}>
      <div className="w-80 space-y-3">
        <p className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <ImageIcon className="h-4 w-4" /> Insert Image
        </p>
        <div className="flex rounded-lg bg-stone-100 p-0.5">
          <button type="button" onClick={() => setMode('upload')} className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition', mode === 'upload' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700')}>
            <Upload className="h-3.5 w-3.5" /> Upload
          </button>
          <button type="button" onClick={() => setMode('url')} className={cn('flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition', mode === 'url' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700')}>
            <Link2Icon className="h-3.5 w-3.5" /> URL
          </button>
        </div>
        {mode === 'upload' ? (
          <div className="space-y-2">
            <button type="button" onClick={onUploadClick} disabled={uploading} className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-stone-500 transition hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600">
              {uploading ? (<><Loader2 className="h-8 w-8 animate-spin text-blue-500" /><span className="text-sm font-medium text-blue-600">Uploading...</span></>) : (<><Upload className="h-8 w-8" /><span className="text-sm font-medium">Click to upload image</span><span className="text-xs text-stone-400">PNG, JPG, WEBP up to 5MB</span></>)}
            </button>
            <p className="text-[11px] text-stone-400 text-center">You can also paste or drag & drop images into the editor</p>
          </div>
        ) : (
          <div className="space-y-2">
            <input ref={urlInputRef} type="url" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && url) onUrlInsert(url); if (e.key === 'Escape') onClose(); }} className="h-9 w-full rounded-lg border border-stone-300 px-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="https://example.com/image.jpg" />
            <div className="flex items-center gap-2 justify-end">
              <button type="button" onClick={onClose} className="h-8 rounded-lg border border-stone-200 bg-white px-4 text-xs font-medium text-stone-600 hover:bg-stone-50">Cancel</button>
              <button type="button" onClick={() => { if (url) onUrlInsert(url); }} disabled={!url} className="h-8 rounded-lg bg-blue-600 px-4 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50">Insert</button>
            </div>
          </div>
        )}
      </div>
    </FloatingPopover>
  );
};

const TablePopover: React.FC<{
  anchorRef: React.RefObject<HTMLElement | null>;
  open: boolean;
  onClose: () => void;
  onInsert: (rows: number, cols: number) => void;
}> = ({ anchorRef, open, onClose, onInsert }) => {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [hoverRow, setHoverRow] = useState(0);
  const [hoverCol, setHoverCol] = useState(0);
  const maxR = 8;
  const maxC = 8;

  useEffect(() => { if (open) { setRows(3); setCols(3); setHoverRow(0); setHoverCol(0); } }, [open]);

  return (
    <FloatingPopover anchorRef={anchorRef} open={open} onClose={onClose}>
      <div className="space-y-3">
        <p className="text-sm font-semibold text-stone-700 flex items-center gap-2">
          <Table className="h-4 w-4" /> Insert Table
        </p>
        <div className="inline-grid gap-1" style={{ gridTemplateColumns: `repeat(${maxC}, 1fr)` }}>
          {Array.from({ length: maxR * maxC }).map((_, idx) => {
            const r = Math.floor(idx / maxC) + 1;
            const c = (idx % maxC) + 1;
            const isActive = r <= hoverRow && c <= hoverCol;
            return (
              <button key={idx} type="button" onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => { setHoverRow(r); setHoverCol(c); }} onClick={() => { onInsert(r, c); onClose(); }}
                className={cn('h-5 w-5 rounded-sm border transition-all', isActive ? 'border-blue-400 bg-blue-100' : 'border-stone-200 bg-white hover:border-stone-300')} />
            );
          })}
        </div>
        <p className="text-xs text-stone-500 text-center">{hoverRow > 0 && hoverCol > 0 ? `${hoverRow} × ${hoverCol}` : 'Hover to select size'}</p>
        <div className="flex items-center gap-2 border-t border-stone-100 pt-3">
          <label className="flex items-center gap-1.5 text-xs text-stone-600">
            Rows
            <input type="number" min={1} max={20} value={rows} onChange={(e) => setRows(+e.target.value)} className="h-7 w-12 rounded-md border border-stone-300 px-1.5 text-center text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </label>
          <X className="h-3 w-3 text-stone-300" />
          <label className="flex items-center gap-1.5 text-xs text-stone-600">
            Cols
            <input type="number" min={1} max={10} value={cols} onChange={(e) => setCols(+e.target.value)} className="h-7 w-12 rounded-md border border-stone-300 px-1.5 text-center text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
          </label>
          <button type="button" onClick={() => { onInsert(rows, cols); onClose(); }} className="ms-auto h-7 rounded-lg bg-blue-600 px-3 text-xs font-medium text-white hover:bg-blue-700">Insert</button>
        </div>
      </div>
    </FloatingPopover>
  );
};

export default HtmlEditor;
