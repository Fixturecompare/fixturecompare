import { manualPoints as premier } from "@/data/manualPoints-premierleague";
import { manualPoints as laliga } from "@/data/manualPoints-laliga";
import { manualPoints as bundesliga } from "@/data/manualPoints-bundesliga";
import { manualPoints as seriea } from "@/data/manualPoints-seriea";
import { manualPoints as ligue1 } from "@/data/manualPoints-ligue1";

// Accepts standard competition codes used in the app dropdown
// PL, PD, BL1, SA, FL1
export function getManualPoints(leagueCode: string | undefined | null) {
  switch ((leagueCode || "").toUpperCase()) {
    case "PL":
      return premier;
    case "PD":
      return laliga;
    case "BL1":
      return bundesliga;
    case "SA":
      return seriea;
    case "FL1":
      return ligue1;
    default:
      return {} as Record<string, number>;
  }
}
