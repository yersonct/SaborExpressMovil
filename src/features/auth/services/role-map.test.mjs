import assert from "node:assert/strict";
import test from "node:test";
import { ROLE_NAMES } from "../types/role.ts";
import { resolveEffectiveRole } from "./roleMap.ts";

test("employee without an active shift enters the client experience", () => {
  assert.equal(
    resolveEffectiveRole([ROLE_NAMES.Mesero, ROLE_NAMES.Cliente], false),
    ROLE_NAMES.Cliente,
  );
});

test("active shift role wins when employee has multiple operational roles", () => {
  assert.equal(
    resolveEffectiveRole(
      [ROLE_NAMES.Mesero, ROLE_NAMES.Repartidor],
      true,
      ROLE_NAMES.Repartidor,
    ),
    ROLE_NAMES.Repartidor,
  );
});
