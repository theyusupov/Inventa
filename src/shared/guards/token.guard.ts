import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate{
    constructor(private jwt: JwtService){}
    canActivate(context: ExecutionContext): boolean {
        let request = context.switchToHttp().getRequest();
        let token = request.headers.authorization?.split(" ")[1]
        if(!token){
            throw new UnauthorizedException("Token not found")
        }
        try {
            let data = this.jwt.verify(token)
            request.user = data
            return true
        } catch (error) {
            throw new UnauthorizedException("Wrong token")
        }
    }
}

 
