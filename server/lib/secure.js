import crypto from 'crypto';

const encrypt = (value) => crypto.createHash('sha256').update(value).digest('hex');

export default encrypt;
