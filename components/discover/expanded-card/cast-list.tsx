"use client";

import Image from "next/image";

interface CastMember {
  name: string;
  character: string;
  profileUrl: string | null;
}

interface CastListProps {
  cast: CastMember[];
}

export function CastList({ cast }: CastListProps) {
  if (cast.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <h3 className="text-sm font-semibold mb-2">Cast</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
        {cast.map((person, i) => (
          <div
            className="shrink-0 text-center w-16"
            key={`${person.name}-${i}`}
          >
            {person.profileUrl ? (
              <Image
                alt={person.name}
                className="rounded-full mx-auto"
                height={48}
                src={person.profileUrl}
                unoptimized
                width={48}
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground text-xs">
                ?
              </div>
            )}
            <p className="mt-1 text-xs font-medium truncate">{person.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {person.character}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
