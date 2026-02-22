import { Request, Response, NextFunction } from "express"

interface customRequest extends Request {
  user?: any // or any other type
}

// const asyncHandler = (func:(req: Request, res: Response, next: NextFunction) => any) => async (req:Request, res:Response, next:NextFunction) => {
//   try {
//     await func(req,res,next)
//   } catch (err: any)  {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message
//     })
//   }
// }

const asyncHandler = (requestHandler: (req: customRequest, res: Response, next: NextFunction) => any) =>
  (req: customRequest, res: Response, next: NextFunction) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
  }

export { asyncHandler }