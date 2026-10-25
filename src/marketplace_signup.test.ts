import { strict as assert } from "node:assert";
import { canHandOffOrder } from "./marketplace_signup.ts";

assert.equal(canHandOffOrder(true, "fractions-101", "teacher-maya"), true);
assert.equal(canHandOffOrder(false, "fractions-101", "teacher-maya"), false);
assert.equal(canHandOffOrder(true, "", "teacher-maya"), false);
console.log("handoff decision tests passed");
