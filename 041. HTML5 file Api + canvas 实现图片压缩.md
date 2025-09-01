# 前言

对于大尺寸图片的上传，在前端进行压缩除了省流量外，最大的意义是极大的提高了用户体验。

这种体验包括两方面：

- 由于上传图片尺寸比较小，因此上传速度会比较快，交互会更加流畅，同时大大降低了网络异常导致上传失败风险。
- 最最重要的体验改进点：省略了图片的再加工成本。很多网站的图片上传功能都会对图片的大小进行限制，尤其是头像上传，限制5M或者2M以内是非常常见的。然后现在的数码设备拍摄功能都非常出众，一张原始图片超过2M几乎是标配，此时如果用户想把手机或相机中的某个得意图片上传作为自己的头像，就会遇到因为图片大小限制而不能上传的窘境，不得不对图片进行再处理，而这种体验其实非常不好的。如果可以在前端进行压缩，则理论上对图片尺寸的限制是没有必要的。

# 思路

思路就是 File + Canvas 的 drawImage，我们可以读取用户上传的 File 对象，然后将其写到画布（canvas）上，利用 Canvas 的 API 进行压缩，完成压缩之后再转成 File（Blob） 对象，上传到远程图片服务器；这里你需要了解几个知识点：

**➦ canvas.drawImage()**

该方法API如下：

```js
context.drawImage(img, dx, dy);
context.drawImage(img, dx, dy, dWidth, dHeight);
context.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);
```

**img**

就是图片对象，可以是页面上获取的DOM对象，也可以是虚拟DOM中的图片对象。

**dx, dy, dWidth, dHeight**

表示在`canvas`画布上规划一片区域用来放置图片，`dx, dy`为canvas元素的左上角坐标，`dWidth, dHeight`指canvas元素上用在显示图片的区域大小。如果没有指定`sx,sy,sWidth,sHeight`这4个参数，则图片会被拉伸或缩放在这片区域内。

**sx,sy,swidth,sheight**

这4个坐标是针对图片元素的，表示图片在`canvas`画布上显示的大小和位置。`sx,sy`表示图片上`sx,sy`这个坐标作为左上角，然后往右下角的`swidth,sheight`尺寸范围图片作为最终在canvas上显示的图片内容。

> 提示：`drawImage()`方法有一个非常怪异的地方，大家一定要注意，那就是5参数和9参数里面参数位置是不一样的，这个和一般的API有所不同。一般API可选参数是放在后面。但是，这里的`drawImage()`9个参数时候，可选参数`sx,sy,swidth,sheight`是在前面的。如果不注意这一点，有些表现会让你无法理解。

下图为[MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage)上原理示意：



![](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage/canvas_drawimage.jpg)

对于本文的图片压缩，需要用的是5个参数语法。举个例子，一张图片（假设图片对象是`img`）的原始尺寸是4000\*3000，现在需要把尺寸限制为400\*300大小，很简单，原理如下代码示意：

```js
var canvas = document.createElement('canvas');
var context = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 300;
// 核心JS就这个
context.drawImage(img,0,0,400,300);
```

把一张大的图片，直接画在一张小小的画布上。此时大图片就天然变成了小图片，压缩就这么实现了，是不是简单的有点超乎想象。

当然，若要落地于实际开发，我们还需要做些其他的工作，就是要解决图片来源和图片去向的问题。

**➦ 如何把系统中图片呈现在浏览器中？**

HTML5 file API可以让图片在上传之前直接在浏览器中显示，通常使用`FileReader`方法，代码示意如下：

```js
const reader = new FileReader(), img = new Image();
const eleFile = document.querySelector("#file");
// 读取文件成功的回调
reader.onload = function (e) {
  // e.target.result就是图片的base64地址信息
  img.src = e.target.result;
};
eleFile.addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (/image/.test(file.type)) {
    // 读取文件
    reader.readAsDataURL(file);
  }
});
```

于是，包含图片信息的`context.drawImage()`方法中的`img`图片就有了。

**➦ 如何把canvas画布转换成img图像**

canvas天然提供了2个转图片的方法：`canvas.toDataURL()` 和 `canvas.toBlob()`。

