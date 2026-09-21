# 楔子

在最近的项目中，需要实现一个功能，允许用户批量选择文件并将其打包成一个 .zip 压缩包进行下载。

要实现这个功能，实际上主要分成两步：

1. 将选中资源打包成 .zip 压缩包
2. 下载压缩包

为此，我们可以使用一些第三方库来简化这一过程。

# 三方库比较

在调研过程中，我对比了几个常用库的优缺点，以下是具体分析：


### 📒 压缩文件的库

| 库名 | 下载量 | Star | 功能 | 适用场景 | 浏览器兼容性 | 性能 |
| --- | --- | --- | --- | --- | --- | --- |
| [jszip](https://www.npmjs.com/package/jszip) | 787w+ | 1.3k | 一个用于创建、读取和编辑 .zip 文件的库。它可以在浏览器和 Node.js 环境中使用。 | 适用于需要在客户端或服务器端处理压缩文件的场景，提供了丰富的 API，可以方便地进行文件压缩、解压和编辑。 | 支持大多数现代浏览器，包括 Chrome、Firefox、Safari 和 Edge。 | 性能相对较好，但在处理非常大的文件或数据集时，可能会显得稍慢。 |
| [fflate](https://www.npmjs.com/package/fflate) | 499w+ | 2.1k | 一个快速且轻量级的压缩库，专注于高性能和小体积。它支持浏览器和 Node.js 环境，并提供同步和异步的 API。 | 适用于对性能和体积有较高要求的项目，尤其是在需要处理大量数据或需要在资源受限环境中运行的情况下。 | 支持所有现代浏览器，包括 Chrome、Firefox、Safari 和 Edge。对老版本浏览器的兼容性可能略逊于 JSZip。 | 由于其轻量级设计，fflate 的性能优于 JSZip，特别是在处理大文件或需要快速压缩和解压的场景中 |

### 📒 文件保存的库

| 库名 | 下载量 | Star | 功能 | 适用场景 | 浏览器兼容性 | 性能 |
| --- | --- | --- | --- | --- | --- | --- |
| [file-saver](https://www.npmjs.com/package/file-saver) | 287w+ | 21.4k | FileSaver.js 是一个简单的库，用于在客户端保存文件。它主要用于触发浏览器的下载功能，将 Blob 对象或文件直接下载到用户的设备。 | 适用于需要在浏览器中保存文件的场景，特别是当需要提供文件下载功能时，例如导出表格数据或图片。 | 支持所有现代浏览器，包括 Chrome、Firefox、Safari 和 Edge。此外，还兼容 IE 10+。 | 由于功能简单，性能表现优异，能够快速触发下载操作。 |
| [browser-fs-access](https://www.npmjs.com/package/browser-fs-access) | 4w+ | 1.4k | 提供了一组用于在浏览器中访问文件系统的 API，使用户能够选择文件进行读取或保存。它基于现代 Web API，如 File System Access API。 | 适用于需要更多文件系统交互功能的场景，例如允许用户选择文件进行上传或选择保存位置。 | 主要支持 Chrome 和 Edge，对其他浏览器如 Firefox 和 Safari 的支持较为有限。 | 性能良好，尤其是在 Chrome 和 Edge 中表现最佳，提供了直观的文件选择和保存体验。 |

**🚀 综合推荐**

根据以上对比，如果需要将多个文件打包成 .zip 并在浏览器中下载，推荐以下组合：

1. 使用 jszip 或 fflate 进行文件压缩：
   - 如果你更关注功能的丰富性和浏览器兼容性，选择 JSZip。
   - 如果你更关注性能和轻量级，选择 fflate。
2. 使用 FileSaver.js 进行文件下载：
   - FileSaver.js 简单易用，广泛兼容主流浏览器，适合大多数导出文件的需求。

这种组合可以确保在大多数浏览器中提供最佳的用户体验，同时兼顾功能性和性能。

# 实现

根据业务需求，最终选择 `fflate` + `FileSaver.js` 实现文件压缩和下载功能，下面是具体示例：

安装依赖：

```shell
$ pnpm add fflate file-saver
$ pnpm add types/file-saver --save-dev
```

工具函数：

```ts
import { zipSync } from 'fflate';
import { saveAs } from 'file-saver';

/**
 * 压缩文件并下载
 * @param opts
 * @param {string} opts.zipName - 压缩包名称
 * @param {Array<{ url: string; filename: string }>} opts.files - 文件列表
 * @param {() => void} [opts.onSuccess] - 下载成功的回调
 * @param {(v: number) => void} [opts.onProgress] - 下载进度的回调
 * @param {(error: Error) => void} [opts.onError] - 下载出错的回调
 */
const fetchAndZipFiles = async (opts: {
  zipName: string;
  files: Array<{ url: string; filename: string }>;
  onSuccess?: () => void;
  onProgress?: (v: number) => void;
  onError?: (error: Error) => void;
}) => {
  const { zipName, files, onProgress, onError, onSuccess } = opts;
  onProgress?.(5);

  const zipFiles: Record<string, Uint8Array> = {};
  const totalFiles = files.length;

  let downloadedFiles = 0;

  try {
    for (const file of files) {
      if (!file.filename) {
        throw new Error('File name is missing');
      }

      const response = await fetch(file.url);

      if (!response.ok) {
        throw new Error(`Failed to fetch ${file.url}: ${response.statusText}`);
      }

      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      zipFiles[file.filename] = new Uint8Array(arrayBuffer);

      downloadedFiles += 1;
      // -- 更新进度以反映基于文件数量的总进度的90%
      onProgress?.(5 + Math.round((downloadedFiles / totalFiles) * 90));
    }

    const zipData = zipSync(zipFiles);
    const zipBlob = new Blob([zipData], { type: 'application/zip' });
    saveAs(zipBlob, `${zipName}.zip`);

    // -- 保存文件后，将进度设置为100%
    onProgress?.(100);
    onSuccess?.();
  } catch (error) {
    onError?.(error);
  }
};
```

调用示例：

```ts
const files = [
  { url: 'https://example.com/file1.png', filename: 'file1.png' },
  { url: 'https://example.com/file2.mp3', filename: 'file2.mp3' }
];

fetchAndZipFiles({
  files,
  zipName: 'files',
  onProgress: progress => {
    console.log(progress);
  },
  onError: error => {
    console.log(error);
  },
  onSuccess: () => {
    console.log('导出成功');
  }
});
```

# 尾言

这篇博客介绍了如何使用 fflate 和 FileSaver.js 实现批量文件打包下载，适用于需要在客户端进行文件压缩和下载的场景。通过选择合适的库和优化代码，你可以确保在各类浏览器中提供良好的用户体验。如果您觉得这边文章帮到了您，希望得到您的点赞和关注，谢谢！