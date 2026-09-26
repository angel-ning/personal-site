"use client";

import { useState } from "react";
import { dclStep, dclCell, emptyDcl, DCL_STATEMENTS, DCL_USERS, DCL_ROLE, DCL_PRIVS, DCL_SCRIPT } from "./sql-logic.mjs";

type State = { grants: { grantee: string; priv: string; obj: string; grantor: string; wgo: boolean }[]; roleExists: boolean; members: string[] };
type Log = { id: string; ok: boolean; msg: string };

// GRANT / REVOKE on a small privilege matrix: roles, WITH GRANT OPTION, cascading revokes.
export function GrantLab() {
  const [state, setState] = useState<State>(emptyDcl() as State);
  const [log, setLog] = useState<Log[]>([]);

  const exec = (id: string) => {
    const r = dclStep(state, id) as { state: State; ok: boolean; msg: string };
    setState(r.state);
    setLog((l) => [...l, { id, ok: r.ok, msg: r.msg }]);
  };
  const reset = () => {
    setState(emptyDcl() as State);
    setLog([]);
  };
  const next = DCL_SCRIPT[log.length];
  const lastLog = log[log.length - 1];
  const who = [...DCL_USERS, ...(state.roleExists ? [DCL_ROLE] : [])];

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker" style={{ textTransform: "none" }}>INTERACTIVE · GRANT / REVOKE</span>
        <span className="lab-controls" style={{ marginTop: 0 }}>
          <button type="button" className="lab-btn" disabled={!next} onClick={() => next && exec(next)}>
            按课件顺序走下一步
          </button>
          <button type="button" className="lab-btn" onClick={reset}>
            重置
          </button>
        </span>
      </div>

      <div className="gl-stmts">
        {DCL_STATEMENTS.map((s) => (
          <button key={s.id} type="button" className={`gl-stmt ${next === s.id ? "gl-next" : ""}`} onClick={() => exec(s.id)}>
            <small>{s.by === "owner" ? "owner" : `以 ${s.by} 身份`}</small>
            <code>{s.sql}</code>
          </button>
        ))}
      </div>

      {lastLog && (
        <p className={`lab-decision ${lastLog.ok ? "lab-forward" : "lab-flood"}`}>
          <b>{lastLog.ok ? "✓ 执行成功" : "✗ 报错"} · {DCL_STATEMENTS.find((s) => s.id === lastLog.id)!.sql}</b>
          <span>{lastLog.msg}</span>
        </p>
      )}

      <div className="ra-scroll">
        <table className="lab-table ra-table gl-matrix">
          <thead>
            <tr>
              <th>用户 / 角色</th>
              {DCL_PRIVS.map(([o, p]) => (
                <th key={o + p}>
                  {p}
                  <small>ON {o}</small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {who.map((u) => (
              <tr key={u}>
                <td>
                  <b>{u}</b>
                  {u !== DCL_ROLE && state.members.includes(u) && <small className="gl-role">+ {DCL_ROLE}</small>}
                </td>
                {DCL_PRIVS.map(([o, p]) => {
                  const c = dclCell(state, u, o, p) as { direct: boolean; viaRole: boolean; wgo: boolean; from: string[] };
                  const has = c.direct || c.viaRole;
                  return (
                    <td key={o + p} className={has ? "gl-yes" : "gl-no"}>
                      {has ? "✓" : "—"}
                      {c.wgo && <span className="gl-tag">GRANT OPTION</span>}
                      {c.direct && c.from.some((f) => f !== "owner") && <span className="gl-tag">来自 {c.from.filter((f) => f !== "owner").join(", ")}</span>}
                      {c.viaRole && <span className="gl-tag">经由角色</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {log.length > 0 && (
        <ol className="gl-log">
          {log.map((l, i) => (
            <li key={i} className={l.ok ? "" : "gl-bad"}>
              <code>{DCL_STATEMENTS.find((s) => s.id === l.id)!.sql}</code>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
