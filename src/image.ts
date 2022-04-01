import * as path from 'path';
import * as crypto from 'crypto';
import * as fs from 'fs';

import * as AWS from 'aws-sdk'
import * as mkdirp from 'mkdirp';
import * as sharp from 'sharp';

interface LocalFileInterface {
    filename: string;
    file: string;
}

class S3ImageUploader {

    private s3: any;
    private readonly bucketName: string;

    constructor(accessKeyId: string, secretAccessKey: string, bucketName: string) {
        this.bucketName = bucketName
        this.s3 = new AWS.S3({
            accessKeyId,
            secretAccessKey
        });
    }


    /**
     * Check image; only image files are allowed
     * @param contents Base64 image
     */
    private checkImage = (contents) => {
        const message = 'Only PNG/JPG files are allowed! 20MB max.'
        return contents.substring(0, 10) === 'data:image' ? null : {message}
    }


    /**
     * Save image to local
     * @param dailyDir Created file directory
     * @param contents Base64 image
     */
    private saveLocalImage = async (dailyDir: string, contents: string): Promise<LocalFileInterface> => {
        const {base64, localExtension}: any = await this.replaceImage(contents)
        const raw = await crypto.pseudoRandomBytes(16);
        const filename = raw.toString('hex') + Date.now() + localExtension;
        const file = dailyDir + filename;
        return new Promise((resolve, reject) => {
            fs.writeFile(file, base64, 'base64', (err) => {
                err ? reject(err) : resolve({filename, file})
            });
        })
    }


    /**
     * Replace image png to jpeg
     * @param contents Base64 Image
     */
    private replaceImage = (contents) => {
        const base64 = contents.replace(/^data:image\/png;base64,/, '')
            .replace(/^data:image\/jpg;base64,/, '')
            .replace(/^data:image\/jpeg;base64,/, '');
        const localExtension = contents.charAt(0) === 'i' ? '.png' : '.jpeg'
        return {base64, localExtension}
    }

    /***
     * AWS S3 upload
     * @param file File location
     * @param filename File name
     * @param contentType Content Type
     */
    private uploadToS3 = (file, filename, contentType = 'image/jpeg'): Promise<string> => {
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
                err ? reject(err) : resolve(data.Location)
            });
        })
    }


    /**
     * Create Uploads Directory
     */
    private createDirectory = (): Promise<string> => {
        return new Promise((resolve) => {
            const date = new Date();
            const currentDir = path.join(__dirname, 'public')
            const dailyDir = currentDir + '/uploads/temp/' + ('0' +
                (date.getMonth() + 1)).slice(-2) + '-' + date.getDate() + '-' + date.getFullYear();
            mkdirp.sync(dailyDir + '/original');
            mkdirp.sync(dailyDir + '/resized');
            mkdirp.sync(dailyDir + '/thumbnail');
            resolve(dailyDir);
        });
    }

    /**
     * Resize images from original size
     * resized original image to 800 width
     * thumbnail 200x200
     * @param originalDir Original image directory
     * @param dir Upload image dir
     */
    private resizeImage = async (originalDir: { file: string, filename: string }, dir: string) => {
        try {
            const {file, filename} = originalDir
            const image = sharp(file)
            const resizedOutput = dir + '/resized/' + filename
            const thumbnailOutput = dir + '/thumbnail/' + filename
            // resized from original size
            await image.resize(800, null).toFormat(sharp.format.jpeg).toFile(resizedOutput);
            // resize image to thumbnail from original size
            await image.resize(200, 200).toFormat(sharp.format.jpeg).toFile(thumbnailOutput);
            return {message: 'file created!'}
        } catch (e) {
            return Promise.reject({message: e})
        }
    }

    /**
     * Upload image
     * @param contents Base64
     */
    public upload = async (contents: string) : Promise<{original: string, thumbnail: string, resized: string}>=> {
        try {
            await this.checkImage(contents)
            const dailyDir = await this.createDirectory()
            const {file, filename} = await this.saveLocalImage(dailyDir + '/original', contents)
            await this.resizeImage({file, filename}, dailyDir)
            const promises = [
                this.uploadToS3(file, 'original-' + filename),
                this.uploadToS3(dailyDir + '/resized/' + filename, 'resized-' + filename),
                this.uploadToS3(dailyDir + '/thumbnail/' + filename, 'thumbnail-' + filename)
            ]
            const result = await Promise.all(promises)
            return {
                original: result[0],
                thumbnail: result[1],
                resized: result[2],
            }
        } catch (err) {
            return Promise.reject({message: err})
        }
    };
}

export default S3ImageUploader
