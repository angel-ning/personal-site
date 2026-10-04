// ISOM 5260 SQL guide: data for <CommandSortQuiz />. Shared with scripts/lib/mdx-core.mjs.

// Which of the four SQL command families does each statement belong to?
export const COMMAND_FAMILIES = [
  { id: "DDL", label: "DDL 定义结构" },
  { id: "DML", label: "DML 操作数据" },
  { id: "DCL", label: "DCL 控制权限" },
  { id: "TCL", label: "TCL 控制事务" },
];
export const COMMAND_ITEMS = [
  { sql: "CREATE TABLE Customer_T ( … );", a: "DDL", why: "建一张新表 = 定义结构。" },
  { sql: "SELECT * FROM Customer_T;", a: "DML", why: "读数据。有的教材把 SELECT 单独叫 DQL（Data Query Language），只有 DML 这个选项时它就属于 DML。" },
  { sql: "GRANT SELECT ON Customer_T TO sales_user;", a: "DCL", why: "给别人权限。" },
  { sql: "DELETE FROM Customer_T;", a: "DML", why: "删的是行（数据），删完表还在，只是空了。" },
  { sql: "DROP TABLE Customer_T;", a: "DDL", why: "连表的定义一起删掉 = 改结构。和上一题的 DELETE 是最常考的一对。" },
  { sql: "COMMIT;", a: "TCL", why: "把这之前的修改永久保存（存档）。" },
  { sql: "ALTER TABLE Customer_T ADD Email VARCHAR2(30);", a: "DDL", why: "加一列改变的是表的结构，不是数据。" },
  { sql: "UPDATE Product_T SET ProductStandardPrice = 775 WHERE ProductID = 7;", a: "DML", why: "改已有行里的值。" },
  { sql: "REVOKE SELECT ON Customer_T FROM sales_user;", a: "DCL", why: "收回权限。" },
  { sql: "ROLLBACK;", a: "TCL", why: "撤销还没 COMMIT 的修改（回档）。" },
  { sql: "INSERT INTO Customer_T VALUES ( … );", a: "DML", why: "加一行数据。" },
  { sql: "ALTER TABLE Order_T ADD CONSTRAINT Order_FK FOREIGN KEY (CustomerID) REFERENCES Customer_T(CustomerID);", a: "DDL", why: "加约束也是改结构（规则属于表的定义）。" },
];
