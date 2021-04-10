## hello world

创建一个audio实例，然后当点击页面上的播放按钮的时候，调用`audio.play`方法播放音频，当点击暂停按钮的时候则调用`audio.pause`方法暂停播放

```js
const src = 'https://mp32.9ku.com/upload/128/2018/02/09/875689.mp3';
const audio = new Audio(src);
audio.addEventListener('canplaythrough', (event) => {
    console.log('audio canplaythrougn now!');
    const playBtn = document.getElementById('play');
    const pauseBtn = document.getElementById('pause');
    playBtn.onclick = function () {
        console.log('play audio!')
        audio.play();
    }
    pauseBtn.onclick = function () {
        console.log('audio paused');
        audio.pause();
    }
});
```


## 互斥播放

同一个页面多个audio实例，其中一个audio播放时将其他audio暂停

```js
const audios = document.getElementsByTagName('audio')
const leng = audios.length
let i = -1;
while (++i < leng) {
  const au = audios[i];
  // 这里不能直接用i在回调里进行判断，因为在实际触发onplaying的时候，i的值已经是4了
  au.onplaying = (function (index) {
    return e => {
      let j = -1;
      while (++j < leng) {
        if (j !== index) {
          audios[j].pause()
          console.log('pause', j, audios[j].id)
        }
      }
    }
  })(i)
}
```



## 监听进度

页面上展示一个播放按钮、一个暂停按钮和控制音量加减的按钮。

同时还需要展示音频总时长和当前已播放的时长信息，以及通过进度条显示当前已播放的进度（蓝色）、当前缓冲完毕的进度（灰色）

<img src="audio.assets/image-20210410170304368.png" alt="image-20210410170304368" style="zoom:50%;" />

音频总长度可以通过`audio.duration`获取到，这是一个只读的变量。

### 监听缓冲进度

通过`audio.buffered`可以获取到当前已经缓冲的部分，获取到的是一个TimeRange对象，通过其`start`,`end`方法可以获取到对应缓冲时段

```js
const currentLoaded = audio.buffered.end(audio.buffered.length - 1);
```

设置一个定时循环去获取已缓冲的部分

```js
 const timer = setInterval(() => {
        if (loaded) {
            return clearTimeout(timer);
        }
        const currentLoaded = audio.buffered.end(audio.buffered.length - 1);
        progressBarBuffer.style.width = `${currentLoaded / duration * 100}%`
        loaded = currentLoaded >= duration;
    }, 500)
```

### 监听播放进度

通过`timeupdate`事件可以监听到音频当前播放事件变化，当播放进度变化的时候，动态去修改进度条宽度和对应的文字信息

```js
audio.ontimeupdate = throttle(function (e) {
    const cur = audio.currentTime, dur = duration;
    setProgressText(`${toMinute(cur)} / ${toMinute(dur)}`)
    progressBarCurrent.style.width = `${cur / dur * 100}%`
}, 1000)
```



### 点击跳转到指定位置播放

点击进度条的指定位置后，跳转到对应的位置进行播放，同时更新进度条。

这个可以通过在进度条上加一个`onclick`监听，当点击进度条的时候，可以获取到点击的坐标位置`x`，计算出`x`到进度起点的相对位置`offset`

这里还要将进度条的长度和音频的总时长建立起关系，进度条总时长可以通过其`offsetWidth`属性获取到，然后相当于进度条每偏移一个像素，则播放时长对应偏移`duration / offsetWidth`时长

此时就可以知道，点击的位置相对于进度条偏移量`offset`对应的音频跳转位置了。音频的跳转通过改变其`currentTime`属性来实现

```js
progressBar.onclick = function (e) {
  if (!progressBarWidth) progressBarWidth = progressBar.offsetWidth;
  const offset = e.clientX - progressBar.offsetLeft;
	position2currentTime(offset)
}

function position2currentTime(offset) {
    const currentTime = offset / progressBarWidth * duration;
    audio.currentTime = currentTime;
}
```



