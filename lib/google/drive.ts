// Google Drive integration via REST API (no npm dependency).
// Requires env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN
//
// Setup (one-time):
//   1. Google Cloud Console → APIs & Services → Credentials → Create OAuth2 client (Web app)
//   2. Enable Google Drive API for the project
//   3. Get a refresh token via https://developers.google.com/oauthplayground
//      - Scope: https://www.googleapis.com/auth/drive
//      - Exchange authorization code for tokens → copy Refresh token
//   4. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN to Vercel env vars

const ATLETAS_FOLDER_ID          = "1dQzypULbIqxqmVmpaSsomwIft6ca7S8g";
const TEMPLATE_INFO_INICIAL_ID   = "15DfBLCsO34bqGq2CQUQTJ5KJJzqGbN72";

// ─── Auth ─────────────────────────────────────────────────────────────────────

async function getAccessToken(): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type:    "refresh_token",
    }),
  });
  const data = (await res.json()) as { access_token?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(`Drive auth failed: ${data.error ?? res.statusText}`);
  }
  return data.access_token;
}

// ─── Drive primitives ─────────────────────────────────────────────────────────

async function createFolder(token: string, name: string, parentId: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] }),
  });
  const data = (await res.json()) as { id?: string; error?: unknown };
  if (!res.ok || !data.id) throw new Error(`Create folder "${name}" failed: ${JSON.stringify(data.error)}`);
  return data.id;
}

async function copyFile(token: string, fileId: string, name: string, parentId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/copy?fields=id`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name, parents: [parentId] }),
  });
  if (!res.ok) {
    const data = (await res.json()) as { error?: unknown };
    throw new Error(`Copy file "${name}" failed: ${JSON.stringify(data.error)}`);
  }
}

async function listFolderContents(
  token: string,
  folderId: string,
): Promise<{ id: string; name: string; mimeType: string }[]> {
  const params = new URLSearchParams({
    q:        `'${folderId}' in parents and trashed = false`,
    fields:   "files(id,name,mimeType)",
    pageSize: "200",
  });
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = (await res.json()) as { files?: { id: string; name: string; mimeType: string }[]; error?: unknown };
  if (!res.ok) throw new Error(`List folder failed: ${JSON.stringify(data.error)}`);
  return data.files ?? [];
}

// Recursively copy a Drive folder into a new parent
async function copyFolderDeep(
  token: string,
  sourceFolderId: string,
  destParentId: string,
  name: string,
): Promise<string> {
  const newFolderId = await createFolder(token, name, destParentId);
  const items = await listFolderContents(token, sourceFolderId);

  for (const item of items) {
    if (item.mimeType === "application/vnd.google-apps.folder") {
      await copyFolderDeep(token, item.id, newFolderId, item.name);
    } else {
      await copyFile(token, item.id, item.name, newFolderId);
    }
  }

  return newFolderId;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function driveConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}

/**
 * Creates the client folder structure in Google Drive:
 *   01 ATLETAS / [NOMBRE CLIENTE] / 01 INFO INICIAL  (copied from template)
 *
 * Returns the ID of the top-level client folder.
 */
export async function crearCarpetaCliente(nombreCliente: string): Promise<string> {
  if (!driveConfigured()) throw new Error("Google Drive credentials not configured");

  const token = await getAccessToken();
  const nombre = nombreCliente.toUpperCase();

  // 1. Create top-level client folder inside 01 ATLETAS
  const clienteFolderId = await createFolder(token, nombre, ATLETAS_FOLDER_ID);

  // 2. Copy INFO INICIAL template (with all subfolders and files) into the client folder
  await copyFolderDeep(token, TEMPLATE_INFO_INICIAL_ID, clienteFolderId, "01 INFO INICIAL");

  return clienteFolderId;
}

export function driveViewUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}
