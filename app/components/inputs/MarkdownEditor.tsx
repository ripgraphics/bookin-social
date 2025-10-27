'use client';

import { FieldErrors } from 'react-hook-form';
import dynamic from 'next/dynamic';
import '@uiw/react-md-editor/markdown-editor.css';
import '@uiw/react-markdown-preview/markdown.css';

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
);

interface MarkdownEditorProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  errors: FieldErrors;
  rows?: number;
  placeholder?: string;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  id,
  label,
  value,
  onChange,
  disabled,
  required,
  errors,
  placeholder,
}) => {
  return (
    <div className="w-full">
      <label 
        htmlFor={id}
        className="block text-md font-medium mb-2 text-zinc-700"
      >
        {label}
        {required && <span className="text-rose-500 ml-1">*</span>}
      </label>
      
      <div data-color-mode="light">
        <MDEditor
          value={value}
          onChange={(val) => onChange(val || '')}
          preview="live"
          hideToolbar={false}
          visibleDragbar={false}
          height={200}
          commands={[
            {
              name: 'bold',
              keyCommand: 'bold',
              buttonProps: { 'aria-label': 'Add bold text' },
              icon: (
                <svg width="12" height="12" viewBox="0 0 520 520">
                  <path fill="currentColor" d="M260 420c-48.6 0-88-39.4-88-88V188c0-48.6 39.4-88 88-88h132c13.3 0 24 10.7 24 24s-10.7 24-24 24H260c-22.1 0-40 17.9-40 40v144c0 22.1 17.9 40 40 40h132c13.3 0 24 10.7 24 24s-10.7 24-24 24H260z" />
                </svg>
              ),
            },
            {
              name: 'italic',
              keyCommand: 'italic',
              buttonProps: { 'aria-label': 'Add italic text' },
              icon: (
                <svg width="12" height="12" viewBox="0 0 520 520">
                  <path fill="currentColor" d="M320 48c13.3 0 24 10.7 24 24s-10.7 24-24 24h-58.7l-89.6 320H232c13.3 0 24 10.7 24 24s-10.7 24-24 24H120c-13.3 0-24-10.7-24-24s10.7-24 24-24h58.7l89.6-320H208c-13.3 0-24-10.7-24-24s10.7-24 24-24h112z" />
                </svg>
              ),
            },
            {
              name: 'heading3',
              keyCommand: 'heading3',
              buttonProps: { 'aria-label': 'Add heading' },
              icon: (
                <svg width="12" height="12" viewBox="0 0 520 520">
                  <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="280" fontWeight="bold" fill="currentColor">H3</text>
                </svg>
              ),
            },
            {
              name: 'unorderedListCommand',
              keyCommand: 'unorderedListCommand',
              buttonProps: { 'aria-label': 'Add unordered list' },
              icon: (
                <svg width="12" height="12" viewBox="0 0 520 520">
                  <circle cx="60" cy="130" r="30" fill="currentColor" />
                  <circle cx="60" cy="260" r="30" fill="currentColor" />
                  <circle cx="60" cy="390" r="30" fill="currentColor" />
                  <rect x="120" y="110" width="340" height="40" rx="8" fill="currentColor" />
                  <rect x="120" y="240" width="340" height="40" rx="8" fill="currentColor" />
                  <rect x="120" y="370" width="340" height="40" rx="8" fill="currentColor" />
                </svg>
              ),
            },
          ]}
          extraCommands={[]}
          textareaProps={{
            placeholder: placeholder || 'Enter description...',
            disabled: disabled,
          }}
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

export default MarkdownEditor;
