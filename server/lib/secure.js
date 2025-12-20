import crypto from 'crypto';

export const encrypt = (value) => {
  return crypto.createHash('sha256').update(value).digest('hex');
};
