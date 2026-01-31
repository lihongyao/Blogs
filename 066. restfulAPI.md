# 概述

RESTful 是目前最流行的 API 设计规范，用于 Web 数据接口的设计。

RestfulAPI 全称 Resource Representational State Transfer ，即表述性状态传递，简称REST。是Roy Fielding博士在2000年他的博士论文中提出来的一种软件架构风格也是一种API的设计风格，（或者是一套设计理论）。根据RESTful API来写API接口的的话，会更加规范化。

# 核心思想

RESTful 的核心思想就是，客户端发出的数据操作指令都是"动词 + 宾语"的结构。比如，“GET /articles” 这个命令，GET是动词，/articles 是宾语。动词通常就是五种 HTTP 方法：

- GET：读取（Read）
- POST：新建（Create）
- PUT：更新（Update）
- PATCH：更新（Update），通常是部分更新
- DELETE：删除（Delete）

# 设计规范

- 宾语必须是名字，如：/cars
- 复数 URL，如果读取一个集合，统一用复数形式，如：/cars
- 避免多级 URL，可通过参数表达，如：/articles?published=true

# 状态码

客户端的每一次请求，服务器都必须给出回应。回应包括 HTTP 状态码和数据两部分。HTTP 状态码就是一个三位数，分成五个类别：

- `1xx`：相关信息
- `2xx`：操作成功
- `3xx`：重定向
- `4xx`：客户端错误
- `5xx`：服务器错误

常见状态码示例：

- `200 ok [GET]`：服务器成功返回用户请求的数据
- `201 CREATED [POST/PUT/PATCH]`：用户新建或修改数据成功
- `204 NO CONTENT [DELETE]`：用户删除数据成功
- `202 ACCEPTED [*]`：表示一个请求已经进入后台排队（异步任务）
- `301`：永久重定向
- `302 / 307 [GET]`：暂时重定向
- `303 [POST/PUT/DELETE]`：暂时重定向
- `400 Bad Request`：服务器不理解客户端的请求，未做任何处理。
- `401 Unauthorized`：用户未提供身份验证凭据，或者没有通过身份验证。
- `403 Forbidden`：用户通过了身份验证，但是不具有访问资源所需的权限。
- `404 Not Found`：所请求的资源不存在，或不可用。
- `405 Method Not Allowed`：户已经通过身份验证，但是所用的 HTTP 方法不在他的权限之内。
- `410 Gone`：所请求的资源已从这个地址转移，不再可用。
- `415 Unsupported Media Type`：客户端要求的返回格式不支持。比如，API 只能返回 JSON 格式，但是客户端要求返回 XML 格式。
- `422 Unprocessable Entity`：客户端上传的附件无法处理，导致请求失败。
- `429 Too Many Requests`：客户端的请求次数超过限额。

- `500 Internal Server Error`：客户端请求有效，服务器处理时发生了意外。
- `503 Service Unavailable`：服务器无法处理请求，一般用于网站维护状态。

# 服务器响应

- 不要返回纯文本
- 发生错误时，不要返回 200 状态码
- 提供链接

# 示例

```json
{
	"code":"200 ok",
  "message":"",
  "data":[]
}
```

