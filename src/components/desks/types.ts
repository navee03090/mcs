import type {
  CampusLocation,
  Issue,
  IssueStatus,
  Profile,
  Report,
  TrustEvent,
} from "@/lib/reportfix/types";

export type Board = {
  viewer: Profile;
  issues: Issue[];
  reports: Report[];
  locations: CampusLocation[];
  ledger: TrustEvent[];
  confidential: Issue[];
};

export type DeskProps = {
  board: Board | null;
  viewer: Profile;
  text: string;
  setText: (value: string) => void;
  busy: boolean;
  msg: string | null;
  summary: string | null;
  locationId: string;
  setLocationId: (value: string) => void;
  toast: string | null;
  reduced: boolean | null;
  trending: Issue[];
  needsPlace: boolean;
  showTriage: boolean;
  submit: (placeId?: string) => void;
  staffAction: (issueId: string, action: "spam" | "close_window") => void;
  setStatus: (issueId: string, status: IssueStatus) => void;
  vote: (issueId: string, vote: "confirm" | "dispute") => void;
  loadSummary: () => void;
  signOut: () => void;
};
