import multer from "multer"
import path from "path"
import os from "os"

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir())  // Uses system temp dir — outside OneDrive
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`)
  }
})

export const upload = multer({ storage: storage })
