import { randomUUID } from "node:crypto";
import { DateTime } from "luxon";
import { EncryptionService } from "./crypto.js";
import type { MessageStore } from "./store.js";
import type { Destination, PublicMessageStatus, SealedMessage } from "./types.js";
export class FutureMessageService {
  constructor(private readonly store:MessageStore,private readonly encryption:EncryptionService){}
  private parseSchedule(deliverAt:string,timezone:string){const local=DateTime.fromISO(deliverAt,{zone:timezone});if(!local.isValid)throw new Error("Invalid delivery date or timezone");if(local.toUTC()<=DateTime.utc())throw new Error("Delivery must be in the future");return local;}
  private publicView(m:SealedMessage):PublicMessageStatus{return {id:m.id,deliverAt:DateTime.fromISO(m.deliverAtUtc).setZone(m.timezone).toISO({includeOffset:false})!,timezone:m.timezone,destination:m.destination,status:m.status,createdAt:m.createdAt,deliveredAt:m.deliveredAt};}
  async seal(message:string,deliverAt:string,timezone:string,destination:Destination){if(!message?.trim())throw new Error("Message is required");if(destination?.type!=="email"||!destination.address)throw new Error("Valid email destination is required");const schedule=this.parseSchedule(deliverAt,timezone);const encrypted=this.encryption.encrypt(message);const entity:SealedMessage={id:randomUUID(),...encrypted,deliverAtUtc:schedule.toUTC().toISO()!,timezone,destination,status:"SEALED",createdAt:DateTime.utc().toISO()!};await this.store.create(entity);return this.publicView(entity);}
  async status(id:string){const entity=await this.store.get(id);return entity?this.publicView(entity):undefined;}
  async reschedule(id:string,deliverAt:string){const entity=await this.store.get(id);if(!entity||entity.status!=="SEALED")return undefined;entity.deliverAtUtc=this.parseSchedule(deliverAt,entity.timezone).toUTC().toISO()!;await this.store.save(entity);return this.publicView(entity);}
  async cancel(id:string){const entity=await this.store.get(id);if(!entity||entity.status!=="SEALED")return false;entity.status="CANCELLED";await this.store.save(entity);return true;}
}