**\1. canvas.toDataURL()**

语法如下：

```js
canvas.toDataURL(mimeType, qualityArgument)
```

可以把图片转换成base64格式信息，纯字符的图片表示法。

其中：

- `mimeType` 表示 `canvas` 导出来的 `base64` 图片的类型，默认是png格式，也即是默认值是 `'image/png'`，我们也可以指定为jpg、webp等格式。`file`对象中的 `file.type` 就是文件的mimeType类型，在转换时候正好可以直接拿来用（如果有file对象）。
- `qualityArgument`表示导出的图片质量，只要导出为`jpg`和`webp`格式的时候此参数才有效果，默认值是`0.92`，是一个比较合理的图片质量输出参数，通常情况下，我们无需再设定。

**\2. canvas.toBlob()**

语法如下：

```js
canvas.toBlob(callback, mimeType, qualityArgument)
```

可以把canvas转换成[Blob文件](http://www.zhangxinxu.com/wordpress/2013/10/understand-domstring-document-formdata-blob-file-arraybuffer/)，通常用在文件上传中，因为是二进制的，对后端更加友好。

和`toDataURL()`方法相比，`toBlob()`方法是异步的，因此多了个`callback`参数，这个`callback`回调方法默认的第一个参数就是转换好的`blob`文件信息，本文demo的文件上传就是将`canvas`图片转换成二进制的`blob`文件，然后再`ajax`上传的，代码如下：

```js
// canvas转为blob并上传
canvas.toBlob(function (blob) {
  // 图片ajax上传
  var xhr = new XMLHttpRequest();
  // 开始上传
  xhr.open("POST", "upload.php", true);
  xhr.send(blob);
});
```

于是，经过“图片→canvas压缩→图片”三步曲，我们完成了图片前端压缩并上传的功能。

# 实现

**➦ HTML部分**

```html
<input id="file" type="file">
```

**➦ JS部分**

```js
;(function () {
  // 压缩图片需要的一些元素和对象
  const reader = new FileReader();
  const img = new Image();
  const eleFile = document.querySelector("#file");
  // 缩放图片需要的canvas
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  // 选择的文件对象
  let file = null;
  // base64地址图片加载完毕后
  img.onload = function () {
    // 图片原始尺寸
    const originWidth = this.width;
    const originHeight = this.height;
    // 最大尺寸限制
    const maxWidth = 400, maxHeight = 400;
    // 目标尺寸
    const targetWidth = originWidth, targetHeight = originHeight;
    // 图片尺寸超过400x400的限制
    if (originWidth > maxWidth || originHeight > maxHeight) {
      if (originWidth / originHeight > maxWidth / maxHeight) {
        // 更宽，按照宽度限定尺寸
        targetWidth = maxWidth;
        targetHeight = Math.round(maxWidth * (originHeight / originWidth));
      } else {
        targetHeight = maxHeight;
        targetWidth = Math.round(maxHeight * (originWidth / originHeight));
      }
    }

    // canvas对图片进行缩放
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    // 清除画布
    context.clearRect(0, 0, targetWidth, targetHeight);
    // 图片压缩
    context.drawImage(img, 0, 0, targetWidth, targetHeight);
    // canvas转为blob并上传
    canvas.toBlob(function (blob) {
      // 图片ajax上传
      const xhr = new XMLHttpRequest();
      // 文件上传成功
      xhr.onreadystatechange = function () {
        if (xhr.status == 200) {
          // xhr.responseText就是返回的数据
        }
      };
      // 开始上传
      xhr.open("POST", "upload.php", true);
      xhr.send(blob);
    }, file.type || "image/png");
  };
  // 文件base64化，以便获知图片原始尺寸
  reader.onload = function (e) {
    // e.target.result就是图片的base64地址信息
    img.src = e.target.result;
  };
  eleFile.addEventListener("change", (event) => {
    file = event.target.files[0];
    if (/image/.test(file.type)) {
      // 读取文件
      reader.readAsDataURL(file);
    }
  });
})();
```

# 参考

- https://www.zhangxinxu.com/wordpress/2017/07/html5-canvas-image-compress-upload/

