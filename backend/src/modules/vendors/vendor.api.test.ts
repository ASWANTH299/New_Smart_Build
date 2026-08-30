import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../../app.js";
import vendorService from "./vendor.service.js";
import { UserModel } from "../users/user.model.js";
import { generateJwtToken } from "../../utils/jwt.js";
import { IVendor } from "./vendor.model.js";

vi.mock("./vendor.service.js");

describe("Vendors API Integration Tests (Phase 9)", () => {
  const app = createApp();
  const adminId = "507f1f77bcf86cd799439011";
  const adminToken = generateJwtToken({
    userId: adminId,
    email: "admin@smartbuild.com",
    role: "ADMIN",
  });

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(UserModel, "findById").mockReturnValue({
      exec: vi.fn().mockResolvedValue({
        _id: adminId,
        primaryRole: "ADMIN",
        status: "ACTIVE",
      }),
    } as unknown as ReturnType<typeof UserModel.findById>);
  });

  it("GET /api/v1/vendors - should list vendors", async () => {
    vi.spyOn(vendorService, "getVendors").mockResolvedValue({
      vendors: [
        {
          _id: new mongoose.Types.ObjectId(),
          code: "VEN-001",
          name: "Apex Steel Ltd",
          status: "ACTIVE",
        } as unknown as IVendor,
      ],
      pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
    });

    const res = await request(app)
      .get("/api/v1/vendors")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].code).toBe("VEN-001");
  });

  it("POST /api/v1/vendors - should create a new vendor", async () => {
    const newVendor = {
      _id: new mongoose.Types.ObjectId(),
      code: "VEN-002",
      name: "Ultra Cement",
      contact: {
        name: "Rahul Roy",
        email: "rahul@ultracement.com",
        phone: "+91-9876543210",
      },
      address: {
        city: "Mumbai",
        country: "India",
      },
      status: "ACTIVE",
    };

    vi.spyOn(vendorService, "createVendor").mockResolvedValue(newVendor as unknown as IVendor);

    const res = await request(app)
      .post("/api/v1/vendors")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        code: "VEN-002",
        name: "Ultra Cement",
        contact: {
          name: "Rahul Roy",
          email: "rahul@ultracement.com",
          phone: "+91-9876543210",
        },
        address: {
          city: "Mumbai",
          country: "India",
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe("Ultra Cement");
  });
});
