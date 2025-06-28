import { BadRequestException } from "@nestjs/common";

export function formatPhoneNumber(phone: string): string {
  if (!/^998\d{9}$/.test(phone)) throw new BadRequestException("Phone number length and format should be: '998932512624'")
  return `+${phone.slice(0, 3)}-${phone.slice(3, 5)}-${phone.slice(5, 8)}-${phone.slice(8, 10)}-${phone.slice(10, 12)}`;
}
