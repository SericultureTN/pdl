import { z } from "zod";
import { axiosClient } from "@/services/http/axiosClient";

const UserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  role: z.enum(["AD_OFFICE_USER", "MIS_ADMIN", "SUPER_ADMIN"]),
  name: z.string().nullable().optional(),
  adOfficeId: z.number().nullable().optional(),
  adOfficeName: z.string().nullable().optional(),
});

export type ApiUser = z.infer<typeof UserSchema>;

const LoginResponseSchema = z.object({
  ok: z.boolean(),
  accessToken: z.string(),
  user: UserSchema,
});

const MeResponseSchema = z.object({
  ok: z.boolean(),
  user: UserSchema,
});

export const authApi = {
  async login(input: { email: string; password: string }) {
    const { data } = await axiosClient.post("/auth/login", input);
    return LoginResponseSchema.parse(data);
  },
  async me() {
    const { data } = await axiosClient.get("/auth/me");
    return MeResponseSchema.parse(data);
  },
  async logout() {
    const { data } = await axiosClient.post("/auth/logout");
    return z.object({ ok: z.boolean() }).passthrough().parse(data);
  },
};

