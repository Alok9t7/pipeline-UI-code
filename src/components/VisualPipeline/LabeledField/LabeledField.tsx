export function LabeledField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <div className="field-label">{label}</div>
      <div className="field-control">{children}</div>
    </label>
  );
}
