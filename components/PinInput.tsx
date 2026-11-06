"use client";

type Props = {
  id: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
};

/** Campo de PIN: so numeros, 4 digitos. */
export default function PinInput({ id, value, onChange, required, placeholder = "••••" }: Props) {
  return (
    <input
      id={id}
      className="pin"
      type="password"
      inputMode="numeric"
      autoComplete="off"
      pattern="\d{4}"
      minLength={4}
      maxLength={4}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
    />
  );
}
