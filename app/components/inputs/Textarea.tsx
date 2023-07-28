import { FieldErrors, FieldValues, UseFormRegister } from "react-hook-form";

interface TextareaProps {
  id: string;
  label: string;
  disabled?: boolean;
  required?: boolean;
  register: UseFormRegister<FieldValues>;
  errors: FieldErrors;
  rows?: number;
}

const Textarea: React.FC<TextareaProps> = ({
  id,
  label,
  disabled,
  register,
  required,
  errors,
  rows = 7,
}) => {
  const errorClass = errors[id]
    ? "border-rose-500 focus:border-rose-500 text-rose-500"
    : "border-neutral-300 focus:border-black text-zinc-400";

  return (
    <div className="w-full relative">
      <textarea
        id={id}
        disabled={disabled}
        {...register(id, { required })}
        placeholder=" "
        rows={rows}
        className={`peer w-full p-4 pt-6 font-light bg-white border-2 rounded-md outline-none transition disabled:opacity-70 disabled:cursor-not-allowed ${errorClass}`}
      />
      <label
        htmlFor={id}
        className={`absolute text-md duration-150 transform -translate-y-3 top-5 z-10 origin-[0] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 ${errorClass}`}
      >
        {label}
      </label>
    </div>
  );
};

export default Textarea;