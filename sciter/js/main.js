import { $, $$ } from '@sciter';
import * as env from '@env';
import * as sys from '@sys';
import { download } from './youtube_dl.js';

adjustWindow();

//setTimeout(() => screenshot(), 10000);

async function screenshot() {
  const image = new Graphics.Image(900, 580, document);
  console.log(image);
  const bytes = image.toBytes('png');
  console.log(bytes);
  const path = sys.cwd() + '/screenshot.png';
  try {
    const file = await sys.fs.open(path, "w+", 0o666);
    await file.write(bytes);
  } catch (e) {
    Window.this.modal(<warning>Cannot open file {path} for writing.<br />{e}<br />Settings will not be saved.</warning>);
  }
}

document.on('click', 'li', function (_, li) {
  if (li.textContent === 'About') {
    Window.this.modal(
      <info caption="About">
        This application uses <a href="https://sciter.com">Sciter</a> Engine,
        © Terra Informatica Software, Inc.,
        and is MIT-licensed, © 2021 Girkov Arpa
      </info>
    );
  }
});

$('button.cloud-download').on('click', async function () {
  for (const tr of $$('tbody>tr')) {
    await download_item(tr);
  }
});

async function download_item(tr) {
  tr.$('(status)').textContent = 'Pre-Processing';
  const url = tr.$('(title)').textContent;
  const format = tr.$('(extension)').textContent;
  for await (const output of download(url, format)) {
    const { type } = output;
    console.log(JSON.stringify(output));
    switch (type) {
      case 'title': {
        const { title } = output;
        tr.$('(title)').textContent = title.slice(title.lastIndexOf('\\') + 1);
        tr.$('(status)').textContent = 'Downloading';
        break;
      }
      case 'progress': {
        const { percent, size, speed, eta } = output;
        tr.$('(percent)').textContent = percent + '%';
        tr.$('(size)').textContent = size;
        tr.$('(speed)').textContent = speed;
        tr.$('(eta)').textContent = eta;
        break;
      }
      case 'complete': {
        tr.$('(status)').textContent = 'Post-Processing';
        break;
      }
      case 'deleting original file': {
        tr.$('(status)').textContent = 'Complete';
        break;
      }
    }
  }
}

function adjustWindow() {
  const [w, h] = [900, 580];
  const [sw, sh] = Window.this.screenBox('frame', 'dimension');
  Window.this.move((sw - w) / 2, (sh - h) / 2, w, h, true);
}

$('.format>.row>select>caption').attributes.readonly = true;

const paths = ['Downloads', 'Desktop', 'Videos', 'Music'].map((path, i) => {
  return <option>{env.path('USER_HOME') + '/' + path}</option>;
});
$('select.folder>popup').append(paths);
$('select.folder>caption').textContent = env.path('USER_HOME') + '/Downloads';

$('button.folder').on('click', function () {
  const folder = Window.this.selectFolder({
    mode: 'open',
    caption: 'Choose Directory'
  });

  $('select.folder').value = folder.replace('file://', '');
});

$('span.gear').on('click', function () {
  const [, , , screenHeight] = Window.this.box('screen', 'dimension');
  const [sx, sy] = Window.this.box('position');
  const { offsetLeft, offsetTop } = this;
  const height = +this.style.height.match(/\d+/)[0] + 7;
  $('menu.gear').popupAt(offsetLeft - sx, (offsetTop - sy) + height, 7);
});

$('button.add').on('click', function () {
  const format = $('select#format>caption').value.replace('default', 'mp4');
  const END_OF_LINE = /[\r\n]+/;
  const lines = $('textarea.urls').value.trim().split(END_OF_LINE);
  const trs = lines.map((url) => {
    return <tr role="option">
      <td name="title">{url}</td>
      <td name="extension">{format}</td>
      <td name="size">-</td>
      <td name="percent">0%</td>
      <td name="eta">-</td>
      <td name="speed">-</td>
      <td name="status">Queued</td>
    </tr>
  });

  $('tbody').append(trs);
});

$('button.delete').on('click', function () {
  const response = Window.this.modal(
    <question caption="Delete">
      <content>Are you sure you want to remove the selected items?</content>
      <buttons>
        <button id="yes" role="default-button">Yes</button>
        <button id="no" role="cancel-button">No</button>
      </buttons>
    </question>
  );
  if (response === 'yes') {
    $$('tbody>tr:checked').forEach((tr) => tr.remove());
  }
});