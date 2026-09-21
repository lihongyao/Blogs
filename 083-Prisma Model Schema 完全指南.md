# 摘要

本文以 **Prisma ORM 7.10.0** 为基础，使用 Prisma Schema Language（PSL）从 0 到 1 编写 `schema.prisma`。内容覆盖 Prisma Schema 的组成、模型和字段、主键与默认值、索引与约束、枚举、关系、数据库映射、PostgreSQL 实战、MongoDB 差异，以及在 Next.js 中的开发工作流。

# 前言

Prisma 项目里经常同时出现三个容易混淆的词：

- **Prisma Schema**：项目中的 `schema.prisma` 文件，使用 PSL 描述数据模型；
- **数据库 Schema**：PostgreSQL 中的表、列和约束，或 MongoDB 中的 collection 和 document；
- **Model Schema**：通常指 Prisma Schema 中的 `model` 定义。

Prisma Schema 不是数据库本身，但它可以作为应用模型和数据库结构之间的契约。Prisma Client 会根据它生成类型安全的查询 API，Prisma Migrate 则可以根据它生成数据库迁移。

本文只讨论 **PSL**，也就是传统 Prisma 项目中最常见的 `.prisma` 文件写法。

## 本文环境

```text
Next.js（TypeScript）
Prisma ORM 7.10.0
PostgreSQL（正文实战）
```

