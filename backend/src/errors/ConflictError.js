import { AppError } from './AppError.js';

export class ConflictError extends AppError {
  constructor(message = 'Conflict occurred') {
    super(message, 409);
  }
}
