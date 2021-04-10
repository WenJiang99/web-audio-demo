document.dispatchEvent(new MouseEvent('click'))

var audioCtx = new AudioContext();
const audio = document.getElementById('my-audio')
audio.autoplay = true;
const gain = audioCtx.createGain()
const source = audioCtx.createMediaElementSource(audio)

source.connect(gain)
gain.connect(audioCtx.destination)
// audio.play()
