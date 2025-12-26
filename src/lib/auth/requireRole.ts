import { AppUser, getUserFromRequest, UserRole } from './getUserFromRequest';

export async function requireRole(allowedRoles: UserRole[]): Promise<AppUser> {
  const user = await getUserFromRequest();

  if (!user) {
    throw new Response('Unauthorized', { status: 401 });
  }

  if (!allowedRoles.includes(user.role)) {
    throw new Response('Forbidden', { status: 403 });
  }

  return user;
}

export async function requireAuth(): Promise<AppUser> {
  const user = await getUserFromRequest();

  if (!user) {
    throw new Response('Unauthorized', { status: 401 });
  }

  return user;
}
