import { randomInt } from "crypto"

export const GenerateOtp = () =>{
    return randomInt(1000, 9999).toString()
}