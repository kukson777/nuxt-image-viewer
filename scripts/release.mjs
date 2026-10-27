// Publishes the version prepared by `npm run release:notes`: commits CHANGELOG.md and
// package.json, tags, publishes to npm, pushes, and creates the GitHub release with the
// notes of this version — the Highlights written by hand included, not only the
// generated list (what `changelogen --release` would put there)
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const run = command => execSync(command, { stdio: 'inherit' })

const { version } = JSON.parse(readFileSync('package.json', 'utf8'))
const tag = `v${version}`

const changelog = readFileSync('CHANGELOG.md', 'utf8')
const start = changelog.indexOf(`## ${tag}\n`)
if (start === -1)
  throw new Error(`CHANGELOG.md has no "## ${tag}" section — run \`npm run release:notes\` first`)
const end = changelog.indexOf('\n## v', start + 1)
const notes = changelog.slice(changelog.indexOf('\n', start) + 1, end === -1 ? undefined : end).trim()

run('git add CHANGELOG.md package.json package-lock.json')
run(`git commit -m "chore(release): ${tag}"`)
run(`git tag -a ${tag} -m ${tag}`)
// prepack builds the module
run('npm publish')
run('git push --follow-tags')
execSync(`gh release create ${tag} --title ${tag} --notes-file -`, { input: notes, stdio: ['pipe', 'inherit', 'inherit'] })
