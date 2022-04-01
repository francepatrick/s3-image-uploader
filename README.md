# s3-image-uploader
> Automated AWS S3 bucket image upload

## Highlights

- Simple and kewl automated library 
- TypeScript supported

## Installation

```bash
npm install --save @franzepatricks/s3-image-uploader
# or
yarn add @franzepatricks/s3-image-uploader
```

## Usage 

```js
import S3ImageUploader from '@franzepatricks/s3-image-uploader'

// create an instance 
const uploader = new S3ImageUploader('AWS accessKeyId', 'AWS secret key', 'bucket name')

data.upload('base64 image')
    .then((data) => {
        // return object {original, thumbnail, resized} aws public url
    }).catch((err) => {
        // err
    })


// you can adjust also the thumbnail size and resize 
data.thumbnailSize.height = 300;
data.thumbnailSize.width = 400;
data.resize.size = 400;
```
Note: after uploading images the library will create a temporary upload directory in the root folder


## License

MIT License

Copyright (c) 2022 France Patrick M Lodonia 

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
