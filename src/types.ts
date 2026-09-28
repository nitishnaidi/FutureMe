export type MessageStatus = "SEALED" | "CANCELLED" | "DELIVERED";
export interface Destination { type: "email"; address: string; }
export interface SealedMessage { id:string; ciphertext:string; iv:string; authTag:string; deliverAtUtc:string; timezone:string; destination:Destination; status:MessageStatus; createdAt:string; deliveredAt?:string; }
export interface PublicMessageStatus { id:string; deliverAt:string; timezone:string; destination:Destination; status:MessageStatus; createdAt:string; deliveredAt?:string; }