> [!WARNING]
> [Prisma 7 MongoDB 快速开始](https://www.prisma.io/docs/v7/prisma-orm/quickstart/mongodb) 目前仍建议 MongoDB 用户使用 Prisma 6.19。本文会解释 MongoDB 的 PSL 写法和差异，但可直接运行的完整流程以 PostgreSQL 为准。`prisma` 与 `@prisma/client` 应保持相同版本，不要把 Prisma 7 CLI 和 Prisma 6 Client 混用。

# Prisma Schema 是什么

Prisma Schema 通常位于：

```text
prisma/schema.prisma
```

它主要包含三个部分：

```prisma
datasource db {
  provider = "postgresql"
}

generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
}
```

- `datasource`：声明数据库 provider；
- `generator`：声明要生成的代码；
- `model`：声明应用中的实体、字段和关系。

一个 `model` 在关系型数据库中通常映射为一张表，在 MongoDB 中通常映射为一个 collection。模型字段会映射为表列或文档字段，关系字段则用于描述 Prisma Client 中的关联查询。

```text
schema.prisma
      │
      ├── prisma generate  ──> Prisma Client 和 TypeScript 类型
      ├── prisma migrate   ──> SQL 迁移文件（关系型数据库）
      └── prisma db push   ──> 将结构直接同步到数据库
```

一个 schema 文件只能声明一个 `datasource`。因此 PostgreSQL 和 MongoDB 不是在同一个文件里同时切换的两个表结构；如果同一个应用确实要连接两种数据库，应分别维护 schema、配置和生成产物。

# 在 Next.js 中初始化 Prisma 7.10.0

## 安装依赖

Prisma 7 的 PostgreSQL 工作流使用 Node PostgreSQL 驱动和 Prisma Driver Adapter：

```bash
$ pnpm add -D prisma@7.10.0 @types/pg
$ pnpm add @prisma/client@7.10.0 @prisma/adapter-pg pg dotenv
```

各依赖的作用：

- `prisma`：CLI，负责 `init`、`validate`、`generate`、`migrate` 等命令；
- `@prisma/client`：运行时的类型安全查询客户端；
- `@prisma/adapter-pg`：把 Prisma Client 接到 `pg` 驱动；
- `pg`：Node.js PostgreSQL 驱动；
- `@types/pg`：`pg` 的 TypeScript 类型定义；
- `dotenv`：让 Prisma Config 在执行 CLI 时读取 `.env`。

确认项目中的两个 Prisma 包版本一致：

```bash
$ pnpm list prisma @prisma/client
```

## 初始化目录

```bash
$ pnpm exec prisma init --datasource-provider postgresql --output ../src/generated/prisma
```

初始化后通常会得到：

```text
.
├── .env
├── prisma.config.ts
└── prisma
    └── schema.prisma
```

`--output` 的路径相对于 `prisma/schema.prisma`，因此生成的客户端会放在 `src/generated/prisma`。

## 配置 `prisma.config.ts`

Prisma 7 将 CLI 配置和 schema 分开。连接 URL 放在 `prisma.config.ts`，`schema.prisma` 中只声明 provider：

```ts
// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

`.env`：

```ini
DATABASE_URL="postgresql://username:password@localhost:5432/blog?schema=public"
```

不要把真实密码提交到 Git。生产环境应在部署平台的环境变量中配置 `DATABASE_URL`。

## 最小 `schema.prisma`

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

model User {
  id    Int    @id @default(autoincrement())
  email String @unique
}
```

Prisma 7 默认使用 `prisma-client` 生成器，并要求填写 `output`。旧教程中的 `prisma-client-js` 和隐式生成路径不一定适用于 Prisma 7 项目。

## 第一次检查和生成

```bash
$ pnpm exec prisma format
$ pnpm exec prisma validate
$ pnpm exec prisma migrate dev --name init
$ pnpm exec prisma generate
```

- `format`：格式化 PSL；
- `validate`：检查语法、类型和关系；
- `migrate dev`：生成并应用开发环境迁移；
- `generate`：根据 schema 生成 Prisma Client。

# PSL 的基本语法

## 一个模型的结构

```prisma
model ModelName {
  fieldName FieldType? @attribute(argument)
  relation  OtherModel[]

  @@blockAttribute(argument)
}
```

一行字段从左到右可以读成：字段名、类型、可选或列表修饰符、字段级属性。

## 标量类型

| PSL 类型 | 常见含义 |
| --- | --- |
| `String` | 字符串 |
| `Int` | 32 位整数 |
| `BigInt` | 大整数 |
| `Float` | 浮点数 |
| `Decimal` | 精确小数，适合金额 |
| `Boolean` | 布尔值 |
| `DateTime` | 日期和时间 |
| `Json` | JSON 数据 |
| `Bytes` | 二进制数据 |

具体数据库类型由 provider 决定。相同的 `String` 在 PostgreSQL 中可以默认映射为 `text`，也可以用 `@db.VarChar(200)` 指定长度；MongoDB 则映射为 BSON 字符串。

## `?` 和 `[]`

```prisma
model User {
  id          Int      @id @default(autoincrement())
  email       String
  displayName String?
  keywords    String[]
  posts       Post[]
}
```

- `?` 表示字段可为空；
- `[]` 表示列表；
- `String[]` 是标量列表，`Post[]` 是关系列表。

不能把 `?` 和 `[]` 组合成 `String[]?`。列表本身可以为空，但不是 `null`。标量列表是否可用取决于数据库连接器，PostgreSQL 的数组能力不能直接推断到其他 provider。

# 字段属性和模型属性

字段属性以一个 `@` 开头，模型级属性以两个 `@@` 开头。

## 主键：`@id` 和 `@@id`

```prisma
model User {
  id Int @id @default(autoincrement())
}
```

常见的 PostgreSQL 主键：

```text
// 自增整数
id Int    @id @default(autoincrement())

// UUID 字符串
id String @id @default(uuid()) @db.Uuid

// CUID 字符串
id String @id @default(cuid())
```

关系型数据库可以使用复合主键：

```prisma
model Membership {
  userId  Int
  groupId Int

  @@id([userId, groupId])
}
```

MongoDB 不支持 `@@id`，因为它的主键固定是文档的 `_id` 字段。

## 默认值：`@default`

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  slug      String   @default(cuid())
}
```

常见默认值包括常量、`now()`、`uuid()`、`cuid()`、`autoincrement()` 和 MongoDB 的 `auto()`。默认值必须和字段类型及 provider 能力匹配。

## 自动更新时间：`@updatedAt`

```prisma
updatedAt DateTime @updatedAt
```

每次通过 Prisma Client 更新记录时，Prisma 会自动设置该字段。它不是数据库触发器，绕过 Prisma 直接执行 SQL 时不会自动更新。

## 唯一约束：`@unique` 和 `@@unique`

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
}

model Post {
  id       Int    @id @default(autoincrement())
  authorId Int
  title    String

  @@unique([authorId, title])
}
```

