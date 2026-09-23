"use client";

import { useState } from "react";
import { verifyPki } from "./pki-logic.mjs";

const MODE_LABEL: Record<string, string> = { hash: "① 只用 Hash", signature: "② + Digital Signature", certificate: "③ + Digital Certificate (CA)" };

export function PkiTrustLab() {
  const [mode, setMode] = useState<"hash" | "signature" | "certificate">("hash");
  const [tampered, setTampered] = useState(false);
  const [impersonated, setImpersonated] = useState(false);
  const r = verifyPki({ mode, tampered, impersonated: mode !== "hash" && impersonated }) as ReturnType<typeof verifyPki>;

  const btn = "lab-btn";
  const cls = r.fooled ? "lab-flood" : r.bobAccepts ? "lab-forward" : "lab-filter";

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · Hash → Signature → Certificate</span>
      </div>

      <div className="lab-controls">
        {(["hash", "signature", "certificate"] as const).map((m) => (
          <button key={m} type="button" onClick={() => setMode(m)} className={`${btn} ${mode === m ? "lab-btn-on" : ""}`}>
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label className="flex items-center gap-1.5 text-[13px]">
          <input type="checkbox" checked={tampered} disabled={impersonated} onChange={(e) => setTampered(e.target.checked)} />
          中间人篡改消息内容
        </label>
        <label className={`flex items-center gap-1.5 text-[13px] ${mode === "hash" ? "opacity-40" : ""}`}>
          <input
            type="checkbox"
            checked={impersonated}
            disabled={mode === "hash"}
            onChange={(e) => {
              setImpersonated(e.target.checked);
              if (e.target.checked) setTampered(false);
            }}
          />
          攻击者冒充 Alice 的身份{mode === "hash" ? "（Hash 模式没有身份声明，不适用）" : ""}
        </label>
      </div>

      <table className="lab-table">
        <tbody>
          <tr>
            <th>真正的发送者</th>
            <td>{r.signer}</td>
          </tr>
          <tr>
            <th>Bob 收到的内容</th>
            <td>{r.contentInTransit}</td>
          </tr>
          <tr>
            <th>Bob 拿来比对的摘要</th>
            <td className="font-mono">
              {r.digestToCompare} {mode === "hash" ? "（明文哈希，跟着内容一起可被篡改）" : "（从签名里解出来的，签名时就锁定了）"}
            </td>
          </tr>
          <tr>
            <th>Bob 自己重算的摘要</th>
            <td className="font-mono">{r.bobRecomputes}</td>
          </tr>
          <tr>
            <th>摘要比对</th>
            <td>{r.integrityCheckPassed ? "✅ 一致" : "❌ 不一致"}</td>
          </tr>
          {r.caCheckApplies && (
            <tr>
              <th>CA 信任检查</th>
              <td>{r.caCheckPassed ? "✅ 证书由受信任的 CA 签发" : "❌ 自签 / 不受信任的证书，直接拒绝"}</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className={`lab-decision ${cls}`}>
        <b>{r.fooled ? "Bob 被骗了" : r.bobAccepts ? "Bob 正确接受" : "Bob 正确拒绝"}</b>
        <span>
          {r.mode === "hash" &&
            (r.tampered
              ? "Hash 函数本身没有秘密可言，攻击者篡改内容后可以顺手重算一个新哈希一起发过去——摘要比对永远能通过，Bob 完全无法察觉内容被改过。"
              : "没有攻击时摘要自然一致，但这个检查本身并不能证明「没人动过」，只是这次恰好没人动。")}
          {r.mode === "signature" &&
            (r.impersonated
              ? "签名的数学运算完全正确——因为确实是攻击者自己用自己的私钥签的；问题出在 Bob 手上那把「Alice 的公钥」根本没人担保过真的属于 Alice。"
              : r.tampered
                ? "签名是对原始摘要加密的，攻击者改了内容却没有 Alice 的私钥去重新签名，Bob 重算的摘要和签名里解出来的对不上，篡改被当场发现。"
                : "内容没被动过，签名也确实是 Alice 私钥签的，完整性和「这把私钥的主人签了它」都确认了。")}
          {r.mode === "certificate" &&
            (r.impersonated
              ? "攻击者可以自己签名，但签不出一张由受信任 CA 背书的证书——Bob 的证书链检查直接拒绝，根本不会走到内容比对那一步。"
              : r.tampered
                ? "证书解决的是「这把公钥是不是真的属于 Alice」，但内容篡改还是要靠签名机制抓——摘要对不上，照样被发现。"
                : "证书由受信任的 CA 签发，绑定了「这把公钥属于 Alice」；签名又保证了内容没被动过——这才是网站 HTTPS 证书真正做到的三件事。")}
        </span>
      </p>
    </div>
  );
}
