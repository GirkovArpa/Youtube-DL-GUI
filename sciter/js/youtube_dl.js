import { $ } from '@sciter';
import { spawn } from '@sys';
import { read_pipe } from './read_pipe.js';

export async function* download(url, format, audio = false) {
  const params = [
    '--newline',
    //'--recode-video',
    '--merge-output-format',
    format,
    '--output',
    $('select.folder>caption').textContent + '/%(title)s.%(ext)s',
    url
  ];
  const yt_dl = spawn(['./youtube-dl.exe', ...params], { stdout: 'pipe', stderr: 'pipe' });
  for await (const line of read_pipe(yt_dl.stdout, '\n')) {
    console.log(`[STDOUT] ${line}`);
    const data = handle_line(line);
    if (data !== null) {
      data.source = 'stdout';
      yield data;
    }
  }
  for await (const line of read_pipe(yt_dl.stderr, '\n')) {
    console.log(`[STDERR] ${line}`);
    const data = handle_line(line);
    if (data !== null) {
      data.source = 'stderr',
      yield data;
    }
  }
}

function handle_line(line) {
  if (line.startsWith('[youtube]')) {
    const re = /^\[youtube] .+: (.+)$/;
    const [match_youtube, youtube] = line.match(re) || [null];
    if (match_youtube !== null) {
      const output = {
        type: 'downloading webpage'
      };  
      return output;
    }
  }
  if (/^Deleting original file/.test(line)) {
    const output = {
      type: 'deleting original file'
    };
    return output;
  }
  if (line.startsWith('[download]')) {
    const [match_title, title] = line.match(/^\[download] Destination: (.+)\..+\..+$/) || [null];
    if (match_title !== null) {
      const output = {
        type: 'title',
        title
      };
      return output;
    }
    const [match_progress, percent, size, speed, eta] = line.match(/^\[download] +([\d\.]+)% of ([\d\.]+.+) at +([\d\.]+.+) ETA (\d+:\d+)$/) || [null];
    if (match_progress !== null) {
      const output = {
        type: 'progress',
        percent,
        size, 
        speed, 
        eta
      };
      return output;
    }
    const [match_complete, , duration] = line.match(/^\[download] 100% of ([\d\.]+.+) in ([\d:]+)$/) || [null];
    if (match_complete !== null) {
      const output = {
        type: 'complete',
        duration
      };
      return output;
    }
  }
  if (line.startsWith('{')) {
    const json = JSON.parse(line);
    const { title } = json;
    const output = {
      type: 'title',
      title
    };
    return output;
  }
  return null;
}