"use client";

import { useState } from "react";
import { MODES, MODE_IDS, vpnView } from "./vpn-logic.mjs";

type ModeId = keyof typeof MODES;
type Layer = { part: string; value: string; enc: boolean };
type Packet = { title: string; layers: Layer[] };

// Pick a mode (transport / tunnel / proxy) and an observer, see which header fields and content they can read.
export function VpnModeLab() {
  const [mode, setMode] = useState<ModeId>("transport");
  const [observer, setObserver] = useState("path");
  const v = vpnView(mode, observer);
  const observers = Object.entries(MODES[mode].observers) as [string, { label: string }][];

  const pickMode = (m: ModeId) => {
    setMode(m);
    if (!(observer in MODES[m].observers)) setObserver("path");
  };

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>
          INTERACTIVE · 谁能看到什么：Transport / Tunnel / Proxy
        </span>
      </div>

      <div className="lab-controls">
        {(MODE_IDS as ModeId[]).map((m) => (
          <button key={m} type="button" className={`lab-btn ${mode === m ? "lab-btn-on" : ""}`} onClick={() => pickMode(m)}>
            {MODES[m].label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[13px] text-fg-2">{v.story}</p>

      {v.packets.map((p: Packet) => (
        <div key={p.title} className="mt-3">
          <div className="text-[13px] font-semibold">{p.title}</div>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {p.layers.map((l: Layer) => (
              <span
                key={l.part}
                className="rounded-md border px-2 py-1 font-mono text-[12px]"
                style={{
                  borderColor: l.enc ? "var(--c-tip)" : "var(--line)",
                  background: l.enc ? "color-mix(in oklab, var(--c-tip) 12%, transparent)" : "var(--subtle)",
                }}
              >
                {l.enc ? "🔒 " : ""}
                <b>{l.part}</b> {l.enc ? "（已加密）" : l.value}
              </span>
            ))}
          </div>
        </div>
      ))}

      <div className="lab-controls">
        <span className="text-[13px]">站在谁的位置看：</span>
        {observers.map(([id, o]) => (
          <button key={id} type="button" className={`lab-btn ${observer === id ? "lab-btn-on" : ""}`} onClick={() => setObserver(id)}>
            {o.label}
          </button>
        ))}
      </div>

      <p className="lab-decision lab-forward">
        <b>能看到</b>
        {v.observer.sees.map((s: string) => (
          <span key={s}>· {s}</span>
        ))}
      </p>
      {v.observer.hidden.length > 0 && (
        <p className="lab-decision lab-flood">
          <b>看不到</b>
          {v.observer.hidden.map((s: string) => (
            <span key={s}>· {s}</span>
          ))}
        </p>
      )}
      <p className="lab-decision lab-filter">
        <b>目的地看到的发送者：{v.sender}</b>
        <span>Tunnel 是「替你运送」，原包进内网，对方看到的是你；Proxy 是「替你说话」，对方看到的是 proxy。</span>
      </p>
    </div>
  );
}
