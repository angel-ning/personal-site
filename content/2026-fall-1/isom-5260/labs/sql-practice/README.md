---
title:
  en: "SQL Practice Book · Run It in SQL Developer"
  zh: "SQL 练习册 · 配合 SQL Developer 使用"
summary:
  en: "83 graded exercises on the lecture's Pine Valley tables and the Lab 6 school tables — SELECT, WHERE, functions, GROUP BY / HAVING, joins, error-spotting, INSERT / UPDATE / DELETE with transactions, and DDL with constraints. Every exercise gives the answer SQL plus the exact result (or ORA error) Oracle should return, to compare against your own run in SQL Developer."
  zh: "83 道分级练习，用课上的 Pine Valley 表和 Lab 6 的学校表：SELECT、WHERE、函数、GROUP BY / HAVING、JOIN、找错题、INSERT / UPDATE / DELETE 与事务、建表与约束。每道题给出答案 SQL 和 Oracle 应该返回的结果（或 ORA 报错），在 SQL Developer 里跑完对照。"
week: 5
date: 2026-10-04
tags: [SQL, Oracle, SQL Developer, Lab 6, 练习]
---
# SQL 练习册 · 配合 SQL Developer 使用

**这一页怎么用：读题 → 自己在 SQL Developer 里写 → 运行 → 点「看答案和预期结果」对照 → 一致就点「我跑过了」。**

每道题都给出两样东西：**答案 SQL**（可以一键复制）和 **Oracle 应该返回的结果**——一张结果表、一个行数、一条 `1 row inserted.` 之类的提示，或者一个 `ORA-xxxxx` 报错。数据用的是老师的 `oracle demo.sql`（Pine Valley 家具公司，和第 5 周课件同一套表）和 Lab 6 的 `lab6_init.sql`（学校与科目），所以你跑出来的结果应该和这里**逐行一致**。

> 难度：●○○ 照着语法写就行 · ●●○ 要想一下 · ●●● 考试陷阱 / 综合题  
> 语法讲解在 [第 5 周笔记](../../lectures/week-05/)，这里只练习。题号（b03、x01……）方便你记录哪题没对上。

> **📌 为什么不在网页里直接运行 SQL**
>
> 浏览器里能跑的数据库（SQLite、PostgreSQL 的 WebAssembly 版）规则和 Oracle 不一样，最要命的是**该报错的不报错**：SQLite 允许在 WHERE 里用列别名、允许 SELECT 里混用聚合列和普通列、`VARCHAR2(5)` 能塞进 20 个字符、数字列能插入 `'abc'`——这些在 Oracle 里全是错误，也正是考试考的点。所以这一页只负责出题和给出 Oracle 的标准答案，**真正运行用 SQL Developer**（连学校的 Oracle），两边一对照，就知道自己哪里写错了。

---

## 0. 第一次用：连上数据库，建好练习数据

### 0.1 连接学校的 Oracle

Lab 6 用的是你自己的 Oracle 账号（见 Lab 6 课件 p.13）：

| 项目         | 填什么                              |
| ---------- | -------------------------------- |
| Username   | ITSC 账号，**不带** `@connect.ust.hk` |
| Password   | 学号后 4 位                          |
| Hostname   | `imz409.ust.hk`                  |
| Port / SID | 按 lab 课上的设置                      |

在 SQL Developer 左上角点绿色的 **+** 新建连接，填好后点 Test，左下角显示 Status: Success 就可以 Connect。在校外连不上的话，通常是要先连学校 VPN。

### 0.2 跑两个初始化脚本

连上后会打开一个空白的 **Worksheet**（工作表）。把下面两个脚本分别复制进去，用 **Run Script**（F5，或工具栏 ▶ 旁边带小纸张的图标）运行整个脚本。快捷键在 Mac 上可能需要按 Fn，按了没反应就直接点工具栏按钮。

*（网页版此处可以一键复制 oracle demo.sql；完整脚本如下）*

```sql
-- ============================================================
-- ISOM 5260: Customer-Order Database
-- Oracle CREATE TABLE and INSERT script
-- ============================================================

-- ------------------------------------------------------------
-- STEP 0: Drop existing tables (if they exist)
-- Run these separately first if you need a clean start.
-- ------------------------------------------------------------
DROP TABLE OrderLine_T;
DROP TABLE Order_T;
DROP TABLE Product_T;
DROP TABLE Customer_T;

-- ------------------------------------------------------------
-- STEP 1: Create tables
-- ------------------------------------------------------------

-- Customer_T
CREATE TABLE Customer_T (
    CustomerID         NUMBER(11,0),
    CustomerName       VARCHAR2(25)  NOT NULL,
    CustomerAddress    VARCHAR2(30),
    CustomerCity       VARCHAR2(20),
    CustomerState      CHAR(2),
    CustomerPostalCode VARCHAR2(15),
    CONSTRAINT Customer_PK PRIMARY KEY (CustomerID)
);

-- Order_T
CREATE TABLE Order_T (
    OrderID    NUMBER(11,0),
    OrderDate  DATE DEFAULT SYSDATE,
    CustomerID NUMBER(11,0),
    CONSTRAINT Order_PK PRIMARY KEY (OrderID),
    CONSTRAINT Order_FK FOREIGN KEY (CustomerID) REFERENCES Customer_T(CustomerID)
);

-- Product_T
-- Note: 'Natural Maple' has been added to the CHECK list
-- because it appears in the sample data on the slide.
CREATE TABLE Product_T (
    ProductID            NUMBER(11,0),
    ProductDescription   VARCHAR2(50),
    ProductFinish        VARCHAR2(20),
    ProductStandardPrice DECIMAL(6,2),
    ProductLineID        INTEGER,
    CONSTRAINT Product_PK PRIMARY KEY (ProductID),
    CONSTRAINT Product_Finish_CHK CHECK (
        ProductFinish IN (
            'Cherry', 'Natural Ash', 'White Ash',
            'Red Oak', 'Natural Oak', 'Walnut', 'Natural Maple'
        )
    )
);

-- OrderLine_T
CREATE TABLE OrderLine_T (
    OrderID         NUMBER(11,0),
    ProductID       INTEGER,
    OrderedQuantity NUMBER(11,0),
    CONSTRAINT OrderLine_PK PRIMARY KEY (OrderID, ProductID),
    CONSTRAINT OrderLine_FK1 FOREIGN KEY (OrderID) REFERENCES Order_T(OrderID),
    CONSTRAINT OrderLine_FK2 FOREIGN KEY (ProductID) REFERENCES Product_T(ProductID)
);

-- ------------------------------------------------------------
-- STEP 2: Populate Customer_T
-- ------------------------------------------------------------
INSERT INTO Customer_T VALUES (1,  'Contemporary Casuals', '1355 S Hines Blvd',    'Gainesville',  'FL', '32601-2871');
INSERT INTO Customer_T VALUES (2,  'Value Furniture',      '15145 S.W. 17th St.',  'Plano',        'TX', '75094-7743');
    
INSERT INTO Customer_T VALUES (3,  'Home Furnishings',     '1900 Allard Ave.',     'Albany',       'NY', '12209-1125');
INSERT INTO Customer_T VALUES (4,  'Eastern Furniture',    '1925 Beltline Rd.',    'Carteret',     'NJ', '07008-3188');
INSERT INTO Customer_T VALUES (5,  'Impressions',          '5585 Westcott Ct.',    'Sacramento',   'CA', '94206-4056');
INSERT INTO Customer_T VALUES (6,  'Furniture Gallery',    '325 Flatiron Dr.',     'Boulder',      'CO', '80514-4432');

INSERT INTO Customer_T 
    (CustomerID, CustomerName, CustomerAddress, CustomerCity, CustomerState, CustomerPostalCode)
VALUES 
    (7, 'Period Furniture', '394 Rainbow Dr.', 'Seattle', 'WA', NULL);
    
INSERT INTO Customer_T VALUES (8,  'California Classics',  '816 Peach Rd.',        'Santa Clara',  'CA', '96915-7743');
INSERT INTO Customer_T VALUES (9,  'M and H Casual Furn',  '3709 First Street',    'Clearwater',   'FL', '33775-0000');
INSERT INTO Customer_T VALUES (10, 'Seminole Interiors',   '2400 Rocky Point Dr.', 'Tallahassee',  'FL', '32301-0000');
INSERT INTO Customer_T VALUES (11, 'American Euro Life',   '2424 Missouri Ave.',   'Orlando',      'FL', '32801-0000');
INSERT INTO Customer_T VALUES (12, 'Battle Creek Furn',    '345 Capitol Ave.',     'Battle Creek', 'MI', '49016-0000');

INSERT INTO Customer_T 
    (CustomerID, CustomerName, CustomerAddress, CustomerCity, CustomerState)
VALUES 
    (13, 'Heritage Furnishings', '66789 College Ave.', 'Duluth', 'MN');

INSERT INTO Customer_T VALUES (14, 'Kaneohe Homes',        '112 Kiowai St.',       'Kaneohe',      'HI', '96744-0000');
INSERT INTO Customer_T VALUES (15, 'Mountain Scenes',      '4132 Main Street',     'Boulder',      'CO', '80302-0000');

INSERT INTO Customer_T VALUES (16, 'Sunshine Interiors', '123 Beach Blvd', 'Tampa', 'FL', '33601-0000');

INSERT INTO Customer_T 
    (CustomerID, CustomerName, CustomerAddress, CustomerCity, CustomerState)
VALUES 
    (17, 'Rocky Mountain Furn', '456 Peak St', 'Denver', 'CO');

INSERT INTO Customer_T VALUES (18, 'Golden State Designs', '789 Capitol Ave', 'Sacramento', 'CA', '94206-0000');

INSERT INTO Customer_T VALUES (19, 'Lone Star Furniture', '101 Main St', 'Plano', 'TX', '75094-0000');

INSERT INTO Customer_T 
    (CustomerID, CustomerName, CustomerAddress, CustomerCity, CustomerState, CustomerPostalCode)
VALUES 
    (20, 'Rainier Home', '202 Pine St', 'Seattle', 'WA', NULL);

-- ------------------------------------------------------------
-- STEP 3: Populate Product_T
-- ------------------------------------------------------------
INSERT INTO Product_T VALUES (1, 'End Table',            'Cherry',        175, 1);
INSERT INTO Product_T VALUES (2, 'Coffee Table',         'Natural Ash',   200, 2);
INSERT INTO Product_T VALUES (3, 'Computer Desk',        'Natural Ash',   375, 2);
INSERT INTO Product_T VALUES (4, 'Entertainment Center', 'Natural Maple', 650, 3);
INSERT INTO Product_T VALUES (5, 'Writers Desk',         'Cherry',        325, 1);
INSERT INTO Product_T VALUES (6, '8-Drawer Desk',        'White Ash',     750, 2);
INSERT INTO Product_T VALUES (7, 'Dining Table',         'Natural Ash',   800, 2);
INSERT INTO Product_T VALUES (8, 'Computer Desk',        'Walnut',        250, 3);
INSERT INTO Product_T VALUES (9,  '3-Drawer Chest',      'Cherry',        450, 1);
INSERT INTO Product_T VALUES (10, '4-Drawer Dresser',    'Natural Oak',   625, 2);

-- ------------------------------------------------------------
-- STEP 4: Populate Order_T
-- ------------------------------------------------------------
INSERT INTO Order_T VALUES (1001, DATE '2024-10-21', 1);
INSERT INTO Order_T VALUES (1002, DATE '2024-10-21', 8);
INSERT INTO Order_T VALUES (1003, DATE '2024-10-22', 15);
INSERT INTO Order_T VALUES (1004, DATE '2024-10-22', 5);
INSERT INTO Order_T VALUES (1005, DATE '2024-10-24', 3);
INSERT INTO Order_T VALUES (1006, DATE '2024-10-24', 2);
INSERT INTO Order_T VALUES (1007, DATE '2024-10-27', 10);
INSERT INTO Order_T VALUES (1008, DATE '2024-10-30', 12);

-- ------------------------------------------------------------
-- STEP 5: Populate OrderLine_T
-- ------------------------------------------------------------
INSERT INTO OrderLine_T VALUES (1001, 1, 2);
INSERT INTO OrderLine_T VALUES (1001, 2, 2);
INSERT INTO OrderLine_T VALUES (1001, 4, 1);
INSERT INTO OrderLine_T VALUES (1002, 3, 5);
INSERT INTO OrderLine_T VALUES (1003, 3, 3);
INSERT INTO OrderLine_T VALUES (1004, 6, 2);
INSERT INTO OrderLine_T VALUES (1004, 8, 2);
INSERT INTO OrderLine_T VALUES (1005, 4, 4);
INSERT INTO OrderLine_T VALUES (1006, 4, 1);
INSERT INTO OrderLine_T VALUES (1006, 5, 2);
INSERT INTO OrderLine_T VALUES (1007, 1, 2);
INSERT INTO OrderLine_T VALUES (1007, 2, 2);
INSERT INTO OrderLine_T VALUES (1008, 3, 3);
INSERT INTO OrderLine_T VALUES (1008, 4, 2);
INSERT INTO OrderLine_T VALUES (1002, 4, 1);
INSERT INTO OrderLine_T VALUES (1003, 1, 1);
INSERT INTO OrderLine_T VALUES (1005, 2, 1);
INSERT INTO OrderLine_T VALUES (1006, 8, 1);

-- ------------------------------------------------------------
-- STEP 6: Commit changes
-- ------------------------------------------------------------
COMMIT;
```

*（网页版此处可以一键复制 lab6\_init.sql；完整脚本如下）*

