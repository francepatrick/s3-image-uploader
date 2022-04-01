declare class S3ImageUploader {
    thumbnailSize: {
        width: number;
        height: number;
    };
    resize: {
        size: number;
    };
    private s3;
    private readonly bucketName;
    constructor(accessKeyId: string, secretAccessKey: string, bucketName: string);
    /**
     * Check image; only image files are allowed
     * @param contents Base64 image
     */
    private checkImage;
    /**
     * Save image to local
     * @param dailyDir Created file directory
     * @param contents Base64 image
     */
    private saveLocalImage;
    /**
     * Replace image png to jpeg
     * @param contents Base64 Image
     */
    private replaceImage;
    /***
     * AWS S3 upload
     * @param file File location
     * @param filename File name
     * @param contentType Content Type
     */
    private uploadToS3;
    /**
     * Create Uploads Directory
     */
    private createDirectory;
    /**
     * Resize images from original size
     * resized original image to 800 width
     * thumbnail 200x200
     * @param originalDir Original image directory
     * @param dir Upload image dir
     */
    private resizeImage;
    /**
     * Upload image
     * @param contents Base64
     */
    upload: (contents: string) => Promise<{
        original: string;
        thumbnail: string;
        resized: string;
    }>;
}
export default S3ImageUploader;
//# sourceMappingURL=image.d.ts.map