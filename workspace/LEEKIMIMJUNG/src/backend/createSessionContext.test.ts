import test from "node:test";
import assert from "node:assert/strict";

import { createSessionContext } from "./createSessionContext.ts";

const hospitalFixture = { manifest: { environmentId: "hospital" } } as any;

test("createSessionContext(hospital): departmentDisplayId가 공식 departmentId와 다르면 extensions에 팀 namespace로 남긴다", () => {
  const ctx: any = createSessionContext(
    { departmentId: "UNSPECIFIED", departmentDisplayId: "NEUROLOGY" },
    hospitalFixture,
  );
  assert.equal(ctx.facts.departmentId, "UNSPECIFIED");
  assert.equal(ctx.extensions?.["LEEKIMIMJUNG.departmentDisplayId"], "NEUROLOGY");
});

test("createSessionContext(hospital): departmentDisplayId가 공식 departmentId와 같으면(예: 정형외과) extensions를 만들지 않는다", () => {
  const ctx: any = createSessionContext(
    { departmentId: "ORTHOPEDICS", departmentDisplayId: "ORTHOPEDICS" },
    hospitalFixture,
  );
  assert.equal(ctx.facts.departmentId, "ORTHOPEDICS");
  assert.equal(ctx.extensions, undefined);
});

test("createSessionContext(hospital): departmentDisplayId가 없으면 extensions 자체가 생기지 않는다", () => {
  const ctx: any = createSessionContext({ departmentId: "ORTHOPEDICS" }, hospitalFixture);
  assert.equal(ctx.extensions, undefined);
});
