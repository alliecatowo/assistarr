import { ExternalImage } from "@/components/ui/external-image";

interface ExpandedCardBackdropProps {
  backdropUrl: string | null;
}

export function ExpandedCardBackdrop({
  backdropUrl,
}: ExpandedCardBackdropProps) {
  if (!backdropUrl) {
    return null;
  }

  return (
    <div className="absolute inset-0 h-48 overflow-hidden">
      <ExternalImage
        alt=""
        className="object-cover opacity-30"
        fill
        sizes="100vw"
        src={backdropUrl}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
    </div>
  );
}
