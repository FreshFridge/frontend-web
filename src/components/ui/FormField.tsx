import type { ReactNode } from "react";

type FormFieldProps = {
  children: ReactNode;
  error?: string;
  hint?: string;
  htmlFor: string;
  label: string;
};

function FormField({ children, error, hint, htmlFor, label }: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error && <p className="field-error">{error}</p>}
      {!error && hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export default FormField;
