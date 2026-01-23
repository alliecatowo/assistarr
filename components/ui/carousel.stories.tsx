import type { Story, StoryDefault } from "@ladle/react";
import { Film } from "lucide-react";
import { Card, CardContent } from "./card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./carousel";

export default {
  title: "UI / Carousel",
} satisfies StoryDefault;

// Default carousel
export const Default: Story = () => (
  <div className="w-full max-w-xs mx-auto">
    <Carousel>
      <CarouselContent>
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={`slide-${index}`}>
            <div className="p-1">
              <Card>
                <CardContent className="flex aspect-square items-center justify-center p-6">
                  <span className="text-4xl font-semibold">{index + 1}</span>
                </CardContent>
              </Card>
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  </div>
);

// Multiple items visible
export const MultipleItems: Story = () => (
  <div className="w-full max-w-2xl mx-auto">
    <Carousel opts={{ align: "start" }}>
      <CarouselContent className="-ml-2 md:-ml-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <CarouselItem key={`item-${index}`} className="pl-2 md:pl-4 basis-1/3">
            <Card>
              <CardContent className="flex aspect-square items-center justify-center p-6">
                <span className="text-2xl font-semibold">{index + 1}</span>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  </div>
);

// Media row (movie posters)
export const MediaRow: Story = () => {
  const movies = [
    "The Matrix",
    "Inception",
    "Interstellar",
    "The Dark Knight",
    "Pulp Fiction",
    "Fight Club",
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h3 className="text-lg font-semibold mb-4">Trending Movies</h3>
      <Carousel opts={{ align: "start" }}>
        <CarouselContent className="-ml-2">
          {movies.map((movie, index) => (
            <CarouselItem key={`movie-${index}`} className="pl-2 basis-1/4">
              <Card className="overflow-hidden">
                <div className="aspect-[2/3] bg-muted flex items-center justify-center">
                  <Film className="h-8 w-8 text-muted-foreground" />
                </div>
                <CardContent className="p-2">
                  <p className="text-sm font-medium truncate">{movie}</p>
                  <p className="text-xs text-muted-foreground">Movie</p>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious />
        <CarouselNext />
      </Carousel>
    </div>
  );
};

// Vertical orientation
export const Vertical: Story = () => (
  <div className="w-full max-w-xs mx-auto h-[300px]">
    <Carousel orientation="vertical" className="h-full">
      <CarouselContent className="-mt-2 h-[250px]">
        {Array.from({ length: 5 }).map((_, index) => (
          <CarouselItem key={`vert-${index}`} className="pt-2 basis-1/3">
            <Card>
              <CardContent className="flex items-center justify-center p-4">
                <span className="text-xl font-semibold">{index + 1}</span>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  </div>
);

// Featured content (larger items)
export const Featured: Story = () => (
  <div className="w-full max-w-2xl mx-auto">
    <Carousel>
      <CarouselContent>
        {["New Releases", "Top Rated", "Recently Added"].map((category, index) => (
          <CarouselItem key={category}>
            <Card className="overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                <div className="text-center text-white">
                  <h3 className="text-2xl font-bold">{category}</h3>
                  <p className="text-sm opacity-80">Browse collection</p>
                </div>
              </div>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  </div>
);

// Without navigation buttons
export const NoButtons: Story = () => (
  <div className="w-full max-w-lg mx-auto">
    <Carousel opts={{ align: "start", loop: true }}>
      <CarouselContent className="-ml-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <CarouselItem key={`nobutton-${index}`} className="pl-2 basis-1/3">
            <Card>
              <CardContent className="flex aspect-square items-center justify-center p-4">
                <span className="text-xl font-semibold">{index + 1}</span>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
    <p className="text-sm text-muted-foreground text-center mt-2">
      Drag to scroll
    </p>
  </div>
);
