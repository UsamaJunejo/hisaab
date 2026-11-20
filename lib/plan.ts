import type { Db } from "./db.ts";
import { today } from "./format.ts";

/** Storage used (MB) = entry data + attachments; compared with the plan's MB. */
export async function usage(d: Db, userId: number) {
  const [r] = await d.q<{ data: number; files: number }>(
    `SELECT (SELECT COUNT(*) FROM entries WHERE user_id = $1)::float8 * 512 AS data,
            (SELECT COALESCE(SUM(size), 0) FROM attachments WHERE user_id = $1)::float8 AS files`,
    [userId],
  );
  return { dataMb: r.data / 1048576, filesMb: r.files / 1048576, usedMb: (r.data + r.files) / 1048576 };
}

/** The group package that covers this person, if someone with an active group package listed their email in Group License. */
export async function groupCover(d: Db, email: string) {
  const [r] = await d.q<{ owner: string; plan_until: string; data_mb: number }>(
    `SELECT o.name AS owner, to_char(o.plan_until, 'YYYY-MM-DD') AS plan_until, o.data_mb FROM group_licenses g JOIN users o ON o.id = g.owner_id
     WHERE lower(g.email) = lower($1) AND o.plan IN ('group_monthly', 'group_yearly') AND o.plan_until >= CURRENT_DATE
     ORDER BY o.plan_until DESC LIMIT 1`,
    [email],
  );
  return r ?? null;
}

/** Locked when the plan date has passed or the data limit is used up (MunshiBaba's two triggers).
 *  A member of an active group package uses the group's date and data space instead, when that is better. */
export async function lockState(d: Db, u: { id: number; email: string; plan_until: string; data_mb: number; is_admin: boolean }): Promise<"ok" | "date" | "data"> {
  if (u.is_admin) return "ok";
  let until = u.plan_until, mb = u.data_mb;
  if (today() > until || (await usage(d, u.id)).usedMb >= mb) {
    const g = await groupCover(d, u.email);
    if (g) { until = g.plan_until > until ? g.plan_until : until; mb = Math.max(mb, g.data_mb); }
  }
  const { usedMb } = await usage(d, u.id);
  if (usedMb >= mb) return "data";
  if (today() > until) return "date";
  return "ok";
}
