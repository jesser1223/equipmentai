import {
  hashResetToken,
  isWithinRateLimit,
  resetExpiry,
  validatePassword,
} from "../lib/password-reset";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

const a = hashResetToken("token-a");
const b = hashResetToken("token-b");
assert(a !== b, "different tokens hash differently");
assert(a === hashResetToken("token-a"), "hash is stable");
assert(!a.includes("token-a"), "hash does not contain the token");

assert(validatePassword("short") !== null, "rejects short password");
assert(validatePassword("longpassword") !== null, "rejects missing number");
assert(validatePassword("12345678") !== null, "rejects missing letter");
assert(validatePassword("Password1") === null, "accepts valid password");

assert(isWithinRateLimit(0) === true, "allows first request");
assert(isWithinRateLimit(2) === true, "allows under limit");
assert(isWithinRateLimit(3) === false, "blocks at limit");

const expiry = resetExpiry(Date.now());
assert(expiry.getTime() > Date.now() + 29 * 60 * 1000, "expiry is about 30 minutes");

console.log("password-reset tests passed");
