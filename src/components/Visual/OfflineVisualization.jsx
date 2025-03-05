import { useEffect, useRef } from 'react';

import { getScaledValue } from '../../utils';

const OfflineVisualization = ({
  drawBackground = () => {},
  buffer,
  color,
  draw,
  altText = 'waveform',
  height,
  debug = false,
}) => {
  const canvasRef = useRef();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const w = canvas.clientWidth * 2;
    const h = canvas.clientHeight * 2;
    canvas.width = w;
    canvas.height = h;
    context.clearRect(0, 0, w, h);
    //draw the background
    drawBackground(context, w, h);

    const lineWidth = 5;
    context.lineWidth = lineWidth;
    context.beginPath();
    if (buffer) {
      if (debug) {
        console.log(buffer.length);
      }
      buffer.forEach((v, i) => {
        if (draw) {
          draw(context, v, i, buffer, w, h, lineWidth);
        } else {
          const x = getScaledValue(
            i,
            0,
            buffer.length,
            lineWidth,
            w - lineWidth
          );
          const y = getScaledValue(
            v,
            Math.max(...buffer) * 1.1,
            Math.min(...buffer) * 1.1,
            0,
            h - lineWidth
          );
          i === 0 ? context.moveTo(x, y) : context.lineTo(x, y);
        }
      });
    }
    context.lineCap = 'round';
    context.strokeStyle = color;
    context.stroke();
  }, [buffer]);

  return (
    <canvas ref={canvasRef} style={{ height, width: '100%' }}>
      {altText}
    </canvas>
  );
};

export default OfflineVisualization;
