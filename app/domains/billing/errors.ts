export class PlanLimitError extends Error {
  public code: string;
  public httpStatus: number;
  public details: Record<string, unknown>;

  constructor(message: string, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "PlanLimitError";
    this.code = "PLAN_LIMIT_EXCEEDED";
    this.httpStatus = 403;
    this.details = details;
  }
}
