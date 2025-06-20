import { SetMetadata } from "@nestjs/common"
import { UserRole } from "generated/prisma"

export let TYPE = "type"

export const Roles = (roles:UserRole[]) =>  SetMetadata(TYPE,roles)