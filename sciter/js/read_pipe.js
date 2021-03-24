import { PLATFORM } from '@env';
import { decode } from '@sciter';

export async function* read_pipe(pipe, EOL = PLATFORM === 'Windows' ? '\r\n' : '\n') {
  const buffer = [];
  while (pipe) {
    const bytes = await try_read_pipe(pipe);
    if (bytes === null) return;
    const chars = decode(bytes);
    for (const char of chars) {
      buffer.push(char);
      const tail = buffer.slice(-EOL.length).join('');
      if (tail === EOL) {
        const line = buffer.join('').replace(EOL, '');
        yield line;
        buffer.length = 0;
      }
    }
  }
}

function try_read_pipe(pipe) {
  try {
    return pipe.read();
  } catch (e) {
    return null;
  }
}