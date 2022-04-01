"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const mkdirp_1 = __importDefault(require("mkdirp"));
const sharp_1 = __importDefault(require("sharp"));
const random_1 = require("./random");
class S3ImageUploader {
    constructor(accessKeyId, secretAccessKey, bucketName) {
        this.thumbnailSize = {
            width: 200,
            height: 200
        };
        this.resize = {
            size: 800
        };
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
            const raw = yield (0, random_1.random)(16);
            const filename = raw + Date.now() + localExtension;
            const file = dailyDir + filename;
            return new Promise((resolve, reject) => {
                fs_1.default.writeFile(file, base64, 'base64', (err) => {
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
            const fileContent = fs_1.default.readFileSync(file);
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
                const currentDir = path_1.default.join(__dirname, '../uploads');
                const dailyDir = currentDir + '/temp/' + ('0' +
                    (date.getMonth() + 1)).slice(-2) + '-' + date.getDate() + '-' + date.getFullYear();
                mkdirp_1.default.sync(dailyDir + '/original');
                mkdirp_1.default.sync(dailyDir + '/resized');
                mkdirp_1.default.sync(dailyDir + '/thumbnail');
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
                const { width, height } = this.thumbnailSize;
                const { file, filename } = originalDir;
                const image = (0, sharp_1.default)(file);
                const resizedOutput = dir + '/resized/' + filename;
                const thumbnailOutput = dir + '/thumbnail/' + filename;
                // resized from original size
                yield image.resize(this.resize.size, null).toFormat(sharp_1.default.format.jpeg).toFile(resizedOutput);
                // resize image to thumbnail from original size
                yield image.resize(width, height).toFormat(sharp_1.default.format.jpeg).toFile(thumbnailOutput);
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
                const { file, filename } = yield this.saveLocalImage(dailyDir + '/original/', contents);
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
        this.s3 = new aws_sdk_1.default.S3({
            accessKeyId,
            secretAccessKey
        });
    }
}
exports.default = S3ImageUploader;
//# sourceMappingURL=image.js.map