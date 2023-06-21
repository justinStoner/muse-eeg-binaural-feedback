import Faust from '@grame/libfaust/FaustLibrary';
import FaustModule from '@grame/libfaust/libfaust-wasm';

const getcode = () => `import("stdfaust.lib");
process = ba.pulsen(1, ba.hz2midikey(freq) * 1000) : pm.marimba(freq, 0, 7000, 0.5, 0.8) * gate * gain with {
  freq = hslider("freq", 440, 40, 8000, 1);
  gain = hslider("gain", 0.5, 0, 1, 0.01);
  gate = button("gate");
};
effect = dm.freeverb_demo;`;

function play(node) {
  node.start();
  node.keyOn(0, 60, 100);
  setTimeout(() => node.keyOn(0, 64, 40), 500);
  setTimeout(() => node.keyOn(0, 67, 80), 1000);
  setTimeout(() => node.allNotesOff(), 5000);
  setTimeout(() => play(node), 7000);
}
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
document.body.style.cursor = 'wait';

FaustModule().then((module) => {
  let compiler = Faust.createCompiler(Faust.createLibFaust(module));
  console.log('Faust compiler version ' + compiler.version());
  let factory = Faust.createPolyFactory();
  factory
    .compileNode(
      audioCtx,
      'Faust',
      compiler,
      getcode(),
      null,
      '-ftz 2',
      4,
      false,
      128
    )
    .then((node) => {
      document.body.style.cursor = 'initial';
      node.connect(audioCtx.destination);
      play(node);
    });
});
const unlockAudioContext = (audioCtx) => {
  if (audioCtx.state !== 'suspended') return;
  const b = document.body;
  const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
  const unlock = () => audioCtx.resume().then(clean);
  const clean = () => events.forEach((e) => b.removeEventListener(e, unlock));
  events.forEach((e) => b.addEventListener(e, unlock, false));
};
unlockAudioContext(audioCtx);
