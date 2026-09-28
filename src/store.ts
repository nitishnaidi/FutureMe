import type { SealedMessage } from "./types.js";
export interface MessageStore { create(message:SealedMessage):Promise<void>; get(id:string):Promise<SealedMessage|undefined>; save(message:SealedMessage):Promise<void>; due(nowUtc:string):Promise<SealedMessage[]>; }
export class InMemoryMessageStore implements MessageStore {
  private readonly messages=new Map<string,SealedMessage>();
  async create(message:SealedMessage){this.messages.set(message.id,structuredClone(message));}
  async get(id:string){const value=this.messages.get(id);return value?structuredClone(value):undefined;}
  async save(message:SealedMessage){this.messages.set(message.id,structuredClone(message));}
  async due(nowUtc:string){return [...this.messages.values()].filter(m=>m.status==="SEALED"&&m.deliverAtUtc<=nowUtc).map(m=>structuredClone(m));}
}
