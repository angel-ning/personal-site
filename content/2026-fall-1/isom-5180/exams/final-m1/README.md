---
title:
  en: "Final Review M1 · Networks, OSI and LAN Devices"
  zh: "期末复习 M1 · 网络组成、OSI 与 LAN 设备"
summary:
  en: "Module 1 for the final, following the exam guideline: network components and types, what each OSI layer does, encapsulation and PDUs, hubs, switches (MAC table: learn, flood, forward, filter), routers, and how two hosts on a LAN talk — with MCQs and drawing questions."
  zh: "按期末 guideline 逐条复习 Module 1：网络组成与类型、OSI 每层的功能、封装与 PDU、Hub、Switch（MAC 表学习 / 泛洪 / 转发 / 过滤）、Router，以及 LAN 里两台主机怎么通信；附选择题和画图题。"
week: 1
date: 2026-10-10
tags: [FinalReview, OSI, Encapsulation, Hub, Switch, Router, MACTable]
---
# 期末复习 M1 · 网络组成、OSI 与 LAN 设备

**详细笔记**：[第 1 周笔记](../../lectures/week-01/)　**总览**：[期末总复习](../final-review/)　**下一章**：[M2 · IP 地址与路由](../final-m2/)

> 优先级：🔴 必考核心 · 🟡 需要理解 · 🟢 了解即可  
> 掌握要求：🖊️ **画图 / 填表**（给拓扑写出过程）· 🔍 **辨析**（选择题判断）· 📝 **默写**（列出名字、定义）

> **🎯 这一章在期末怎么考**
>
> - **Final-guide 列的 8 条**：Components of a network · Common types of networks · OSI model: function of each layer · Encapsulation and de-encapsulation · Hubs · Switches · Routers · Communication between devices in a LAN network。
> - **Final Review 的 19 道选择题里有 6 道是 M1**（第 1–6 题）：广播帧谁收到、交换机为什么比 Hub 好、FCS 不对怎么办、CAM 表建好后单播谁收到、哪些设备看 MAC、广播太多用什么设备。
> - **画图题**：老师的 M1 板书 10 页里 6 页是「帧怎么走」——**MAC 表逐帧填**、封装逐层加头、共享总线上谁收到、路由表 Initial → 完整。
> - 分量：约占全部复习时间的 **20–25%**。设备那条线（Hub → Switch → Router）是重点，网络类型、带宽、拓扑是送分的选择题。

## 本章大纲

