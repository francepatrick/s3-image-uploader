"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const AWS = __importStar(require("aws-sdk"));
const mkdirp = __importStar(require("mkdirp"));
const sharp = __importStar(require("sharp"));
class S3ImageUploader {
    constructor(accessKeyId, secretAccessKey, bucketName) {
        /**
         * Check image; only image files are allowed
         * @param contents Base64 image
         */
        this.checkImage = (contents) => {
            const message = 'Only PNG/JPG files are allowed! 20MB max.';
            return contents.substring(0, 10) === 'data:image' ? null : { message };
        };
        /**
         * Save image to local
         * @param dailyDir Created file directory
         * @param contents Base64 image
         */
        this.saveLocalImage = (dailyDir, contents) => __awaiter(this, void 0, void 0, function* () {
            const { base64, localExtension } = yield this.replaceImage(contents);
            const raw = yield crypto.pseudoRandomBytes(16);
            const filename = raw.toString('hex') + Date.now() + localExtension;
            const file = dailyDir + filename;
            return new Promise((resolve, reject) => {
                fs.writeFile(file, base64, 'base64', (err) => {
                    err ? reject(err) : resolve({ filename, file });
                });
            });
        });
        /**
         * Replace image png to jpeg
         * @param contents Base64 Image
         */
        this.replaceImage = (contents) => {
            const base64 = contents.replace(/^data:image\/png;base64,/, '')
                .replace(/^data:image\/jpg;base64,/, '')
                .replace(/^data:image\/jpeg;base64,/, '');
            const localExtension = contents.charAt(0) === 'i' ? '.png' : '.jpeg';
            return { base64, localExtension };
        };
        /***
         * AWS S3 upload
         * @param file File location
         * @param filename File name
         * @param contentType Content Type
         */
        this.uploadToS3 = (file, filename, contentType = 'image/jpeg') => {
            const fileContent = fs.readFileSync(file);
            const params = {
                Bucket: this.bucketName,
                Key: filename,
                Body: fileContent,
                ContentType: contentType,
                ACL: 'public-read'
            };
            return new Promise((resolve, reject) => {
                this.s3.upload(params, (err, data) => {
                    err ? reject(err) : resolve(data.Location);
                });
            });
        };
        /**
         * Create Uploads Directory
         */
        this.createDirectory = () => {
            return new Promise((resolve) => {
                const date = new Date();
                const currentDir = path.join(__dirname, 'public');
                const dailyDir = currentDir + '/uploads/temp/' + ('0' +
                    (date.getMonth() + 1)).slice(-2) + '-' + date.getDate() + '-' + date.getFullYear();
                mkdirp.sync(dailyDir + '/original');
                mkdirp.sync(dailyDir + '/resized');
                mkdirp.sync(dailyDir + '/thumbnail');
                resolve(dailyDir);
            });
        };
        /**
         * Resize images from original size
         * resized original image to 800 width
         * thumbnail 200x200
         * @param originalDir Original image directory
         * @param dir Upload image dir
         */
        this.resizeImage = (originalDir, dir) => __awaiter(this, void 0, void 0, function* () {
            try {
                const { file, filename } = originalDir;
                const image = sharp(file);
                const resizedOutput = dir + '/resized/' + filename;
                const thumbnailOutput = dir + '/thumbnail/' + filename;
                // resized from original size
                yield image.resize(800, null).toFormat(sharp.format.jpeg).toFile(resizedOutput);
                // resize image to thumbnail from original size
                yield image.resize(200, 200).toFormat(sharp.format.jpeg).toFile(thumbnailOutput);
                return { message: 'file created!' };
            }
            catch (e) {
                return Promise.reject({ message: e });
            }
        });
        /**
         * Upload image
         * @param contents Base64
         */
        this.upload = (contents) => __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.checkImage(contents);
                const dailyDir = yield this.createDirectory();
                const { file, filename } = yield this.saveLocalImage(dailyDir + '/original', contents);
                yield this.resizeImage({ file, filename }, dailyDir);
                const promises = [
                    this.uploadToS3(file, 'original-' + filename),
                    this.uploadToS3(dailyDir + '/resized/' + filename, 'resized-' + filename),
                    this.uploadToS3(dailyDir + '/thumbnail/' + filename, 'thumbnail-' + filename)
                ];
                const result = yield Promise.all(promises);
                return {
                    original: result[0],
                    thumbnail: result[1],
                    resized: result[2],
                };
            }
            catch (err) {
                return Promise.reject({ message: err });
            }
        });
        this.bucketName = bucketName;
        this.s3 = new AWS.S3({
            accessKeyId,
            secretAccessKey
        });
    }
}
exports.default = S3ImageUploader;
//# sourceMappingURL=image.js.map