const SUPER_ADMIN_EMAIL = 'admin@agrilien.sn';

const ADMIN_HASH = 'c3VwZXJAZG1pbjIwMjYh';

function decodeKey(): string {
  try {
    return atob(ADMIN_HASH);
  } catch {
    return '';
  }
}

export function isSuperAdminEmail(email: string): boolean {
  return email.trim().toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase();
}

export function verifySuperAdminPassword(password: string): boolean {
  return password === decodeKey();
}

export function getSuperAdminEmail(): string {
  return SUPER_ADMIN_EMAIL;
}
