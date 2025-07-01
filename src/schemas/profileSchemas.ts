import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters long.").max(50, "Name is too long."),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters long."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const notificationSettingsSchema = z.object({
  email: z.object({
    newMessages: z.boolean(),
    maintenanceUpdates: z.boolean(),
    paymentReminders: z.boolean(),
  }),
  sms: z.object({
    newMessages: z.boolean(),
    maintenanceUpdates: z.boolean(),
  }),
}); 