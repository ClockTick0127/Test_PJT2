import { cn } from "@/lib/utils";
export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: React.ReactNode;
  tone?: string;
  className?: string;
}) {
  return <span className={cn("badge", "badge-" + tone, className)}>{children}</span>;
}
export function Progress({ value, label }: { value: number; label?: string }) {
  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || "완성도"}
    >
      <div style={{ width: value + "%" }} />
    </div>
  );
}
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}
export function Empty({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {children}
    </div>
  );
}
