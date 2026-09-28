import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
export interface EncryptedPayload { ciphertext:string; iv:string; authTag:string; }
export class EncryptionService {
  constructor(private readonly key:Buffer) { if (key.length !== 32) throw new Error("Encryption key must be exactly 32 bytes"); }
  encrypt(plaintext:string):EncryptedPayload { const iv=randomBytes(12); const cipher=createCipheriv("aes-256-gcm",this.key,iv); const ciphertext=Buffer.concat([cipher.update(plaintext,"utf8"),cipher.final()]); return {ciphertext:ciphertext.toString("base64"),iv:iv.toString("base64"),authTag:cipher.getAuthTag().toString("base64")}; }
  decrypt(payload:EncryptedPayload):string { const decipher=createDecipheriv("aes-256-gcm",this.key,Buffer.from(payload.iv,"base64")); decipher.setAuthTag(Buffer.from(payload.authTag,"base64")); return Buffer.concat([decipher.update(Buffer.from(payload.ciphertext,"base64")),decipher.final()]).toString("utf8"); }
}
