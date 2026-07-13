import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

// Parse portfolio from company-content.ts without TS compilation
const source = readFileSync(
  resolve("src/lib/company-content.ts"),
  "utf8"
);

const portfolioMatch = source.match(
  /export const portfolio: PortfolioProject\[\] = (\[[\s\S]*?\n\]);/
);
if (!portfolioMatch) {
  console.error("Could not parse portfolio");
  process.exit(1);
}

const portfolio = eval(portfolioMatch[1]);

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

const values = portfolio
  .map((project, index) => {
    const featured = project.featured ? "true" : "false";
    const category = project.category ? sqlString(project.category) : "null";
    const description = project.description
      ? sqlString(project.description)
      : "null";

    return `(${sqlString(project.name)}, ${sqlString(project.scope)}, ${sqlString(project.location)}, ${sqlString(project.status)}, ${sqlString(project.completion)}, ${description}, ${featured}, ${category}, ${index})`;
  })
  .join(",\n  ");

const sql = `insert into public.projects (name, scope, location, status, completion, description, featured, category, sort_order)
values
  ${values};`;

writeFileSync(resolve("scripts/seed-projects.sql"), sql);
console.log(`Wrote ${portfolio.length} projects to scripts/seed-projects.sql`);
