import { Request, Response, NextFunction } from "express";

/**
 * Middleware is created to control permissions based on each user's role.
 * 
 * Definition:
 * requireRole(...roles) generates middleware that allows the request to proceed only 
 * if an authenticated user exists and their individual role is included in the list 
 * of roles specified when the middleware was applied to that route. 
 * If either condition is not met, it responds with a 403 status and halts execution.
 */
export function requireRole(...allowedRoles: string[]) {

  return (req: Request, res: Response, next: NextFunction) => {

    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "No tienes permisos para esta acción" });

    }
    return next();
  };
}