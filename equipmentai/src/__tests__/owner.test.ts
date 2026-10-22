import { isConfiguredOwner } from "../lib/owner";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

process.env.OWNER_USER_ID = "owner-123";
assert(isConfiguredOwner("owner-123") === true, "matching owner id");
assert(isConfiguredOwner("other-user") === false, "other user denied");
assert(isConfiguredOwner(undefined) === false, "missing user denied");

delete process.env.OWNER_USER_ID;
assert(isConfiguredOwner("owner-123") === false, "missing config denies access");

process.env.OWNER_USER_ID = "";
assert(isConfiguredOwner("owner-123") === false, "blank config denies access");

console.log("owner auth tests passed");
