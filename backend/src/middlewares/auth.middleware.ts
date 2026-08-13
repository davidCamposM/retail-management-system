import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";




interface JwtPayload {
    id  : number;
    role: "ADMIN" | "VENDEDOR"
}


export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  
    const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    // Authorization error. 
    return res.status(401).json({ error: "Token not provided" });
  }


// Only the token is extracted, without the "Bearer" variable.
  const token = header.split(" ")[1];


// Try | Catch
try {

    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = payload;
    return next();

  } catch {

    return res.status(401).json({ error: "Invalid Token" });

  }

}