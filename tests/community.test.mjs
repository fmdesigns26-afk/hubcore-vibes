import test from "node:test";
import assert from "node:assert/strict";
import { escapeText, initials } from "../functions/lib/community.js";
test("escapeText trims and limits",()=>{assert.equal(escapeText("  hello\nworld  ",20),"helloworld");assert.equal(escapeText("abcdefgh",5),"abcde");});
test("initials creates display initials",()=>{assert.equal(initials("Yutani Pretorius"),"YP");assert.equal(initials("hubcore"),"H");});