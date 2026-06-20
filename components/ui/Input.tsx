import { InputHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...rest }, ref) => {
    return (
      <div className="form-group">
        {label && (
          <label htmlFor={id} className="form-label">
            {label}
          </label>
        )}
        <input
          id={id}
          ref={ref}
          className={clsx("form-input", className)}
          {...rest}
        />
        {error && <span className="form-error">{error}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";


interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className, id, ...rest }: SelectProps) {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <select id={id} className={clsx("form-input", className)} {...rest}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}


interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export function Textarea({ label, error, className, id, ...rest }: TextareaProps) {
  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}
      <textarea
        id={id}
        rows={3}
        className={clsx("form-input", className)}
        style={{ resize: "vertical" }}
        {...rest}
      />
      {error && <span className="form-error">{error}</span>}
    </div>
  );
}
