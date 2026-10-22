import { accessBlock, accessMessage, canAccessApp } from "../lib/access";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

assert(canAccessApp("Approved", false) === true, "approved company can access");
assert(canAccessApp("Pending", false) === false, "pending company blocked");
assert(canAccessApp("Denied", false) === false, "denied company blocked");
assert(canAccessApp("Suspended", false) === false, "suspended company blocked");
assert(canAccessApp(undefined, false) === false, "missing status blocked");
assert(canAccessApp("Pending", true) === true, "owner keeps access while pending");
assert(canAccessApp("Suspended", true) === true, "owner keeps access while suspended");
assert(canAccessApp("Denied", true) === true, "owner keeps access while denied");

assert(accessBlock("Pending") === "pending", "pending block");
assert(accessBlock("Denied") === "denied", "denied block");
assert(accessBlock("Suspended") === "suspended", "suspended block");
assert(accessBlock("Canceled") === "unapproved", "unknown subscription-like status blocked");
assert(accessMessage("Pending").includes("approval"), "pending message");
assert(accessMessage("Suspended").includes("suspended"), "suspended message");

console.log("access policy tests passed");
