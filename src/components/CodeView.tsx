import { useState, useCallback } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewProps {
  code: string;
}

const CODE_FONT_SIZE = '17px';

export default function CodeView({ code }: CodeViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className="relative flex-1 min-h-0 overflow-auto rounded-lg border border-gray-700"
         style={{ fontSize: CODE_FONT_SIZE }}>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 z-10 px-3 py-1 font-mono rounded
                   bg-gray-700 hover:bg-gray-600 text-gray-200 transition-colors"
        style={{ fontSize: '12px' }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <SyntaxHighlighter
        language="c"
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: '#1e1e1e',
          fontSize: CODE_FONT_SIZE,
          lineHeight: '1.6',
          minHeight: '100%',
        }}
        codeTagProps={{
          style: { fontSize: CODE_FONT_SIZE, fontFamily: 'Consolas, monospace' }
        }}
        showLineNumbers
      >
        {code || '// Configure peripherals to generate code'}
      </SyntaxHighlighter>
    </div>
  );
}
