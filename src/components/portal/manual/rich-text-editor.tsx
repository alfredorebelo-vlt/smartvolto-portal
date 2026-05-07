"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Link as LinkIcon, Undo2, Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-[var(--vd-blue-500)] underline" },
      }),
      Placeholder.configure({ placeholder: placeholder ?? "Escreve o conteúdo do artigo…" }),
    ],
    content: value,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "vd-richtext p-4 focus:outline-none min-h-[300px]",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  if (!editor) return null;

  function setLink() {
    const previous = editor!.getAttributes("link").href;
    const url = window.prompt("URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-[var(--border)] bg-[var(--muted)] px-2 py-1.5">
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Negrito">
          <Bold className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Itálico">
          <Italic className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")} title="Riscado">
          <Strikethrough className="size-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })} title="Título 1">
          <Heading1 className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Título 2">
          <Heading2 className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Título 3">
          <Heading3 className="size-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Lista">
          <List className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Lista numerada">
          <ListOrdered className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Citação">
          <Quote className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
          <LinkIcon className="size-3.5" />
        </ToolbarButton>

        <Divider />

        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Desfazer" disabled={!editor.can().undo()}>
          <Undo2 className="size-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Refazer" disabled={!editor.can().redo()}>
          <Redo2 className="size-3.5" />
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  onClick, active, disabled, title, children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "grid size-7 place-items-center rounded text-[var(--muted-foreground)] transition-colors",
        active && "bg-[var(--accent)] text-[var(--foreground)]",
        !active && !disabled && "hover:bg-[var(--accent)]",
        disabled && "opacity-30",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className="mx-1 h-5 w-px bg-[var(--border)]" />;
}