```sql
drop table school cascade constraints;

drop table subject cascade constraints;

drop table subject_offer cascade constraints;

Create table SCHOOL (
	SCHOOL_ID Varchar2 (3) NOT NULL ,
	SCHOOL_NAME Varchar2 (100) NOT NULL ,
	CONTACT_PERSON Varchar2 (100) NOT NULL ,
	TELEPHONE Varchar2 (8) NOT NULL ,
        NO_OF_STU Number,
primary key (SCHOOL_ID) 
) 
/

Create table SUBJECT (
	SUBJECT_CODE Varchar2 (4) NOT NULL ,
	SUBJECT_NAME Varchar2 (100) NOT NULL ,
	SUBJECT_LEVEL Varchar2 (2) NOT NULL ,
primary key (SUBJECT_CODE) 
) 
/

Create table SUBJECT_OFFER (
	FK_SCHOOL_ID Varchar2 (3) NOT NULL ,
	FK_SUBJECT_CODE Varchar2 (4) NOT NULL ,
primary key (FK_SCHOOL_ID,FK_SUBJECT_CODE) 
) 
/


Alter table SUBJECT_OFFER add  foreign key (FK_SCHOOL_ID) references SCHOOL (SCHOOL_ID) 
/

Alter table SUBJECT_OFFER add  foreign key (FK_SUBJECT_CODE) references SUBJECT (SUBJECT_CODE) 
/
INSERT INTO SCHOOL VALUES ('1','School No. 1','Peter Leung','15823931',69 );         
INSERT INTO SCHOOL VALUES ('2','School No. 2','Stanley Wong','86051042',242);        
INSERT INTO SCHOOL VALUES ('3','School No. 3','Leo Tse','54488246',530);             
INSERT INTO SCHOOL VALUES ('4','School No. 4','Elahi Carlos','54125473',825);        
INSERT INTO SCHOOL VALUES ('5','School No. 5','Eduardo Lau','44185208',336);         
INSERT INTO SCHOOL VALUES ('6','School No. 6','Sisi Wong','75447810',524);           
INSERT INTO SCHOOL VALUES ('7','School No. 7','CK Chan','4170099',68 );              
INSERT INTO SCHOOL VALUES ('8','School No. 8','KK Lee','12140674',612);              
INSERT INTO SCHOOL VALUES ('9','School No. 9','Jonah Wong','8063438',716);           
INSERT INTO SCHOOL VALUES ('10','School No. 10','Usher Yu','83672294',69 );          
INSERT INTO SCHOOL VALUES ('11','School No. 11','Eason Chan','70306564',516);        
INSERT INTO SCHOOL VALUES ('12','School No. 12','Cecilia Cheung','11120926',236);    
INSERT INTO SCHOOL VALUES ('13','School No. 13','Gilian Chung','95243385',636);      
INSERT INTO SCHOOL VALUES ('14','School No. 14','Roger Poon','71453788',627);        
INSERT INTO SCHOOL VALUES ('15','School No. 15','Joseph Cheng','91848745',848);      
INSERT INTO SCHOOL VALUES ('16','School No. 16','MS Tang','41478663',86 );           
INSERT INTO SCHOOL VALUES ('17','School No. 17','May Ho','93669356',212);            
INSERT INTO SCHOOL VALUES ('18','School No. 18','Perfect Au','74443547',864);        
INSERT INTO SCHOOL VALUES ('19','School No. 19','Brad Drad','88461285',615);         
INSERT INTO SCHOOL VALUES ('20','School No. 20','Dorothy Wong','80435848',225);      

INSERT INTO SUBJECT VALUES ('1001','Chinese Language and Culture','AS');     
INSERT INTO SUBJECT VALUES ('1002','Use of English','AS');                   
INSERT INTO SUBJECT VALUES ('1003','Mathematics and Statistics','AS');       
INSERT INTO SUBJECT VALUES ('1004','Geography','AL');                        
INSERT INTO SUBJECT VALUES ('1005','Economics','AL');                        
INSERT INTO SUBJECT VALUES ('1006','Principles of Accounts','AL');           
INSERT INTO SUBJECT VALUES ('1007','Business Studies','AL');                 
INSERT INTO SUBJECT VALUES ('1008','Pure Mathematics','AL');                 
INSERT INTO SUBJECT VALUES ('1009','History','AL');                          
INSERT INTO SUBJECT VALUES ('1010','Chinese History','AL');                  
INSERT INTO SUBJECT VALUES ('1011','English Literature','AL');               
INSERT INTO SUBJECT VALUES ('1012','Religious Studies','AS');                
INSERT INTO SUBJECT VALUES ('1013','Physics','AL');                          
INSERT INTO SUBJECT VALUES ('1014','Chemistry','AL');                        
INSERT INTO SUBJECT VALUES ('1015','Biology','AL');                          
INSERT INTO SUBJECT VALUES ('1016','Chinese Culture','AL');                  
INSERT INTO SUBJECT VALUES ('1017','Liberal Studies','AS');                  
INSERT INTO SUBJECT VALUES ('1018','Applied Mathematics','AL');              
INSERT INTO SUBJECT VALUES ('1019','Computer Studies','AL');                 
INSERT INTO SUBJECT VALUES ('1020','Art','AS');       

INSERT INTO SUBJECT_OFFER VALUES ('1','1002');
INSERT INTO SUBJECT_OFFER VALUES ('1','1004');
INSERT INTO SUBJECT_OFFER VALUES ('1','1008');
INSERT INTO SUBJECT_OFFER VALUES ('1','1020');
INSERT INTO SUBJECT_OFFER VALUES ('2','1007');
INSERT INTO SUBJECT_OFFER VALUES ('2','1008');
INSERT INTO SUBJECT_OFFER VALUES ('2','1009');
INSERT INTO SUBJECT_OFFER VALUES ('3','1010');
INSERT INTO SUBJECT_OFFER VALUES ('3','1016');
INSERT INTO SUBJECT_OFFER VALUES ('3','1017');
INSERT INTO SUBJECT_OFFER VALUES ('4','1007');
INSERT INTO SUBJECT_OFFER VALUES ('4','1009');
INSERT INTO SUBJECT_OFFER VALUES ('4','1011');
INSERT INTO SUBJECT_OFFER VALUES ('5','1014');
INSERT INTO SUBJECT_OFFER VALUES ('5','1016');
INSERT INTO SUBJECT_OFFER VALUES ('5','1017');
INSERT INTO SUBJECT_OFFER VALUES ('5','1018');
INSERT INTO SUBJECT_OFFER VALUES ('6','1010');
INSERT INTO SUBJECT_OFFER VALUES ('6','1016');
INSERT INTO SUBJECT_OFFER VALUES ('7','1002');
INSERT INTO SUBJECT_OFFER VALUES ('7','1003');
INSERT INTO SUBJECT_OFFER VALUES ('7','1010');
INSERT INTO SUBJECT_OFFER VALUES ('7','1012');
INSERT INTO SUBJECT_OFFER VALUES ('7','1015');
INSERT INTO SUBJECT_OFFER VALUES ('7','1017');
INSERT INTO SUBJECT_OFFER VALUES ('7','1018');
INSERT INTO SUBJECT_OFFER VALUES ('8','1011');
INSERT INTO SUBJECT_OFFER VALUES ('8','1012');
INSERT INTO SUBJECT_OFFER VALUES ('8','1013');
INSERT INTO SUBJECT_OFFER VALUES ('8','1014');
INSERT INTO SUBJECT_OFFER VALUES ('8','1018');
INSERT INTO SUBJECT_OFFER VALUES ('8','1020');
INSERT INTO SUBJECT_OFFER VALUES ('9','1005');
INSERT INTO SUBJECT_OFFER VALUES ('9','1008');
INSERT INTO SUBJECT_OFFER VALUES ('9','1017');
INSERT INTO SUBJECT_OFFER VALUES ('9','1018');
INSERT INTO SUBJECT_OFFER VALUES ('10','1006');
INSERT INTO SUBJECT_OFFER VALUES ('11','1003');
INSERT INTO SUBJECT_OFFER VALUES ('12','1002');
INSERT INTO SUBJECT_OFFER VALUES ('12','1003');
INSERT INTO SUBJECT_OFFER VALUES ('12','1004');
INSERT INTO SUBJECT_OFFER VALUES ('12','1012');
INSERT INTO SUBJECT_OFFER VALUES ('12','1013');
INSERT INTO SUBJECT_OFFER VALUES ('12','1015');
INSERT INTO SUBJECT_OFFER VALUES ('12','1017');
INSERT INTO SUBJECT_OFFER VALUES ('13','1009');
INSERT INTO SUBJECT_OFFER VALUES ('13','1010');
INSERT INTO SUBJECT_OFFER VALUES ('14','1002');
INSERT INTO SUBJECT_OFFER VALUES ('14','1013');
INSERT INTO SUBJECT_OFFER VALUES ('14','1020');
INSERT INTO SUBJECT_OFFER VALUES ('15','1002');
INSERT INTO SUBJECT_OFFER VALUES ('15','1004');
INSERT INTO SUBJECT_OFFER VALUES ('15','1008');
INSERT INTO SUBJECT_OFFER VALUES ('15','1014');
INSERT INTO SUBJECT_OFFER VALUES ('15','1020');
INSERT INTO SUBJECT_OFFER VALUES ('16','1001');
INSERT INTO SUBJECT_OFFER VALUES ('16','1015');
INSERT INTO SUBJECT_OFFER VALUES ('16','1020');
INSERT INTO SUBJECT_OFFER VALUES ('17','1003');
INSERT INTO SUBJECT_OFFER VALUES ('17','1017');
INSERT INTO SUBJECT_OFFER VALUES ('18','1002');
INSERT INTO SUBJECT_OFFER VALUES ('18','1009');
INSERT INTO SUBJECT_OFFER VALUES ('18','1018');
INSERT INTO SUBJECT_OFFER VALUES ('19','1004');
INSERT INTO SUBJECT_OFFER VALUES ('19','1009');
INSERT INTO SUBJECT_OFFER VALUES ('19','1010');
INSERT INTO SUBJECT_OFFER VALUES ('19','1015');
INSERT INTO SUBJECT_OFFER VALUES ('19','1017');
INSERT INTO SUBJECT_OFFER VALUES ('20','1003');
INSERT INTO SUBJECT_OFFER VALUES ('20','1019');             

COMMIT;
```

> **⚠️ 跑脚本时的几个提醒**
>
> - **第一次跑**时，老师脚本开头的 4 条 `DROP TABLE` 会报 `ORA-00942: table or view does not exist`（表还不存在，删不了），**这是正常的**，后面的建表和插入会照常执行。
> - 原始的 `lab6_init.sql` 第 38 行多了一行 `===`，这里提供的版本已经**删掉**了。如果你之前用原文件跑过，用下面的 e01 和 s01 检查一下：SCHOOL、SUBJECT 应该各 20 行，SUBJECT\_OFFER 70 行。
> - **任何时候结果对不上、或者数据被改乱了，重新跑一遍这两个脚本**就回到初始状态。两个脚本开头都会先删表再重建。

### 0.3 运行一条语句 vs 运行整个脚本

| 操作                        | 快捷键              | 运行什么              | 结果显示在                                         |
| ------------------------- | ---------------- | ----------------- | --------------------------------------------- |
| Run Statement（工具栏第一个绿色 ▶） | **Ctrl + Enter** | 光标所在的那一条          | **Query Result**：表格，可以滚动、排序                   |
| Run Script（▶ 旁边带小纸张的图标）   | **F5**           | 整个 worksheet，从上到下 | **Script Output**：纯文字，`1 row inserted.` 之类的提示 |

做练习时用 **Run Statement**：一次只跑一条，结果是表格，方便和这里对照。每条语句最后写分号 `;`，语句之间空一行，这样 SQL Developer 能分清「光标所在的那一条」到哪里结束。

> **💡 怎么读结果**
>
> - **表头都是大写**：Oracle 会把没加双引号的名字统一转成大写，所以你写 `CustomerName`，表头显示 `CUSTOMERNAME`。
> - **`(null)`** 表示空值（这一格没有数据），不是文字 "null"。
> - 行数多时 SQL Developer 默认只先取 50 行，结果窗口上方显示 **Fetched 50 rows**；往下滚到底会继续取，变成 **All Rows Fetched: N**。
> - **日期**默认显示成 `21-OCT-24`（日-月-年），这是 SQL Developer 的 NLS 设置决定的。
> - 数字末尾的 0 会被省掉：`170.0` 显示为 `170`。

> **📌 结果对不上时，按这个顺序查**
>
> 1. **数据被改过？** 前面的练习改了数据又 COMMIT 了 → 重跑初始化脚本。
> 2. **行的顺序不一样，但内容一样？** 没写 `ORDER BY` 时，Oracle 不保证顺序。这里的题目基本都写了 ORDER BY。
> 3. **日期显示格式不一样？** NLS 设置不同，日期本身没错。
> 4. **报错代码一样，但信息不一样？** 报错信息里的 `<你的用户名>` 会显示你自己的账号；Oracle 23ai 的报错信息比 19c 更长。**只要 ORA 编号一致就算对上了。**
> 5. 还是不对：记下题号，可能是这里的预期结果写错了。

**e01 · 看看你有哪些表**（准备 ●○○）

确认初始化脚本跑成功了：列出你账号里所有的表。

提示：不用记这句，直接复制运行即可。

> ```sql
> SELECT table_name FROM user_tables ORDER BY table_name;
> ```
>
> **预期：**
>
> | TABLE\_NAME    |
> | -------------- |
> | CUSTOMER\_T    |
> | ORDERLINE\_T   |
> | ORDER\_T       |
> | PRODUCT\_T     |
> | SCHOOL         |
> | SUBJECT        |
> | SUBJECT\_OFFER |
>
> 至少要有这 7 张表（按字母排序）。如果你之前做过别的练习，还会多出 FLCUSTOMER\_T、CLASSROOM 之类的表，这没关系。
>
> **为什么：**`user_tables` 是 Oracle 自带的**数据字典视图**（data dictionary view），记录「当前用户拥有哪些表」。表名在 Oracle 内部一律存成**大写**，所以这里看到的是 `CUSTOMER_T` 而不是 `Customer_T`。

**e02 · 确认 Oracle 版本**（准备 ●○○）

查一下学校服务器上 Oracle 的版本号。有几条报错规则在新旧版本之间不一样，后面会用到。

> ```sql
> SELECT banner FROM v$version;
> ```
>
> **预期：**
>
> 返回 1–2 行，类似 `Oracle Database 19c Enterprise Edition Release 19.0.0.0.0` 或 `Oracle Database 23ai …`。记下你看到的是 19c 还是 23ai。如果报 ORA-00942（没有权限看这个视图），改用 `SELECT * FROM product_component_version;`。
>
> **为什么：**这个页面的预期结果按 **Oracle 19c** 写。23ai 放宽了少数规则（例如 GROUP BY 里可以用列别名）、报错信息也更详细（会写出表名和列名）。本页的题目都避开了这些差别，错误代码（ORA-xxxxx）在两个版本里是一样的。

---

## 1. 认识数据

做题前先看一眼表里有什么。下面的数据和你跑完初始化脚本之后的数据**完全一样**。

### 1.1 Pine Valley Furniture（课件第 5 周的表）

**CUSTOMER\_T**：客户：每行一位客户（20 行）

| CUSTOMERID (PK) | CUSTOMERNAME (NN)    | CUSTOMERADDRESS      | CUSTOMERCITY | CUSTOMERSTATE | CUSTOMERPOSTALCODE |
| --------------- | -------------------- | -------------------- | ------------ | ------------- | ------------------ |
| 1               | Contemporary Casuals | 1355 S Hines Blvd    | Gainesville  | FL            | 32601-2871         |
| 2               | Value Furniture      | 15145 S.W. 17th St.  | Plano        | TX            | 75094-7743         |
| 3               | Home Furnishings     | 1900 Allard Ave.     | Albany       | NY            | 12209-1125         |
| 4               | Eastern Furniture    | 1925 Beltline Rd.    | Carteret     | NJ            | 07008-3188         |
| 5               | Impressions          | 5585 Westcott Ct.    | Sacramento   | CA            | 94206-4056         |
| 6               | Furniture Gallery    | 325 Flatiron Dr.     | Boulder      | CO            | 80514-4432         |
| 7               | Period Furniture     | 394 Rainbow Dr.      | Seattle      | WA            | (null)             |
| 8               | California Classics  | 816 Peach Rd.        | Santa Clara  | CA            | 96915-7743         |
| 9               | M and H Casual Furn  | 3709 First Street    | Clearwater   | FL            | 33775-0000         |
| 10              | Seminole Interiors   | 2400 Rocky Point Dr. | Tallahassee  | FL            | 32301-0000         |
| 11              | American Euro Life   | 2424 Missouri Ave.   | Orlando      | FL            | 32801-0000         |
| 12              | Battle Creek Furn    | 345 Capitol Ave.     | Battle Creek | MI            | 49016-0000         |
| 13              | Heritage Furnishings | 66789 College Ave.   | Duluth       | MN            | (null)             |
| 14              | Kaneohe Homes        | 112 Kiowai St.       | Kaneohe      | HI            | 96744-0000         |
| 15              | Mountain Scenes      | 4132 Main Street     | Boulder      | CO            | 80302-0000         |
| 16              | Sunshine Interiors   | 123 Beach Blvd       | Tampa        | FL            | 33601-0000         |
| 17              | Rocky Mountain Furn  | 456 Peak St          | Denver       | CO            | (null)             |
| 18              | Golden State Designs | 789 Capitol Ave      | Sacramento   | CA            | 94206-0000         |
| 19              | Lone Star Furniture  | 101 Main St          | Plano        | TX            | 75094-0000         |
| 20              | Rainier Home         | 202 Pine St          | Seattle      | WA            | (null)             |

**PRODUCT\_T**：产品：每行一个家具产品。ProductFinish 有 CHECK 约束，只能是 7 种材质之一（10 行）