- **[1. 🟡 Components of a Network 📝🔍](#1--components-of-a-network-)**
- **[2. 🟡 Common Types of Networks 🔍](#2--common-types-of-networks-)**
- **[3. 🔴 OSI Model：每一层做什么 📝🔍](#3--osi-model每一层做什么-)**
- **[4. 🔴 Encapsulation and De-encapsulation 🖊️📝](#4--encapsulation-and-de-encapsulation-️)**
- **[5. 🔴 Hubs 🔍🖊️](#5--hubs-️)**
- **[6. 🔴 Switches：MAC Address Table 🖊️🔍](#6--switchesmac-address-table-️)**
- **[7. 🔴 Routers 🖊️🔍](#7--routers-️)**
- **[8. 🔴 Communication between Devices in a LAN 🖊️](#8--communication-between-devices-in-a-lan-️)**
- **[9. 练习 · 选择题](#9-练习--选择题)**
- **[10. 练习 · 画图题](#10-练习--画图题)**

---

## 1. 🟡 Components of a Network 📝🔍

| 类别                       | 课件定义                                                            | 例子                                 |
| ------------------------ | --------------------------------------------------------------- | ---------------------------------- |
| **End devices**          | Where a message **originates from** or where it is **received** | PC、手机、打印机、服务器                      |
| **Intermediary devices** | **Interconnect** end devices                                    | Switch、Router、Wireless AP、Firewall |
| **Network media**        | 数据走的路                                                           | 铜线（电脉冲）、光纤（光脉冲）、无线（电磁波）            |

- 中间设备的 3 件事：**regenerate and retransmit** signals · **maintain information about pathways** · **notify other devices of errors**。
- **NIC** 网卡（MAC 烧在上面）；**port 和 interface 可以互换**。

🔗 [第 1 周 §2](../../lectures/week-01/#2--components-of-a-network网络的三类组成)

## 2. 🟡 Common Types of Networks 🔍

|    | **LAN**         | **WAN**           |
| -- | --------------- | ----------------- |
| 范围 | 有限区域内连接**终端设备** | 跨大地理范围连接 **LAN**  |
| 谁管 | **单一组织或个人**     | 通常是**一个或多个服务提供商** |
| 速度 | **高速**          | 较慢的 LAN 间链路       |

- **Internet** = 全世界互连的 LAN 和 WAN，不属于任何个人或组织（IETF、ICANN、IAB 维护标准和地址）。
- **Intranet** = 组织**内部私有**的网络，只有成员或授权者能访问；**Extranet** = **有控制地开放给外部组织**（供应商、客户）。
- 其他：MAN、WLAN、SAN（知道全称）。网络安全三目标 **CIA**：只有该看的人能看 · 没被改 · 需要时能用。

🔗 [第 1 周 §3–4](../../lectures/week-01/#3--common-types-of-networks网络类型)

## 3. 🔴 OSI Model：每一层做什么 📝🔍

| # | OSI 层            | 做什么                                          | PDU         | 典型设备                   | TCP/IP         |
| - | ---------------- | -------------------------------------------- | ----------- | ---------------------- | -------------- |
| 7 | Application 应用层  | 给用户的应用程序提供网络服务（HTTP, FTP, SMTP, DNS, Telnet） | **Data**    | —                      | Application    |
| 6 | Presentation 表示层 | 数据格式、编码、压缩、加密（ASCII, JPEG, TLS 加密）           | **Data**    | —                      | Application    |
| 5 | Session 会话层      | 建立、管理、终止两台主机之间的会话（NetBIOS, RPC）              | **Data**    | —                      | Application    |
| 4 | Transport 传输层    | 端到端传输：可靠(TCP) 或不可靠(UDP)（TCP, UDP）            | **Segment** | (防火墙会看端口)              | Transport      |
| 3 | Network 网络层      | 逻辑地址(IP) + 选最佳路径（IP, ICMP, RIP, OSPF）        | **Packet**  | Router 路由器             | Internet       |
| 2 | Data Link 数据链路层  | 物理地址(MAC) 访问介质 + 差错检测（Ethernet, PPP）         | **Frame**   | Switch / Bridge 交换机/网桥 | Network Access |
| 1 | Physical 物理层     | 在设备之间传送比特(电、光、电磁波)（网线、光纤、无线电）                | **Bits**    | Repeater / Hub 中继器/集线器 | Network Access |

| 层              | 关键词（课件标题）                                            | 用什么地址 / 设备                | PDU         |
| -------------- | ---------------------------------------------------- | ------------------------- | ----------- |
| 7 Application  | Network process to applications（HTTP、Telnet）         | —                         | Data        |
| 6 Presentation | Data representation：**格式、压缩、加密**                     | —                         | Data        |
| 5 Session      | Interhost communication：**建立、管理、终止会话**               | —                         | Data        |
| 4 Transport    | End-to-end connection：**可靠 / 不可靠**（TCP、UDP），分段、编号、重传 | **端口号**                   | **Segment** |
| 3 Network      | Address and best path：**逻辑地址 + 选路**（IP）              | **IP** · Router           | **Packet**  |
| 2 Data Link    | Access to media：**物理地址（MAC）+ 差错检测（FCS）**             | **MAC** · Switch / Bridge | **Frame**   |
| 1 Physical     | Binary transmission：**传比特**                          | — · Hub / Repeater        | **Bits**    |

- **为什么分层**（课件 6 条）：reduces complexity · standardizes interfaces · modular engineering · interoperable technology · accelerates evolution · simplifies teaching and learning。
- **TCP/IP 四层**：Application（= OSI 5–7）· Transport（4）· Internet（3）· Network Access（1–2）。**OSI = 7 层，TCP/IP = 4 层**。

> **🧠 记忆口诀**
>
> 从上往下：**A**ll **P**eople **S**eem **T**o **N**eed **D**ata **P**rocessing。PDU 从 L4 往下：**S**egment → **P**acket → **F**rame → **B**it（Some People Fear Birthdays）。

🔗 [第 1 周 §6–8](../../lectures/week-01/#7--osi-七层模型逐层功能)

## 4. 🔴 Encapsulation and De-encapsulation 🖊️📝

- **Encapsulation**：下层把上层的 PDU 整个放进自己的数据区，再**加上本层的 header（数据链路层还加 trailer）**。
- **De-encapsulation**：接收方从下往上，每层**读自己那层的头、剥掉，交给上一层**（peer-to-peer：第 N 层加的头只有对方第 N 层读）。

| 层         | 加了什么                          | 变成      |
| --------- | ----------------------------- | ------- |
| Transport | 源 / 目的**端口**、序号               | Segment |
| Network   | **源 IP、目的 IP**                | Packet  |
| Data Link | **源 MAC、目的 MAC** + 尾部 **FCS** | Frame   |
| Physical  | 变成 0/1 信号                     | Bits    |

**FCS（Frame Check Sequence）**：发送方算一个值放在帧尾；接收方重算，**对不上就丢弃**（L2 只检测、不重传，重传是 TCP 的事）。守的是 **Integrity**。

*（网页版此处可交互：改发送的比特、选择被干扰的位，观察接收方重算的 FCS 是否一致）*

🔗 [第 1 周 §9](../../lectures/week-01/#9--encapsulation--de-encapsulation封装与解封装)

## 5. 🔴 Hubs 🔍🖊️

- **Multiport repeater**，**Layer 1**：只认比特、不看地址；**从一个口收到，就从其他所有口发出去**。
- 所有端口在**同一个冲突域**（两台同时发就 collision）、同一个广播域；任何一台都能**嗅探**别人的流量。
- Repeater：信号会衰减 → 重新生成干净的信号，延长距离（两个口，L1）。

🔗 [第 1 周 §11](../../lectures/week-01/#11--networking-devices从-repeater-到-switch为什么需要交换机)

## 6. 🔴 Switches：MAC Address Table 🖊️🔍

**MAC address table = switching table = CAM table**，三列：**MAC address · Port · Time stamp**。

| 规则          | 内容                                                       |
| ----------- | -------------------------------------------------------- |
| **学习**      | 看帧的 **Source MAC** + 进来的端口 → 写进表（已有就**刷新时间戳**）           |
| **决策**      | 看帧的 **Destination MAC** 查表                               |
| **Flood**   | 目的是**广播**（FF-FF-FF-FF-FF-FF），或目的 MAC **不在表里** → 除入口外所有端口 |
| **Forward** | 在表里，端口 ≠ 入口 → 只从那一个端口                                    |
| **Filter**  | 在表里，端口 = 入口 → 不转发                                        |
| **Aging**   | 一条记录约 **5 分钟**（Cisco 300 秒）没被刷新就删掉：主机会移动 / 关机，表容量有限      |

**交换机怎么避免冲突**：① microsegmentation / dedicated paths（每台主机独占端口、内部独立通路）② **full duplex** ③ **buffering**（多台同时发给同一台 → 先存再逐个发）④ 查表只发目的端口。  
**隔离冲突域（每个端口一个），不隔离广播域。**

*（网页版此处是可交互的交换机演示；下表是同一套规则算出的结果）*

| # | 时间   | 帧     | 学习             | 决策                     |
| - | ---- | ----- | -------------- | ---------------------- |
| 1 | 4:41 | F → Q | MAC-F @ E0（新增） | **Flood → E1, E2, E3** |
| 2 | 4:45 | Q → F | MAC-Q @ E1（新增） | **Forward → E0**       |
| 3 | 4:47 | L → V | MAC-L @ E0（新增） | **Flood → E1, E2, E3** |
| 4 | 4:49 | V → L | MAC-V @ E1（新增） | **Forward → E0**       |
| 5 | 4:50 | F → L | MAC-F @ E0（刷新） | **Filter**             |

🔗 [第 1 周 §12](../../lectures/week-01/#12--switch-交换机--layer-2-与-mac-address-table)

## 7. 🔴 Routers 🖊️🔍

- **Layer 3**，看 **IP（逻辑地址）**；能连接**不同的 L2 技术**（Ethernet 进、Serial 出）。
- **Routing table**：**目的 IP 网络 → 出口 Interface**（课件完整版还有来源 C / R、next hop、metric）。一条记录 = 一整个网络，**没有 MAC 表那种时间戳**。
- 来源：**directly connected**（开机就有 = Initial R.T.）· **static**（管理员手写）· **dynamic**（RIP / EIGRP / OSPF 自动学）。
- 决策只有 **Forward 或 Discard**——**路由器不 flood、不转发广播** → 每个接口一个广播域。
- 每过一台路由器：**拆旧帧头 → 按目的 IP 查表 → 用出口接口重新封装新帧**。**IP 不变，MAC 每跳都换。**
- 接口：**Ethernet（E0、Gig0/0）接 LAN**；**Serial（S0、Se0/0/0）点对点连另一台路由器**（PPP / HDLC，没有以太网 MAC）。

|     | Hub / Repeater | Switch / Bridge                | Router                   |
| --- | -------------- | ------------------------------ | ------------------------ |
| 层   | **L1**         | **L2**                         | **L3**                   |
| 看什么 | 比特             | **MAC**                        | **IP**                   |
| 表   | 无              | MAC 表（MAC · Port · Time stamp） | 路由表（Network · Interface） |
| 转发  | 全部其他端口         | **Flood / Forward / Filter**   | **Forward / Discard**    |
| 冲突域 | 全部共 1 个        | **每个端口 1 个**                   | 每个接口 1 个                 |
| 广播域 | 1 个            | 1 个                            | **每个接口 1 个**             |

🔗 [第 1 周 §13](../../lectures/week-01/#13--router-路由器--layer-3-与-routing-table)

## 8. 🔴 Communication between Devices in a LAN 🖊️

- **MAC 地址**：48 位 = 12 个十六进制数；前 3 字节 **OUI**（厂商），后 3 字节厂商分配。写法 `00-60-2F-3A-07-BC` / `0200.1111.1111`。
- **Unicast**（1 对 1，最主要）· **Broadcast**（1 对全部，MAC **FF-FF-FF-FF-FF-FF**，IP **255.255.255.255**）· **Multicast**（1 对一组）。
- **共享总线 / Hub 上 PC1 → PC3**：每台网卡都会复制这一帧，**看目的 MAC**：不是自己就丢弃，是自己才往上交。`IP (S, D) = (IP-1, IP-3)`，`MAC (S, D) = (MAC-1, MAC-3)`。
- 同一个 LAN 里主机直接 ARP 对方拿 MAC（M2），**不需要网关**。
- **Data flow**：Fred（7→1）→ SW1（L1–2）→ R1（L1–3，换帧头）→ Hub（L1）→ Barney（1→7）。**每台设备只处理到自己那一层。**

🔗 [第 1 周 §14–15](../../lectures/week-01/#14--mac-address-与三种通信方式)

---

## 9. 练习 · 选择题

**1. Which layer of the OSI model is responsible for logical addressing and path determination?**

- A. Data Link
- B. Network
- C. Transport
- D. Session

> **答案：B**
>
> L3 Network：**Address and best path**，逻辑地址（IP）+ 路由器选路。Data Link 是**物理地址（MAC）**。

**2. What is the PDU called at the Data Link layer?**

- A. Segment
- B. Packet
- C. Frame
- D. Bits

> **答案：C**
>
> L4 Segment → L3 Packet → **L2 Frame** → L1 Bits。只有 Frame 同时有 header 和 trailer（FCS）。

**3. Which TWO functions belong to the Data Link layer? (Choose two.)**

- A. Physical addressing using MAC addresses
- B. Path selection between networks
- C. Error detection with the FCS
- D. Data compression and encryption
- E. Establishing and terminating sessions

> **答案：A、C**
>
> L2 = **Access to media**：**MAC 物理地址**和**差错检测（FCS）**。B 是 L3，D 是 L6，E 是 L5。

**4. A LAN is best described as a network that:**

- A. interconnects LANs over a wide geographic area and is run by service providers
- B. interconnects end devices in a limited area and is administered by a single organization
- C. is owned by no one and connects the whole world
- D. gives suppliers controlled access to a company's data

> **答案：B**
>
> A 是 WAN，C 是 Internet，D 是 Extranet。

**5. A switch receives a frame whose destination MAC address is not in its MAC address table. What does the switch do?**

- A. Drops the frame
- B. Sends an ARP request for the destination
- C. Floods the frame out all ports except the incoming port
- D. Sends the frame back out the incoming port

> **答案：C**
>
> Unknown unicast → **Flood**（除入口外所有端口）。ARP 是主机 / 路由器做的，交换机不做；丢弃是路由器查不到时的做法。

**6. How does a switch build its MAC address table?**

- A. The administrator enters each MAC address manually
- B. By examining the source MAC address of incoming frames and the port they arrive on
- C. By examining the destination MAC address of incoming frames
- D. By exchanging tables with other switches using RIP

> **答案：B**
>
> **用 Source 学，用 Destination 决策。** 交换机亲眼看到帧从哪个口进来，所以源地址的位置是确定的；RIP 是路由协议。

**7. Why does each entry in a switch's MAC address table have a time stamp?**

- A. To measure the latency of each host
- B. So that entries for hosts that moved or went silent are removed after the aging time
- C. So the switch can tell which frame arrived first and reorder them
- D. Because routers need it to calculate the metric

> **答案：B**
>
> 老化（aging）：超过 aging time（板书 5 分钟，Cisco 300 秒）没刷新就删除——主机可能换了端口或关机，CAM 表容量也有限。

**8. Which TWO statements about collision and broadcast domains are true? (Choose two.)**

- A. Every port of a switch is a separate collision domain
- B. A switch separates broadcast domains
- C. All ports of a hub are in one collision domain
- D. A router forwards broadcasts to all its interfaces
- E. A hub separates collision domains

> **答案：A、C**
>
> Switch：每个端口一个冲突域，但所有端口一个广播域（B 错）；Hub：全部一个冲突域；**Router 不转发广播**（D 错）。

**9. Which mechanism lets a switch avoid a collision when two PCs send frames to the same destination at the same time?**

- A. Flooding
- B. Buffering
- C. Filtering
- D. Aging

> **答案：B**
>
> **Buffering**：把同时到达、发往同一出口的帧先存进内存，再一帧一帧转发（Slide 60–61）。

**10. When a router forwards a packet from its Ethernet interface out its serial interface, which statement is true?**

- A. The destination IP address is changed to the next router's address
- B. The source and destination IP addresses stay the same; the Layer 2 header is rebuilt for the serial link
- C. The frame is forwarded unchanged
- D. The router floods the packet if the destination network is unknown

> **答案：B**
>
> 路由器换的是 L2 帧（Ethernet → PPP / HDLC），IP 头不变；查不到网络是 discard，不会 flood。

**11. A MAC address is 48 bits long. What do the first 24 bits identify?**

- A. The network the host is on
- B. The manufacturer (OUI)
- C. The port on the switch
- D. The subnet number

> **答案：B**
>
> 前 3 字节 **OUI（Organizationally Unique Identifier）** = 厂商代码；后 3 字节由厂商保证唯一。Assignment 1 第 2 题就是「比较前 24 位看是不是同一厂商」。

**12. Which TWO devices operate only at Layer 1? (Choose two.)**

- A. Repeater
- B. Switch
- C. Hub
- D. Bridge
- E. Router

> **答案：A、C**
>
> Repeater 和 Hub 只处理比特；Switch / Bridge = L2，Router = L3。

## 10. 练习 · 画图题

**画图 1：交换机 4 个端口 E0–E3。F、L 接在 E0 那一侧的共享线上，Q、V 接在 E1 那一侧。MAC 表一开始是空的，依次发：① F→Q（4:41）② Q→F（4:45）③ L→V（4:47）④ V→L（4:49）⑤ F→L（4:50）。写出每一帧后的 MAC 表变化和转发决策。**

> | # | 学到（看 Source）                    | 查目的            | 决策                 |
> | - | ------------------------------- | -------------- | ------------------ |
> | ① | **新增** MAC-F → E0（4:41）         | Q 不在表里         | **Flood**：E1、E2、E3 |
> | ② | **新增** MAC-Q → E1（4:45）         | F 在 E0 ≠ 入口 E1 | **Forward**：只发 E0  |
> | ③ | **新增** MAC-L → E0（4:47）         | V 不在表里         | **Flood**：E1、E2、E3 |
> | ④ | **新增** MAC-V → E1（4:49）         | L 在 E0 ≠ 入口 E1 | **Forward**：只发 E0  |
> | ⑤ | MAC-F 已存在 → 时间戳 **4:41 → 4:50** | L 在 E0 = 入口 E0 | **Filter**：不转发     |
>
> 最后的表：F–E0–4:50 · Q–E1–4:45 · L–E0–4:47 · V–E1–4:49。如果 Q 5 分钟内不再发帧，它那一行会被删掉（aging）。（老师板书 M1 Supplementary p.4，课堂答案见第 1 周笔记。）

**画图 2：四台 PC 接在同一个 Hub 上。PC1 发帧给 PC3。写出这一帧的 IP (S, D)、MAC (S, D)，并说明 PC2、PC3、PC4 各自怎么处理。如果 PC2 同时发给 PC4 会怎样？**

> `IP (S, D) = (IP-1, IP-3)`，`MAC (S, D) = (MAC-1, MAC-3)`。Hub 把信号发给所有端口，**每台网卡都复制这一帧**：PC2、PC4 看到目的 MAC 不是自己 → **丢弃**；PC3 是自己 → 交给网络层 → 一路上交到应用。PC2 同时发 → 两路电信号在共享介质上叠加 → **collision**，两帧都坏（Hub 上所有设备在同一冲突域）。换成交换机就不会：独立通路 + 全双工 + buffering。

**画图 3：画出数据从 PC-S（IP-1 / MAC-1）发往 PC-R（IP-2 / MAC-2）时在发送方的封装过程，标出每层加了什么、PDU 叫什么。**

> - AP / Pre / Ses：**Data**
> - Transport：切成段，每段加 **端口号 + 序号** → **Segment**
> - Network：加 **IP-1（源）+ IP-2（目的）** → **Packet**
> - Data Link：加 **MAC-1（源）+ MAC-2（目的）** 作为 header，末尾加 **FCS** 作为 trailer → **Frame**
> - Physical：**Bits**（1101…）
>
> 接收方反过来逐层剥头（de-encapsulation）；在数据链路层先重算 FCS，不对就丢弃。

**画图 4：三台路由器 A–S0···S0–B–S1···S0–C；每台路由器 E0、E1 各接一个 LAN（A：10.1.1.0、10.1.2.0；B：10.2.3.0、10.2.4.0；C：10.3.5.0、10.3.6.0）。写出 Router B 的 Initial R.T. 和完整 R.T.。**

> **Initial R.T.**（只有直连）：10.2.3.0 → E0；10.2.4.0 → E1。（如果题目给了 A–B、B–C 两条串行线的网络地址，它们也是 B 的直连网络，写 S0、S1。）
>
> **完整 R.T.**：再加远程网络——往 A 那边的从 **S0** 出：10.1.1.0 → S0、10.1.2.0 → S0；往 C 那边的从 **S1** 出：10.3.5.0 → S1、10.3.6.0 → S1。
>
> 规则：直连写自己的 E 口；远程网络写**本路由器朝那个方向的出口**（不是对面的端口）。远程条目可以 static 手写，也可以 RIP / OSPF 动态学到。

**简答：为什么交换机比 Hub 更适合 LAN？至少写三点。**

> ① 查 MAC 表**只向目的端口转发**（Hub 发给所有端口），每台主机独享端口带宽（microsegmentation）；② **每个端口一个冲突域**，配合全双工和 buffering 基本消除冲突；③ 不会把流量发给无关主机，**更难被嗅探**；④ 表是自动学习的，不用配置。（但交换机不隔离广播域——那要靠路由器。）
