import { motion } from "framer-motion";
import { transitions } from "@/app/lib/motionTokens";

type SectionIntroProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  center?: boolean;
};

export default function SectionIntro({ eyebrow, title, subtitle, center = false }: SectionIntroProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={transitions.reveal}
      className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}
    >
      {eyebrow && (
        <p className="badge w-fit">
          <span className="badge-dot" />
          {eyebrow}
        </p>
      )}
      <h2 className="font-display mt-6 text-4xl leading-tight text-white md:text-5xl lg:text-[3.4rem]">{title}</h2>
      {subtitle && <p className="mt-4 text-base leading-relaxed text-gray-400 md:text-lg">{subtitle}</p>}
    </motion.div>
  );
}
