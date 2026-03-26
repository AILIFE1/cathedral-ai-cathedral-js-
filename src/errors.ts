export class CathedralError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CathedralError";
  }
}

export class AuthError extends CathedralError {
  constructor(message = "Invalid or missing API key.") {
    super(message);
    this.name = "AuthError";
  }
}

export class NotFoundError extends CathedralError {
  constructor(message = "Resource not found.") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends CathedralError {
  constructor(message = "Rate limit hit. Slow down requests.") {
    super(message);
    this.name = "RateLimitError";
  }
}