| PRODUCTID (PK) | PRODUCTDESCRIPTION   | PRODUCTFINISH | PRODUCTSTANDARDPRICE | PRODUCTLINEID |
| -------------- | -------------------- | ------------- | -------------------- | ------------- |
| 1              | End Table            | Cherry        | 175                  | 1             |
| 2              | Coffee Table         | Natural Ash   | 200                  | 2             |
| 3              | Computer Desk        | Natural Ash   | 375                  | 2             |
| 4              | Entertainment Center | Natural Maple | 650                  | 3             |
| 5              | Writers Desk         | Cherry        | 325                  | 1             |
| 6              | 8-Drawer Desk        | White Ash     | 750                  | 2             |
| 7              | Dining Table         | Natural Ash   | 800                  | 2             |
| 8              | Computer Desk        | Walnut        | 250                  | 3             |
| 9              | 3-Drawer Chest       | Cherry        | 450                  | 1             |
| 10             | 4-Drawer Dresser     | Natural Oak   | 625                  | 2             |

**ORDER\_T**：订单：每行一张订单，CustomerID 指向下单的客户（8 行）

| ORDERID (PK) | ORDERDATE | CUSTOMERID (FK → CUSTOMER\_T) |
| ------------ | --------- | ----------------------------- |
| 1001         | 21-OCT-24 | 1                             |
| 1002         | 21-OCT-24 | 8                             |
| 1003         | 22-OCT-24 | 15                            |
| 1004         | 22-OCT-24 | 5                             |
| 1005         | 24-OCT-24 | 3                             |
| 1006         | 24-OCT-24 | 2                             |
| 1007         | 27-OCT-24 | 10                            |
| 1008         | 30-OCT-24 | 12                            |

**ORDERLINE\_T**：订单明细：每行 =「某张订单里的某个产品买了几个」，主键是 (OrderID, ProductID) 两列一起（18 行）

| ORDERID (PK, FK → ORDER\_T) | PRODUCTID (PK, FK → PRODUCT\_T) | ORDEREDQUANTITY |
| --------------------------- | ------------------------------- | --------------- |
| 1001                        | 1                               | 2               |
| 1001                        | 2                               | 2               |
| 1001                        | 4                               | 1               |
| 1002                        | 3                               | 5               |
| 1003                        | 3                               | 3               |
| 1004                        | 6                               | 2               |
| 1004                        | 8                               | 2               |
| 1005                        | 4                               | 4               |
| 1006                        | 4                               | 1               |
| 1006                        | 5                               | 2               |
| 1007                        | 1                               | 2               |
| 1007                        | 2                               | 2               |
| 1008                        | 3                               | 3               |
| 1008                        | 4                               | 2               |
| 1002                        | 4                               | 1               |
| 1003                        | 1                               | 1               |
| 1005                        | 2                               | 1               |
| 1006                        | 8                               | 1               |

四张表的关系（第 4 周画的 ER 图映射过来的）：

- 一位**客户**（Customer\_T）可以下多张**订单**（Order\_T）→ Order\_T.CustomerID 是外键
- 一张订单可以买多个**产品**（Product\_T），一个产品也可以出现在多张订单里——**多对多**，所以中间拆出一张**关联表** OrderLine\_T，主键是 (OrderID, ProductID) 两列一起
- 20 位客户里只有 8 位下过单；10 个产品里有 3 个从没卖出去——后面 JOIN 的题会用到这两件事

### 1.2 Lab 6：学校与科目

**SCHOOL**：学校：NO\_OF\_STU 是学生人数（20 行）

| SCHOOL\_ID (PK) | SCHOOL\_NAME (NN) | CONTACT\_PERSON (NN) | TELEPHONE (NN) | NO\_OF\_STU |
| --------------- | ----------------- | -------------------- | -------------- | ----------- |
| 1               | School No. 1      | Peter Leung          | 15823931       | 69          |
| 2               | School No. 2      | Stanley Wong         | 86051042       | 242         |
| 3               | School No. 3      | Leo Tse              | 54488246       | 530         |
| 4               | School No. 4      | Elahi Carlos         | 54125473       | 825         |
| 5               | School No. 5      | Eduardo Lau          | 44185208       | 336         |
| 6               | School No. 6      | Sisi Wong            | 75447810       | 524         |
| 7               | School No. 7      | CK Chan              | 4170099        | 68          |
| 8               | School No. 8      | KK Lee               | 12140674       | 612         |
| 9               | School No. 9      | Jonah Wong           | 8063438        | 716         |
| 10              | School No. 10     | Usher Yu             | 83672294       | 69          |
| 11              | School No. 11     | Eason Chan           | 70306564       | 516         |
| 12              | School No. 12     | Cecilia Cheung       | 11120926       | 236         |
| 13              | School No. 13     | Gilian Chung         | 95243385       | 636         |
| 14              | School No. 14     | Roger Poon           | 71453788       | 627         |
| 15              | School No. 15     | Joseph Cheng         | 91848745       | 848         |
| 16              | School No. 16     | MS Tang              | 41478663       | 86          |
| 17              | School No. 17     | May Ho               | 93669356       | 212         |
| 18              | School No. 18     | Perfect Au           | 74443547       | 864         |
| 19              | School No. 19     | Brad Drad            | 88461285       | 615         |
| 20              | School No. 20     | Dorothy Wong         | 80435848       | 225         |

**SUBJECT**：科目：SUBJECT\_LEVEL 是 AS 或 AL（20 行）

| SUBJECT\_CODE (PK) | SUBJECT\_NAME (NN)           | SUBJECT\_LEVEL (NN) |
| ------------------ | ---------------------------- | ------------------- |
| 1001               | Chinese Language and Culture | AS                  |
| 1002               | Use of English               | AS                  |
| 1003               | Mathematics and Statistics   | AS                  |
| 1004               | Geography                    | AL                  |
| 1005               | Economics                    | AL                  |
| 1006               | Principles of Accounts       | AL                  |
| 1007               | Business Studies             | AL                  |
| 1008               | Pure Mathematics             | AL                  |
| 1009               | History                      | AL                  |
| 1010               | Chinese History              | AL                  |
| 1011               | English Literature           | AL                  |
| 1012               | Religious Studies            | AS                  |
| 1013               | Physics                      | AL                  |
| 1014               | Chemistry                    | AL                  |
| 1015               | Biology                      | AL                  |
| 1016               | Chinese Culture              | AL                  |
| 1017               | Liberal Studies              | AS                  |
| 1018               | Applied Mathematics          | AL                  |
| 1019               | Computer Studies             | AL                  |
| 1020               | Art                          | AS                  |

**SUBJECT\_OFFER**：开课：每行 =「某所学校开设某门科目」，主键是两列一起（70 行）

| FK\_SCHOOL\_ID (PK, FK → SCHOOL) | FK\_SUBJECT\_CODE (PK, FK → SUBJECT) |
| -------------------------------- | ------------------------------------ |
| 1                                | 1002                                 |
| 1                                | 1004                                 |
| 1                                | 1008                                 |
| 1                                | 1020                                 |
| 2                                | 1007                                 |
| 2                                | 1008                                 |
| 2                                | 1009                                 |
| 3                                | 1010                                 |
| 3                                | 1016                                 |
| 3                                | 1017                                 |
| 4                                | 1007                                 |
| 4                                | 1009                                 |
| 4                                | 1011                                 |
| 5                                | 1014                                 |
| 5                                | 1016                                 |
| 5                                | 1017                                 |
| 5                                | 1018                                 |
| 6                                | 1010                                 |
| 6                                | 1016                                 |
| 7                                | 1002                                 |
| 7                                | 1003                                 |
| 7                                | 1010                                 |
| 7                                | 1012                                 |
| 7                                | 1015                                 |
| 7                                | 1017                                 |
| 7                                | 1018                                 |
| 8                                | 1011                                 |
| 8                                | 1012                                 |
| 8                                | 1013                                 |
| 8                                | 1014                                 |
| 8                                | 1018                                 |
| 8                                | 1020                                 |
| 9                                | 1005                                 |
| 9                                | 1008                                 |
| 9                                | 1017                                 |
| 9                                | 1018                                 |
| 10                               | 1006                                 |
| 11                               | 1003                                 |
| 12                               | 1002                                 |
| 12                               | 1003                                 |
| 12                               | 1004                                 |
| 12                               | 1012                                 |
| 12                               | 1013                                 |
| 12                               | 1015                                 |
| 12                               | 1017                                 |
| 13                               | 1009                                 |
| 13                               | 1010                                 |
| 14                               | 1002                                 |
| 14                               | 1013                                 |
| 14                               | 1020                                 |
| 15                               | 1002                                 |
| 15                               | 1004                                 |
| 15                               | 1008                                 |
| 15                               | 1014                                 |
| 15                               | 1020                                 |
| 16                               | 1001                                 |
| 16                               | 1015                                 |
| 16                               | 1020                                 |
| 17                               | 1003                                 |
| 17                               | 1017                                 |
| 18                               | 1002                                 |
| 18                               | 1009                                 |
| 18                               | 1018                                 |
| 19                               | 1004                                 |
| 19                               | 1009                                 |
| 19                               | 1010                                 |
| 19                               | 1015                                 |
| 19                               | 1017                                 |
| 20                               | 1003                                 |
| 20                               | 1019                                 |

结构和 Pine Valley 一样是「两张实体表 + 一张关联表」：一所学校开多门科目，一门科目也被多所学校开设，SUBJECT\_OFFER 记录「谁开了什么」。注意 **SCHOOL\_ID 是 VARCHAR2（文字）**，这件事在 s06、s08 里会变成陷阱。

---

## 2. SELECT 基础

`SELECT 要哪些列 FROM 哪张表;` ——最简单的查询只需要这两个子句。

**b01 · 看整张表**（SELECT 基础 ●○○）

显示 Customer\_T 的所有列、所有行。

提示：`SELECT 列 FROM 表;`，所有列用 `*`。

> ```sql
> SELECT * FROM Customer_T;
> ```
>
> **预期：20 行**
>
> | CUSTOMERID | CUSTOMERNAME         | CUSTOMERADDRESS      | CUSTOMERCITY | CUSTOMERSTATE | CUSTOMERPOSTALCODE |
> | ---------- | -------------------- | -------------------- | ------------ | ------------- | ------------------ |
> | 1          | Contemporary Casuals | 1355 S Hines Blvd    | Gainesville  | FL            | 32601-2871         |
> | 2          | Value Furniture      | 15145 S.W. 17th St.  | Plano        | TX            | 75094-7743         |
> | 3          | Home Furnishings     | 1900 Allard Ave.     | Albany       | NY            | 12209-1125         |
> | 4          | Eastern Furniture    | 1925 Beltline Rd.    | Carteret     | NJ            | 07008-3188         |
> | 5          | Impressions          | 5585 Westcott Ct.    | Sacramento   | CA            | 94206-4056         |
> | 6          | Furniture Gallery    | 325 Flatiron Dr.     | Boulder      | CO            | 80514-4432         |
> | 7          | Period Furniture     | 394 Rainbow Dr.      | Seattle      | WA            | (null)             |
> | 8          | California Classics  | 816 Peach Rd.        | Santa Clara  | CA            | 96915-7743         |
> | 9          | M and H Casual Furn  | 3709 First Street    | Clearwater   | FL            | 33775-0000         |
> | 10         | Seminole Interiors   | 2400 Rocky Point Dr. | Tallahassee  | FL            | 32301-0000         |
> | 11         | American Euro Life   | 2424 Missouri Ave.   | Orlando      | FL            | 32801-0000         |
> | 12         | Battle Creek Furn    | 345 Capitol Ave.     | Battle Creek | MI            | 49016-0000         |
> | 13         | Heritage Furnishings | 66789 College Ave.   | Duluth       | MN            | (null)             |
> | 14         | Kaneohe Homes        | 112 Kiowai St.       | Kaneohe      | HI            | 96744-0000         |
> | 15         | Mountain Scenes      | 4132 Main Street     | Boulder      | CO            | 80302-0000         |
> | 16         | Sunshine Interiors   | 123 Beach Blvd       | Tampa        | FL            | 33601-0000         |
> | 17         | Rocky Mountain Furn  | 456 Peak St          | Denver       | CO            | (null)             |
> | 18         | Golden State Designs | 789 Capitol Ave      | Sacramento   | CA            | 94206-0000         |
> | 19         | Lone Star Furniture  | 101 Main St          | Plano        | TX            | 75094-0000         |
> | 20         | Rainier Home         | 202 Pine St          | Seattle      | WA            | (null)             |
>
> 没写 ORDER BY 时，Oracle 不保证行的顺序。小表一般按插入顺序显示，但不能依赖这一点。
>
> **为什么：**`*` 表示「所有列」。注意第 7、13、17、20 行的邮编显示为 `(null)`——SQL Developer 用 `(null)` 表示**空值**，它和空字符串、0 都不一样。

**b02 · 只要几列**（SELECT 基础 ●○○）

只显示每位客户的名字、城市和州。

提示：把 `*` 换成具体的列名，用逗号隔开。

> ```sql
> SELECT CustomerName, CustomerCity, CustomerState
> FROM Customer_T;
> ```
>
> **预期：20 行**
>
> | CUSTOMERNAME         | CUSTOMERCITY | CUSTOMERSTATE |
> | -------------------- | ------------ | ------------- |
> | Contemporary Casuals | Gainesville  | FL            |
> | Value Furniture      | Plano        | TX            |
> | Home Furnishings     | Albany       | NY            |
> | Eastern Furniture    | Carteret     | NJ            |
> | Impressions          | Sacramento   | CA            |
> | Furniture Gallery    | Boulder      | CO            |
> | Period Furniture     | Seattle      | WA            |
> | California Classics  | Santa Clara  | CA            |
> | M and H Casual Furn  | Clearwater   | FL            |
> | Seminole Interiors   | Tallahassee  | FL            |
> | American Euro Life   | Orlando      | FL            |
> | Battle Creek Furn    | Battle Creek | MI            |
> | Heritage Furnishings | Duluth       | MN            |
> | Kaneohe Homes        | Kaneohe      | HI            |
> | Mountain Scenes      | Boulder      | CO            |
> | Sunshine Interiors   | Tampa        | FL            |
> | Rocky Mountain Furn  | Denver       | CO            |
> | Golden State Designs | Sacramento   | CA            |
> | Lone Star Furniture  | Plano        | TX            |
> | Rainier Home         | Seattle      | WA            |
>
> **为什么：**SELECT 后面列的**顺序**就是结果里列的顺序，和建表时的顺序无关。结果表头显示成大写的 `CUSTOMERNAME`——Oracle 会把没加双引号的名字统一转成大写，所以 SQL 里大小写随便写。

**b03 · 去掉重复：DISTINCT**（SELECT 基础 ●○○）

客户分布在哪些州？每个州只列一次，按字母排序。

提示：在 SELECT 后面加 `DISTINCT`；排序用 `ORDER BY 列名`。

> ```sql
> SELECT DISTINCT CustomerState
> FROM Customer_T
> ORDER BY CustomerState;
> ```
>
> **预期：10 行**
>
> | CUSTOMERSTATE |
> | ------------- |
> | CA            |
> | CO            |
> | FL            |
> | HI            |
> | MI            |
> | MN            |
> | NJ            |
> | NY            |
> | TX            |
> | WA            |
>
> **为什么：**20 位客户只来自 10 个州。`DISTINCT` 把完全相同的行合并成一行。这里加了 `ORDER BY`，因为 Oracle 去重后的顺序是随机的，不排序的话你跑出来的顺序可能和这里不同。

**b04 · DISTINCT 作用于整行**（SELECT 基础 ●●○）

列出所有不重复的「州 + 城市」组合，先按州、再按城市排序。数一数有几行。

提示：DISTINCT 只写一次，放在 SELECT 后面，对后面所有列一起生效。

