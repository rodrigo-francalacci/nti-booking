import crypto from "crypto";

const b64url = (buf: Buffer) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

export function sign(payload: object, secret: string) {
  const body = Buffer.from(JSON.stringify(payload));
  const sig = crypto.createHmac("sha256", secret).update(body).digest();
  return `${b64url(body)}.${b64url(sig)}`;
}

export function verify(token: string, secret: string): { ok: boolean; payload?: any } {
  const [body64, sig64] = token.split(".");
  if (!body64 || !sig64) return { ok: false };
  const body = Buffer.from(body64.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  const expected = crypto.createHmac("sha256", secret).update(body).digest();
  const given = Buffer.from(sig64.replace(/-/g, "+").replace(/_/g, "/"), "base64");
  if (!crypto.timingSafeEqual(expected, given)) return { ok: false };
  const payload = JSON.parse(body.toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) return { ok: false };
  return { ok: true, payload };
}
