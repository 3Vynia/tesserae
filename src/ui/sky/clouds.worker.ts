import { renderClouds, type CloudOptions } from './clouds';

self.onmessage = async (e: MessageEvent<CloudOptions>) => {
  const options = e.data;
  const canvas = new OffscreenCanvas(options.size, options.size);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    self.postMessage(null);
    return;
  }
  ctx.putImageData(new ImageData(renderClouds(options), options.size, options.size), 0, 0);
  self.postMessage(await canvas.convertToBlob({ type: 'image/png' }));
};
