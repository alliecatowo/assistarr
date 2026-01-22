import { BaseArrClient } from "../base-arr";
import type {
  SonarrCalendarEpisode,
  SonarrCommand,
  SonarrQueueItem,
  SonarrSystemStatus,
} from "./types";

export class SonarrClient extends BaseArrClient<
  SonarrSystemStatus,
  SonarrQueueItem,
  SonarrCalendarEpisode,
  SonarrCommand
> {}