> ```sql
> SELECT DISTINCT CustomerState, CustomerCity
> FROM Customer_T
> ORDER BY CustomerState, CustomerCity;
> ```
>
> **预期：16 行**
>
> | CUSTOMERSTATE | CUSTOMERCITY |
> | ------------- | ------------ |
> | CA            | Sacramento   |
> | CA            | Santa Clara  |
> | CO            | Boulder      |
> | CO            | Denver       |
> | FL            | Clearwater   |
> | FL            | Gainesville  |
> | FL            | Orlando      |
> | FL            | Tallahassee  |
> | FL            | Tampa        |
> | HI            | Kaneohe      |
> | MI            | Battle Creek |
> | MN            | Duluth       |
> | NJ            | Carteret     |
> | NY            | Albany       |
> | TX            | Plano        |
> | WA            | Seattle      |
>
> **为什么：**`DISTINCT` 管的是**整行**，不是第一列：只有州和城市**都**相同才算重复。所以 CA 出现了两次（Sacramento、Santa Clara）。20 位客户里有 Sacramento、Plano、Seattle、Boulder 各重复一次，所以剩 16 行。

**b05 · 排序：从贵到便宜**（SELECT 基础 ●○○）

列出所有产品的编号、名称和标准价格，从最贵排到最便宜。

提示：`ORDER BY 列名 DESC`

> ```sql
> SELECT ProductID, ProductDescription, ProductStandardPrice
> FROM Product_T
> ORDER BY ProductStandardPrice DESC;
> ```
>
> **预期：10 行**
>
> | PRODUCTID | PRODUCTDESCRIPTION   | PRODUCTSTANDARDPRICE |
> | --------- | -------------------- | -------------------- |
> | 7         | Dining Table         | 800                  |
> | 6         | 8-Drawer Desk        | 750                  |
> | 4         | Entertainment Center | 650                  |
> | 10        | 4-Drawer Dresser     | 625                  |
> | 9         | 3-Drawer Chest       | 450                  |
> | 3         | Computer Desk        | 375                  |
> | 5         | Writers Desk         | 325                  |
> | 8         | Computer Desk        | 250                  |
> | 2         | Coffee Table         | 200                  |
> | 1         | End Table            | 175                  |
>
> **为什么：**`ASC` 升序（默认，可以不写），`DESC` 降序。

**b06 · 两级排序**（SELECT 基础 ●●○）

按州排序；同一个州里再按客户名字排序。显示州和名字。

提示：ORDER BY 后面写两个列，用逗号隔开。

> ```sql
> SELECT CustomerState, CustomerName
> FROM Customer_T
> ORDER BY CustomerState, CustomerName;
> ```
>
> **预期：20 行**
>
> | CUSTOMERSTATE | CUSTOMERNAME         |
> | ------------- | -------------------- |
> | CA            | California Classics  |
> | CA            | Golden State Designs |
> | CA            | Impressions          |
> | CO            | Furniture Gallery    |
> | CO            | Mountain Scenes      |
> | CO            | Rocky Mountain Furn  |
> | FL            | American Euro Life   |
> | FL            | Contemporary Casuals |
> | FL            | M and H Casual Furn  |
> | FL            | Seminole Interiors   |
> | FL            | Sunshine Interiors   |
> | HI            | Kaneohe Homes        |
> | MI            | Battle Creek Furn    |
> | MN            | Heritage Furnishings |
> | NJ            | Eastern Furniture    |
> | NY            | Home Furnishings     |
> | TX            | Lone Star Furniture  |
> | TX            | Value Furniture      |
> | WA            | Period Furniture     |
> | WA            | Rainier Home         |
>
> **为什么：**先按第一个列排，**第一个列相同的行**再按第二个列排。比如 FL 有 5 位客户，它们之间按名字字母排。

---

## 3. WHERE：只要符合条件的行

WHERE 逐行检查条件，留下条件为 **TRUE** 的行。这一节的 w03、w09、w10 是选择题的高频陷阱。

**w01 · 数值比较**（WHERE 筛选 ●○○）

找出标准价格超过 500 的产品。

提示：`WHERE 列 > 数字`，数字不加引号。

> ```sql
> SELECT ProductID, ProductDescription, ProductStandardPrice
> FROM Product_T
> WHERE ProductStandardPrice > 500
> ORDER BY ProductID;
> ```
>
> **预期：4 行**
>
> | PRODUCTID | PRODUCTDESCRIPTION   | PRODUCTSTANDARDPRICE |
> | --------- | -------------------- | -------------------- |
> | 4         | Entertainment Center | 650                  |
> | 6         | 8-Drawer Desk        | 750                  |
> | 7         | Dining Table         | 800                  |
> | 10        | 4-Drawer Dresser     | 625                  |
>
> **为什么：**WHERE 一行一行地检查条件，只留下条件为 TRUE 的行。比较运算符：`=`、`<>`（不等于，也可写 `!=`）、`>`、`>=`、`<`、`<=`。

**w02 · 文字比较要加单引号**（WHERE 筛选 ●○○）

找出所有佛罗里达州（FL）的客户。

提示：`WHERE CustomerState = 'FL'`

> ```sql
> SELECT CustomerID, CustomerName, CustomerCity
> FROM Customer_T
> WHERE CustomerState = 'FL'
> ORDER BY CustomerID;
> ```
>
> **预期：5 行**
>
> | CUSTOMERID | CUSTOMERNAME         | CUSTOMERCITY |
> | ---------- | -------------------- | ------------ |
> | 1          | Contemporary Casuals | Gainesville  |
> | 9          | M and H Casual Furn  | Clearwater   |
> | 10         | Seminole Interiors   | Tallahassee  |
> | 11         | American Euro Life   | Orlando      |
> | 16         | Sunshine Interiors   | Tampa        |
>
> **为什么：**文字（字符串）要用**单引号** `'FL'`。双引号在 Oracle 里有别的意思（见「会报错吗」一节的 x05）。

**w03 · 大小写敏感**（WHERE 筛选 ●●○）

把上一题的 `'FL'` 改成小写 `'fl'` 再跑一次。会发生什么？

> ```sql
> SELECT CustomerID, CustomerName, CustomerCity
> FROM Customer_T
> WHERE CustomerState = 'fl';
> ```
>
> **预期：0 行（只有表头，没有数据）**
>
> **为什么：****不报错，但一行都没有。** SQL 的关键字和列名不分大小写，但**单引号里的数据**是区分大小写的：表里存的是 `'FL'`，`'fl'` 和它不相等。

**w04 · LIKE：以 Desk 结尾**（WHERE 筛选 ●○○）

找出名称以 Desk 结尾的产品。

提示：模糊匹配用 `LIKE`，通配符 `%`。

> ```sql
> SELECT ProductID, ProductDescription
> FROM Product_T
> WHERE ProductDescription LIKE '%Desk'
> ORDER BY ProductID;
> ```
>
> **预期：4 行**
>
> | PRODUCTID | PRODUCTDESCRIPTION |
> | --------- | ------------------ |
> | 3         | Computer Desk      |
> | 5         | Writers Desk       |
> | 6         | 8-Drawer Desk      |
> | 8         | Computer Desk      |
>
> **为什么：**`%` 代表「任意多个字符（包括 0 个）」。`'%Desk'` = 前面随便、最后是 Desk。

**w05 · LIKE：\_ 只占一个字符**（WHERE 筛选 ●●○）

找出名称形如「一个字符 + -Drawer + 任意内容」的产品（课件 p.30 的例子）。

> ```sql
> SELECT ProductID, ProductDescription
> FROM Product_T
> WHERE ProductDescription LIKE '_-Drawer%'
> ORDER BY ProductID;
> ```
>
> **预期：3 行**
>
> | PRODUCTID | PRODUCTDESCRIPTION |
> | --------- | ------------------ |
> | 6         | 8-Drawer Desk      |
> | 9         | 3-Drawer Chest     |
> | 10        | 4-Drawer Dresser   |
>
> **为什么：**`_` 正好代表**一个**字符。`'_-Drawer%'` 能匹配 `8-Drawer Desk`、`3-Drawer Chest`、`4-Drawer Dresser`，但匹配不到 `10-Drawer …`（开头有两个字符）。

**w06 · IN：在一个列表里**（WHERE 筛选 ●○○）

找出来自 CA、CO 或 WA 的客户。

> ```sql
> SELECT CustomerName, CustomerState
> FROM Customer_T
> WHERE CustomerState IN ('CA', 'CO', 'WA')
> ORDER BY CustomerState, CustomerName;
> ```
>
> **预期：8 行**
>
> | CUSTOMERNAME         | CUSTOMERSTATE |
> | -------------------- | ------------- |
> | California Classics  | CA            |
> | Golden State Designs | CA            |
> | Impressions          | CA            |
> | Furniture Gallery    | CO            |
> | Mountain Scenes      | CO            |
> | Rocky Mountain Furn  | CO            |
> | Period Furniture     | WA            |
> | Rainier Home         | WA            |
>
> **为什么：**`IN (...)` 等价于用 OR 连起来的多个 `=`：`CustomerState = 'CA' OR CustomerState = 'CO' OR CustomerState = 'WA'`，但更短。

**w07 · BETWEEN 包含两端**（WHERE 筛选 ●○○）

找出价格在 200 到 375 之间（含 200 和 375）的产品。

> ```sql
> SELECT ProductID, ProductDescription, ProductStandardPrice
> FROM Product_T
> WHERE ProductStandardPrice BETWEEN 200 AND 375
> ORDER BY ProductStandardPrice;
> ```
>
> **预期：4 行**
>
> | PRODUCTID | PRODUCTDESCRIPTION | PRODUCTSTANDARDPRICE |
> | --------- | ------------------ | -------------------- |
> | 2         | Coffee Table       | 200                  |
> | 8         | Computer Desk      | 250                  |
> | 5         | Writers Desk       | 325                  |
> | 3         | Computer Desk      | 375                  |
>
> **为什么：**`BETWEEN a AND b` **包含两端**，等价于 `>= a AND <= b`。结果里 200 和 375 都在。

**w08 · 找空值：IS NULL**（WHERE 筛选 ●○○）

哪些客户没有填邮编？

提示：判断空值要用 `IS NULL`，不能用 `= NULL`（下一题）。

> ```sql
> SELECT CustomerID, CustomerName, CustomerPostalCode
> FROM Customer_T
> WHERE CustomerPostalCode IS NULL
> ORDER BY CustomerID;
> ```
>
> **预期：4 行**
>
> | CUSTOMERID | CUSTOMERNAME         | CUSTOMERPOSTALCODE |
> | ---------- | -------------------- | ------------------ |
> | 7          | Period Furniture     | (null)             |
> | 13         | Heritage Furnishings | (null)             |
> | 17         | Rocky Mountain Furn  | (null)             |
> | 20         | Rainier Home         | (null)             |
>
> **为什么：**13 和 17 号客户插入时没写邮编这一列，7 和 20 号显式写了 `NULL`——两种写法结果一样，都是空值。

**w09 · 陷阱：= NULL**（WHERE 筛选 ●●○）

把上一题的 `IS NULL` 改成 `= NULL`。

> ```sql
> SELECT CustomerID, CustomerName, CustomerPostalCode
> FROM Customer_T
> WHERE CustomerPostalCode = NULL;
> ```
>
> **预期：0 行（只有表头，没有数据）**
>
> **为什么：****不报错，但返回 0 行。** NULL 表示「未知」，任何值和 NULL 比较的结果都是「未知」（不是 TRUE），WHERE 只留下 TRUE 的行，所以一行都不剩。这是选择题最爱考的点之一。

**w10 · AND / OR 优先级（没括号）**（WHERE 筛选 ●●●）

下面这条查询想找「Cherry 或 Natural Ash 材质、并且价格高于 300」的产品。先猜结果有几行，再运行。

> ```sql
> SELECT ProductID, ProductDescription, ProductFinish, ProductStandardPrice
> FROM Product_T
> WHERE ProductFinish = 'Cherry' OR ProductFinish = 'Natural Ash'
>   AND ProductStandardPrice > 300
> ORDER BY ProductID;
> ```
>
> **预期：5 行**
>
> | PRODUCTID | PRODUCTDESCRIPTION | PRODUCTFINISH | PRODUCTSTANDARDPRICE |
> | --------- | ------------------ | ------------- | -------------------- |
> | 1         | End Table          | Cherry        | 175                  |
> | 3         | Computer Desk      | Natural Ash   | 375                  |
> | 5         | Writers Desk       | Cherry        | 325                  |
> | 7         | Dining Table       | Natural Ash   | 800                  |
> | 9         | 3-Drawer Chest     | Cherry        | 450                  |
>
> **为什么：****AND 比 OR 先算**，所以这条实际是 `Cherry OR (Natural Ash AND > 300)`：所有 Cherry 产品（包括 175 元的 End Table）都进来了，Natural Ash 才受价格限制。和课件 p.31「有括号 vs 没括号」是同一个考点。

**w11 · AND / OR 优先级（加括号）**（WHERE 筛选 ●●●）

加上括号，写出真正想要的意思。

> ```sql
> SELECT ProductID, ProductDescription, ProductFinish, ProductStandardPrice
> FROM Product_T
> WHERE (ProductFinish = 'Cherry' OR ProductFinish = 'Natural Ash')
>   AND ProductStandardPrice > 300
> ORDER BY ProductID;
> ```
>
> **预期：4 行**
>
> | PRODUCTID | PRODUCTDESCRIPTION | PRODUCTFINISH | PRODUCTSTANDARDPRICE |
> | --------- | ------------------ | ------------- | -------------------- |
> | 3         | Computer Desk      | Natural Ash   | 375                  |
> | 5         | Writers Desk       | Cherry        | 325                  |
> | 7         | Dining Table       | Natural Ash   | 800                  |
> | 9         | 3-Drawer Chest     | Cherry        | 450                  |
>
> **为什么：**括号让 OR 先算，价格条件对两种材质都生效：175 元的 End Table 被去掉了。不确定优先级时，**加括号**永远是对的。

**w12 · 日期比较**（WHERE 筛选 ●○○）

找出 2024 年 10 月 22 日之后（不含当天）下的订单。

提示：`WHERE OrderDate > DATE 'YYYY-MM-DD'`

> ```sql
> SELECT OrderID, OrderDate
> FROM Order_T
> WHERE OrderDate > DATE '2024-10-22'
> ORDER BY OrderID;
> ```
>
> **预期：4 行**
>
> | ORDERID | ORDERDATE |
> | ------- | --------- |
> | 1005    | 24-OCT-24 |
> | 1006    | 24-OCT-24 |
> | 1007    | 27-OCT-24 |
> | 1008    | 30-OCT-24 |
>
> 日期列的显示格式由 SQL Developer 的 NLS 设置决定，默认是 `DD-MON-RR`（例如 24-OCT-24）。如果你的设置不同，显示会不一样，但日期本身相同。
>
> **为什么：**`DATE '2024-10-22'` 是 Oracle 的**日期字面量**（date literal），格式固定为 `'YYYY-MM-DD'`。不要直接写 `OrderDate > '2024-10-22'`：那是拿日期和字符串比，能不能成功取决于 NLS 设置。

---

## 4. 计算、别名与函数

SELECT 后面不只能写列名，还能写**表达式**和**函数**，每一行算一次。这些计算只影响显示，**不会改动表里的数据**。

**c01 · SELECT 里做计算**（计算、别名与函数 ●○○）

显示每个产品的编号、原价和涨价 10% 之后的价格。

> ```sql
> SELECT ProductID, ProductStandardPrice, ProductStandardPrice * 1.1
> FROM Product_T
> ORDER BY ProductID;
> ```
>
> **预期：10 行**
>
> | PRODUCTID | PRODUCTSTANDARDPRICE | PRODUCTSTANDARDPRICE\*1.1 |
> | --------- | -------------------- | ------------------------- |
> | 1         | 175                  | 192.5                     |
> | 2         | 200                  | 220                       |
> | 3         | 375                  | 412.5                     |
> | 4         | 650                  | 715                       |
> | 5         | 325                  | 357.5                     |
> | 6         | 750                  | 825                       |
> | 7         | 800                  | 880                       |
> | 8         | 250                  | 275                       |
> | 9         | 450                  | 495                       |
> | 10        | 625                  | 687.5                     |
>
> **为什么：**SELECT 里可以写**表达式**，每一行算一次，不会改动表里的数据。第三列的表头是 Oracle 自动生成的：把表达式转大写并去掉空格，变成 `PRODUCTSTANDARDPRICE*1.1`。

