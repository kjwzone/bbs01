/**
 * Vercel REST API deploy (bypasses CLI User-Agent hostname bug on Windows).
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const authPath = join(
  homedir(),
  "AppData",
  "Roaming",
  "xdg.data",
  "com.vercel.cli",
  "auth.json",
);

const auth = JSON.parse(readFileSync(authPath, "utf8"));
const token = auth.token;

const api = async (path, options = {}) => {
  const res = await fetch(`https://api.vercel.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${res.status} ${path}: ${JSON.stringify(body)}`);
  }
  return body;
};

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

const main = async () => {
  const user = await api("/v2/user");
  console.log("User:", user.user?.username ?? user.username);

  const teamId = user.user?.defaultTeamId ?? user.defaultTeamId;
  const teamQuery = teamId ? `?teamId=${teamId}` : "";

  let project;
  const projects = await api(`/v9/projects${teamQuery}`);
  project = projects.projects?.find((p) => p.name === "bbs01");

  if (!project) {
    console.log("Creating project bbs01...");
    project = await api(`/v11/projects${teamQuery}`, {
      method: "POST",
      body: JSON.stringify({
        name: "bbs01",
        framework: "nextjs",
        gitRepository: {
          type: "github",
          repo: "kjwzone/bbs01",
        },
      }),
    });
  }

  const projectId = project.id ?? project.projectId;
  console.log("Project:", project.name ?? "bbs01", projectId);

  const env = loadEnv();
  for (const [key, value] of Object.entries(env)) {
    if (!key.startsWith("NEXT_PUBLIC_")) continue;
    console.log(`Setting env: ${key}`);
    try {
      await api(`/v10/projects/${projectId}/env${teamQuery}`, {
        method: "POST",
        body: JSON.stringify({
          key,
          value,
          type: "encrypted",
          target: ["production", "preview", "development"],
        }),
      });
    } catch (e) {
      const msg = String(e.message);
      if (!msg.includes("ENV_CONFLICT")) {
        console.warn(`  skip ${key}:`, msg);
      }
    }
  }

  console.log("Creating production deployment from GitHub main...");
  const deployment = await api(`/v13/deployments${teamQuery}`, {
    method: "POST",
    body: JSON.stringify({
      name: "bbs01",
      project: projectId,
      target: "production",
      gitSource: {
        type: "github",
        org: "kjwzone",
        repo: "bbs01",
        ref: "main",
      },
    }),
  });

  const url = deployment.url
    ? `https://${deployment.url}`
    : deployment.alias?.[0]
      ? `https://${deployment.alias[0]}`
      : null;

  console.log("Deployment ID:", deployment.id);
  console.log("URL:", url ?? "(building — check Vercel dashboard)");
  if (deployment.inspectorUrl) {
    console.log("Inspector:", deployment.inspectorUrl);
  }
};

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
