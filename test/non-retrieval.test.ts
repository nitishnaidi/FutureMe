import assert from "node:assert/strict";
import test from "node:test";
import { DateTime } from "luxon";
import { randomBytes } from "node:crypto";
import { EncryptionService } from "../src/crypto.js";
import { FutureMessageService } from "../src/service.js";
import { InMemoryMessageStore } from "../src/store.js";
test("sealed message APIs never return plaintext",async()=>{const service=new FutureMessageService(new InMemoryMessageStore(),new EncryptionService(randomBytes(32)));const plaintext="This should remain sealed.";const result=await service.seal(plaintext,DateTime.utc().plus({days:1}).toISO()!,"UTC",{type:"email",address:"me@example.com"});assert.equal(JSON.stringify(result).includes(plaintext),false);const status=await service.status(result.id);assert.equal(JSON.stringify(status).includes(plaintext),false);});
