"use client";

import { useState } from "react";
import type { DiscoverItem } from "./discover-context";
import { ActionButtons } from "./expanded-card/action-buttons";
import { CastList } from "./expanded-card/cast-list";
import { ExpandedCardHeader } from "./expanded-card/expanded-card-header";
import {
  useMediaDetails,
  useMediaPitch,
  useMediaRequest,
} from "./expanded-card/hooks";
import { MediaDetailsContent } from "./expanded-card/media-details-content";
import { SimilarItems } from "./expanded-card/similar-items";

interface ExpandedCardProps {
  item: DiscoverItem;
  onClose: () => void;
  onStatusChange?: (tmdbId: number, status: DiscoverItem["status"]) => void;
}

export function ExpandedCard({
  item,
  onClose,
  onStatusChange,
}: ExpandedCardProps) {
  const { details, similar, isLoading } = useMediaDetails(
    item.tmdbId,
    item.mediaType
  );
  const { pitch, isPitchLoading } = useMediaPitch(item.tmdbId, item.mediaType);
  const [showFullOverview, setShowFullOverview] = useState(false);
  const { isRequesting, handleRequest } = useMediaRequest(item, onStatusChange);

  const status = details?.status ?? item.status;

  return (
    <div className="relative my-4 overflow-hidden rounded-xl border bg-card shadow-lg">
      <ExpandedCardHeader onClose={onClose} />

      <MediaDetailsContent
        details={details}
        isPitchLoading={isPitchLoading}
        item={item}
        onToggleOverview={() => setShowFullOverview(!showFullOverview)}
        pitch={pitch}
        showFullOverview={showFullOverview}
      />

      {!isLoading && details && (
        <>
          {details.cast && details.cast.length > 0 && (
            <div className="px-6 pb-6">
              <CastList cast={details.cast} />
            </div>
          )}

          <div className="px-6 pb-6">
            <ActionButtons
              imdbId={details.imdbId}
              isRequesting={isRequesting}
              onRequest={handleRequest}
              status={status}
            />
          </div>

          {similar.length > 0 && (
            <div className="px-6 pb-6">
              <SimilarItems
                items={similar}
                title={details?.title || item.title}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