**c02 · 列别名**（计算、别名与函数 ●○○）

同上，但把涨价后的列命名为 Plus10Percent。

> ```sql
> SELECT ProductID, ProductStandardPrice * 1.1 AS Plus10Percent
> FROM Product_T
> ORDER BY ProductID;
> ```
>
> **预期：10 行**
>
> | PRODUCTID | PLUS10PERCENT |
> | --------- | ------------- |
> | 1         | 192.5         |
> | 2         | 220           |
> | 3         | 412.5         |
> | 4         | 715           |
> | 5         | 357.5         |
> | 6         | 825           |
> | 7         | 880           |
> | 8         | 275           |
> | 9         | 495           |
> | 10        | 687.5         |
>
> **为什么：**`AS 别名` 给结果列改名，`AS` 可以省略：`ProductStandardPrice * 1.1 Plus10Percent` 效果一样。表头显示成大写的 `PLUS10PERCENT`；想保留大小写或者别名里有空格，要用**双引号**：`AS "Plus 10%"`。

**c03 · WHERE 用表达式、ORDER BY 用别名**（计算、别名与函数 ●●○）

找出涨价 10% 后超过 300 的产品，按涨价后价格从高到低排（老师 demo 里的例子）。

> ```sql
> SELECT ProductID, ProductStandardPrice * 1.1 AS Plus10Percent
> FROM Product_T
> WHERE ProductStandardPrice * 1.1 > 300
> ORDER BY Plus10Percent DESC;
> ```
>
> **预期：7 行**
>
> | PRODUCTID | PLUS10PERCENT |
> | --------- | ------------- |
> | 7         | 880           |
> | 6         | 825           |
> | 4         | 715           |
> | 10        | 687.5         |
> | 9         | 495           |
> | 3         | 412.5         |
> | 5         | 357.5         |
>
> **为什么：**WHERE 里必须把表达式**重写一遍**，因为 WHERE 在 SELECT 之前执行，那时别名还不存在（直接写别名会报错，见 x01）。ORDER BY 在 SELECT 之后执行，所以可以用别名。

**c04 · ROUND 四舍五入**（计算、别名与函数 ●○○）

打 85 折之后的价格保留 1 位小数，命名为 SalePrice。

> ```sql
> SELECT ProductID, ProductStandardPrice, ROUND(ProductStandardPrice * 0.85, 1) AS SalePrice
> FROM Product_T
> ORDER BY ProductID;
> ```
>
> **预期：10 行**
>
> | PRODUCTID | PRODUCTSTANDARDPRICE | SALEPRICE |
> | --------- | -------------------- | --------- |
> | 1         | 175                  | 148.8     |
> | 2         | 200                  | 170       |
> | 3         | 375                  | 318.8     |
> | 4         | 650                  | 552.5     |
> | 5         | 325                  | 276.3     |
> | 6         | 750                  | 637.5     |
> | 7         | 800                  | 680       |
> | 8         | 250                  | 212.5     |
> | 9         | 450                  | 382.5     |
> | 10        | 625                  | 531.3     |
>
> **为什么：**`ROUND(数, 位数)`：位数是 1 就保留 1 位小数，0 或不写就取整。Oracle 显示数字时会去掉末尾的 0，所以 148.75 → 148.8，而 170 显示为 `170` 而不是 `170.0`。

**c05 · 拼接文字：||**（计算、别名与函数 ●●○）

把城市和州拼成「城市, 州」的形式，命名为 Location。

> ```sql
> SELECT CustomerName, CustomerCity || ', ' || CustomerState AS Location
> FROM Customer_T
> WHERE CustomerID <= 5
> ORDER BY CustomerID;
> ```
>
> **预期：5 行**
>
> | CUSTOMERNAME         | LOCATION        |
> | -------------------- | --------------- |
> | Contemporary Casuals | Gainesville, FL |
> | Value Furniture      | Plano, TX       |
> | Home Furnishings     | Albany, NY      |
> | Eastern Furniture    | Carteret, NJ    |
> | Impressions          | Sacramento, CA  |
>
> **为什么：**Oracle 用 `||` 连接字符串（不是 `+`）。中间的 `', '` 是一段普通文字。

**c06 · 日期函数**（计算、别名与函数 ●●●）

对每张订单，显示下单日期、两个月后的日期，以及下单之后的第一个星期四。

> ```sql
> SELECT OrderID, OrderDate,
>        ADD_MONTHS(OrderDate, 2) AS TwoMonthsLater,
>        NEXT_DAY(OrderDate, 'THURSDAY') AS NextThursday
> FROM Order_T
> ORDER BY OrderID;
> ```
>
> **预期：8 行**
>
> | ORDERID | ORDERDATE | TWOMONTHSLATER | NEXTTHURSDAY |
> | ------- | --------- | -------------- | ------------ |
> | 1001    | 21-OCT-24 | 21-DEC-24      | 24-OCT-24    |
> | 1002    | 21-OCT-24 | 21-DEC-24      | 24-OCT-24    |
> | 1003    | 22-OCT-24 | 22-DEC-24      | 24-OCT-24    |
> | 1004    | 22-OCT-24 | 22-DEC-24      | 24-OCT-24    |
> | 1005    | 24-OCT-24 | 24-DEC-24      | 31-OCT-24    |
> | 1006    | 24-OCT-24 | 24-DEC-24      | 31-OCT-24    |
> | 1007    | 27-OCT-24 | 27-DEC-24      | 31-OCT-24    |
> | 1008    | 30-OCT-24 | 30-DEC-24      | 31-OCT-24    |
>
> 这里的日期按 SQL Developer 默认的 DD-MON-RR 格式显示。
>
> **为什么：**`NEXT_DAY` 返回**严格之后**的那个星期几：1005 号订单本身就是星期四（24-OCT-24），结果是下一个星期四 31-OCT-24。老师 demo 里写的是 `NEXT_DAY(OrderDate, 5)`，用数字表示星期几——数字对应哪一天取决于 NLS\_TERRITORY 设置（美国区 1 = 星期日，5 = 星期四），所以这里用英文星期名更稳。如果你的 SQL Developer 是中文界面，`'THURSDAY'` 可能报 ORA-01846，改用 `'星期四'` 或数字 5。

**c07 · 控制日期显示格式：TO\_CHAR**（计算、别名与函数 ●●○）

把下单日期显示成 2024-10-21 这种格式，命名为 OrderDay。

> ```sql
> SELECT OrderID, TO_CHAR(OrderDate, 'YYYY-MM-DD') AS OrderDay
> FROM Order_T
> ORDER BY OrderID;
> ```
>
> **预期：8 行**
>
> | ORDERID | ORDERDAY   |
> | ------- | ---------- |
> | 1001    | 2024-10-21 |
> | 1002    | 2024-10-21 |
> | 1003    | 2024-10-22 |
> | 1004    | 2024-10-22 |
> | 1005    | 2024-10-24 |
> | 1006    | 2024-10-24 |
> | 1007    | 2024-10-27 |
> | 1008    | 2024-10-30 |
>
> **为什么：**`TO_CHAR(日期, '格式')` 把日期转成指定格式的文字，不受 NLS 设置影响。常用格式：`YYYY` 四位年、`MM` 月、`DD` 日、`DY` 星期缩写。

---

## 5. 聚合与分组：COUNT / SUM / AVG、GROUP BY、HAVING

聚合函数把很多行压成一个值；GROUP BY 先分组，再每组压一次。记住执行顺序：**FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY**。

**a01 · 数行数：COUNT(\*)**（聚合与分组 ●○○）

Customer\_T 一共有多少位客户？

> ```sql
> SELECT COUNT(*)
> FROM Customer_T;
> ```
>
> **预期：1 行**
>
> | COUNT(\*) |
> | --------- |
> | 20        |
>
> **为什么：**聚合函数（aggregate function）把很多行**压成一个值**。`COUNT(*)` 数的是行数。

**a02 · COUNT(列) 跳过 NULL**（聚合与分组 ●●○）

数一数有多少位客户填了邮编。

> ```sql
> SELECT COUNT(CustomerPostalCode)
> FROM Customer_T;
> ```
>
> **预期：1 行**
>
> | COUNT(CUSTOMERPOSTALCODE) |
> | ------------------------- |
> | 16                        |
>
> **为什么：**`COUNT(列)` 只数**这一列不是 NULL** 的行：20 位客户里有 4 位邮编为空，所以是 16。`COUNT(*)` 和 `COUNT(列)` 的区别是常考点。

**a03 · 多个聚合一起算**（聚合与分组 ●○○）

价格低于 275 的产品有几个、平均价格是多少（保留 2 位小数）？

> ```sql
> SELECT COUNT(*), ROUND(AVG(ProductStandardPrice), 2) AS AvgPrice
> FROM Product_T
> WHERE ProductStandardPrice < 275;
> ```
>
> **预期：1 行**
>
> | COUNT(\*) | AVGPRICE |
> | --------- | -------- |
> | 3         | 208.33   |
>
> **为什么：**先 WHERE 筛出 175、200、250 三个产品，再对这 3 行算聚合。老师 demo 里没有 ROUND，Oracle 会显示 `208.333333…`（一长串 3），这是正常的。

**a04 · MIN / MAX / SUM**（聚合与分组 ●○○）

所有产品里最低价、最高价、价格总和分别是多少？

> ```sql
> SELECT MIN(ProductStandardPrice) AS Cheapest,
>        MAX(ProductStandardPrice) AS Priciest,
>        SUM(ProductStandardPrice) AS Total
> FROM Product_T;
> ```
>
> **预期：1 行**
>
> | CHEAPEST | PRICIEST | TOTAL |
> | -------- | -------- | ----- |
> | 175      | 800      | 4600  |
>
> **为什么：**五个常用聚合函数：`COUNT`、`SUM`、`AVG`、`MIN`、`MAX`。除了 `COUNT(*)`，它们都会**忽略 NULL**。

**a05 · 分组：GROUP BY**（聚合与分组 ●○○）

每个州各有几位客户？按人数从多到少排，人数相同按州名排。

> ```sql
> SELECT CustomerState, COUNT(*) AS NumCustomers
> FROM Customer_T
> GROUP BY CustomerState
> ORDER BY NumCustomers DESC, CustomerState;
> ```
>
> **预期：10 行**
>
> | CUSTOMERSTATE | NUMCUSTOMERS |
> | ------------- | ------------ |
> | FL            | 5            |
> | CA            | 3            |
> | CO            | 3            |
> | TX            | 2            |
> | WA            | 2            |
> | HI            | 1            |
> | MI            | 1            |
> | MN            | 1            |
> | NJ            | 1            |
> | NY            | 1            |
>
> **为什么：**`GROUP BY CustomerState` 把州相同的行分成一组，每组算一次 `COUNT(*)`，每组输出**一行**。所以 SELECT 里只能出现：分组的列，或者聚合函数。

**a06 · 筛选分组：HAVING**（聚合与分组 ●○○）

只列出客户超过 1 位的州。

> ```sql
> SELECT CustomerState, COUNT(*)
> FROM Customer_T
> GROUP BY CustomerState
> HAVING COUNT(*) > 1
> ORDER BY CustomerState;
> ```
>
> **预期：5 行**
>
> | CUSTOMERSTATE | COUNT(\*) |
> | ------------- | --------- |
> | CA            | 3         |
> | CO            | 3         |
> | FL            | 5         |
> | TX            | 2         |
> | WA            | 2         |
>
> **为什么：****WHERE 筛行，HAVING 筛组。** HAVING 在分组之后执行，所以条件里可以用聚合函数；WHERE 不行（见 x04）。

**a07 · 按两列分组**（聚合与分组 ●●○）

按「州 + 城市」统计客户数（老师 demo 的例子），按州、城市排序。

> ```sql
> SELECT CustomerState, CustomerCity, COUNT(*)
> FROM Customer_T
> GROUP BY CustomerState, CustomerCity
> ORDER BY CustomerState, CustomerCity;
> ```
>
> **预期：16 行**
>
> | CUSTOMERSTATE | CUSTOMERCITY | COUNT(\*) |
> | ------------- | ------------ | --------- |
> | CA            | Sacramento   | 2         |
> | CA            | Santa Clara  | 1         |
> | CO            | Boulder      | 2         |
> | CO            | Denver       | 1         |
> | FL            | Clearwater   | 1         |
> | FL            | Gainesville  | 1         |
> | FL            | Orlando      | 1         |
> | FL            | Tallahassee  | 1         |
> | FL            | Tampa        | 1         |
> | HI            | Kaneohe      | 1         |
> | MI            | Battle Creek | 1         |
> | MN            | Duluth       | 1         |
> | NJ            | Carteret     | 1         |
> | NY            | Albany       | 1         |
> | TX            | Plano        | 2         |
> | WA            | Seattle      | 2         |
>
> **为什么：**两列都相同才算同一组。对比 b04：行数一样（16 行），因为这里的分组方式和 `DISTINCT CustomerState, CustomerCity` 完全相同，只是多了一列计数。

**a08 · 每种材质的统计**（聚合与分组 ●●○）

每种材质（ProductFinish）有几个产品、平均价格多少（取整）？按材质名排序。

> ```sql
> SELECT ProductFinish, COUNT(*) AS NumProducts, ROUND(AVG(ProductStandardPrice)) AS AvgPrice
> FROM Product_T
> GROUP BY ProductFinish
> ORDER BY ProductFinish;
> ```
>
> **预期：6 行**
>
> | PRODUCTFINISH | NUMPRODUCTS | AVGPRICE |
> | ------------- | ----------- | -------- |
> | Cherry        | 3           | 317      |
> | Natural Ash   | 3           | 458      |
> | Natural Maple | 1           | 650      |
> | Natural Oak   | 1           | 625      |
> | Walnut        | 1           | 250      |
> | White Ash     | 1           | 750      |
>
> **为什么：**`ROUND(x)` 不写位数就是取整。Natural Ash 的三个产品是 200、375、800，平均 458.33 → 458。

**a09 · WHERE + GROUP BY + HAVING + ORDER BY**（聚合与分组 ●●●）

只看价格不低于 200 的产品：按产品线（ProductLineID）分组，留下至少有 2 个产品的产品线，显示产品数和平均价，按平均价从高到低排。

> ```sql
> SELECT ProductLineID, COUNT(*) AS NumProducts, AVG(ProductStandardPrice) AS AvgPrice
> FROM Product_T
> WHERE ProductStandardPrice >= 200
> GROUP BY ProductLineID
> HAVING COUNT(*) >= 2
> ORDER BY AvgPrice DESC;
> ```
>
> **预期：3 行**
>
> | PRODUCTLINEID | NUMPRODUCTS | AVGPRICE |
> | ------------- | ----------- | -------- |
> | 2             | 5           | 550      |
> | 3             | 2           | 450      |
> | 1             | 2           | 387.5    |
>
> **为什么：**按逻辑执行顺序走一遍：**FROM** 10 个产品 → **WHERE** 去掉 175 元的 End Table（9 个）→ **GROUP BY** 分成 3 条产品线 → **HAVING** 产品线 1 只剩 Writers Desk 和 3-Drawer Chest，正好 2 个，留下 → **SELECT** 算平均 → **ORDER BY** 用别名排序。

---

## 6. 多表 JOIN

一张表只存一类东西（客户、订单、产品），要把它们拼在一起看，就要用**外键 = 主键**把表连起来。

**j01 · 订单配上客户名字**（多表 JOIN ●○○）

列出每张订单的编号、日期和下单客户的名字。

提示：`FROM 表1 别名 JOIN 表2 别名 ON 别名.列 = 别名.列`

