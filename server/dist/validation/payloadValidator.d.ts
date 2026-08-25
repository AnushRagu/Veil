import { Request, Response, NextFunction } from "express";
export declare const payloadSizeLimit = 500000;
export declare function validatePayload(req: Request, res: Response, next: NextFunction): void;
export declare function sanitizeOriginCheck(req: Request, res: Response, next: NextFunction): void;
export declare function rateLimiter(maxRequests?: number, windowMs?: number): (req: Request, res: Response, next: NextFunction) => void;
//# sourceMappingURL=payloadValidator.d.ts.map