上面的组合约束保证同一作者不能有两个同名文章，但不同作者可以使用相同标题。需要时可以通过 `name` 参数命名组合约束。

## 索引：`@@index`

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  authorId  Int
  status    String
  createdAt DateTime @default(now())

  @@index([authorId])
  @@index([status, createdAt])
}
```

索引应该服务于真实查询。索引越多，写入和更新的成本通常越高。

## 数据库名称映射：`@map` 和 `@@map`

```prisma
model User {
  id        Int      @id @default(autoincrement())
  createdAt DateTime @map("created_at")

  @@map("users")
}
```

此时 Prisma Client 使用 `createdAt` 和 `User`，数据库仍然使用 `created_at` 和 `users`。`@map` 只影响字段，`@@map` 影响模型对应的表或 collection。

## 原生类型：`@db.*`

```prisma
model Product {
  id         Int     @id @default(autoincrement())
  name       String  @db.VarChar(120)
  price      Decimal @db.Decimal(12, 2)
  externalId String  @db.Uuid
}
```

原生类型属于具体 provider。PostgreSQL 的 `@db.Uuid`、`@db.VarChar` 不能原样复制到 MongoDB。

# 从 0 到 1 写一个博客模型

下面的 schema 用 PostgreSQL 建模一个简单的博客系统：用户、个人资料、文章、分类和文章状态。

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model User {
  id          Int      @id @default(autoincrement())
  email       String   @unique
  displayName String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  profile Profile?
  posts   Post[]

  @@map("users")
}

model Profile {
  id        Int    @id @default(autoincrement())
  bio       String?
  avatarUrl String?
  userId    Int    @unique

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("profiles")
}

model Post {
  id          Int        @id @default(autoincrement())
  slug        String     @unique
  title       String
  content     String?
  status      PostStatus @default(DRAFT)
  publishedAt DateTime?
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  authorId Int
  author   User @relation(fields: [authorId], references: [id], onDelete: Restrict)

  categories Category[]

  @@index([authorId, status])
  @@index([publishedAt])
  @@map("posts")
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]

  @@map("categories")
}
```

这个例子可以按以下顺序阅读：

1. `User`、`Profile`、`Post`、`Category` 是四个实体；
2. 每个模型都有一个主键；
3. `Post.authorId` 是真正存储在数据库中的外键列；
4. `author`、`posts`、`profile`、`categories` 是 Prisma 层的关系字段；
5. `Profile.userId @unique` 把 User 和 Profile 约束为一对一；
6. `PostStatus` 限制文章状态的取值；
7. `@@map` 让 Prisma 使用 PascalCase，数据库保留复数表名。

# 关系建模

关系字段和关系标量字段要分开理解：

```prisma
model Post {
  authorId Int  // 关系标量字段，数据库中有这一列
  author   User @relation(fields: [authorId], references: [id]) // Prisma Client 使用
}
```

`author` 不会变成一个 `User` 类型的数据库列，真正连接两张表的是 `authorId`。

## 一对多

一个用户有多篇文章，一篇文章属于一个用户：

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  authorId Int
  author   User @relation(fields: [authorId], references: [id])
}
```

外键放在“多”的一侧，也就是 `Post`。

## 一对一

一对一关系需要让外键唯一：

```prisma
model User {
  id      Int     @id @default(autoincrement())
  profile Profile?
}

model Profile {
  id     Int  @id @default(autoincrement())
  userId Int  @unique
  user   User @relation(fields: [userId], references: [id])
}
```

如果没有 `userId @unique`，数据库只能保证 Profile 指向 User，却不能阻止多个 Profile 指向同一个 User。

## 多对多：隐式中间表

当关系本身不需要额外字段时，PostgreSQL 可以使用隐式多对多：

```prisma
model Post {
  id         Int        @id @default(autoincrement())
  title      String
  categories Category[]
}

model Category {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[]
}
```

执行迁移时，Prisma 会创建关系所需的中间表。中间表名称和列名由 Prisma 管理，适合简单关联。

## 多对多：显式中间模型

如果关系需要 `sortOrder`、`createdAt` 等额外字段，应显式声明中间模型：

```prisma
model Post {
  id         Int           @id @default(autoincrement())
  title      String
  categories PostCategory[]
}

