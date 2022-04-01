"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.random = void 0;
const random = (length = 12, prefix = '') => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return prefix + result;
};
exports.random = random;
//# sourceMappingURL=random.js.map