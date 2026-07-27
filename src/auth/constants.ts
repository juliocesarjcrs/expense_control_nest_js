if (!process.env.SECRET_KEY) {
  throw new Error('SECRET_KEY environment variable is not defined');
}

export const jwtConstants = {
  secret: process.env.SECRET_KEY,
};
