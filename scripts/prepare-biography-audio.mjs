// Generate a self-hosted recording using a separate synthesis tool process.
import { mkdtemp, mkdir, rm, writeFile, rename } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { hambardzumyanBiography as person } from '../data/biographies/Viktor_Hambardzumyan_Biography.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const work = await mkdtemp(join(tmpdir(), 'factum-armenian-voice-'))
try {
  console.log('Preparing the Armenian synthesis tool (first run requires internet)…')
  execFileSync('npm', ['install', '--prefix', work, '--cache', join(work, 'cache'), '--ignore-scripts', '--no-audit', '--no-fund', '--fetch-retries=0', '--fetch-timeout=20000', '@spelling-creator/spellophone@0.2.1'], { stdio: 'inherit', timeout: 120000 })
  const paragraphs = ['Վիկտոր Համբարձումյան', person.bio,
    ...person.biographySections.flatMap(section => [section.title, section.text]),
    'Կարևոր տարեթվեր', ...person.timeline.map(event => `${event.date}։ ${event.text}`)]
  await writeFile(join(work, 'text.json'), JSON.stringify(paragraphs))
  await writeFile(join(work, 'generate.mjs'), `
import { readFile, writeFile } from 'node:fs/promises';
import { createEspeak, encodeWav } from '@spelling-creator/spellophone/node';
const engine = await createEspeak({ languages: ['hy'] });
try {
  engine.setVoice('hy');
  const paragraphs = JSON.parse(await readFile(new URL('./text.json', import.meta.url), 'utf8'));
  const pieces = paragraphs.map(text => engine.synthesize(text, { rate: 145 }).samples);
  const samples = new Int16Array(pieces.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of pieces) { samples.set(part, offset); offset += part.length; }
  if (samples.length < engine.sampleRate) throw new Error('No usable Armenian audio was generated');
  await writeFile(new URL('./recording.wav', import.meta.url), encodeWav(samples, engine.sampleRate));
} finally { engine.dispose(); }
`)
  execFileSync(process.execPath, [join(work, 'generate.mjs')], { stdio: 'inherit', timeout: 120000 })
  const directory = join(root, 'public/audio/people')
  await mkdir(directory, { recursive: true })
  const staging = join(directory, 'hambardzumyan.tmp.mp3')
  try {
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', join(work, 'recording.wav'), '-codec:a', 'libmp3lame', '-b:a', '64k', staging], { stdio: 'inherit', timeout: 120000 })
    await rename(staging, join(directory, 'hambardzumyan.mp3'))
  } finally { await rm(staging, { force: true }) }
  console.log('Ready: public/audio/people/hambardzumyan.mp3. Refresh the biography page.')
} catch {
  console.error('Recording could not be prepared. Check internet access, Node.js 24+ and ffmpeg, then run npm run voice:prepare again.')
  process.exitCode = 1
} finally { await rm(work, { recursive: true, force: true }) }
