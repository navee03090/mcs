import { reporterLabel, staffLabel } from "./people-label";
import type { Issue, Profile } from "./types";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function row(values: string[]) {
  const cells = values
    .map((value) => `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`)
    .join("");
  return `<Row>${cells}</Row>`;
}

export function issuesWorkbook(issues: Issue[], people: Profile[]) {
  const header = ["Report", "Status", "Priority", "Department", "Location", "Student", "Staff", "Me-too", "Updated"];
  const lines = issues.map((issue) =>
    row([
      issue.title,
      issue.status,
      issue.priority,
      issue.department ?? "",
      issue.location_text,
      reporterLabel(issue, people),
      staffLabel(issue, people),
      String(issue.me_too_count),
      issue.updated_at,
    ]),
  );
  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Issues">
<Table>
${row(header)}
${lines.join("\n")}
</Table>
</Worksheet>
</Workbook>`;
}

export function downloadIssuesExcel(issues: Issue[], people: Profile[]) {
  const xml = issuesWorkbook(issues, people);
  const blob = new Blob([xml], { type: "application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "reportfix-issues.xls";
  link.click();
  URL.revokeObjectURL(url);
}
