import { randomInt } from "crypto";

export function generateTemporaryPassword(length = 14) {
  const chars =
    "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += chars.charAt(randomInt(chars.length));
  }
  return password;
}
