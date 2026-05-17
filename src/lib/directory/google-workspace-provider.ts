import { google, admin_directory_v1 } from "googleapis";
import { DirectoryProvider, DirectoryUser, DirectoryFilter } from "./types";
import { prisma } from "@/lib/prisma";

export class GoogleWorkspaceDirectoryProvider implements DirectoryProvider {
  constructor(
    private adminEmail: string,
    private privateKey: string,
    private domain: string = "voltodrive.com"
  ) {}

  private async getAuthClient() {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_WORKSPACE_CLIENT_EMAIL,
      key: this.privateKey.replace(/\\n/g, "\n"),
      scopes: [
        "https://www.googleapis.com/auth/admin.directory.user.readonly",
        "https://www.googleapis.com/auth/directory.readonly",
      ],
      subject: this.adminEmail,
    });
    await auth.authorize();
    return auth;
  }

  // Devolve mapa email → photoUrl via People API (people.get por utilizador)
  private async fetchPhotoMap(
    auth: InstanceType<typeof google.auth.JWT>,
    users: GWorkspaceUser[]
  ): Promise<{ map: Map<string, string>; error?: string }> {
    const map = new Map<string, string>();
    try {
      const people = google.people({ version: "v1", auth });

      // people.getBatchGet aceita até 50 resourceNames por pedido
      const usersWithId = users.filter((u) => u.id && u.primaryEmail);
      const BATCH = 50;

      for (let i = 0; i < usersWithId.length; i += BATCH) {
        const batch = usersWithId.slice(i, i + BATCH);
        const resourceNames = batch.map((u) => `people/${u.id}`);

        const res = await people.people.getBatchGet({
          resourceNames,
          personFields: "photos,emailAddresses",
        });

        for (const personRes of res.data.responses ?? []) {
          const person = personRes.person;
          if (!person) continue;
          const email =
            person.emailAddresses?.find((e) => e.metadata?.primary)?.value ??
            person.emailAddresses?.[0]?.value;
          const photo =
            person.photos?.find((p) => !p.default)?.url ??
            person.photos?.[0]?.url;
          if (email && photo && !photo.includes("default")) {
            map.set(email, photo);
          }
        }
      }
      return { map };
    } catch (err) {
      return { map, error: err instanceof Error ? err.message : String(err) };
    }
  }

  async listUsers(filter?: DirectoryFilter): Promise<DirectoryUser[]> {
    // Serve from local DB (populated by syncUsers) so the UI is fast
    const where: Record<string, unknown> = {};

    if (filter?.status === "active") where.status = "ACTIVE";
    else if (filter?.status === "suspended") where.status = "SUSPENDED";
    else where.status = "ACTIVE";

    if (filter?.department) where.department = filter.department;
    if (filter?.officeLocation) where.officeLocation = filter.officeLocation;

    let users = await prisma.user.findMany({
      where,
      orderBy: [{ givenName: "asc" }, { familyName: "asc" }],
    });

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.email.toLowerCase().includes(q) ||
          (u.givenName ?? "").toLowerCase().includes(q) ||
          (u.familyName ?? "").toLowerCase().includes(q) ||
          (u.jobTitle ?? "").toLowerCase().includes(q) ||
          (u.department ?? "").toLowerCase().includes(q)
      );
    }

    return users.map((u) => ({
      id: u.id,
      email: u.email,
      givenName: u.givenName ?? u.name?.split(" ")[0] ?? "",
      familyName: u.familyName ?? u.name?.split(" ").slice(1).join(" ") ?? "",
      jobTitle: u.jobTitle ?? undefined,
      department: u.department ?? undefined,
      officeLocation: u.officeLocation ?? undefined,
      phoneNumber: u.phoneNumber ?? undefined,
      managerEmail: u.managerEmail ?? undefined,
      startDate: u.startDate ?? undefined,
      isAdmin: u.isAdmin,
      suspended: u.status === "SUSPENDED",
      orgUnitPath: u.orgUnitPath ?? undefined,
      image: u.image ?? undefined,
      bio: u.bio ?? undefined,
      linkedinUrl: u.linkedinUrl ?? undefined,
      workLocation: u.workLocation ?? undefined,
    }));
  }

  async getUser(id: string): Promise<DirectoryUser | null> {
    const u = await prisma.user.findUnique({ where: { id } });
    if (!u) return null;
    return {
      id: u.id,
      email: u.email,
      givenName: u.givenName ?? u.name?.split(" ")[0] ?? "",
      familyName: u.familyName ?? u.name?.split(" ").slice(1).join(" ") ?? "",
      jobTitle: u.jobTitle ?? undefined,
      department: u.department ?? undefined,
      officeLocation: u.officeLocation ?? undefined,
      phoneNumber: u.phoneNumber ?? undefined,
      managerEmail: u.managerEmail ?? undefined,
      startDate: u.startDate ?? undefined,
      isAdmin: u.isAdmin,
      suspended: u.status === "SUSPENDED",
      orgUnitPath: u.orgUnitPath ?? undefined,
      image: u.image ?? undefined,
      bio: u.bio ?? undefined,
      linkedinUrl: u.linkedinUrl ?? undefined,
      workLocation: u.workLocation ?? undefined,
    };
  }

  async syncUsers(): Promise<number> {
    const auth = await this.getAuthClient();
    const admin = google.admin({ version: "directory_v1", auth }) as admin_directory_v1.Admin;

    const allUsers = await this.fetchAllUsers(admin);
    const { map: photoMap, error: photoError } = await this.fetchPhotoMap(auth, allUsers);

    let count = 0;

    for (const g of allUsers) {
      const email = g.primaryEmail;
      if (!email) continue;

      const givenName = g.name?.givenName ?? undefined;
      const familyName = g.name?.familyName ?? undefined;
      const fullName = [givenName, familyName].filter(Boolean).join(" ") || email;

      const org = g.organizations?.[0];
      const workPhone = g.phones?.find((p) => p.type === "work") ?? g.phones?.[0];
      const managerRel = g.relations?.find((r) => r.type === "manager");
      const building = g.locations?.find((l) => l.type === "desk") ?? g.locations?.[0];

      // Tenta ler dateOfBirth de campos personalizados do Google Workspace
      // Suporta vários nomes comuns: Birthday, HR, Employee_Info
      let dateOfBirth: Date | undefined;
      const customSchemas = g.customSchemas as Record<string, Record<string, string>> | undefined;
      if (customSchemas) {
        const dobRaw =
          customSchemas["Birthday"]?.["Date_of_Birth"] ??
          customSchemas["HR"]?.["Date_of_Birth"] ??
          customSchemas["HR"]?.["Birthday"] ??
          customSchemas["Employee_Info"]?.["Date_of_Birth"] ??
          customSchemas["Personal"]?.["Date_of_Birth"];
        if (dobRaw) {
          const parsed = new Date(dobRaw);
          if (!isNaN(parsed.getTime())) dateOfBirth = parsed;
        }
      }

      const data = {
        name: fullName,
        givenName,
        familyName,
        googleUserId: g.id ?? undefined,
        image: photoMap.get(email) ?? g.thumbnailPhotoUrl ?? undefined,
        jobTitle: org?.title ?? undefined,
        department: org?.department ?? undefined,
        officeLocation: building?.buildingId ?? org?.location ?? undefined,
        orgUnitPath: g.orgUnitPath ?? undefined,
        phoneNumber: workPhone?.value ?? undefined,
        managerEmail: managerRel?.value ?? undefined,
        isAdmin: g.isAdmin ?? false,
        status: (g.suspended ? "SUSPENDED" : "ACTIVE") as "ACTIVE" | "SUSPENDED",
        lastSyncedAt: new Date(),
        ...(dateOfBirth !== undefined && { dateOfBirth }),
      };

      await prisma.user.upsert({
        where: { email },
        create: { email, ...data },
        update: data,
      });

      count++;
    }

    return count;
  }

  private async fetchAllUsers(admin: admin_directory_v1.Admin): Promise<GWorkspaceUser[]> {
    const all: GWorkspaceUser[] = [];
    let pageToken: string | undefined;
    do {
      const res = await admin.users.list({
        domain: this.domain,
        maxResults: 500,
        orderBy: "email",
        pageToken,
        projection: "full",
      });
      all.push(...((res.data.users ?? []) as GWorkspaceUser[]));
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
    return all;
  }
}

interface GWorkspaceUser {
  id?: string | null;
  primaryEmail?: string | null;
  suspended?: boolean | null;
  isAdmin?: boolean | null;
  thumbnailPhotoUrl?: string | null;
  orgUnitPath?: string | null;
  name?: { givenName?: string | null; familyName?: string | null } | null;
  organizations?: Array<{ title?: string | null; department?: string | null; location?: string | null }> | null;
  phones?: Array<{ value?: string | null; type?: string | null }> | null;
  relations?: Array<{ value?: string | null; type?: string | null }> | null;
  locations?: Array<{ buildingId?: string | null; type?: string | null }> | null;
  customSchemas?: unknown;
}
