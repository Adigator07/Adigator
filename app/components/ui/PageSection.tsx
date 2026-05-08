import type { ReactNode } from "react";

type PageSectionProps = {
  id?: string;
  className?: string;
  children: ReactNode;
};

export default function PageSection({ id, className = "", children }: PageSectionProps) {
  return (
    <section id={id} className={`landing-section relative z-10 ${className}`.trim()}>
      <div className="landing-container">{children}</div>
    </section>
  );
}