model Category {
  id    Int           @id @default(autoincrement())
  name  String        @unique
  posts PostCategory[]
}

model PostCategory {
  postId     Int
  categoryId Int
  sortOrder  Int      @default(0)
  createdAt  DateTime @default(now())

  post     Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  category Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)

  @@id([postId, categoryId])
  @@index([categoryId])
}
```

同一组模型的同一条业务关系，不要同时声明隐式和显式两套关系。

## 自关联

分类树、评论回复、员工汇报关系都属于自关联。自关联通常要写关系名称：

```prisma
model Category {
  id       Int        @id @default(autoincrement())
  name     String
  parentId Int?

  parent   Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children Category[] @relation("CategoryTree")
}
```

## 同一对模型有多条关系

例如一个 User 同时是文章作者和审核者，必须通过关系名称区分：

```prisma
model User {
  id            Int    @id @default(autoincrement())
  authoredPosts Post[] @relation("PostAuthor")
  reviewedPosts Post[] @relation("PostReviewer")
}

model Post {
  id         Int  @id @default(autoincrement())
  authorId   Int
  reviewerId Int?

  author   User  @relation("PostAuthor", fields: [authorId], references: [id])
  reviewer User? @relation("PostReviewer", fields: [reviewerId], references: [id])
}
```

## 参照动作

关系可以指定删除和更新时的行为：

```prisma
author User @relation(
  fields: [authorId],
  references: [id],
  onDelete: Restrict,
  onUpdate: Cascade
)
```

常见动作包括：

- `Cascade`：级联处理关联记录；
- `Restrict`：存在关联记录时阻止操作；
- `NoAction`：交给数据库的默认行为；
- `SetNull`：将外键设为 `NULL`，外键字段必须是可选的。

删除用户是否级联删除文章，是业务规则，不要只为了让删除操作成功就盲目使用 `Cascade`。

# 枚举、JSON 和复合数据

## 枚举

```prisma
enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Post {
  id     Int        @id @default(autoincrement())
  status PostStatus @default(DRAFT)
}
```

枚举成员名最终会参与数据库映射，修改成员名称可能需要数据迁移。面向用户的显示文案建议在 TypeScript 中单独维护。

## JSON

```prisma
model Post {
  id       Int  @id @default(autoincrement())
  metadata Json?
}
```

`Json` 适合结构变化频繁、不会参与核心关系和约束的数据。需要过滤、排序或唯一约束的数据，通常应该拆成明确字段或独立模型。

## MongoDB 的复合类型

传统 Prisma Schema 中的 `type` 复合类型主要用于 MongoDB 嵌入文档：

```prisma
type Address {
  city    String
  street  String
  zipCode String?
}

model User {
  id      String  @id @default(auto()) @map("_id") @db.ObjectId
  email   String  @unique
  address Address?
}
```

复合类型没有自己的 ID、关系或独立 collection，它的字段会嵌入父文档。PostgreSQL 应使用 `Json` 或单独的 `Address` 模型，不能假设 `type` 在所有 provider 中都可用。

# PostgreSQL 和 MongoDB 的差异

PSL 的基本语法是共通的，但 provider 会改变模型的存储和约束语义。

| 关注点 | PostgreSQL | MongoDB |
| --- | --- | --- |
| 模型映射 | table | collection/document |
| 主键 | 自增整数、UUID 等 | 通常是 `_id` + ObjectId |
| 外键 | 可以由数据库维护 | 没有关系型外键，通常保存引用 ID |
| 多对多 | 可以使用隐式中间表 | 通常需要显式保存 ID 或中间结构 |
| 原生类型 | `@db.Uuid`、`@db.VarChar`、`@db.Decimal` 等 | `@db.ObjectId` 等 |
| 迁移 | `prisma migrate dev/deploy` | 不支持 Prisma Migrate，使用 `db push` 或手动变更 |
| 复合类型 | 不支持传统 `type` 复合类型 | 可使用嵌入式 `type` |

## PostgreSQL 主键

```prisma
model User {
  id Int @id @default(autoincrement())
}
```

或者使用 UUID：

```prisma
model User {
  id String @id @default(uuid()) @db.Uuid
}
```

## MongoDB 主键

MongoDB 文档的物理主键是 `_id`。Prisma 字段不能直接以 `_` 开头，所以通常使用 `@map("_id")`：

```prisma
model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  email String @unique
}
```

MongoDB 不支持 `@@id` 和 `autoincrement()`。关系标量也必须使用正确的 ObjectId 映射：

```prisma
model User {
  id    String @id @default(auto()) @map("_id") @db.ObjectId
  posts Post[]
}