> ```sql
> SELECT o.OrderID, o.OrderDate, c.CustomerName
> FROM Order_T o
>   JOIN Customer_T c ON o.CustomerID = c.CustomerID
> ORDER BY o.OrderID;
> ```
>
> **预期：8 行**
>
> | ORDERID | ORDERDATE | CUSTOMERNAME         |
> | ------- | --------- | -------------------- |
> | 1001    | 21-OCT-24 | Contemporary Casuals |
> | 1002    | 21-OCT-24 | California Classics  |
> | 1003    | 22-OCT-24 | Mountain Scenes      |
> | 1004    | 22-OCT-24 | Impressions          |
> | 1005    | 24-OCT-24 | Home Furnishings     |
> | 1006    | 24-OCT-24 | Value Furniture      |
> | 1007    | 27-OCT-24 | Seminole Interiors   |
> | 1008    | 30-OCT-24 | Battle Creek Furn    |
>
> **为什么：**Order\_T 里只有 CustomerID（外键），名字在 Customer\_T 里。`JOIN … ON 外键 = 主键` 把两张表按客户编号拼成一行。`o`、`c` 是**表别名**，Oracle 里表别名前面**不能**加 `AS`。

**j02 · 老式写法：逗号 + WHERE**（多表 JOIN ●●○）

用 `FROM 表1, 表2 WHERE …` 的写法写出上一题，结果应该完全一样。

> ```sql
> SELECT o.OrderID, o.OrderDate, c.CustomerName
> FROM Order_T o, Customer_T c
> WHERE o.CustomerID = c.CustomerID
> ORDER BY o.OrderID;
> ```
>
> **预期：8 行**
>
> | ORDERID | ORDERDATE | CUSTOMERNAME         |
> | ------- | --------- | -------------------- |
> | 1001    | 21-OCT-24 | Contemporary Casuals |
> | 1002    | 21-OCT-24 | California Classics  |
> | 1003    | 22-OCT-24 | Mountain Scenes      |
> | 1004    | 22-OCT-24 | Impressions          |
> | 1005    | 24-OCT-24 | Home Furnishings     |
> | 1006    | 24-OCT-24 | Value Furniture      |
> | 1007    | 27-OCT-24 | Seminole Interiors   |
> | 1008    | 30-OCT-24 | Battle Creek Furn    |
>
> **为什么：**这是 SQL-89 的写法，考试和老代码里都会见到。两种写法对 inner join 来说结果一样；推荐用 `JOIN … ON`，连接条件和筛选条件分得清楚。

**j03 · 忘了写连接条件**（多表 JOIN ●●○）

把上一题的 WHERE 删掉。结果有几行？

> ```sql
> SELECT o.OrderID, c.CustomerName
> FROM Order_T o, Customer_T c;
> ```
>
> **预期：160 行（只看行数）**
>
> **为什么：****8 张订单 × 20 位客户 = 160 行**，每张订单和每位客户都配了一次，叫**笛卡尔积**（Cartesian product）。不报错，但结果是错的——行数突然变得很多时，先检查是不是漏了连接条件。

**j04 · LEFT OUTER JOIN：保留所有客户**（多表 JOIN ●●○）

列出所有客户以及他们的订单编号；没下过单的客户也要出现。

> ```sql
> SELECT c.CustomerID, c.CustomerName, o.OrderID
> FROM Customer_T c
>   LEFT OUTER JOIN Order_T o ON c.CustomerID = o.CustomerID
> ORDER BY c.CustomerID;
> ```
>
> **预期：20 行**
>
> | CUSTOMERID | CUSTOMERNAME         | ORDERID |
> | ---------- | -------------------- | ------- |
> | 1          | Contemporary Casuals | 1001    |
> | 2          | Value Furniture      | 1006    |
> | 3          | Home Furnishings     | 1005    |
> | 4          | Eastern Furniture    | (null)  |
> | 5          | Impressions          | 1004    |
> | 6          | Furniture Gallery    | (null)  |
> | 7          | Period Furniture     | (null)  |
> | 8          | California Classics  | 1002    |
> | 9          | M and H Casual Furn  | (null)  |
> | 10         | Seminole Interiors   | 1007    |
> | 11         | American Euro Life   | (null)  |
> | 12         | Battle Creek Furn    | 1008    |
> | 13         | Heritage Furnishings | (null)  |
> | 14         | Kaneohe Homes        | (null)  |
> | 15         | Mountain Scenes      | 1003    |
> | 16         | Sunshine Interiors   | (null)  |
> | 17         | Rocky Mountain Furn  | (null)  |
> | 18         | Golden State Designs | (null)  |
> | 19         | Lone Star Furniture  | (null)  |
> | 20         | Rainier Home         | (null)  |
>
> **为什么：**LEFT JOIN 保留**左边表的所有行**，右边配不上的地方补 NULL。8 张订单分别属于 8 位不同的客户，所以结果是 8 行有订单 + 12 行 `(null)` = 20 行。`OUTER` 可以省略。

**j05 · 从没下过单的客户**（多表 JOIN ●●●）

只列出从来没下过订单的客户。

> ```sql
> SELECT c.CustomerID, c.CustomerName
> FROM Customer_T c
>   LEFT JOIN Order_T o ON c.CustomerID = o.CustomerID
> WHERE o.OrderID IS NULL
> ORDER BY c.CustomerID;
> ```
>
> **预期：12 行**
>
> | CUSTOMERID | CUSTOMERNAME         |
> | ---------- | -------------------- |
> | 4          | Eastern Furniture    |
> | 6          | Furniture Gallery    |
> | 7          | Period Furniture     |
> | 9          | M and H Casual Furn  |
> | 11         | American Euro Life   |
> | 13         | Heritage Furnishings |
> | 14         | Kaneohe Homes        |
> | 16         | Sunshine Interiors   |
> | 17         | Rocky Mountain Furn  |
> | 18         | Golden State Designs |
> | 19         | Lone Star Furniture  |
> | 20         | Rainier Home         |
>
> **为什么：**套路：**LEFT JOIN + 右边主键 IS NULL** = 「左边有、右边没有」的行。这是外连接最常见的用法。

**j06 · 订单明细：三张表**（多表 JOIN ●●○）

列出订单 1001 买了哪些产品：产品名、数量、单价，以及小计（数量 × 单价，命名为 LineTotal）。

> ```sql
> SELECT p.ProductDescription, ol.OrderedQuantity, p.ProductStandardPrice,
>        ol.OrderedQuantity * p.ProductStandardPrice AS LineTotal
> FROM OrderLine_T ol
>   JOIN Product_T p ON ol.ProductID = p.ProductID
> WHERE ol.OrderID = 1001
> ORDER BY p.ProductID;
> ```
>
> **预期：3 行**
>
> | PRODUCTDESCRIPTION   | ORDEREDQUANTITY | PRODUCTSTANDARDPRICE | LINETOTAL |
> | -------------------- | --------------- | -------------------- | --------- |
> | End Table            | 2               | 175                  | 350       |
> | Coffee Table         | 2               | 200                  | 400       |
> | Entertainment Center | 1               | 650                  | 650       |
>
> **为什么：**OrderLine\_T 是订单和产品之间的**关联表**（多对多关系拆出来的表），它的每一行是「某张订单里的某个产品买了几个」。产品名和价格要 join Product\_T 才能拿到。

**j07 · 每张订单的总金额：四张表**（多表 JOIN ●●●）

每张订单的客户名和订单总金额（Σ 数量 × 单价，命名为 OrderTotal），按订单号排序。

> ```sql
> SELECT o.OrderID, c.CustomerName,
>        SUM(ol.OrderedQuantity * p.ProductStandardPrice) AS OrderTotal
> FROM Order_T o
>   JOIN Customer_T c   ON o.CustomerID = c.CustomerID
>   JOIN OrderLine_T ol ON o.OrderID = ol.OrderID
>   JOIN Product_T p    ON ol.ProductID = p.ProductID
> GROUP BY o.OrderID, c.CustomerName
> ORDER BY o.OrderID;
> ```
>
> **预期：8 行**
>
> | ORDERID | CUSTOMERNAME         | ORDERTOTAL |
> | ------- | -------------------- | ---------- |
> | 1001    | Contemporary Casuals | 1400       |
> | 1002    | California Classics  | 2525       |
> | 1003    | Mountain Scenes      | 1300       |
> | 1004    | Impressions          | 2000       |
> | 1005    | Home Furnishings     | 2800       |
> | 1006    | Value Furniture      | 1550       |
> | 1007    | Seminole Interiors   | 750        |
> | 1008    | Battle Creek Furn    | 2425       |
>
> **为什么：**四张表 join 成「每个订单行一行」，再按订单分组求和。`c.CustomerName` 必须写进 GROUP BY，否则报 ORA-00979（见 x03）——虽然一张订单只有一个客户，Oracle 也不会帮你推断。

**j08 · 从没卖出去的产品**（多表 JOIN ●●●）

哪些产品从来没有出现在任何订单里？

> ```sql
> SELECT p.ProductID, p.ProductDescription
> FROM Product_T p
>   LEFT JOIN OrderLine_T ol ON p.ProductID = ol.ProductID
> WHERE ol.OrderID IS NULL
> ORDER BY p.ProductID;
> ```
>
> **预期：3 行**
>
> | PRODUCTID | PRODUCTDESCRIPTION |
> | --------- | ------------------ |
> | 7         | Dining Table       |
> | 9         | 3-Drawer Chest     |
> | 10        | 4-Drawer Dresser   |
>
> **为什么：**和 j05 是同一个套路，换了两张表。

---

## 7. 会报错吗？

这一节每道题都**先猜**：会不会报错？报什么？然后再运行。考试是选择题，「下面哪条语句会报错」是最常见的题型之一。x09 是反过来的陷阱：看起来写错了，却不报错。

**x01 · WHERE 里用列别名**（会报错吗 ●●○）

这条会报错吗？

> ```sql
> SELECT ProductID, ProductStandardPrice * 1.1 AS Plus10Percent
> FROM Product_T
> WHERE Plus10Percent > 300;
> ```
>
> **预期报错：**`ORA-00904: "PLUS10PERCENT": invalid identifier`
>
> **为什么：****invalid identifier = 找不到这个名字。** WHERE 执行的时候 SELECT 还没执行，别名 Plus10Percent 还不存在。正确写法见 c03。

**x02 · 聚合和普通列混用，没有 GROUP BY**（会报错吗 ●●○）

这条会报错吗？

> ```sql
> SELECT CustomerState, COUNT(*)
> FROM Customer_T;
> ```
>
> **预期报错：**`ORA-00937: not a single-group group function`
>
> **为什么：**`COUNT(*)` 把 20 行压成 1 行，但 CustomerState 有 20 个值，放不进一行。要么去掉 CustomerState，要么加 `GROUP BY CustomerState`（见 a05）。

**x03 · SELECT 的列不在 GROUP BY 里**（会报错吗 ●●○）

这条会报错吗？

> ```sql
> SELECT CustomerState, CustomerCity, COUNT(*)
> FROM Customer_T
> GROUP BY CustomerState;
> ```
>
> **预期报错：**`ORA-00979: not a GROUP BY expression`
>
> **为什么：**按州分组后每个州输出一行，但同一个州有好几个城市（比如 FL 有 5 个），CustomerCity 不知道该显示哪个。**规则：SELECT 里的非聚合列都必须出现在 GROUP BY 里。**

**x04 · WHERE 里用聚合函数**（会报错吗 ●●○）

这条会报错吗？

> ```sql
> SELECT CustomerState, COUNT(*)
> FROM Customer_T
> WHERE COUNT(*) > 1
> GROUP BY CustomerState;
> ```
>
> **预期报错：**`ORA-00934: group function is not allowed here`
>
> **为什么：**WHERE 在分组之前执行，那时还没有「组」，没法 COUNT。对分组的筛选要写在 HAVING 里（见 a06）。

**x05 · 字符串用了双引号**（会报错吗 ●○○）

这条会报错吗？

> ```sql
> SELECT CustomerName
> FROM Customer_T
> WHERE CustomerState = "FL";
> ```
>
> **预期报错：**`ORA-00904: "FL": invalid identifier`
>
> **为什么：**Oracle 里**双引号包的是名字**（列名、表名、别名），**单引号包的才是文字**。`"FL"` 被当成一个叫 FL 的列，找不到就报 invalid identifier。不加引号写 `= FL` 也是同样的错误。

**x06 · 表别名加 AS**（会报错吗 ●●○）

这条会报错吗？

> ```sql
> SELECT c.CustomerName, o.OrderID
> FROM Customer_T AS c
>   JOIN Order_T AS o ON c.CustomerID = o.CustomerID;
> ```
>
> **预期报错：**`ORA-00933: SQL command not properly ended`
>
> **为什么：**Oracle 里**表别名前面不能写 AS**（列别名可以）。这是 Oracle 和 MySQL、PostgreSQL 等其他数据库不一样的地方，课件 p.46 特别强调过。

**x07 · 两张表都有的列名没写前缀**（会报错吗 ●●○）

这条会报错吗？

> ```sql
> SELECT CustomerID, OrderID
> FROM Customer_T c
>   JOIN Order_T o ON c.CustomerID = o.CustomerID;
> ```
>
> **预期报错：**`ORA-00918: column ambiguously defined`
>
> **为什么：**Customer\_T 和 Order\_T 都有 CustomerID，Oracle 不知道你要哪一个。写成 `c.CustomerID`（或 `o.CustomerID`）就好。OrderID 只在 Order\_T 里有，所以不用前缀也行。（23ai 的报错信息更长，会写明出现在哪两张表里。）

**x08 · 表名拼错**（会报错吗 ●○○）

这条会报错吗？

> ```sql
> SELECT * FROM Customers_T;
> ```
>
> **预期报错：**`ORA-00942: table or view does not exist`
>
> **为什么：**多了一个 s。ORA-00942 的另一个常见原因是：表建在别人的账号下（比如共用账号 isom5260），你用自己的账号连上去，自然看不到。

**x09 · 陷阱：少了一个逗号**（会报错吗 ●●●）

这条会报错吗？结果有几列？

> ```sql
> SELECT CustomerName CustomerCity
> FROM Customer_T
> WHERE CustomerID <= 3
> ORDER BY CustomerID;
> ```
>
> **预期：3 行**
>
> | CUSTOMERCITY         |
> | -------------------- |
> | Contemporary Casuals |
> | Value Furniture      |
> | Home Furnishings     |
>
> **为什么：****不报错！** 少了逗号，`CustomerCity` 被当成了 CustomerName 的**列别名**（AS 可以省略）。结果只有 1 列，表头叫 CUSTOMERCITY，内容却是客户名字。这种错误最难发现。

---

## 8. 改数据：INSERT / UPDATE / DELETE 与事务

> **⚠️ 这一节按顺序做，中途不要 COMMIT**
>
> d01–d10 会插入、修改数据，并且故意触发各种约束错误；最后 d11 用 **ROLLBACK** 把所有修改撤销。只要中途没有 COMMIT、也没有执行 CREATE / ALTER / DROP（它们会自动提交），数据就能完全恢复。万一恢复不了，重跑初始化脚本即可。

**d01 · INSERT：插入一行**（改数据与事务 ●○○）

新增一位客户：编号 21，Pacific Living，地址 88 Ocean Dr，城市 Honolulu，州 HI，邮编 96815-0000。然后查出来看看。

提示：`INSERT INTO 表 VALUES (值1, 值2, …);`

