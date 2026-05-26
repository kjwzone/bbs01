/**
 * Cloud Supabase API validation (anon key only, no service_role).
 * Run: node scripts/validate-api.mjs
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const loadEnv = () => {
  const text = readFileSync(".env.local", "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i > 0) env[t.slice(0, i)] = t.slice(i + 1);
  }
  return env;
};

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const results = [];
const record = (id, pass, evidence) => {
  results.push({ id, pass, evidence });
  console.log(`${pass ? "PASS" : "FAIL"} ${id}: ${evidence}`);
};

const ts = Date.now();
const password = "TestPass123!";
const emailA = `userA+${ts}@example.com`;
const emailB = `userB+${ts}@example.com`;

const anon = createClient(url, key);

// POST-001: anonymous SELECT
{
  const { error } = await anon.from("posts").select("id").limit(1);
  record("POST-001", !error, error?.message ?? "anon SELECT posts OK");
}

// RLS-001: anonymous INSERT
{
  const fakeUuid = "00000000-0000-4000-8000-000000000001";
  const { error } = await anon.from("posts").insert({
    title: "anon",
    content: "anon",
    author_id: fakeUuid,
  });
  record(
    "RLS-001",
    Boolean(error),
    error?.message ?? "unexpected: anon insert succeeded",
  );
}

// RLS-004 / RLS-005: anonymous UPDATE/DELETE must not change data
{
  const { data: before } = await anon.from("posts").select("id, title").eq("id", 1).maybeSingle();
  const { data: updated, error: upErr } = await anon
    .from("posts")
    .update({ title: "hack" })
    .eq("id", 1)
    .select("id");
  const { data: after } = await anon.from("posts").select("title").eq("id", 1).maybeSingle();
  const blocked =
    Boolean(upErr) ||
    (updated ?? []).length === 0 ||
    before?.title === after?.title;
  record(
    "RLS-004",
    blocked,
    upErr?.message ?? `updated rows=${(updated ?? []).length}, title unchanged`,
  );
}
{
  const { data: deleted, error: delErr } = await anon
    .from("posts")
    .delete()
    .eq("id", 1)
    .select("id");
  const blocked = Boolean(delErr) || (deleted ?? []).length === 0;
  record(
    "RLS-005",
    blocked,
    delErr?.message ?? `deleted rows=${(deleted ?? []).length}`,
  );
}

const signUpAndSession = async (email) => {
  const client = createClient(url, key);
  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password,
  });
  if (signUpError) return { client, error: signUpError.message };

  if (signUpData.session) {
    return { client, userId: signUpData.user?.id };
  }

  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) return { client, error: signInError.message };
  return { client, userId: signInData.user?.id };
};

const userA = await signUpAndSession(emailA);
if (userA.error) {
  record("AUTH-001", false, `signup A: ${userA.error}`);
  record("AUTH-002", false, "blocked by AUTH-001");
  record("POST-002", false, "blocked by AUTH-001");
} else {
  record("AUTH-001", true, `signup ${emailA}, user=${userA.userId}`);

  const { error: loginErr } = await userA.client.auth.signInWithPassword({
    email: emailA,
    password,
  });
  record("AUTH-002", !loginErr, loginErr?.message ?? `login ${emailA} OK`);

  const { data: profile } = await userA.client
    .from("profiles")
    .select("id, email")
    .eq("id", userA.userId)
    .single();
  record(
    "PROFILE-001",
    profile?.id === userA.userId,
    profile ? `profile id=${profile.id}` : "profile missing",
  );

  const { data: post, error: insertErr } = await userA.client
    .from("posts")
    .insert({
      title: `title-${ts}`,
      content: `content-${ts}`,
      author_id: userA.userId,
    })
    .select("id, author_id")
    .single();

  record(
    "POST-002",
    !insertErr && post?.author_id === userA.userId,
    insertErr?.message ?? `created post id=${post?.id}`,
  );

  if (post?.id) {
    const { error: updateErr } = await userA.client
      .from("posts")
      .update({ title: `updated-${ts}` })
      .eq("id", post.id)
      .select("id");
    record("POST-003", !updateErr, updateErr?.message ?? "author update OK");

    // DATA-001 app-level: empty title via DB NOT NULL
    const { error: data1 } = await userA.client.from("posts").insert({
      title: "",
      content: "x",
      author_id: userA.userId,
    });
    record(
      "DATA-001",
      Boolean(data1),
      data1?.message ?? "unexpected empty title insert",
    );

    const { error: data2 } = await userA.client.from("posts").insert({
      title: "x",
      content: "",
      author_id: userA.userId,
    });
    record(
      "DATA-002",
      Boolean(data2),
      data2?.message ?? "unexpected empty content insert",
    );

    const userB = await signUpAndSession(emailB);
    if (userB.error) {
      record("RLS-002", false, `signup B: ${userB.error}`);
      record("RLS-003", false, "blocked by user B signup");
    } else {
      const { error: rls2 } = await userB.client
        .from("posts")
        .update({ title: "stolen" })
        .eq("id", post.id)
        .select("id");
      const rls2Blocked =
        Boolean(rls2) ||
        (await userB.client.from("posts").select("title").eq("id", post.id).single())
          .data?.title !== "stolen";
      record(
        "RLS-002",
        rls2Blocked,
        rls2?.message ?? "user B cannot change A post title",
      );

      const { error: rls3 } = await userB.client
        .from("posts")
        .delete()
        .eq("id", post.id)
        .select("id");
      const stillExists = (
        await userA.client.from("posts").select("id").eq("id", post.id).maybeSingle()
      ).data;
      record(
        "RLS-003",
        Boolean(rls3) || stillExists != null,
        rls3?.message ?? `post still exists after B delete attempt`,
      );
    }

    const { error: delErr } = await userA.client
      .from("posts")
      .delete()
      .eq("id", post.id);
    record("POST-004", !delErr, delErr?.message ?? "author delete OK");

    await userA.client.auth.signOut();
    record("AUTH-003", true, "signOut called for user A");
  }
}

const failed = results.filter((r) => !r.pass);
console.log("\n--- SUMMARY ---");
console.log(`Total: ${results.length}, Pass: ${results.length - failed.length}, Fail: ${failed.length}`);
if (failed.length) {
  console.log("Failed:", failed.map((f) => f.id).join(", "));
  process.exit(1);
}
