import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../../auth/types/authenticated-user.type';

/**
 * Usage: @CurrentUser() user: AuthenticatedUser
 * Populated by JwtStrategy.validate() after JwtAuthGuard runs.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