> ```sql
> INSERT INTO Customer_T
> VALUES (21, 'Pacific Living', '88 Ocean Dr', 'Honolulu', 'HI', '96815-0000');
> ```
>
> **第 1 步 · 预期：1 row inserted.**
>
> ```sql
> SELECT * FROM Customer_T WHERE CustomerID = 21;
> ```
>
> **第 2 步 · 预期：1 行**
>
> | CUSTOMERID | CUSTOMERNAME   | CUSTOMERADDRESS | CUSTOMERCITY | CUSTOMERSTATE | CUSTOMERPOSTALCODE |
> | ---------- | -------------- | --------------- | ------------ | ------------- | ------------------ |
> | 21         | Pacific Living | 88 Ocean Dr     | Honolulu     | HI            | 96815-0000         |
>
> **为什么：**不写列名时，VALUES 必须按**建表时的列顺序**给出**所有列**的值。这一节的修改最后都会用 ROLLBACK 撤销（d11），所以先**不要** COMMIT。

**d02 · INSERT：只给部分列**（改数据与事务 ●○○）

再新增客户 22，Desert Rose，州 AZ，只知道名字和州。

> ```sql
> INSERT INTO Customer_T (CustomerID, CustomerName, CustomerState)
> VALUES (22, 'Desert Rose', 'AZ');
> ```
>
> **第 1 步 · 预期：1 row inserted.**
>
> ```sql
> SELECT * FROM Customer_T WHERE CustomerID = 22;
> ```
>
> **第 2 步 · 预期：1 行**
>
> | CUSTOMERID | CUSTOMERNAME | CUSTOMERADDRESS | CUSTOMERCITY | CUSTOMERSTATE | CUSTOMERPOSTALCODE |
> | ---------- | ------------ | --------------- | ------------ | ------------- | ------------------ |
> | 22         | Desert Rose  | (null)          | (null)       | AZ            | (null)             |
>
> **为什么：**列出要插入的列，其余列自动变成 NULL（或者建表时设的 DEFAULT 值）。没写的列如果是 NOT NULL 且没有 DEFAULT，就会报错（下一题）。

d03–d07 每题都会违反一种约束。数据库替你守住了数据的正确性——这就是第 5 周讲的 PRIMARY KEY、NOT NULL、CHECK、FOREIGN KEY 的实际作用。

**d03 · 违反约束（1）：主键重复**（改数据与事务 ●●○）

再插入一位编号为 1 的客户。

> ```sql
> INSERT INTO Customer_T (CustomerID, CustomerName)
> VALUES (1, 'Duplicate Furniture');
> ```
>
> **预期报错：**`ORA-00001: unique constraint (<你的用户名>.CUSTOMER_PK) violated`
>
> **为什么：**主键不能重复。报错信息里的 CUSTOMER\_PK 就是建表时 `CONSTRAINT Customer_PK PRIMARY KEY` 起的名字——**给约束起名字**的好处就是报错时一眼知道是哪条规则。

**d04 · 违反约束（2）：NOT NULL**（改数据与事务 ●●○）

插入一位没有名字的客户。

> ```sql
> INSERT INTO Customer_T (CustomerID, CustomerCity)
> VALUES (23, 'Austin');
> ```
>
> **预期报错：**`ORA-01400: cannot insert NULL into ("<你的用户名>"."CUSTOMER_T"."CUSTOMERNAME")`
>
> **为什么：**CustomerName 建表时是 `NOT NULL`，没给值就会变成 NULL，于是报错。

**d05 · 违反约束（3）：长度超出**（改数据与事务 ●●○）

把州写成三个字母 'TEX'。

> ```sql
> INSERT INTO Customer_T (CustomerID, CustomerName, CustomerState)
> VALUES (23, 'Big Sky Furniture', 'TEX');
> ```
>
> **预期报错：**`ORA-12899: value too large for column "<你的用户名>"."CUSTOMER_T"."CUSTOMERSTATE" (actual: 3, maximum: 2)`
>
> **为什么：**CustomerState 是 `CHAR(2)`，最多 2 个字符。数据类型本身就是一种约束。

**d06 · 违反约束（4）：CHECK**（改数据与事务 ●●○）

新增一个材质为 Pine（松木）的产品。

> ```sql
> INSERT INTO Product_T
> VALUES (11, 'Bookshelf', 'Pine', 300, 1);
> ```
>
> **预期报错：**`ORA-02290: check constraint (<你的用户名>.PRODUCT_FINISH_CHK) violated`
>
> **为什么：**Product\_T 的 CHECK 约束只允许 7 种材质，Pine 不在列表里。

**d07 · 违反约束（5）：外键找不到「父」**（改数据与事务 ●●○）

给一个不存在的客户（编号 99）下一张订单。

> ```sql
> INSERT INTO Order_T
> VALUES (1009, DATE '2024-11-01', 99);
> ```
>
> **预期报错：**`ORA-02291: integrity constraint (<你的用户名>.ORDER_FK) violated - parent key not found`
>
> **为什么：****参照完整性**（referential integrity）：外键的值必须在被参照的表里存在（或者为 NULL）。Customer\_T 里没有 99 号客户。

**d08 · UPDATE：改指定的行**（改数据与事务 ●●○）

所有 Cherry 材质的产品涨价 10%，然后查看结果。

> ```sql
> UPDATE Product_T
> SET ProductStandardPrice = ProductStandardPrice * 1.1
> WHERE ProductFinish = 'Cherry';
> ```
>
> **第 1 步 · 预期：3 rows updated.**
>
> ```sql
> SELECT ProductID, ProductDescription, ProductStandardPrice
> FROM Product_T
> WHERE ProductFinish = 'Cherry'
> ORDER BY ProductID;
> ```
>
> **第 2 步 · 预期：3 行**
>
> | PRODUCTID | PRODUCTDESCRIPTION | PRODUCTSTANDARDPRICE |
> | --------- | ------------------ | -------------------- |
> | 1         | End Table          | 192.5                |
> | 5         | Writers Desk       | 357.5                |
> | 9         | 3-Drawer Chest     | 495                  |
>
> **为什么：**`SET 列 = 新值`，新值可以用这一列原来的值来算。WHERE 决定改哪些行。

**d09 · UPDATE 忘了 WHERE**（改数据与事务 ●●○）

Lab 6 的问题：如果 UPDATE 不写 WHERE 会怎样？（这一题会改动所有产品，下一节会撤销。）

> ```sql
> UPDATE Product_T
> SET ProductStandardPrice = 100;
> ```
>
> **第 1 步 · 预期：10 rows updated.**
>
> ```sql
> SELECT ProductID, ProductStandardPrice FROM Product_T ORDER BY ProductID;
> ```
>
> **第 2 步 · 预期：10 行**
>
> | PRODUCTID | PRODUCTSTANDARDPRICE |
> | --------- | -------------------- |
> | 1         | 100                  |
> | 2         | 100                  |
> | 3         | 100                  |
> | 4         | 100                  |
> | 5         | 100                  |
> | 6         | 100                  |
> | 7         | 100                  |
> | 8         | 100                  |
> | 9         | 100                  |
> | 10        | 100                  |
>
> **为什么：****整张表的每一行都被改了。** UPDATE 和 DELETE 不写 WHERE = 作用于全表。工作中这是真正的事故，所以执行前先用同样的 WHERE 跑一次 SELECT，确认会改哪些行。

**d10 · DELETE：被引用的行删不掉**（改数据与事务 ●●●）

删除 1 号客户。

> ```sql
> DELETE FROM Customer_T
> WHERE CustomerID = 1;
> ```
>
> **预期报错：**`ORA-02292: integrity constraint (<你的用户名>.ORDER_FK) violated - child record found`
>
> **为什么：**1 号客户下过订单 1001，Order\_T 里有行引用它（「子记录」）。删掉的话那张订单就指向一个不存在的客户，所以 Oracle 拒绝。要删得先删订单，或者建外键时加 `ON DELETE CASCADE`。

**d11 · ROLLBACK：撤销还没提交的修改**（改数据与事务 ●●○）

撤销这一节做过的所有修改，然后确认数据恢复了。

> ```sql
> ROLLBACK;
> ```
>
> **第 1 步 · 预期：Rollback complete.**
>
> ```sql
> SELECT COUNT(*) FROM Customer_T;
> ```
>
> **第 2 步 · 预期：1 行**
>
> | COUNT(\*) |
> | --------- |
> | 20        |
>
> ```sql
> SELECT ProductID, ProductStandardPrice FROM Product_T ORDER BY ProductID;
> ```
>
> **第 3 步 · 预期：10 行**
>
> | PRODUCTID | PRODUCTSTANDARDPRICE |
> | --------- | -------------------- |
> | 1         | 175                  |
> | 2         | 200                  |
> | 3         | 375                  |
> | 4         | 650                  |
> | 5         | 325                  |
> | 6         | 750                  |
> | 7         | 800                  |
> | 8         | 250                  |
> | 9         | 450                  |
> | 10        | 625                  |
>
> **为什么：**INSERT / UPDATE / DELETE 在 COMMIT 之前只是「草稿」：只有你自己的会话看得到，ROLLBACK 就全部撤销。COMMIT 之后就是永久的，ROLLBACK 也撤不回来。⚠️ 如果你中途 COMMIT 过，或者执行过任何 DDL（CREATE / ALTER / DROP 会**自动 COMMIT**），这里就恢复不了——重新跑一次初始化脚本即可。

---

## 9. 建表与约束：CREATE / ALTER / DROP

t01–t05 是 Lab 6 课件里的 CLASSROOM 练习，按顺序做完，表最后会被删掉，不会留下痕迹。

**t01 · CREATE TABLE（Lab 6 练习）**（建表与约束 ●○○）

建一张 CLASSROOM 表：CLASSROOM\_ID 是 VARCHAR2(7) 主键，CLASSROOM\_SIZE 是 NUMBER(5,0)。

> ```sql
> CREATE TABLE Classroom (
>   Classroom_ID   VARCHAR2(7),
>   Classroom_Size NUMBER(5,0),
>   CONSTRAINT Classroom_PK PRIMARY KEY (Classroom_ID)
> );
> ```
>
> **预期：Table CLASSROOM created.**
>
> **为什么：**`NUMBER(p, s)`：p 是总位数，s 是小数位数。`NUMBER(5,0)` = 最多 5 位整数，最大 99999。如果提示表已存在（ORA-00955），先 `DROP TABLE Classroom;`。

**t02 · ALTER TABLE：改类型、加列**（建表与约束 ●●○）

把 CLASSROOM\_SIZE 改成 NUMBER(5,2)，再加一列 CAPACITY NUMBER(3,0)（Lab 6 练习）。

> ```sql
> ALTER TABLE Classroom MODIFY Classroom_Size NUMBER(5,2);
> ```
>
> **第 1 步 · 预期：Table CLASSROOM altered.**
>
> ```sql
> ALTER TABLE Classroom ADD Capacity NUMBER(3,0);
> ```
>
> **第 2 步 · 预期：Table CLASSROOM altered.**
>
> **为什么：**`MODIFY` 改已有列，`ADD` 加新列。NUMBER(5,0) → NUMBER(5,2) 意味着整数部分从最多 5 位变成最多 3 位（总共 5 位，其中 2 位给小数）。表是空的所以能改；如果表里已经有数据，Oracle 可能拒绝缩小精度（ORA-01440）。

**t03 · 数据类型的范围**（建表与约束 ●●○）

插入两个教室：LTA（面积 400.5，容量 450）和 LTB（面积 120，容量 1000）。

> ```sql
> INSERT INTO Classroom VALUES ('LTA', 400.5, 450);
> ```
>
> **第 1 步 · 预期：1 row inserted.**
>
> ```sql
> INSERT INTO Classroom VALUES ('LTB', 120, 1000);
> ```
>
> **第 2 步 · 预期报错：**`ORA-01438: value larger than specified precision allowed for this column`
>
> **为什么：**CAPACITY 是 `NUMBER(3,0)`，最大 999，1000 放不下。

**t04 · DELETE 带条件（Lab 6 例子）**（建表与约束 ●○○）

再插入一个小教室 RM101（面积 60，容量 40），然后删掉容量 ≤ 100 的教室。

> ```sql
> INSERT INTO Classroom VALUES ('RM101', 60, 40);
> ```
>
> **第 1 步 · 预期：1 row inserted.**
>
> ```sql
> DELETE FROM Classroom WHERE Capacity <= 100;
> ```
>
> **第 2 步 · 预期：1 row deleted.**
>
> ```sql
> SELECT * FROM Classroom;
> ```
>
> **第 3 步 · 预期：1 行**
>
> | CLASSROOM\_ID | CLASSROOM\_SIZE | CAPACITY |
> | ------------- | --------------- | -------- |
> | LTA           | 400.5           | 450      |
>
> **为什么：**DELETE 删的是**行**，表还在；DROP TABLE 才是把整张表（结构 + 数据）删掉。

**t05 · DROP TABLE**（建表与约束 ●○○）

删除 CLASSROOM 表。

> ```sql
> DROP TABLE Classroom;
> ```
>
> **预期：Table CLASSROOM dropped.**
>
> **为什么：**DDL 语句执行前后都会**自动 COMMIT**：上一题插入的 LTA 已经被提交了，就算后面 ROLLBACK 也回不来（不过表已经删了，也无所谓了）。

**t06 · 删不掉的表**（建表与约束 ●●○）

试着删除 Customer\_T。（放心，会失败。）

> ```sql
> DROP TABLE Customer_T;
> ```
>
> **预期报错：**`ORA-02449: unique/primary keys in table referenced by foreign keys`
>
> **为什么：**Order\_T 的外键引用着 Customer\_T 的主键。要删 Customer\_T，得先删 Order\_T（所以老师的脚本是按 OrderLine\_T → Order\_T → Product\_T → Customer\_T 的顺序 DROP），或者写 `DROP TABLE Customer_T CASCADE CONSTRAINTS`（连外键约束一起删，lab6 的初始化脚本就是这样写的）。

**t07 · 用查询结果建表（老师 demo）**（建表与约束 ●●○）

建一张 FLCustomer\_T（结构和 Customer\_T 相同），把佛罗里达的客户复制进去，查看后删掉这张表。

> ```sql
> CREATE TABLE FLCustomer_T (
>   CustomerID         NUMBER(11,0),
>   CustomerName       VARCHAR2(25) NOT NULL,
>   CustomerAddress    VARCHAR2(30),
>   CustomerCity       VARCHAR2(20),
>   CustomerState      CHAR(2),
>   CustomerPostalCode VARCHAR2(15),
>   CONSTRAINT FLCustomer_PK PRIMARY KEY (CustomerID)
> );
> ```
>
> **第 1 步 · 预期：Table FLCUSTOMER\_T created.**
>
> ```sql
> INSERT INTO FLCustomer_T
> SELECT * FROM Customer_T WHERE CustomerState = 'FL';
> ```
>
> **第 2 步 · 预期：5 rows inserted.**
>
> ```sql
> SELECT CustomerID, CustomerName, CustomerCity FROM FLCustomer_T ORDER BY CustomerID;
> ```
>
> **第 3 步 · 预期：5 行**
>
> | CUSTOMERID | CUSTOMERNAME         | CUSTOMERCITY |
> | ---------- | -------------------- | ------------ |
> | 1          | Contemporary Casuals | Gainesville  |
> | 9          | M and H Casual Furn  | Clearwater   |
> | 10         | Seminole Interiors   | Tallahassee  |
> | 11         | American Euro Life   | Orlando      |
> | 16         | Sunshine Interiors   | Tampa        |
>
> ```sql
> DROP TABLE FLCustomer_T;
> ```
>
> **第 4 步 · 预期：Table FLCUSTOMER\_T dropped.**
>
> **为什么：**`INSERT INTO 表 SELECT …` 一次插入一个查询的全部结果，不用写 VALUES。查询的列数和类型要和目标表对得上。如果 CREATE 报 ORA-00955（名字已被占用），说明你之前跑过老师的 demo，先 DROP 再建。

---

## 10. Lab 6 走一遍

s01–s05 是 Lab 6 手册里的 Case 1–5；s07、s08 是手册里的 DML 步骤，包括手册本身的一处错误；s09–s12 是额外的练习。

**s01 · Case 1：所有学校**（Lab 6 ●○○）

列出 SCHOOL 表的全部内容。

