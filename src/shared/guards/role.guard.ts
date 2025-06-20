import {CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable } from "rxjs";
import { TYPE } from "./role.decorator";

@Injectable()
export class JwtRoleGuard implements CanActivate{
    constructor(private readonly reflector:Reflector){}
    canActivate(context: ExecutionContext): boolean  {
        const role = this.reflector.getAllAndOverride(TYPE,[
            context.getHandler(),
            context.getClass()
        ])
        if(!role){
            return true
        }
        let {user} = context.switchToHttp().getRequest()
        return role.some((r)=> r == user.role)
    }
}