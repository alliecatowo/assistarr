import { BaseArrClient } from "../base-arr";
import type {
  RadarrCalendarMovie,
  RadarrCommand,
  RadarrQueueItem,
  RadarrSystemStatus,
} from "./types";

export class RadarrClient extends BaseArrClient<
  RadarrSystemStatus,
  RadarrQueueItem,
  RadarrCalendarMovie,
  RadarrCommand
> {}
