import React from 'react';

interface FormattedTextProps {
  content?: string | null;
  className?: string;
  paragraphClassName?: string;
  headingClassName?: string;
  listClassName?: string;
}

export default function FormattedText({
  content,
  className = '',
  paragraphClassName = 'text-gray-700 text-sm leading-relaxed mb-3',
  headingClassName = 'text-base font-bold text-gray-900 mt-4 mb-2',
  listClassName = 'list-disc pl-5 text-gray-700 text-sm leading-relaxed my-2 space-y-1',
}: FormattedTextProps) {
  if (!content || typeof content !== 'string') return null;
  const trimmed = content.trim();
  if (!trimmed) return null;

  // Check if content contains markdown tokens (# , ## , ** , - , * , 1. , > )
  const hasMarkdown = /(?:^|\n)(#{1,6}\s|\*|\-|\d+\.|\>)|(\*\*|__|\*|_)/.test(trimmed);

  if (!hasMarkdown) {
    // Simple multi-paragraph / line-break text
    const paragraphs = trimmed.split(/\n\s*\n/);
    return (
      <div className={`space-y-3 ${className}`}>
        {paragraphs.map((p, idx) => (
          <p key={idx} className={`${paragraphClassName} whitespace-pre-line`}>
            {renderInlineMarkdown(p)}
          </p>
        ))}
      </div>
    );
  }

  // Parse markdown line by line
  const lines = trimmed.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: { type: 'ul' | 'ol'; items: string[] } | null = null;

  function flushList(keyPrefix: number) {
    if (!currentList) return;
    const ListTag = currentList.type === 'ul' ? 'ul' : 'ol';
    const listStyleClass = currentList.type === 'ul' ? listClassName : `${listClassName} list-decimal`;
    elements.push(
      <ListTag key={`list-${keyPrefix}`} className={listStyleClass}>
        {currentList.items.map((item, iIdx) => (
          <li key={iIdx}>{renderInlineMarkdown(item)}</li>
        ))}
      </ListTag>
    );
    currentList = null;
  }

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    if (!trimmedLine) {
      flushList(index);
      return;
    }

    // Headings (# , ## , ### )
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushList(index);
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const customHeadingClass =
        level === 1
          ? 'text-xl font-black text-gray-900 mt-5 mb-2'
          : level === 2
          ? 'text-lg font-extrabold text-gray-900 mt-4 mb-2'
          : headingClassName;

      elements.push(
        <div key={index} className={customHeadingClass}>
          {renderInlineMarkdown(text)}
        </div>
      );
      return;
    }

    // Blockquote (> )
    if (trimmedLine.startsWith('> ')) {
      flushList(index);
      elements.push(
        <blockquote
          key={index}
          className="border-l-4 border-amber-400 pl-4 py-1.5 my-3 bg-amber-50/60 rounded-r-lg text-amber-950 text-xs sm:text-sm italic"
        >
          {renderInlineMarkdown(trimmedLine.slice(2))}
        </blockquote>
      );
      return;
    }

    // Bullet list (- , * , • )
    const bulletMatch = trimmedLine.match(/^[\-\*\•]\s+(.+)$/);
    if (bulletMatch) {
      if (!currentList || currentList.type !== 'ul') {
        flushList(index);
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(bulletMatch[1]);
      return;
    }

    // Numbered list (1. , 2. )
    const numberMatch = trimmedLine.match(/^\d+\.\s+(.+)$/);
    if (numberMatch) {
      if (!currentList || currentList.type !== 'ol') {
        flushList(index);
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(numberMatch[1]);
      return;
    }

    // Regular paragraph line
    flushList(index);
    elements.push(
      <p key={index} className={`${paragraphClassName} whitespace-pre-line`}>
        {renderInlineMarkdown(trimmedLine)}
      </p>
    );
  });

  flushList(lines.length);

  return <div className={`space-y-2 ${className}`}>{elements}</div>;
}

/**
 * Parses inline markdown: **bold**, *italic*, [link](url)
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const tokenRegex = /(\*\*[^*]+\*\*|_[^_]+_|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    if ((part.startsWith('*') && part.endsWith('*')) || (part.startsWith('_') && part.endsWith('_'))) {
      return <em key={idx} className="italic">{part.slice(1, -1)}</em>;
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline font-semibold"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}
