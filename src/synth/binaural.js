import { leftChannel, rightChannel } from '../store';

const getFM = () => {
  return null;
};

const getAM = () => {
  return null;
};
let graph = {};
const Synth = ({ left, right }) => {
  let active = false;
  const getGraph = (chan) => {
    let osc, fm, am;
    if (chan.useFM && !chan.useAM) {
      fm = getFM(chan);
    }
    if (!chan.useFM && chan.useAM) {
      am = getAM(chan);
    }
    if (chan.useFM && chan.useAM) {
      fm = getFM(chan);

      am = getAM(chan);
    }
    if (!chan.useFM && !chan.useAM) {
    }

    return { fm, am, osc };
  };

  left.state.subscribe((chan) => {
    graph = Object.assign({}, graph, getGraph(chan, 'left'));
    if (active) {
      return graph;
    }
  });

  right.state.subscribe((chan) => {
    graph = Object.assign({}, graph, getGraph(chan, 'right'));
    if (active) {
      return graph;
    }
  });

  const start = () => {
    if (!active) {
      active = true;
    }
  };

  const stop = () => {
    if (active) {
      active = false;
    }
  };

  return {
    start,
    stop,
  };
};

export default Synth({ left: leftChannel, right: rightChannel });
