export const enum TYPE_STORAGE {
  AWS = 'AWS',
  FTP = 'FTP',
  LOCAL = 'LOCAL',
}

export const TYPE_STORAGE_IMAGE = requireEnv('TYPE_STORAGE');
export const ALLOW_AVATAR_FILE: string[] = ['image/png', 'image/jpeg'];

// FOR TESTING
export const FTP_STORAGE = {
  // basepath: process.env.FTP_STORAGE_BASE_PATH,
  // ftp: {
  //     host: process.env.FTP_STORAGE_HOST,
  //     secure: JSON.parse(process.env.FTP_STORAGE_SECURE),
  //     user: process.env.FTP_STORAGE_USER,
  //     password: process.env.FTP_STORAGE_PASSWORD,
  // },
};

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const AWS_STORAGE = {
  AWS_ACCESS_KEY_ID: requireEnv('AWS_ACCESS_KEY_ID'),
  AWS_SECRET_ACCESS_KEY: requireEnv('AWS_SECRET_ACCESS_KEY'),
  // AWS_ENDPOINT: requireEnv('AWS_ENDPOINT'),
  AWS_BUCKET_NAME: requireEnv('AWS_BUCKET_NAME'),
  AWS_REGION: requireEnv('AWS_REGION'),
  // AWS_ACL: process.env.AWS_ACL,
  // AWS_S3_FORCE_PATH_STYLE: JSON.parse(process.env.AWS_S3_FORCE_PATH_STYLE),
  // AWS_S3_BUCKET_ENDPOINT: JSON.parse(process.env.AWS_S3_BUCKET_ENDPOINT),
};
