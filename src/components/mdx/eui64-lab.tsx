"use client";

import { useState } from "react";
import { eui64, EUI_PRESETS } from "./ipv6-logic.mjs";

type Eui = {
  mac: string;
  oui: string[];
  device: string[];
  firstBefore: string;
  firstAfter: string;
  ulWas: number;
  flippedHex: string;
  bytes: string[];
  iid: string;
  linkLocal: string;
  global: string | null;
  globalPrefix: string | null;
};

// 8 bits with the U/L bit (7th from the left) highlighted.
function Byte({ bits }: { bits: string }) {
  return (
    <code>
      {bits.slice(0, 4)} {bits.slice(4, 6)}
      <b className="text-[var(--c-exam)]">{bits[6]}</b>
      {bits[7]}
    </code>
  );
}

// MAC → EUI-64 Interface ID in the three steps of Slide 29, then the link-local and SLAAC global addresses.
export function Eui64Lab() {
  const [mac, setMac] = useState(EUI_PRESETS[0].mac);
  const [prefix, setPrefix] = useState(EUI_PRESETS[0].prefix);
  const r = eui64(mac, prefix) as Eui | null;

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · EUI-64：MAC → Interface ID</span>
      </div>
      <div className="lab-controls">
        {EUI_PRESETS.map((x) => (
          <button key={x.label} type="button" className={`lab-btn ${mac === x.mac ? "lab-btn-on" : ""}`} onClick={() => { setMac(x.mac); setPrefix(x.prefix); }}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="lab-controls">
        <label className="flex items-center gap-1.5 text-[13px]">
          MAC
          <input value={mac} onChange={(e) => setMac(e.target.value)} spellCheck={false} aria-label="MAC address" className="lab-select w-[12em] px-2 py-0.5" />
        </label>
        <label className="flex items-center gap-1.5 text-[13px]">
          RA 给的 /64 prefix
          <input value={prefix} onChange={(e) => setPrefix(e.target.value)} spellCheck={false} aria-label="prefix" className="lab-select w-[13em] px-2 py-0.5" />
        </label>
      </div>

      {!r ? (
        <p className="lab-decision lab-flood">
          <b>不是合法的 MAC 地址</b>
          <span>48 位 = 12 个十六进制数，例如 FC:99:47:75:CE:E0 或 Cisco 写法 fc99.4775.cee0。</span>
        </p>
      ) : (
        <>
          <table className="lab-table">
            <tbody>
              <tr>
                <th>Step 1 拆开 MAC</th>
                <td>
                  <span className="v6-tag v6-grp font-mono">OUI {r.oui.join(":")}</span>{" "}
                  <span className="v6-tag v6-iid font-mono">Device ID {r.device.join(":")}</span>
                  <div className="text-fg-3 text-[12.5px]">各 24 位，从中间切开</div>
                </td>
              </tr>
              <tr>
                <th>Step 2 中间插 FFFE</th>
                <td className="font-mono">
                  {r.oui.join(":")}:<b className="text-[var(--c-exam)]">FF:FE</b>:{r.device.join(":")}
                  <div className="font-sans text-fg-3 text-[12.5px]">48 位 + 16 位 = 64 位</div>
                </td>
              </tr>
              <tr>
                <th>Step 3 翻转 U/L 位</th>
                <td>
                  第一个字节 {r.oui[0]} = <Byte bits={r.firstBefore} /> → <Byte bits={r.firstAfter} /> = <b className="font-mono">{r.flippedHex}</b>
                  <div className="text-fg-3 text-[12.5px]">
                    从左数第 7 位（Universally / Locally bit）{r.ulWas === 0 ? "0 → 1" : "本来是 1 → 翻成 0"}：是「取反」，不是一律写 1
                  </div>
                </td>
              </tr>
              <tr>
                <th>Interface ID</th>
                <td>
                  <b className="font-mono">{r.iid}</b>
                </td>
              </tr>
              <tr>
                <th>Link-local</th>
                <td>
                  <code>{r.linkLocal}</code>
                  <div className="text-fg-3 text-[12.5px]">FE80::/10（实际是 FE80::/64）+ Interface ID，接口一启用 IPv6 就自动生成（Slide 33）</div>
                </td>
              </tr>
              <tr>
                <th>SLAAC 全球单播</th>
                <td>
                  {r.global ? (
                    <>
                      <code>{r.global}</code>
                      <div className="text-fg-3 text-[12.5px]">RA 里的 prefix {r.globalPrefix} + 自己生成的 Interface ID</div>
                    </>
                  ) : (
                    <span className="text-fg-3">prefix 不是合法的 IPv6 地址</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          <p className="lab-decision lab-filter">
            <b>为什么 Windows Vista 之后改用随机 Interface ID？</b>
            <span>EUI-64 里直接看得出 MAC（{r.mac}）。课件 Slide 28 把它当优点：管理员能从地址认出是哪个接口（easily tracked）；反过来也是隐私问题——设备走到哪个网络，后 64 位都一样，别人也能一路跟踪它。</span>
          </p>
        </>
      )}
    </div>
  );
}
