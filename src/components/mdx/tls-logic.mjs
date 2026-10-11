// Pure data for <TlsLab />: the HTTPS handshake on slide 17 / PKI p.23, step by step —
// which cryptographic tool each step uses, what it achieves, and what an eavesdropper sees.

export const TLS_STEPS = [
  {
    id: "hello",
    title: "① Client Hello / Server Hello",
    who: "浏览器 ⇄ amazon.com",
    tool: "（还没有加密）",
    what: "双方报上自己支持的 TLS 版本和加密算法，各给一个随机数，商量好这次用哪一套。",
    solves: "统一「语言」",
    sees: "全部看得到：在连 amazon.com、选了哪套算法",
  },
  {
    id: "cert",
    title: "② Server 发出 Certificate",
    who: "amazon.com → 浏览器",
    tool: "数字证书 + 数字签名 + 哈希",
    what: "服务器把证书发过来：里面有 amazon.com 的公钥、有效期，以及 CA（如 DigiCert）用自己私钥对证书摘要做的签名。",
    solves: "让浏览器拿到「这把公钥属于 amazon.com」的证据",
    sees: "看得到证书（证书本来就是公开的）",
  },
  {
    id: "verify",
    title: "③ 浏览器验证证书",
    who: "浏览器自己",
    tool: "非对称（用 CA 的公钥验签）+ 哈希",
    what: "浏览器用内置的根 CA 公钥一级级验证签名（证书链），再检查域名对不对、有没有过期、有没有被吊销。任何一项不通过就弹出「连接不安全」。",
    solves: "Authentication：确认对面真的是 amazon.com，不是冒充的中间人",
    sees: "什么也看不到（在浏览器本地完成）",
  },
  {
    id: "kx",
    title: "④ Key Exchange：协商 session key",
    who: "浏览器 ⇄ amazon.com",
    tool: "非对称（RSA 或 ECDH）",
    what: "双方用非对称算法交换信息，各自算出同一把对称的 session key。这把钥匙从没在网上以明文出现过。",
    solves: "解决对称加密的「密钥分发」难题",
    sees: "看得到交换的数据，但算不出 session key",
  },
  {
    id: "data",
    title: "⑤ Session Key Established：传输数据",
    who: "浏览器 ⇄ amazon.com",
    tool: "对称（AES）+ 哈希式完整性校验（MAC）",
    what: "之后的登录信息、购物车、信用卡号都用 session key 做 AES 加密，每条记录附带完整性校验。",
    solves: "Confidentiality（快，扛得住大流量）+ Integrity",
    sees: "只看得到乱码，以及数据量和时间",
  },
  {
    id: "end",
    title: "⑥ 会话结束",
    who: "双方",
    tool: "—",
    what: "session key 作废；下次连接重新协商一把新的（PKI p.27：1st / 2nd / 3rd session 各用一把 session key）。",
    solves: "就算某一把 session key 泄露，也只影响那一次会话",
    sees: "—",
  },
];
