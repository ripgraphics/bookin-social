'use client';

interface SimpleInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  hasError?: boolean;
}

const SimpleInput: React.FC<SimpleInputProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  disabled,
  required,
  hasError
}) => {
  return (
    <div className="w-full relative">
      <input
        id={id}
        disabled={disabled}
        placeholder=" "
        value={value}
        onChange={onChange}
        type={type}
        className={`
          peer
          w-full
          p-4
          pt-6
          font-light
          bg-white
          border-2
          rounded-md
          outline-none
          transition
          disabled:opacity-70
          disabled:cursor-not-allowed
          ${hasError ? 'border-rose-500' : 'border-neutral-300'}
          ${hasError ? 'focus:border-rose-500' : 'focus:border-black'}
        `}
      />
      <label
        htmlFor={id}
        className={`
          absolute
          text-md
          duration-150
          transform
          -translate-y-3
          top-5
          z-10
          origin-[0]
          left-4
          peer-placeholder-shown:scale-100
          peer-placeholder-shown:translate-y-0
          peer-focus:scale-75
          peer-focus:-translate-y-4
          ${hasError ? 'text-rose-500' : 'text-zinc-400'}
        `}
      >
        {label}
      </label>
    </div>
  );
};

export default SimpleInput;

