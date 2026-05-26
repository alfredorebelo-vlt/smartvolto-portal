import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/auth";
import { google, drive_v3 } from "googleapis";
import { getGoogleOAuth2, isAuthError } from "@/lib/google-oauth";

export async function GET(request: NextRequest) {
  const session = (await auth()) as Session | null;
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userId = (session.user as any).id as string;

  const result = await getGoogleOAuth2(userId);
  if (!result) return NextResponse.json({ files: [], error: "drive_auth_required" });
  const { oauth2 } = result;

  const { searchParams } = request.nextUrl;
  // modes: recent | folder | my-drive | search | shared-drives | shared-drive
  const mode = searchParams.get("mode") ?? "recent";
  const folderId = searchParams.get("folderId") ?? "root";
  const driveId = searchParams.get("driveId") ?? "";
  const q = searchParams.get("q") ?? "";

  try {
    const drive = google.drive({ version: "v3", auth: oauth2 });

    const FIELDS = "files(id,name,mimeType,webViewLink,iconLink,modifiedTime,size,parents,driveId)";

    // Listar discos partilhados
    if (mode === "shared-drives") {
      const res = await drive.drives.list({
        pageSize: 50,
        fields: "drives(id,name,backgroundImageLink)",
      });
      const drives = (res.data.drives ?? []).map((d) => ({
        id: d.id,
        name: d.name,
        isSharedDrive: true,
        mimeType: "application/vnd.google-apps.drive",
      }));
      return NextResponse.json({ files: drives, folderName: null, folderParents: null });
    }

    let query = "trashed=false";
    let orderBy = "modifiedTime desc";
    let driveIdParam: string | undefined;
    let includeAllDrives = false;
    let corpora: string | undefined;

    if (mode === "recent") {
      orderBy = "viewedByMeTime desc";
    } else if (mode === "folder") {
      const parent = folderId === "root" ? "root" : folderId;
      query = `'${parent}' in parents and trashed=false`;
      orderBy = "folder,name";
      if (driveId) {
        driveIdParam = driveId;
        includeAllDrives = true;
        corpora = "drive";
      }
    } else if (mode === "my-drive") {
      query = "'root' in parents and trashed=false";
      orderBy = "folder,name";
    } else if (mode === "shared-drive" && driveId) {
      query = `'${driveId}' in parents and trashed=false`;
      orderBy = "folder,name";
      driveIdParam = driveId;
      includeAllDrives = true;
      corpora = "drive";
    } else if (mode === "search" && q.trim()) {
      query = `name contains '${q.replace(/'/g, "\\'")}' and trashed=false`;
      orderBy = "modifiedTime desc";
      includeAllDrives = true;
      corpora = "allDrives";
    }

    const listParams: drive_v3.Params$Resource$Files$List = {
      pageSize: 50,
      orderBy,
      fields: FIELDS,
      q: query,
    };
    if (driveIdParam) listParams.driveId = driveIdParam;
    if (includeAllDrives) {
      listParams.includeItemsFromAllDrives = true;
      listParams.supportsAllDrives = true;
    }
    if (corpora) listParams.corpora = corpora;

    const res = await drive.files.list(listParams);

    // Metadata da pasta atual (exceto root/drives raiz)
    let folderName: string | null = null;
    let folderParents: string[] | null = null;
    if (mode === "folder" && folderId !== "root") {
      const meta = await drive.files.get({
        fileId: folderId,
        fields: "id,name,parents",
        supportsAllDrives: true,
      });
      folderName = meta.data.name ?? null;
      folderParents = (meta.data.parents ?? null) as string[] | null;
    }

    const files = (res.data.files ?? []).map((f) => ({
      id: f.id,
      name: f.name,
      mimeType: f.mimeType,
      webViewLink: f.webViewLink,
      iconLink: f.iconLink,
      modifiedTime: f.modifiedTime,
      size: f.size,
      parents: f.parents,
      driveId: f.driveId,
      isFolder: f.mimeType === "application/vnd.google-apps.folder",
    }));

    return NextResponse.json({ files, folderName, folderParents });
  } catch (err) {
    if (isAuthError(err)) return NextResponse.json({ files: [], error: "drive_auth_required" });
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ files: [], error: msg });
  }
}
