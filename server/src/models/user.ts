export interface UserIdentity {
  issuer: string;
  subject: string;
}

export interface User {
  id: string;
  identities: UserIdentity[];
  name: string;
}
