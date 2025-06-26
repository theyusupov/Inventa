import {diskStorage} from 'multer'
import { extname } from 'path'

const createMulterStorage = (endpoint:string)=>{
    return diskStorage({
        destination:endpoint,
        filename: (req, file, cb) => {
            cb(null, `${Date.now()}${extname(file.originalname)}`)
        }
    })
}

export const multerUploadUserImage = createMulterStorage('./images')




