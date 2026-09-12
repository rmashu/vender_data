import { getMongoDb, isMongoConfigured } from "@/backend/database/mongodb";
import { stores } from "@/backend/masters/master-data";
import { getUserByEmail as getSeedUserByEmail } from "./access-control";
import type { RoleCode, User, UserStatus } from "./types";

type UserDocument = {
  _id?: unknown;
  id?: string;
  name?: string;
  email?: string;
  assignedStores?: string[];
  passwordHash?: string;
  roleCode?: RoleCode;
  status?: UserStatus;
};

type CreateUserInput = {
  passwordHash: string;
  name: string;
  email: string;
};

export async function getUserByEmail(email: string): Promise<User | null> {
  if (!isMongoConfigured()) {
    return getSeedUserByEmail(email);
  }

  const db = await getMongoDb();
  const user = await db.collection<UserDocument>("users").findOne({ email: email.toLowerCase() });

  if (!user?.email || !user.roleCode || !user.status) {
    return null;
  }

  return {
    assignedStores: normalizeAssignedStores(user.roleCode, user.assignedStores),
    id: user.id ?? String(user._id ?? user.email),
    name: user.name ?? user.email,
    email: user.email,
    roleCode: user.roleCode,
    status: normalizeStatus(user.status),
  };
}

export async function ensureDemoAdminUser() {
  if (!isMongoConfigured()) {
    return getSeedUserByEmail(process.env.AUTH_DEMO_EMAIL ?? "admin@example.com");
  }

  const email = (process.env.AUTH_DEMO_EMAIL ?? "admin@example.com").toLowerCase();
  const db = await getMongoDb();

  await db.collection<UserDocument>("users").updateOne(
    { email },
    {
      $setOnInsert: {
        assignedStores: Array.from(new Set(stores)),
        id: "user_demo_admin",
        name: "Demo Admin",
        email,
        roleCode: "ADMIN",
        status: "ACTIVE",
      },
    },
    { upsert: true },
  );

  return getUserByEmail(email);
}

export async function createNewUser(input: CreateUserInput): Promise<User | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  const email = input.email.toLowerCase();
  const db = await getMongoDb();
  const existingUser = await db.collection<UserDocument>("users").findOne({ email });

  if (existingUser) {
    return null;
  }

  const user: User = {
    assignedStores: [],
    id: `user_${Date.now()}`,
    name: input.name,
    email,
    roleCode: "VIEWER",
    status: "PENDING",
  };

  await db.collection<UserDocument>("users").insertOne({
    ...user,
    passwordHash: input.passwordHash,
  });
  return user;
}

export async function getUserPasswordHash(email: string): Promise<string | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  const db = await getMongoDb();
  const user = await db
    .collection<UserDocument>("users")
    .findOne({ email: email.toLowerCase() }, { projection: { passwordHash: 1 } });

  return user?.passwordHash ?? null;
}

export async function approveUser(email: string, roleCode: RoleCode): Promise<User | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  const db = await getMongoDb();
  await db.collection<UserDocument>("users").updateOne(
    { email: email.toLowerCase() },
    {
      $set: {
        roleCode,
        status: "ACTIVE",
      },
    },
  );

  return getUserByEmail(email);
}

export async function listUsers(): Promise<User[]> {
  if (!isMongoConfigured()) {
    const seedUser = getSeedUserByEmail(process.env.AUTH_DEMO_EMAIL ?? "admin@example.com");
    return seedUser ? [seedUser] : [];
  }

  const db = await getMongoDb();
  const users = await db.collection<UserDocument>("users").find({}).sort({ status: -1, email: 1 }).toArray();

  return users
    .filter((user) => user.email && user.roleCode && user.status)
    .map((user) => ({
      id: user.id ?? String(user._id ?? user.email),
      assignedStores: normalizeAssignedStores(user.roleCode ?? "VIEWER", user.assignedStores),
      name: user.name ?? user.email ?? "",
      email: user.email ?? "",
      roleCode: user.roleCode ?? "VIEWER",
      status: normalizeStatus(user.status),
    }));
}

export async function updateUserStatus(email: string, status: UserStatus): Promise<User | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  const db = await getMongoDb();
  await db.collection<UserDocument>("users").updateOne({ email: email.toLowerCase() }, { $set: { status } });

  return getUserByEmail(email);
}

export async function updateUserPasswordHash(email: string, passwordHash: string): Promise<User | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  const db = await getMongoDb();
  await db.collection<UserDocument>("users").updateOne({ email: email.toLowerCase() }, { $set: { passwordHash } });

  return getUserByEmail(email);
}

export async function updateUserStores(email: string, assignedStores: string[]): Promise<User | null> {
  if (!isMongoConfigured()) {
    return null;
  }

  const db = await getMongoDb();
  await db.collection<UserDocument>("users").updateOne(
    { email: email.toLowerCase() },
    { $set: { assignedStores: Array.from(new Set(assignedStores.map((store) => store.trim()).filter(Boolean))) } },
  );

  return getUserByEmail(email);
}

function normalizeAssignedStores(roleCode: RoleCode, assignedStores?: string[]) {
  if (roleCode === "ADMIN") {
    return Array.from(new Set(stores));
  }

  return Array.isArray(assignedStores) ? assignedStores : [];
}

function normalizeStatus(status: unknown): UserStatus {
  const normalized = String(status ?? "PENDING").replaceAll('"', "").toUpperCase();

  if (normalized === "ACTIVE" || normalized === "INACTIVE" || normalized === "PENDING") {
    return normalized;
  }

  return "PENDING";
}
