import Link from "next/link";
import Icon from "@/components/brand/Icon";

export default function SectionHead({
  eyebrow,
  title,
  href,
  linkLabel = "Ver todo",
}: {
  eyebrow?: string;
  title: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="sec-head">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2 className="sec-title mt-1 font-display text-2xl font-extrabold text-navy sm:text-3xl">{title}</h2>
      </div>
      {href && (
        <Link href={href} className="btn btn-ghost hidden sm:inline-flex">
          {linkLabel} <Icon name="arrowRight" size={16} />
        </Link>
      )}
    </div>
  );
}
