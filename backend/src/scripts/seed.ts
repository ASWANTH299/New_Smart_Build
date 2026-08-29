import mongoose from "mongoose";
import { config } from "../config/index.js";
import { UserModel, UserRole } from "../modules/users/user.model.js";
import { ProjectTypeModel } from "../modules/project-types/projectType.model.js";
import { ProjectModel, IProject } from "../modules/projects/project.model.js";
import { ProjectMembershipModel } from "../modules/auth/projectMembership.model.js";
import { PhaseModel, IPhase } from "../modules/phases/phase.model.js";
import { TaskModel, ITask } from "../modules/tasks/task.model.js";
import { MilestoneModel } from "../modules/milestones/milestone.model.js";
import { hashPassword } from "../utils/password.js";

export interface SeedOptions {
  resetAdminPassword?: boolean;
  seedDevFixtures?: boolean;
}

export interface SeedResult {
  adminCreated: boolean;
  adminUpdated: boolean;
  adminEmail: string;
  devUsersCreated: number;
  projectTypesCreated: number;
  projectsCreated: number;
}

export async function seedDatabase(options: SeedOptions = {}): Promise<SeedResult> {
  const adminEmail = process.env.INITIAL_ADMIN_EMAIL?.toLowerCase().trim();
  const defaultPassword = process.env.INITIAL_ADMIN_PASSWORD;
  const adminName = process.env.INITIAL_ADMIN_NAME || "System Administrator";

  if (!adminEmail || !defaultPassword) {
    const existingAnyAdmin = await UserModel.findOne({ primaryRole: "ADMIN" }).exec();
    if (!existingAnyAdmin) {
      throw new Error(
        "Missing required bootstrap environment variables: INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD"
      );
    }
  }

  const effectiveAdminEmail = (adminEmail || "admin@smartbuild.com").toLowerCase().trim();
  const effectivePassword = defaultPassword || "Admin@123456";

  const shouldReset =
    options.resetAdminPassword === true ||
    process.env.RESET_ADMIN_PASSWORD === "true" ||
    process.argv.includes("--reset-admin");

  const withDevFixtures =
    options.seedDevFixtures === true ||
    process.env.SEED_DEV_FIXTURES === "true" ||
    process.argv.includes("--with-dev-fixtures");

  let adminCreated = false;
  let adminUpdated = false;
  let devUsersCreated = 0;

  // 1. Seed baseline Project Types
  const defaultTypes = [
    { name: "Residential", code: "RES", description: "Residential building and villa projects" },
    { name: "Commercial", code: "COM", description: "Commercial towers, malls, and offices" },
    { name: "Infrastructure", code: "INF", description: "Roads, bridges, and public civil works" },
    { name: "Industrial", code: "IND", description: "Warehouses, manufacturing plants, and logistics" },
  ];

  let projectTypesCreated = 0;
  for (const type of defaultTypes) {
    const exists = await ProjectTypeModel.findOne({ code: type.code }).exec();
    if (!exists) {
      await ProjectTypeModel.create(type);
      projectTypesCreated += 1;
    }
  }

  const defaultType = await ProjectTypeModel.findOne({ code: "COM" }).exec();

  // 2. Seed / Synchronize Initial ADMIN User (Bootstrap Authority)
  const existingAdmin = await UserModel.findOne({ email: effectiveAdminEmail }).exec();

  let adminUserId: mongoose.Types.ObjectId;

  if (!existingAdmin) {
    const passwordHash = await hashPassword(effectivePassword);
    const newAdmin = await UserModel.create({
      name: adminName,
      email: effectiveAdminEmail,
      passwordHash,
      primaryRole: "ADMIN",
      additionalPermissions: [],
      status: "ACTIVE",
      failedLoginCount: 0,
      accountLockedUntil: null,
    });
    adminCreated = true;
    adminUserId = newAdmin._id;
  } else {
    adminUserId = existingAdmin._id;
    if (shouldReset) {
      const passwordHash = await hashPassword(effectivePassword);
      existingAdmin.passwordHash = passwordHash;
      existingAdmin.status = "ACTIVE";
      existingAdmin.failedLoginCount = 0;
      existingAdmin.accountLockedUntil = null;
      await existingAdmin.save();
      adminUpdated = true;
    }
  }

  // 3. Conditionally Seed Development Role Fixtures if explicitly requested
  const userMap = new Map<string, mongoose.Types.ObjectId>();
  userMap.set("ADMIN", adminUserId);

  let projectsCreated = 0;

  if (withDevFixtures) {
    const roleAccounts: Array<{ email: string; name: string; role: UserRole }> = [
      { email: (process.env.INITIAL_PM_EMAIL || "pm@smartbuild.com").toLowerCase().trim(), name: "Rajesh Mukherjee (PM)", role: "PROJECT_MANAGER" },
      { email: (process.env.INITIAL_ENGINEER_EMAIL || "engineer@smartbuild.com").toLowerCase().trim(), name: "Amit Sharma (Site Eng)", role: "SITE_ENGINEER" },
      { email: (process.env.INITIAL_STORE_EMAIL || "store@smartbuild.com").toLowerCase().trim(), name: "Vikram Verma (Store Mgr)", role: "STORE_MANAGER" },
      { email: (process.env.INITIAL_CONTRACTOR_EMAIL || "contractor@smartbuild.com").toLowerCase().trim(), name: "Suresh Patil (Contractor)", role: "CONTRACTOR" },
      { email: (process.env.INITIAL_CLIENT_EMAIL || "client@smartbuild.com").toLowerCase().trim(), name: "Urban Skyline Corp (Client)", role: "CLIENT" },
    ];

    for (const account of roleAccounts) {
      const existingUser = await UserModel.findOne({ email: account.email }).exec();

      if (!existingUser) {
        const passwordHash = await hashPassword(effectivePassword);
        const newUser = await UserModel.create({
          name: account.name,
          email: account.email,
          passwordHash,
          primaryRole: account.role,
          additionalPermissions: [],
          status: "ACTIVE",
          failedLoginCount: 0,
          accountLockedUntil: null,
        });

        devUsersCreated += 1;
        userMap.set(account.role, newUser._id);
      } else {
        userMap.set(account.role, existingUser._id);
        if (shouldReset) {
          const passwordHash = await hashPassword(effectivePassword);
          existingUser.passwordHash = passwordHash;
          existingUser.status = "ACTIVE";
          existingUser.failedLoginCount = 0;
          existingUser.accountLockedUntil = null;
          await existingUser.save();
        }
      }
    }

    // Seed baseline active construction project for dev fixtures
    let project = (await ProjectModel.findOne({ code: "PRJ-2026-001" }).exec()) as IProject | null;

    const pmId = userMap.get("PROJECT_MANAGER") || adminUserId;
    const clientId = userMap.get("CLIENT");
    const engineerId = userMap.get("SITE_ENGINEER") || pmId;
    const contractorId = userMap.get("CONTRACTOR") || pmId;

    if (!project) {
      project = (await ProjectModel.create({
        code: "PRJ-2026-001",
        name: "Apex Horizon Tower",
        typeId: defaultType?._id,
        location: "Sector 62, Metro Corridor",
        description: "24-storey commercial office and retail complex development.",
        plannedStartDate: new Date("2026-01-01"),
        plannedEndDate: new Date("2027-06-30"),
        actualStartDate: new Date("2026-01-15"),
        projectManagerId: pmId,
        clientUserId: clientId || null,
        status: "ACTIVE",
        health: "HEALTHY",
        healthFactors: [],
        progress: 45,
        createdBy: adminUserId,
      })) as IProject;
      projectsCreated += 1;
    }

    const projectId = project._id;
    const projectIdStr = projectId.toString();

    // Ensure all 6 roles have active project membership
    const allRoleIds = Array.from(userMap.values());
    for (const uid of allRoleIds) {
      const memExists = await ProjectMembershipModel.findOne({
        userId: uid,
        projectId: projectIdStr,
      }).exec();

      if (!memExists) {
        await ProjectMembershipModel.create({
          userId: uid,
          projectId: projectIdStr,
          assignmentStatus: "ACTIVE",
          assignedAt: new Date(),
          assignedBy: adminUserId,
        });
      }
    }

    // Check and seed Phases
    const phaseCount = await PhaseModel.countDocuments({ projectId }).exec();
    if (phaseCount === 0) {
      const phase1 = (await PhaseModel.create({
        projectId,
        name: "Substructure & Deep Foundation",
        sequence: 1,
        plannedStartDate: new Date("2026-01-15"),
        plannedEndDate: new Date("2026-04-30"),
        actualStartDate: new Date("2026-01-15"),
        actualEndDate: new Date("2026-04-20"),
        status: "COMPLETED",
        progress: 100,
      })) as IPhase;

      const phase2 = (await PhaseModel.create({
        projectId,
        name: "Superstructure Concrete Frame",
        sequence: 2,
        plannedStartDate: new Date("2026-05-01"),
        plannedEndDate: new Date("2026-12-31"),
        actualStartDate: new Date("2026-05-01"),
        status: "IN_PROGRESS",
        progress: 45,
      })) as IPhase;

      const phase3 = (await PhaseModel.create({
        projectId,
        name: "Finishing, Facade & MEP Works",
        sequence: 3,
        plannedStartDate: new Date("2027-01-01"),
        plannedEndDate: new Date("2027-06-30"),
        status: "NOT_STARTED",
        progress: 0,
      })) as IPhase;

      // Seed Tasks
      const task1 = (await TaskModel.create({
        projectId,
        phaseId: phase1._id,
        title: "Pile Cap & Raft Concrete Pouring",
        plannedQuantity: 1200,
        completedQuantity: 1200,
        unit: "cu.m",
        progress: 100,
        plannedStartDate: new Date("2026-01-15"),
        plannedEndDate: new Date("2026-03-31"),
        actualStartDate: new Date("2026-01-15"),
        actualEndDate: new Date("2026-03-25"),
        contractorId,
        priority: "HIGH",
        status: "COMPLETED",
        dependencies: [],
        createdBy: pmId,
      })) as ITask;

      const task2 = (await TaskModel.create({
        projectId,
        phaseId: phase2._id,
        title: "Columns & Level 5 Slab Casting",
        plannedQuantity: 2500,
        completedQuantity: 1125,
        unit: "cu.m",
        progress: 45,
        plannedStartDate: new Date("2026-05-01"),
        plannedEndDate: new Date("2026-09-30"),
        actualStartDate: new Date("2026-05-05"),
        assigneeId: engineerId,
        priority: "URGENT",
        status: "IN_PROGRESS",
        dependencies: [task1._id],
        createdBy: pmId,
      })) as ITask;

      await TaskModel.create({
        projectId,
        phaseId: phase3._id,
        title: "Exterior Glass Facade Glazing",
        plannedQuantity: 4500,
        completedQuantity: 0,
        unit: "sq.m",
        progress: 0,
        plannedStartDate: new Date("2027-01-01"),
        plannedEndDate: new Date("2027-04-30"),
        contractorId,
        priority: "MEDIUM",
        status: "TODO",
        dependencies: [task2._id],
        createdBy: pmId,
      });
    }

    // Check and seed Milestones
    const milestoneCount = await MilestoneModel.countDocuments({ projectId }).exec();
    if (milestoneCount === 0) {
      await MilestoneModel.create({
        projectId,
        name: "Substructure & Raft Handover",
        description: "Completion and engineering signoff of sub-grade foundation.",
        plannedDate: new Date("2026-04-30"),
        actualDate: new Date("2026-04-20"),
        status: "ACHIEVED",
        clientVisible: true,
      });

      await MilestoneModel.create({
        projectId,
        name: "Level 10 Structural Topping Out",
        description: "Mid-height structural frame completion milestone.",
        plannedDate: new Date("2026-10-15"),
        status: "PENDING",
        clientVisible: true,
      });

      await MilestoneModel.create({
        projectId,
        name: "Final Handover & Occupancy Certificate",
        description: "Final client inspection, authority clearances, and key handover.",
        plannedDate: new Date("2027-06-30"),
        status: "PENDING",
        clientVisible: true,
      });
    }
  }

  return {
    adminCreated,
    adminUpdated,
    adminEmail: effectiveAdminEmail,
    devUsersCreated,
    projectTypesCreated,
    projectsCreated,
  };
}