> ```sql
> SELECT * FROM School;
> ```
>
> **预期：20 行**
>
> | SCHOOL\_ID | SCHOOL\_NAME  | CONTACT\_PERSON | TELEPHONE | NO\_OF\_STU |
> | ---------- | ------------- | --------------- | --------- | ----------- |
> | 1          | School No. 1  | Peter Leung     | 15823931  | 69          |
> | 2          | School No. 2  | Stanley Wong    | 86051042  | 242         |
> | 3          | School No. 3  | Leo Tse         | 54488246  | 530         |
> | 4          | School No. 4  | Elahi Carlos    | 54125473  | 825         |
> | 5          | School No. 5  | Eduardo Lau     | 44185208  | 336         |
> | 6          | School No. 6  | Sisi Wong       | 75447810  | 524         |
> | 7          | School No. 7  | CK Chan         | 4170099   | 68          |
> | 8          | School No. 8  | KK Lee          | 12140674  | 612         |
> | 9          | School No. 9  | Jonah Wong      | 8063438   | 716         |
> | 10         | School No. 10 | Usher Yu        | 83672294  | 69          |
> | 11         | School No. 11 | Eason Chan      | 70306564  | 516         |
> | 12         | School No. 12 | Cecilia Cheung  | 11120926  | 236         |
> | 13         | School No. 13 | Gilian Chung    | 95243385  | 636         |
> | 14         | School No. 14 | Roger Poon      | 71453788  | 627         |
> | 15         | School No. 15 | Joseph Cheng    | 91848745  | 848         |
> | 16         | School No. 16 | MS Tang         | 41478663  | 86          |
> | 17         | School No. 17 | May Ho          | 93669356  | 212         |
> | 18         | School No. 18 | Perfect Au      | 74443547  | 864         |
> | 19         | School No. 19 | Brad Drad       | 88461285  | 615         |
> | 20         | School No. 20 | Dorothy Wong    | 80435848  | 225         |
>
> **为什么：**共 20 所学校。注意 NO\_OF\_STU（学生人数）这一列名——lab 手册里写的是 No\_of\_student，和初始化脚本对不上，后面 s07 会遇到。

**s02 · Case 2：科目名称和级别**（Lab 6 ●○○）

列出所有科目的名称和级别。

> ```sql
> SELECT Subject_Name, Subject_Level FROM Subject;
> ```
>
> **预期：20 行**
>
> | SUBJECT\_NAME                | SUBJECT\_LEVEL |
> | ---------------------------- | -------------- |
> | Chinese Language and Culture | AS             |
> | Use of English               | AS             |
> | Mathematics and Statistics   | AS             |
> | Geography                    | AL             |
> | Economics                    | AL             |
> | Principles of Accounts       | AL             |
> | Business Studies             | AL             |
> | Pure Mathematics             | AL             |
> | History                      | AL             |
> | Chinese History              | AL             |
> | English Literature           | AL             |
> | Religious Studies            | AS             |
> | Physics                      | AL             |
> | Chemistry                    | AL             |
> | Biology                      | AL             |
> | Chinese Culture              | AL             |
> | Liberal Studies              | AS             |
> | Applied Mathematics          | AL             |
> | Computer Studies             | AL             |
> | Art                          | AS             |
>
> **为什么：**AS = Advanced Supplementary，AL = Advanced Level（香港旧学制的科目级别）。

**s03 · Case 3：列别名**（Lab 6 ●○○）

列出学校名和联系人，联系人那一列显示为 Person\_in\_charge。

> ```sql
> SELECT School_Name, Contact_Person Person_in_charge
> FROM School
> WHERE School_ID IN ('1', '2', '3');
> ```
>
> **预期：3 行**
>
> | SCHOOL\_NAME | PERSON\_IN\_CHARGE |
> | ------------ | ------------------ |
> | School No. 1 | Peter Leung        |
> | School No. 2 | Stanley Wong       |
> | School No. 3 | Leo Tse            |
>
> **为什么：**别名前省略了 AS。为了节省篇幅这里只取了 3 所学校；Lab 手册的原题没有 WHERE，会返回 20 行。

**s04 · Case 4：DISTINCT**（Lab 6 ●○○）

科目分成哪几个级别？

> ```sql
> SELECT DISTINCT Subject_Level
> FROM Subject
> ORDER BY Subject_Level;
> ```
>
> **预期：2 行**
>
> | SUBJECT\_LEVEL |
> | -------------- |
> | AL             |
> | AS             |
>
> **为什么：**20 个科目只有 2 种级别。Lab 手册原题没写 ORDER BY，你跑出来可能是 AS 在前。

**s05 · Case 5：按名称排序**（Lab 6 ●○○）

所有科目按名称字母顺序排列。

> ```sql
> SELECT *
> FROM Subject
> ORDER BY Subject_Name;
> ```
>
> **预期：20 行**
>
> | SUBJECT\_CODE | SUBJECT\_NAME                | SUBJECT\_LEVEL |
> | ------------- | ---------------------------- | -------------- |
> | 1018          | Applied Mathematics          | AL             |
> | 1020          | Art                          | AS             |
> | 1015          | Biology                      | AL             |
> | 1007          | Business Studies             | AL             |
> | 1014          | Chemistry                    | AL             |
> | 1016          | Chinese Culture              | AL             |
> | 1010          | Chinese History              | AL             |
> | 1001          | Chinese Language and Culture | AS             |
> | 1019          | Computer Studies             | AL             |
> | 1005          | Economics                    | AL             |
> | 1011          | English Literature           | AL             |
> | 1004          | Geography                    | AL             |
> | 1009          | History                      | AL             |
> | 1017          | Liberal Studies              | AS             |
> | 1003          | Mathematics and Statistics   | AS             |
> | 1013          | Physics                      | AL             |
> | 1006          | Principles of Accounts       | AL             |
> | 1008          | Pure Mathematics             | AL             |
> | 1012          | Religious Studies            | AS             |
> | 1002          | Use of English               | AS             |
>
> **为什么：**Oracle 默认按字符编码排序（大写字母在小写字母前面）。这里所有名字都是大写开头，所以就是普通的字母顺序。

**s06 · 陷阱：数字存成了文字**（Lab 6 ●●●）

按 SCHOOL\_ID 排序，看看前 12 行的顺序有什么奇怪的地方。

> ```sql
> SELECT School_ID, School_Name
> FROM School
> ORDER BY School_ID;
> ```
>
> **预期：20 行**
>
> | SCHOOL\_ID | SCHOOL\_NAME  |
> | ---------- | ------------- |
> | 1          | School No. 1  |
> | 10         | School No. 10 |
> | 11         | School No. 11 |
> | 12         | School No. 12 |
> | 13         | School No. 13 |
> | 14         | School No. 14 |
> | 15         | School No. 15 |
> | 16         | School No. 16 |
> | 17         | School No. 17 |
> | 18         | School No. 18 |
> | 19         | School No. 19 |
> | 2          | School No. 2  |
> | 20         | School No. 20 |
> | 3          | School No. 3  |
> | 4          | School No. 4  |
> | 5          | School No. 5  |
> | 6          | School No. 6  |
> | 7          | School No. 7  |
> | 8          | School No. 8  |
> | 9          | School No. 9  |
>
> **为什么：**排出来是 1, 10, 11, 12, …, 19, 2, 20, 3 …——因为 SCHOOL\_ID 是 **VARCHAR2**，按**文字**比较时逐个字符比，'10' 的第一个字符 '1' 比 '2' 小。想按数字排要写 `ORDER BY TO_NUMBER(School_ID)`。设计表时，编号如果要参与计算或排序就应该用 NUMBER。

**s07 · Lab 手册的 INSERT 为什么报错**（Lab 6 ●●○）

按 Lab 6 手册插入第 21 所学校。

> ```sql
> INSERT INTO School (School_ID, School_Name, Contact_Person, Telephone, No_of_student)
> VALUES ('021', 'School No. 21', 'Jonathan Mok', '99871122', 233);
> ```
>
> **第 1 步 · 预期报错：**`ORA-00904: "NO_OF_STUDENT": invalid identifier`
>
> ```sql
> INSERT INTO School (School_ID, School_Name, Contact_Person, Telephone, No_of_stu)
> VALUES ('021', 'School No. 21', 'Jonathan Mok', '99871122', 233);
> ```
>
> **第 2 步 · 预期：1 row inserted.**
>
> **为什么：****用你自己账号跑 lab6\_init.sql 建的表，列名是 NO\_OF\_STU**，而 Lab 手册写的是 No\_of\_student（手册说共用账号 isom5260 里的表结构可能不同）。把列名改对就能插入。`lab6_scripts.sql` 里 `SELECT * FROM school` 后面还少了一个分号，用 F5 跑整个脚本时它会和下一句 UPDATE 粘在一起报错。

**s08 · UPDATE 与隐式类型转换**（Lab 6 ●●●）

把 21 号学校的联系人改成 Jonathan Lok、学生数改成 342；再把 18 号学校的电话改成 23587638（Lab 6 课件的例子），最后撤销。

> ```sql
> UPDATE School
> SET Contact_Person = 'Jonathan Lok', No_of_stu = 342
> WHERE School_ID = '021';
> ```
>
> **第 1 步 · 预期：1 row updated.**
>
> ```sql
> UPDATE School
> SET Telephone = '23587638'
> WHERE School_ID = 18;
> ```
>
> **第 2 步 · 预期：1 row updated.**
>
> ```sql
> ROLLBACK;
> ```
>
> **第 3 步 · 预期：Rollback complete.**
>
> **为什么：**课件写的是 `WHERE SCHOOL_ID = 18`（数字，没加引号），但 SCHOOL\_ID 是文字列。Oracle 会把**这一列的每个值**都转成数字再比较，所以能跑通；但如果表里有一个转不成数字的 ID（比如 'A01'），就会报 ORA-01722: invalid number。好习惯：文字列就用单引号 `'18'`。注意 '021' 和 '21' 是两个不同的文字。

**s09 · 每个级别有几个科目**（Lab 6 ●○○）

统计 AS 和 AL 各有多少个科目。

> ```sql
> SELECT Subject_Level, COUNT(*) AS NumSubjects
> FROM Subject
> GROUP BY Subject_Level
> ORDER BY Subject_Level;
> ```
>
> **预期：2 行**
>
> | SUBJECT\_LEVEL | NUMSUBJECTS |
> | -------------- | ----------- |
> | AL             | 14          |
> | AS             | 6           |
>
> **为什么：**AL 14 门、AS 6 门，加起来正好 20。

**s10 · 哪些学校开了物理**（Lab 6 ●●○）

列出开设 Physics 的学校编号、名称和联系人。

> ```sql
> SELECT s.School_ID, s.School_Name, s.Contact_Person
> FROM School s
>   JOIN Subject_Offer so ON s.School_ID = so.FK_School_ID
>   JOIN Subject sub     ON so.FK_Subject_Code = sub.Subject_Code
> WHERE sub.Subject_Name = 'Physics'
> ORDER BY s.School_Name;
> ```
>
> **预期：3 行**
>
> | SCHOOL\_ID | SCHOOL\_NAME  | CONTACT\_PERSON |
> | ---------- | ------------- | --------------- |
> | 12         | School No. 12 | Cecilia Cheung  |
> | 14         | School No. 14 | Roger Poon      |
> | 8          | School No. 8  | KK Lee          |
>
> **为什么：**SUBJECT\_OFFER 是学校和科目之间的关联表（多对多）。从学校走到科目要经过它：School → Subject\_Offer → Subject。结果按学校名（文字）排序，所以 School No. 8 排在最后。

**s11 · 开课最多的学校**（Lab 6 ●●●）

每所学校开了几门科目？只列出 5 门及以上的，按门数从多到少排。

> ```sql
> SELECT s.School_Name, COUNT(*) AS NumSubjects
> FROM School s
>   JOIN Subject_Offer so ON s.School_ID = so.FK_School_ID
> GROUP BY s.School_Name
> HAVING COUNT(*) >= 5
> ORDER BY NumSubjects DESC, s.School_Name;
> ```
>
> **预期：5 行**
>
> | SCHOOL\_NAME  | NUMSUBJECTS |
> | ------------- | ----------- |
> | School No. 12 | 7           |
> | School No. 7  | 7           |
> | School No. 8  | 6           |
> | School No. 15 | 5           |
> | School No. 19 | 5           |
>
> **为什么：**School No. 12 和 School No. 7 都是 7 门，按第二排序键 School\_Name 排——它是文字，逐个字符比，'1' < '7'，所以 12 排在 7 前面（同 s06 的陷阱）。

**s12 · 没有学校开的科目**（Lab 6 ●●●）

有没有哪门科目一所学校都没开？

> ```sql
> SELECT sub.Subject_Code, sub.Subject_Name
> FROM Subject sub
>   LEFT JOIN Subject_Offer so ON sub.Subject_Code = so.FK_Subject_Code
> WHERE so.FK_School_ID IS NULL
> ORDER BY sub.Subject_Code;
> ```
>
> **预期：0 行（只有表头，没有数据）**
>
> **为什么：****返回 0 行**——每门科目都至少有一所学校开。空结果也是一个答案：说明查询本身没错，只是没有符合条件的数据。怎么确认不是写错了？把 `WHERE` 删掉再跑，能看到 70 行（每门课 × 开它的学校），而且右边没有一个 `(null)`。

---

## 🔴 常见 ORA 报错速查

报错时先看 **ORA 编号**，再看冒号后面的英文——它通常已经告诉你是哪个名字、哪条约束出了问题。

| 编号        | 英文                                             | 意思             | 最常见的原因                               | 题           |
| --------- | ---------------------------------------------- | -------------- | ------------------------------------ | ----------- |
| ORA-00904 | invalid identifier                             | 找不到这个名字        | 列名拼错；WHERE 里用了列别名；字符串用了双引号           | x01、x05、s07 |
| ORA-00942 | table or view does not exist                   | 找不到这张表         | 表名拼错；表建在别的账号下                        | x08         |
| ORA-00918 | column ambiguously defined                     | 列名有歧义          | 两张表都有这一列，没写表别名前缀                     | x07         |
| ORA-00933 | SQL command not properly ended                 | 语句没有正确结束       | 表别名加了 AS；多了或少了某个关键字                  | x06         |
| ORA-00937 | not a single-group group function              | 聚合和普通列混用       | 有 COUNT / SUM 等，却没写 GROUP BY         | x02         |
| ORA-00979 | not a GROUP BY expression                      | 列不在 GROUP BY 里 | SELECT 里的非聚合列没写进 GROUP BY            | x03         |
| ORA-00934 | group function is not allowed here             | 这里不能用聚合函数      | 在 WHERE 里用了 COUNT / SUM 等，应该放 HAVING | x04         |
| ORA-00001 | unique constraint violated                     | 违反唯一约束         | 主键重复                                 | d03         |
| ORA-01400 | cannot insert NULL                             | 不能插入空值         | NOT NULL 的列没给值                       | d04         |
| ORA-12899 | value too large for column                     | 文字太长           | 超过 VARCHAR2 / CHAR 的长度               | d05         |
| ORA-01438 | value larger than specified precision          | 数字太大           | 超过 NUMBER(p, s) 的位数                  | t03         |
| ORA-02290 | check constraint violated                      | 违反 CHECK 约束    | 值不在允许的范围或列表里                         | d06         |
| ORA-02291 | parent key not found                           | 外键找不到父记录       | 引用了不存在的主键值                           | d07         |
| ORA-02292 | child record found                             | 还有子记录引用它       | 删除被外键引用的行                            | d10         |
| ORA-02449 | unique/primary keys referenced by foreign keys | 表被外键引用         | DROP 被别的表引用的表                        | t06         |
| ORA-01722 | invalid number                                 | 无效数字           | 把转不成数字的文字当数字用                        | s08         |
| ORA-00955 | name is already used by an existing object     | 名字已被占用         | CREATE 了一张已经存在的表                     | t01、t07     |