model Post {
  id       String @id @default(auto()) @map("_id") @db.ObjectId
  authorId String @db.ObjectId
  author   User   @relation(fields: [authorId], references: [id])
}
```

## Prisma 7.10.0 的 MongoDB 版本提示

当前 Prisma v7 MongoDB 快速开始页面仍然写明：MongoDB 支持正在迁移到 Prisma v7，暂时使用 Prisma v6.19。也就是说：

```text
PSL 语法可以描述 MongoDB 模型
≠
Prisma 7.10.0 已经可以运行完整 MongoDB 工作流
```

如果项目必须使用 MongoDB，应将 `prisma` 和 `@prisma/client` 一起固定到官方支持 MongoDB 的 `6.19`，并按照 v6 的配置方式执行；如果项目必须保持 `7.10.0`，建议采用 PostgreSQL 实战，不要把 MongoDB provider 写进同一套可执行步骤。

# Schema 的开发工作流

## 手写模型并迁移

适合新项目和由 Prisma Schema 驱动数据库的项目：

```bash
$ pnpm exec prisma format
$ pnpm exec prisma validate
$ pnpm exec prisma migrate dev --name init
$ pnpm exec prisma generate
```

之后修改模型，例如新增字段：

```prisma
model User {
  id          Int     @id @default(autoincrement())
  email       String  @unique
  displayName String?
}
```

再创建一条有意义的迁移：

```bash
$ pnpm exec prisma migrate dev --name add_display_name
```

迁移目录应提交到版本控制：

```text
prisma/
├── schema.prisma
└── migrations/
    ├── 20260101000000_init/
    │   └── migration.sql
    └── 20260102000000_add_display_name/
        └── migration.sql
```

生产环境使用：

```bash
$ pnpm exec prisma migrate deploy
```

不要在生产环境用 `migrate dev`，它是开发环境命令，可能会检测到漂移后要求重置数据库。

## 快速原型：`db push`

```bash
$ pnpm exec prisma db push
$ pnpm exec prisma generate
```

`db push` 直接把 schema 的当前状态同步到数据库，不创建迁移历史，适合本地快速试验。它不适合需要审查 SQL、保留变更历史或安全处理数据迁移的生产流程。

## 已有数据库：`db pull`

如果数据库已经存在，可以先反向生成模型：

```bash
$ pnpm exec prisma db pull
$ pnpm exec prisma generate
```

反向生成后要人工检查命名、关系和业务语义。数据库中的约束能被 introspection 读取，但某些业务含义仍然需要补充或调整。

## 查看数据：Prisma Studio

```bash
$ pnpm exec prisma studio
```

Studio 适合开发环境查看和编辑数据，不应当作为生产数据管理后台，也不应绕过正式的业务校验。

# 在 Next.js 中使用 Prisma Client

Prisma 7 的 PostgreSQL Client 需要通过 adapter 连接 `pg`。可以在 `src/lib/prisma.ts` 中建立一个开发环境复用的单例：

```ts
// src/lib/prisma.ts
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
```

在 Route Handler、Server Action 或其他服务端代码中使用：

```ts
import { prisma } from "@/lib/prisma";

