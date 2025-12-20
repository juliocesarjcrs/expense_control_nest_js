/**
 * Interface para el payload del JWT
 * Define exactamente qué datos se guardan en el token
 */
export interface JwtPayload {
  sub: number; // ID del usuario (subject)
  email: string; // Email del usuario
  role: number; // Rol: 0 = Normal, 1 = Admin
  name: string; // Nombre del usuario
  iat?: number; // Issued at (fecha de creación) - agregado automáticamente
  exp?: number; // Expiration (fecha de expiración) - agregado automáticamente
}

/**
 * Interface para el usuario validado que se asigna a req.user
 * Este es el objeto que recibirás en tus controllers
 */
export interface JwtUser {
  id: number;
  email: string;
  role: number;
  name: string;
}

/**
 * Tipo para extender el Request de Express con el usuario tipado
 * Úsalo en tus controllers para tener autocompletado
 */
export interface RequestWithUser extends Request {
  user: JwtUser;
}
