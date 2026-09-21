"use client";

import React from "react";
import { ExternalLink, ChevronRight } from "lucide-react";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

/**
 * Custom High-Contrast Palantir Gotham Markdown Renderer.
 * Completely eliminates raw asterisks (***, **) and unstyled markdown tags,
 * replacing them with clean typography, styled dividers, callout boxes, and badge highlights.
 */
export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  if (!content) return null;

  // Split lines
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let inList = false;
  let listItems: React.ReactNode[] = [];
  let inBlockquote = false;
  let blockquoteLines: string[] = [];
  let inCodeBlock = false;
  let codeBlockLines: string[] = [];

  const flushList = (key: string) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} className="my-2 space-y-1 pl-1">
          {listItems}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushBlockquote = (key: string) => {
    if (inBlockquote && blockquoteLines.length > 0) {
      const bqText = blockquoteLines.join("\n");
      elements.push(
        <div
          key={`bq-${key}`}
          className="my-2.5 rounded-r border-l-2 border-[#2b95d6] bg-[#101418]/90 p-2.5 text-xs text-[#c5d1de] shadow-inner"
        >
          <MarkdownInline text={bqText} />
        </div>
      );
      blockquoteLines = [];
      inBlockquote = false;
    }
  };

  const flushCodeBlock = (key: string) => {
    if (inCodeBlock && codeBlockLines.length > 0) {
      elements.push(
        <pre
          key={`code-${key}`}
          className="my-2 overflow-x-auto rounded border border-[#293742] bg-[#101418] p-2.5 font-mono text-[11px] text-[#8a9ba8]"
        >
          <code>{codeBlockLines.join("\n")}</code>
        </pre>
      );
      codeBlockLines = [];
      inCodeBlock = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // Code block toggle
    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock(`${index}`);
      } else {
        flushList(`${index}`);
        flushBlockquote(`${index}`);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Horizontal Rule (*** or --- or ___ or *** on its own line)
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      flushList(`${index}`);
      flushBlockquote(`${index}`);
      elements.push(
        <hr key={`hr-${index}`} className="my-3 border-t border-[#293742]" />
      );
      return;
    }

    // Blockquote
    if (trimmed.startsWith(">")) {
      flushList(`${index}`);
      inBlockquote = true;
      blockquoteLines.push(trimmed.replace(/^>\s?/, ""));
      return;
    } else if (inBlockquote) {
      flushBlockquote(`${index}`);
    }

    // Empty line
    if (!trimmed) {
      flushList(`${index}`);
      flushBlockquote(`${index}`);
      elements.push(<div key={`space-${index}`} className="h-1.5" />);
      return;
    }

    // Headers
    if (trimmed.startsWith("### ")) {
      flushList(`${index}`);
      flushBlockquote(`${index}`);
      elements.push(
        <h4
          key={`h3-${index}`}
          className="mt-3 mb-1 font-mono text-xs font-bold uppercase tracking-wider text-[#2b95d6] flex items-center gap-1.5"
        >
          <span className="inline-block h-1.5 w-1.5 bg-[#2b95d6]" />
          <MarkdownInline text={trimmed.substring(4)} />
        </h4>
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList(`${index}`);
      flushBlockquote(`${index}`);
      elements.push(
        <h3
          key={`h2-${index}`}
          className="mt-3 mb-1.5 text-sm font-bold text-[#f5f8fa] border-b border-[#293742]/80 pb-1"
        >
          <MarkdownInline text={trimmed.substring(3)} />
        </h3>
      );
      return;
    }

    if (trimmed.startsWith("# ")) {
      flushList(`${index}`);
      flushBlockquote(`${index}`);
      elements.push(
        <h2
          key={`h1-${index}`}
          className="mt-3.5 mb-2 text-base font-bold text-white border-b border-[#293742] pb-1.5"
        >
          <MarkdownInline text={trimmed.substring(2)} />
        </h2>
      );
      return;
    }

    // Bullet Lists (- or * or •)
    const listMatch = trimmed.match(/^[-*•]\s+(.*)$/);
    if (listMatch) {
      flushBlockquote(`${index}`);
      inList = true;
      listItems.push(
        <li key={`li-${index}`} className="flex items-start gap-2 text-xs leading-relaxed text-[#e1e8ed]">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#2b95d6]/80" />
          <div className="flex-1">
            <MarkdownInline text={listMatch[1]} />
          </div>
        </li>
      );
      return;
    }

    // Numbered Lists (1. 2. etc.)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      flushBlockquote(`${index}`);
      inList = true;
      listItems.push(
        <li key={`num-${index}`} className="flex items-start gap-2 text-xs leading-relaxed text-[#e1e8ed]">
          <span className="font-mono text-[10px] font-bold text-[#8a9ba8] shrink-0 mt-0.5">
            {numMatch[1]}.
          </span>
          <div className="flex-1">
            <MarkdownInline text={numMatch[2]} />
          </div>
        </li>
      );
      return;
    }

    // Regular Paragraph
    flushList(`${index}`);
    flushBlockquote(`${index}`);
    elements.push(
      <p key={`p-${index}`} className="text-xs leading-relaxed text-[#e1e8ed] mb-1.5">
        <MarkdownInline text={trimmed} />
      </p>
    );
  });

  flushList("end");
  flushBlockquote("end");
  flushCodeBlock("end");

  return <div className={`font-sans ${className}`}>{elements}</div>;
}

