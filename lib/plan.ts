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

/** Locked when the plan date has passed or the data limit is used up (MunshiBaba's two triggers). */
export async function lockState(d: Db, u: { id: number; plan_until: string; data_mb: number; is_admin: boolean }): Promise<"ok" | "date" | "data"> {
  if (u.is_admin) return "ok";
  const { usedMb } = await usage(d, u.id);
  if (usedMb >= u.data_mb) return "data";
  if (today() > u.plan_until) return "date";
  return "ok";
}
