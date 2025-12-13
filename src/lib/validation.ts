import { z } from "zod";

/**
 * Validation schemas for forms
 */

export const loginSchema = z.object({
  email: z.string().email("Введите корректный email"),
  password: z.string().min(6, "Пароль должен быть не менее 6 символов"),
});

export const signupSchema = loginSchema.extend({
  fullName: z.string().min(2, "Имя должно быть не менее 2 символов").max(50, "Имя слишком длинное"),
});

export const createRideSchema = z.object({
  from_city: z.string().min(2, "Город отправления обязателен").max(100),
  from_address: z.string().max(200).optional(),
  to_city: z.string().min(2, "Город прибытия обязателен").max(100),
  to_address: z.string().max(200).optional(),
  departure_date: z.string().refine(
    (date) => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    },
    { message: "Дата не может быть в прошлом" }
  ),
  departure_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Неверный формат времени"),
  estimated_duration: z.string().max(50).optional(),
  price: z.string().refine(
    (val) => {
      const num = parseInt(val);
      return !isNaN(num) && num > 0 && num <= 100000;
    },
    { message: "Цена должна быть от 1 до 100000 рублей" }
  ),
  seats_total: z.string().refine(
    (val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 1 && num <= 7;
    },
    { message: "Количество мест должно быть от 1 до 7" }
  ),
  seats_available: z.string().refine(
    (val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 0 && num <= 7;
    },
    { message: "Свободных мест должно быть от 0 до 7" }
  ),
  allow_smoking: z.boolean(),
  allow_pets: z.boolean(),
  allow_music: z.boolean(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => {
    const seatsAvailable = parseInt(data.seats_available);
    const seatsTotal = parseInt(data.seats_total);
    return seatsAvailable <= seatsTotal;
  },
  {
    message: "Свободных мест не может быть больше общего количества",
    path: ["seats_available"],
  }
);

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type CreateRideFormData = z.infer<typeof createRideSchema>;

