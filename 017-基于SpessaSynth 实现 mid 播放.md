# 楔子

最近项目中有一个需求：在前端实现 .mid 资源的播放。经过调研，我们选择了 [SpessaSynth](https://github.com/spessasus/SpessaSynth) 作为解决方案。

> SpessaSynth 是一个基于 SoundFont2 的纯 JavaScript 实时合成器和 MIDI 播放器库。它功能强大，可以轻松读取、写入或播放 MIDI 文件，并支持读取/写入 SF2/SF3 文件。
>
> —— 摘自官网

# 使用

## 准备

1. 创建项目

   ```shell
   $ pnpm create vite spessasynth-demo --template react-ts
   $ cd spessasynth-demo
   $ pnpm install
   ```

2. 安装依赖

   ```shell
   $ pnpm add spessasynth_lib
   ```

3. 导入 `worklet` 模块，点击下载 [worklet_processor.min.js](https://github.com/spessasus/SpessaSynth/blob/master/src/spessasynth_lib/synthetizer/worklet_processor.min.js) 文件，并将其拷贝至项目目录中。

   > 提示：参考 [这里 >>](https://github.com/spessasus/SpessaSynth/wiki/Importing-The-Worklet)

4. 音色库： 例如 [SGM.sf3](https://github.com/spessasus/SpessaSynth/blob/master/soundfonts/SGM.sf3)

   > 提示：你也可以使用自己的音色库，将其放置在项目目录中即可。

## 源码

以下是一个基于 SpessaSynth 实现的简单示例，展示了如何加载 .mid 文件并实现播放、暂停、停止以及从指定位置开始播放的功能。更多用法可以请参考 [使用指南 >>]( https://github.com/spessasus/SpessaSynth/wiki/Usage-As-Library)

```tsx
import React, { ChangeEvent, useEffect, useRef } from "react";

// -- 导入依赖
import { Synthetizer, Sequencer } from "spessasynth_lib";

// -- 导入音色库
import hxp_sf3_1 from "./soundfonts/hxp_sf3_1.sf3";
import hxp_sf3_2 from "./soundfonts/hxp_sf3_2.sf3";
// -- 导入样式
import "./App.css";

const App: React.FC = () => {
  // -- refs
  const seq = useRef<Sequencer | null>(null);
  const synth = useRef<Synthetizer | null>(null);
  const midiFile = useRef<ArrayBuffer | null>(null);
  const audioCtx = useRef<AudioContext | null>(null);
  const soundfonts = useRef<ArrayBuffer | null>(null);

  // -- methods
  const getAudioContext = async () => {
    if (!audioCtx.current) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioCtx.current = new AudioContext();
      await audioCtx.current.audioWorklet.addModule("/worklet_processor.min.js");
    }
    return audioCtx.current;
  };

  const concatArrayBuffers = (...buffers: ArrayBuffer[]): ArrayBuffer => {
    const totalLength = buffers.reduce((sum, { byteLength }) => sum + byteLength, 0);
    const concatenatedBuffer = new Uint8Array(totalLength);
    let offset = 0;
    buffers.forEach((buffer) => {
      concatenatedBuffer.set(new Uint8Array(buffer), offset);
      offset += buffer.byteLength;
    });
    return concatenatedBuffer.buffer;
  };

  // -- events
  const onPlay = async () => {
    if (!midiFile.current || !synth.current) return;
    if (seq.current) {
      seq.current?.play();
    } else {
      seq.current = new Sequencer([{ binary: midiFile.current, altName: "" }], synth.current);
      seq.current.loop = false;
      seq.current.addOnSongEndedEvent(() => {
        console.log("播放结束");
      }, "_");
    }
  };
  const onPause = () => {
    seq.current?.pause();
  };
  const onStop = () => {
    seq.current?.stop();
  };
  const onReplay = () => {
    seq.current?.play(true);
  };
  const onPlayAt20Seconds = () => {
    seq.current!.currentTime = 110;
    seq.current?.play();
  };

  const onFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !soundfonts.current) return;

    const audioCtx = await getAudioContext();
    midiFile.current = await file.arrayBuffer();
    synth.current = new Synthetizer(audioCtx.destination, soundfonts.current);
  };

  // -- 加载 sf3 资源
  const loadSoundfonts = async () => {
    // -- 由于这边准备了两个音色库文件，因此需要将其拼接在一起
    // -- 如果你只有一个音色库文件，则直接获取其arrayBuffer即可
    const sfont1 = await (await fetch(hxp_sf3_1)).arrayBuffer();
    const sfont2 = await (await fetch(hxp_sf3_2)).arrayBuffer();
    soundfonts.current = concatArrayBuffers(sfont1, sfont2);
  };
  useEffect(() => {
    loadSoundfonts();
  }, []);

  return (
    <div className="app">
      <input type="file" accept=".mid, .rmi" onChange={onFileChange} />
      <div className="buttons">
        <button onClick={onPlay}>播放</button>
        <button onClick={onPause}>暂停</button>
        <button onClick={onStop}>停止</button>
        <button onClick={onReplay}>重播</button>
        <button onClick={onPlayAt20Seconds}>从 20 秒开始播放</button>
      </div>
    </div>
  );
};
export default App;

```

# 尾言

在这篇博客中，我们介绍了如何使用 SpessaSynth 库在前端实现 .mid 文件的播放。通过简单的配置和代码示例，我们展示了如何加载 MIDI 文件、使用音色库，并实现基本的播放控制功能。这只是 SpessaSynth 功能的一部分，它还支持许多高级功能，如实时合成和对 SF2/SF3 文件的操作。

使用 SpessaSynth 可以方便地将 MIDI 文件播放功能集成到前端应用中，无需额外的插件或后台支持，极大地简化了开发流程。对于有更复杂音频处理需求的项目，这个库也提供了强大的扩展能力。

希望这篇博客能帮助你快速上手 SpessaSynth，并激发你在项目中探索更多的音频处理可能性。如果你有任何问题或想分享你的使用体验，欢迎在评论区留言！
