import { Link } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

interface Crumb {
  label: string;
  to?: string;
}

/**
 * Pages pass an explicit trail rather than this component parsing the
 * URL -- explicit is more predictable than inferring labels from route
 * segments, and lets a page show a human label ("New") for a param
 * like ":propertyId".
 */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      <Link to="/" className="hover:text-foreground flex items-center">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5" />
            {item.to && !isLast ? (
              <Link to={item.to} className="hover:text-foreground">{item.label}</Link>
            ) : (
              <span className={isLast ? "text-foreground font-medium" : ""}>{item.label}</span>
            )}
          </span>
        );
      })}
    </div>
  );
}
