import assert from "node:assert/strict";
import { handleResponse } from "./handleResponse.ts";
import { setApiLanguage } from "./apiLanguage.ts";
assert.equal(await handleResponse(new Response(null, { status: 204 })), undefined);
assert.deepEqual(await handleResponse(Response.json({ id: 1 })), { id: 1 });
await assert.rejects(handleResponse(Response.json({ code: "REVIEW_EXISTS", message: "Este pedido ya tiene una reseña" }, { status: 409 })), error => error.statusCode === 409 && error.code === "REVIEW_EXISTS" && error.message === "Este pedido ya tiene una reseña");
setApiLanguage("es");
await assert.rejects(
  handleResponse(Response.json({
    code: "INTERNAL_ERROR",
    message: "NpgsqlException: private-database-host",
    detail: "at PaymentService.Process() in /srv/source.cs:line 42",
  }, { status: 500 })),
  error => error.statusCode === 500 &&
    error.message === "El servidor no pudo completar la solicitud." &&
    !error.message.includes("private-database") &&
    !error.message.includes("PaymentService"),
);
for (const [language, expected] of Object.entries({ es: "No tienes permisos para realizar esta acción.", en: "You do not have permission to perform this action.", pt: "Você não tem permissão para realizar esta ação.", fr: "Vous n’avez pas l’autorisation d’effectuer cette action." })) {
  setApiLanguage(language);
  await assert.rejects(handleResponse(new Response(null, { status: 403 })), error => error.message === expected);
}
setApiLanguage("es");
console.log("handleResponse: 204, JSON, conflicts, sanitized 5xx and four-language errors passed");