### 完整实现代码

html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <link rel="stylesheet" href="index.css">
</head>

<body>

    <button id="play">play</button>
    <button id="pause">pause</button>
    <button id="add">+</button>
    <button id="sub">-</button>

    <div class="progress">
        <div class="progress-text"></div>
        <div id="progress-bar">
            <div id="progress-bar-ready"></div>
            <div id="progress-bar-current"></div>
        </div>
    </div>
</body>
<script src="./scripts/index.js"></script>
</html>
```

JavaScript代码

```js
function throttle(fn, timeout) {
    const _context = this;
    let _timer, lastInvoke = 0;
    const _timeout = timeout || 100;
    function invoke(...args) {
        fn.apply(_context, ...args)
        clearTimeout(_timer);
        _timer = null;
    }
    function throttled(...args) {
        const remaining = lastInvoke + _timeout - Date.now();
        if (remaining <= 0) {
            invoke(...args)
        } else if (!_timer) {
            _timer = setTimeout(() => {
                invoke()
            }, _timeout);
        }
    }
    return throttled;
}

const src = 'https://mp32.9ku.com/upload/128/2018/02/09/875689.mp3'
const audio = new Audio(src);
const logger = console.log;
const STEP = 0.1;

const playBtn = document.getElementById('play');
const pauseBtn = document.getElementById('pause');
const addBtn = document.getElementById('add');
const subBtn = document.getElementById('sub');
const progressText = document.querySelectorAll('.progress-text')[0]
const progressBarCurrent = document.getElementById('progress-bar-current')
const progressBarBuffer = document.getElementById('progress-bar-ready')
const progressBar = document.getElementById('progress-bar')

let duration, progressBarWidth;

function setProgressText(text) {
    progressText.innerHTML = `>> ${text}`;
}

function toMinute(time) {
    const minute = Math.floor(time / 60);
    const second = Math.round(time % 60);
    return `${minute}:${second}`
}

function position2currentTime(offset) {
    const currentTime = offset / progressBarWidth * duration;
    audio.currentTime = currentTime;
}

function init() {
    audio.autoplay = false;
    playBtn.onclick = function () {
        console.log('play audio!')
        audio.play();
    }
    pauseBtn.onclick = function () {
        console.log('audio paused');
        audio.pause();
    }


    addBtn.onclick = function (e) {
        const current = audio.volume;
        const next = Number((current + STEP).toPrecision(2));
        audio.volume = Math.min(next, 1)
        logger('new volume: ', audio.volume)
    }

    subBtn.onclick = function (e) {
        const current = audio.volume;
        const next = Number((current - STEP).toPrecision(2));
        audio.volume = Math.max(next, 0)
        logger('new volume: ', audio.volume)
    }
    progressBar.onclick = function (e) {
        if (!progressBarWidth) progressBarWidth = progressBar.offsetWidth;
        const offset = e.clientX - progressBar.offsetLeft;
        position2currentTime(offset)
    }
}

audio.ontimeupdate = throttle(function (e) {
    const cur = audio.currentTime, dur = duration;
    setProgressText(`${toMinute(cur)} / ${toMinute(dur)}`)
    progressBarCurrent.style.width = `${cur / dur * 100}%`
}, 1000)

audio.addEventListener('canplay', (event) => {
    console.log('audio canplaythrougn now!');
});

audio.ondurationchange = function (e) {
    duration = audio.duration;
    logger('duration: ', duration)
}


audio.onloadeddata = function (e) {
    init()
    let loaded = false;
    const timer = setInterval(() => {
        if (loaded) {
            return clearTimeout(timer);
        }
        const currentLoaded = audio.buffered.end(audio.buffered.length - 1);
        progressBarBuffer.style.width = `${currentLoaded / duration * 100}%`
        loaded = currentLoaded >= duration;
    }, 500)
}

```
