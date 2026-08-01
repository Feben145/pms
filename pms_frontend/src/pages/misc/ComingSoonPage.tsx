import { useLocation, useParams } from "react-router-dom";
import { Construction } from "lucide-react";
import { Breadcrumb } from "../../components/Breadcrumb";
import { NAV_GROUPS } from "../../layout/navConfig";

/**
 * Placeholder for sidebar items that map to modules from the original
 * requirements spec (Maintenance, Reports, Financial Management, etc.)
 * that aren't built yet -- Phase 2/3 in docs/ARCHITECTURE.md.
 *
 * Resolves its own title/group from the URL slug against navConfig,
 * so adding a new placeholder item only means editing navConfig.ts --
 * no new route or page needed here.
 */
export default function ComingSoonPage() {
  const { slug } = useParams();
  const location = useLocation();

  let title = "Coming soon";
  let group = "Account";
  for (const g of NAV_GROUPS) {
    const match = g.items.find((item) => item.comingSoon === location.pathname);
    if (match) {
      title = match.label;
      group = g.group;
      break;
    }
  }
  if (title === "Coming soon" && slug) {
    title = slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div>
      <Breadcrumb items={[{ label: group }, { label: title }]} />
      <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-lg bg-card">
        <Construction className="h-8 w-8 text-muted-foreground/50 mb-3" strokeWidth={1.5} />
        <h2 className="text-base font-medium text-foreground mb-1">{title}</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          This module isn't built yet. It's on the roadmap — see the project status doc for what's planned next.
        </p>
      </div>
    </div>
  );
}
