import { DiscoverCard } from "../discover-card";
import type { DiscoverItem } from "../discover-context";

interface SimilarItemsProps {
  items: DiscoverItem[];
  title?: string;
}

const NOOP_REQUEST = () => {
  return;
};
export function SimilarItems({ items, title }: SimilarItemsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold mb-2">Similar to {title}</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {items.map((item) => (
          <DiscoverCard
            isRequesting={false}
            item={item}
            key={item.id}
            onRequest={NOOP_REQUEST}
            showReason={false}
          />
        ))}
      </div>
    </div>
  );
}
