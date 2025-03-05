export const chartStyles = {
  wrapperStyle: {
    display: 'flex',
    flexWrap: 'wrap',
    padding: '20px',
  },
};

export const emptyChannelData = {
  ch0: {
    datasets: [{}],
  },
  ch1: {
    datasets: [{}],
  },
  ch2: {
    datasets: [{}],
  },
  ch3: {
    datasets: [{}],
  },
  ch4: {
    datasets: [{}],
  },
};

export const emptyAuxChannelData = {
  ch0: {
    datasets: [{}],
  },
  ch1: {
    datasets: [{}],
  },
  ch2: {
    datasets: [{}],
  },
  ch3: {
    datasets: [{}],
  },
  ch4: {
    datasets: [{}],
  },
};

export const emptySingleChannelData = {
  ch1: {
    datasets: [{}],
  },
};

export const generalOptions = {
  scales: {
    y: [
      {
        scaleLabel: {
          display: true,
        },
      },
    ],
    x: [
      {
        scaleLabel: {
          display: true,
        },
      },
    ],
  },
  elements: {
    point: {
      radius: 0,
    },
  },
  title: {
    display: true,
    text: 'Channel',
  },
  responsive: true,
  tooltips: { enabled: false },
};