/**
 * Handles inline markdown: bold (***, **), italic (*, _), inline code (`code`), links ([text](url))
 */
function MarkdownInline({ text }: { text: string }) {
  if (!text) return null;

  // Replace ***text*** with bold-italic
  // Replace **text** with strong
  // Replace `code` with styled code
  // Replace [text](url) with a link
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;

  // Regex to match markdown links, bold-italic, bold, italic, code
  const inlineRegex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/;

  while (remaining.length > 0) {
    const match = remaining.match(inlineRegex);
    if (!match || match.index === undefined) {
      parts.push(remaining);
      break;
    }

    if (match.index > 0) {
      parts.push(remaining.substring(0, match.index));
    }

    const matchedStr = match[0];

    // Bold-italic (***text***)
    if (matchedStr.startsWith("***") && matchedStr.endsWith("***")) {
      const inner = matchedStr.slice(3, -3);
      parts.push(
        <strong key={`bi-${keyIdx++}`} className="font-bold italic text-white">
          {inner}
        </strong>
      );
    }
    // Bold (**text**)
    else if (matchedStr.startsWith("**") && matchedStr.endsWith("**")) {
      const inner = matchedStr.slice(2, -2);
      parts.push(
        <strong key={`b-${keyIdx++}`} className="font-semibold text-white">
          {inner}
        </strong>
      );
    }
    // Italic (*text*)
    else if (matchedStr.startsWith("*") && matchedStr.endsWith("*")) {
      const inner = matchedStr.slice(1, -1);
      parts.push(
        <em key={`i-${keyIdx++}`} className="italic text-[#c5d1de]">
          {inner}
        </em>
      );
    }
    // Inline code (`code`)
    else if (matchedStr.startsWith("`") && matchedStr.endsWith("`")) {
      const inner = matchedStr.slice(1, -1);
      parts.push(
        <code
          key={`code-${keyIdx++}`}
          className="rounded bg-[#101418] border border-[#293742] px-1 py-0.2 font-mono text-[11px] text-[#2b95d6]"
        >
          {inner}
        </code>
      );
    }
    // Link ([text](url))
    else if (matchedStr.startsWith("[")) {
      const linkText = match[6];
      const linkUrl = match[7];
      parts.push(
        <a
          key={`a-${keyIdx++}`}
          href={linkUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-0.5 text-[#2b95d6] hover:underline font-medium"
        >
          <span>{linkText}</span>
          <ExternalLink className="h-2.5 w-2.5 opacity-70" />
        </a>
      );
    }

    remaining = remaining.substring(match.index + matchedStr.length);
  }

  return <>{parts}</>;
}
