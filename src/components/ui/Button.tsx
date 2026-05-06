import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

function Button({
  children,
  className = "",
  variant = "primary",
  ...props
}: ButtonProps) {
  const variantClass =
    variant === "primary" ? "button" : `button button-${variant}`;

  return (
    <button className={`${variantClass} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export default Button;
