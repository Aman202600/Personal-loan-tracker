import { Request, Response, NextFunction } from 'express';
import { summaryService } from '../services/summary.service';

export class SummaryController {
  /**
   * GET /api/summary
   * Retrieve aggregated dashboard metrics for authenticated user
   */
  async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const summary = await summaryService.getSummary(userId);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const summaryController = new SummaryController();
