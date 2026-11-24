import type { Issue, Profile } from "./types";

export function cmsOf(person: Profile) {
  return person.cms_id || person.roll_number || "";
}

export function reporterLabel(issue: Issue, people: Profile[]) {
  if (issue.is_confidential) return "Anonymous";
  if (!issue.reporter_ids.length) return "Unknown";
  return issue.reporter_ids
    .map((id) => {
      const person = people.find((profile) => profile.id === id);
      if (!person) return "Removed student";
      const cms = cmsOf(person);
      return cms ? `${person.name} (CMS ${cms})` : person.name;
    })
    .join(", ");
}

export function staffLabel(issue: Issue, people: Profile[]) {
  if (issue.is_confidential) return "Sealed";
  const staff = people.find((profile) => profile.role === "staff" && profile.department === issue.department);
  return staff?.name ?? `${issue.department} staff`;
}