async function runSeed() {
  try {
    console.log(`Connecting to database: ${config.MONGODB_URI}...`);
    await mongoose.connect(config.MONGODB_URI);
    console.log("Connected to MongoDB. Running bootstrap seed...");

    const result = await seedDatabase();

    if (result.adminCreated) {
      console.log(`[SEED] Created initial ADMIN user: ${result.adminEmail}`);
    } else if (result.adminUpdated) {
      console.log(`[SEED] ADMIN user (${result.adminEmail}) password was successfully reset.`);
    } else {
      console.log(
        `[SEED] ADMIN user (${result.adminEmail}) already exists. (Use npm run seed:reset to reset credentials).`
      );
    }

    console.log(`[SEED] Initialized ${result.projectTypesCreated} default project type(s).`);
    if (result.devUsersCreated > 0) {
      console.log(`[SEED] Seeded ${result.devUsersCreated} development role account(s).`);
    }
    if (result.projectsCreated > 0) {
      console.log(`[SEED] Created ${result.projectsCreated} baseline construction project(s).`);
    }
    console.log("[SEED] Database bootstrap completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("[SEED ERROR] Bootstrap failed:", error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Execute directly when run as CLI script
if (process.argv[1] && process.argv[1].endsWith("seed.ts")) {
  runSeed();
}
