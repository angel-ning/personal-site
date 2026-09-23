// Pure logic for <PkiTrustLab />: walks Hash → Digital Signature → Digital Certificate,
// the same three-slide ladder the professor builds up in Lesson 4 (PKI deck, p.15-19).
// Shared with scripts/lib/mdx-core.mjs so the exported Markdown table uses the same rules.

export const MODES = ["hash", "signature", "certificate"];

export const ORIGINAL_MSG = "转账 $100 给 Bob";
export const TAMPERED_MSG = "转账 $100 给 攻击者";
export const ATTACKER_MSG = "点击链接，立刻验证你的账户";

// Toy "hash": position-weighted sum of char codes, same spirit as the FCS demo's toy checksum —
// not a real digest algorithm, just enough to show "same input -> same output, any change -> different output".
export function toyHash(str) {
  let sum = 0;
  for (let i = 0; i < str.length; i++) sum += str.charCodeAt(i) * (i + 1);
  return (sum % 100003).toString(16).padStart(5, "0");
}

/**
 * mode: "hash" | "signature" | "certificate"
 * tampered: an on-path attacker edits the message after it left the real sender
 * impersonated: there is no real Alice at all — an attacker authors and signs the whole message,
 *   but presents their key/certificate as if it belonged to Alice (only meaningful for signature/certificate)
 */
export function verifyPki({ mode, tampered, impersonated }) {
  const legit = !impersonated;
  const authoredMsg = legit ? ORIGINAL_MSG : ATTACKER_MSG;
  const signer = legit ? "Alice" : "攻击者";
  const digestAtOrigin = toyHash(authoredMsg);

  const contentInTransit = legit && tampered ? TAMPERED_MSG : authoredMsg;
  const bobRecomputes = toyHash(contentInTransit);

  // Hash mode has no secret: a competent on-path attacker can recompute a matching hash for
  // whatever content they substituted, so the "digest to compare against" simply tracks the
  // (possibly tampered) content in transit — the check is a tautology.
  const digestToCompare = mode === "hash" ? bobRecomputes : digestAtOrigin;
  const integrityCheckPassed = digestToCompare === bobRecomputes;
  const actuallyIntact = contentInTransit === authoredMsg;

  const caCheckApplies = mode === "certificate";
  const caCheckPassed = !caCheckApplies || legit; // a self-issued "certificate" from an impersonator isn't signed by a CA Bob trusts

  let identityTrusted;
  if (mode === "hash") identityTrusted = null; // hashing never claims an identity
  else if (mode === "signature") identityTrusted = true; // the math always checks out for whoever actually signed — that's the flaw
  else identityTrusted = caCheckPassed;

  const bobAccepts = integrityCheckPassed && identityTrusted !== false;
  // "Fooled" = Bob accepts something he shouldn't (real tampering slipped past, or an impersonator got trusted).
  const fooled = bobAccepts && (!actuallyIntact || (mode !== "hash" && impersonated && identityTrusted === true && caCheckPassed !== false && mode === "signature"));

  return {
    mode, tampered, impersonated, legit, signer,
    contentInTransit, digestAtOrigin, bobRecomputes, digestToCompare,
    integrityCheckPassed, actuallyIntact, caCheckApplies, caCheckPassed, identityTrusted,
    bobAccepts, fooled,
  };
}

export function scenarioLabel({ mode, tampered, impersonated }) {
  const m = { hash: "只用 Hash", signature: "+ Digital Signature", certificate: "+ Digital Certificate (CA)" }[mode];
  const a = impersonated ? "攻击者冒充 Alice" : tampered ? "中间人篡改内容" : "无攻击";
  return `${m} · ${a}`;
}
