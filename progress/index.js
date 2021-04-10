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

const src = 'https://mp32.9ku.com/upload/128/2018/02/09/875689.mp3';
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
    logger('seek: ', position2currentTime(offset))
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
