import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto, loginDto, RegisterDto, SendotpDto, verifyOtpDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { GenerateOtp } from 'src/shared/generateOtp';
import * as nodemailer from 'nodemailer'
import * as dotenv from 'dotenv'
import * as bcrypt from 'bcrypt'
import { JwtService } from '@nestjs/jwt';
import * as path from 'path';
import  * as fs  from 'fs/promises';
dotenv.config()

let windowStore : {[key:string]:string} = {};

interface OtpResponse {
  message: string;
}



@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService, private readonly Jwt: JwtService) {}

  private transporter = nodemailer.createTransport({
    service:"gmail",
    auth:{
      user: process.env.EMAIL,
      pass: process.env.PASSWORD
    }
  })

  async sendOtp(data: SendotpDto): Promise<{message: string}> {    
    const { email } = data;
    const otp = GenerateOtp();
    windowStore[email] = otp;
    setTimeout(()=>{
      delete windowStore[email]}, 10*60*1000)
    
    let options = {
      from : process.env.EMAIL,
      to : email,
      subject: 'Your otp code',
      text: `Your OTP: ${otp}`
    }
    try {
      await this.transporter.sendMail(options)

      await this.prisma.user.create({data:{fullName:"", phoneNumber:"", password:"", image:"", isActive:false, balance:0, role:"STAFF", email }})
      return {message:"Otp sent uccessfully"}
    } catch (error) {
      console.log({error});
      throw error
      
    }
  }

  async verifyOtp(data: verifyOtpDto) {
    const { otp, email } = data;
    let sentOtp = windowStore[email];
    
    if (otp === sentOtp) {
      delete windowStore[email]; 
      await this.prisma.user.update({where:{email},data:{isActive:true}})
      return {message: "OTP verified successfully" };
    } else {
      return {message: "Invalid OTP" };
    }
  }

  async register(createUserDto: RegisterDto) {
    let isVerified = await this.prisma.user.findFirst({where:{email:createUserDto.email}})
    if(!isVerified){
      return {Error:"This email is not verified yet"}
    }

    let hashedPassword = await bcrypt.hash(createUserDto.password, 10)
    let createdData = await this.prisma.user.update({where:{email:createUserDto.email},data:{
      fullName:createUserDto.fullName, 
      phoneNumber: createUserDto.phoneNumber,
      image:createUserDto.image, 
      password: hashedPassword,
    }})
    return {message:"Registered successfully"};
  }

  async login(data:loginDto){
    let IsEmailVerified = await this.prisma.user.findFirst({where:{email:data.email}})
    if(!IsEmailVerified){
      return {Error:"This email is not registered yet"}
    }
    let comparedPassword = bcrypt.compareSync(data.password, IsEmailVerified.password);
    if(!comparedPassword){
      return {Error:"Wrong password!"}
    }
    let token = this.Jwt.sign({role: IsEmailVerified.role, id: IsEmailVerified})
    return {token}
  }

  async findAll() {
    return await this.prisma.user.findMany()
 
  }

  async findOne(id: string) {
    let oneData = await this.prisma.user.findFirst({where:{id:id}})
      if (!oneData) {
        throw new NotFoundException('User not found');
    }
    return oneData
  }

  async updateImage(id: string, image: Express.Multer.File){
    let isUserExist = await this.prisma.user.findFirst({where:{id}})
    if(!isUserExist||!isUserExist.image){
      throw new BadRequestException("User not found or image does not exist for this user")
    }
    let filePath = path.join(__dirname,"../../userImage",isUserExist.image)
      try {
    await fs.unlink(filePath); 
  } catch (err) {
    console.warn('Old image not found or already deleted:', err.message);
  }
    await this.prisma.user.update({where:{id}, data:{image:image.filename}})
    return {message:"Image updated successfully"}
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    let updatedData = await this.prisma.user.update({where:{id},data:updateUserDto})
    return {message:"User updated successfully"}
  }

  async remove(id: string) {
    let isUserExist = await this.prisma.user.delete({where:{id}})
    if(!isUserExist){
      throw new BadRequestException("Not found")
    }
    let filePath = path.join(__dirname, "../../userImage", isUserExist.image)
    try {
      fs.unlink(filePath)
      await this.prisma.user.delete({where:{id}})
      return {message:"User deleted successfully"};
    } catch (error) {
      throw new BadRequestException("Something went wrong")
    }
  }

async sendOtpToResetPassword(userId: string) {
  console.log(userId);
  
  const isUserExist = await this.prisma.user.findFirst({ where: { id: userId } });

  if (!isUserExist) {
    throw new BadRequestException("User not found");
  }

  const otp = GenerateOtp();
  const email = isUserExist.email;

  windowStore[email] = otp;

  setTimeout(() => {
    delete windowStore[email];
  }, 10 * 60 * 1000);

  const options = {
    from: process.env.EMAIL,
    to: email,
    subject: "Your OTP to reset password",
    text: `Verify this OTP to reset your password: ${otp}`
  };

  try {
    await this.transporter.sendMail(options);
    return { message: "Check your email and verify OTP." }; // ✅ to'g'ri format
  } catch (error) {
    throw new BadRequestException("Something went wrong!");
  }
}

    
}