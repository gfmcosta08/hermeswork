declare module "bcryptjs" {
  export function genSalt(rounds?: number): Promise<string>;
  export function hash(s: string, salt: string): Promise<string>;
  export function compare(s: string, hash: string): Promise<boolean>;
}
