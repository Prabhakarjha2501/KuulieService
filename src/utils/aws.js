const AWS = require('aws-sdk');
const multerS3 = require('multer-s3');
const mime = require('mime-types');
const fs = require('fs/promises');
const fsWithoutPromise = require('fs');

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const uploadQuotationDocument = async (fileName, fileData) => {
    const params = {
        Bucket: process.env.AWS_PUBLIC_LINK_BUCKET,
        Key: fileName,
        ContentType: 'application/pdf',
        Body: fileData
    };
    return s3.upload(params).promise();
}

const uploadDocument = async (fileName, ContentType, fileData) => {
    const params = {
        Bucket: process.env.AWS_PUBLIC_LINK_BUCKET,
        Key: fileName,
        ContentType: 'application/pdf',
        Body: fileData
    };
    return s3.upload(params).promise();
}

const uploadLogFile = async (fileName) => {
    if(fsWithoutPromise.existsSync(fileName)) {
        const fileData = await fs.readFile(fileName);
        const params = {
            Bucket: process.env.AWS_PUBLIC_LINK_BUCKET,
            Key: fileName,
            ContentType: 'text/plain',
            Body: fileData
        };
        const s3Response = s3.upload(params).promise();
        fs.unlink(fileName);
        return s3Response;
    }
}

const getMulterS3Storage = () => multerS3({
    s3: s3,
    bucket: process.env.AWS_PUBLIC_LINK_BUCKET,
    contentType: function (_req, file, cb) {
        cb(null, file.mimetype)
    },
    metadata: function (_req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (_req, file, cb) {
        const ext = mime.extension(file.mimetype);
        cb(null, `${Date.now().toString()}.${ext}`)
    }
})

module.exports = {
    uploadQuotationDocument,
    uploadDocument,
    getMulterS3Storage,
    uploadLogFile
}
