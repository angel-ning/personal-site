"use client";

import { useState } from "react";
import { HIERARCHY, childrenOf, inheritance } from "./eer-logic.mjs";

type Node = { parent: string | null; attrs: string[]; split?: string };
const H = HIERARCHY as Record<string, Node>;

// Click an entity to see every attribute it has and where each one is inherited from.
export function HierarchyExplorer() {
  const [sel, setSel] = useState("GRADUATE STUDENT");
  const chain = inheritance(sel) as { entity: string; attrs: string[] }[];
  const onPath = new Set(chain.map((c) => c.entity));

  const renderNode = (name: string, depth: number) => (
    <li key={name}>
      <button type="button" onClick={() => setSel(name)} className={`hx-node ${name === sel ? "hx-sel" : onPath.has(name) ? "hx-path" : ""}`}>
        <b>{name}</b>
        <small>{H[name].attrs.join(", ")}</small>
      </button>
      {H[name].split && <span className="hx-split">{H[name].split}</span>}
      {childrenOf(name).length > 0 && <ul>{childrenOf(name).map((c: string) => renderNode(c, depth + 1))}</ul>}
    </li>
  );

  return (
    <div className="lab not-prose">
      <div className="lab-head">
        <span className="lab-kicker">Interactive · 属性继承到 root</span>
        <span className="text-[12px] text-fg-3">点任意实体</span>
      </div>
      <ul className="hx-tree">{renderNode("PERSON", 0)}</ul>
      <table className="lab-table">
        <thead>
          <tr>
            <th>{sel} 的属性</th>
            <th>定义在</th>
          </tr>
        </thead>
        <tbody>
          {chain.map((c, i) =>
            c.attrs.map((a) => (
              <tr key={c.entity + a} className={i === 0 ? "lab-hot" : ""}>
                <td>{a}</td>
                <td>{i === 0 ? `${c.entity}（自己的）` : `${c.entity}（继承）`}</td>
              </tr>
            )),
          )}
        </tbody>
      </table>
      <p className="lab-decision lab-filter">
        <b>规则：属性放在「对所有实例都适用」的最通用那一层</b>
        <span>越往下的子类，属性越多：自己的 + 一路向上继承到 root 的。标识符 SSN 只在 PERSON 定义一次。</span>
      </p>
    </div>
  );
}