export async function listPosts() {
  return prisma.post.findMany({
    where: { status: "PUBLISHED" },
    include: { author: true },
    orderBy: { publishedAt: "desc" },
  });
}
```

Prisma Client 只能在服务端使用，不要从 Client Component 直接导入。`@/generated/prisma/client` 也要和 `generator` 中的 `output` 路径保持一致；如果项目没有配置 `@/*` 别名，就改成相对路径。

# 常见错误和排查方式

## 找不到 `DATABASE_URL`

检查根目录是否存在 `.env`、`prisma.config.ts` 是否有 `import "dotenv/config"`，以及变量名是否正好是 `DATABASE_URL`。

## 关系两端定义不完整

关系至少需要补齐另一端，并在实际持有外键的一侧声明 `fields` 和 `references`：

```prisma
model User {
  id    Int    @id @default(autoincrement())
  posts Post[]
}

model Post {
  id       Int  @id @default(autoincrement())
  authorId Int
  author   User @relation(fields: [authorId], references: [id])
}
```

## MongoDB 的 ObjectId 类型不匹配

MongoDB 的模型 ID 和关系标量应该保持一致：

```prisma
id       String @id @default(auto()) @map("_id") @db.ObjectId
authorId String @db.ObjectId
```

不要只给 ID 加 `@db.ObjectId`，却让 `authorId` 仍然是普通 `String`。

## 给已有数据新增必填字段

如果表中已经有数据，直接新增没有默认值的必填字段会无法迁移。更稳妥的步骤是：

1. 先将字段设为可选，或提供合理默认值；
2. 迁移并回填旧数据；
3. 再改为必填并创建第二次迁移。

## 把数据库类型写进通用 schema

```prisma
// 仅适用于支持该 native type 的 provider
id String @db.Uuid
```

`@db.*` 是 provider-specific 类型映射。切换数据库前要重新检查主键、数组、枚举、JSON、索引和关系能力。

## 在 MongoDB 上执行 `migrate dev`

MongoDB 不支持 Prisma Migrate。对于官方支持 MongoDB 的 Prisma 版本，应使用 `db push`、`db pull` 或数据库自己的变更工具，并对数据迁移脚本负责。

# 编写 Model Schema 的检查清单

提交 schema 前可以按下面的顺序检查：

1. `datasource.provider` 是否和目标数据库一致；
2. `generator.output` 是否指向项目实际使用的目录；
3. 每个模型是否有主键或符合 provider 要求的唯一标识；
4. 必填字段是否真的应该禁止 `NULL`；
5. 默认值函数是否被当前 provider 支持；
6. 外键字段的类型是否和被引用的主键完全一致；
7. 一对一关系的外键是否有 `@unique`；
8. 多对多关系是否需要额外字段，从而决定使用隐式还是显式中间模型；
9. 高频查询是否有合适的 `@@index`，是否存在重复索引；
10. 是否需要 `@map`、`@@map` 兼容已有表名和列名；
11. schema 修改后是否执行了 `format`、`validate`、迁移和 `generate`；
12. 迁移文件是否已经审查并提交到版本控制。

# 总结

PSL 的核心可以记成：

```text
model       定义实体
field       定义字段和类型
@attribute  修改字段行为
@@attribute 修改模型级约束和索引
@relation   描述模型之间的关系
@map        映射到已有数据库命名
```

真正需要认真设计的，不是把字段翻译成几行代码，而是确定哪些字段必填或唯一、主键如何生成、外键放在哪一侧、删除时应该级联还是阻止、哪些查询需要索引，以及目标 provider 是否支持你使用的类型和功能。

在 Prisma 7.10.0 的 Next.js 项目中，可以先用 PostgreSQL + PSL 建立稳定的 schema，再通过迁移管理数据库结构。PostgreSQL 和 MongoDB 共用一部分 PSL 语法，但主键、关系、原生类型和迁移方式都不同，不能把 provider 当成完全无关的配置。

# 参考资料

- [Prisma Schema 总览](https://www.prisma.io/docs/orm/v7/prisma-schema/overview)
- [Models：模型、字段、属性和类型](https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/models)
- [Relations：一对一、一对多和多对多关系](https://www.prisma.io/docs/orm/v7/prisma-schema/data-model/relations)
- [Prisma 7 PostgreSQL Quickstart](https://www.prisma.io/docs/v7/prisma-orm/quickstart/postgresql)
- [Prisma Config API](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference)
- [MongoDB connector](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/mongodb)
- [Prisma Migrate 限制](https://www.prisma.io/docs/orm/v7/prisma-migrate/understanding-prisma-migrate/limitations-and-known-issues)
