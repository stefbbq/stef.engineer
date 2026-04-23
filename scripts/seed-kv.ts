/**
 * downloads data from Firestore and writes JSON files for KV seeding
 *
 * usage:
 *   pnpm seed              # downloads from Firestore, writes to scripts/data/
 *   wrangler kv:put ...    # then seed KV (commands printed at the end)
 */

import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, getDoc, getDocs, query, orderBy } from 'firebase/firestore'
import { writeFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const firebaseConfig = {
  apiKey: 'AIzaSyBwAW83gmnREYJbiEUw2sWKzToG7t5WZfI',
  authDomain: 'internet-nerd-online.firebaseapp.com',
  projectId: 'internet-nerd-online',
  storageBucket: 'internet-nerd-online.appspot.com',
  messagingSenderId: '1030519790910',
  appId: '1:1030519790910:web:73e094c12307e3652de06f',
}

const app = initializeApp(firebaseConfig)
const database = getFirestore(app)

const fetchDoc = async (collectionName: string, docId: string) => {
  const docRef = doc(database, collectionName, docId)
  const snap = await getDoc(docRef)
  if (!snap.exists()) throw new Error(`document ${collectionName}/${docId} not found`)
  return snap.data()
}

const fetchCollection = async (collectionName: string) => {
  const snapshot = await getDocs(query(collection(database, collectionName), orderBy('id')))
  const data: unknown[] = []
  snapshot.forEach(document => data.push(document.data()))
  return data
}

const main = async () => {
  const outputDir = join(__dirname, 'data')
  mkdirSync(outputDir, { recursive: true })

  console.log('downloading from Firestore...\n')

  const about = await fetchDoc('general', 'about')
  console.log('  general/about ✓')

  const softSkills = await fetchDoc('general', 'softSkills')
  console.log('  general/softSkills ✓')

  const skills = await fetchCollection('skills')
  console.log(`  skills (${skills.length} items) ✓`)

  const experience = await fetchCollection('experience')
  console.log(`  experience (${experience.length} items) ✓`)

  const technologies = await fetchCollection('technologies')
  console.log(`  technologies (${technologies.length} items) ✓`)

  const menu = await fetchCollection('menu')
  console.log(`  menu (${menu.length} items) ✓`)

  const kvData: Record<string, unknown> = {
    'general:about': about,
    'general:softSkills': softSkills,
    'skills': skills,
    'experience': experience,
    'technologies': technologies,
    'menu': menu,
  }

  for (const [key, value] of Object.entries(kvData)) {
    const filename = key.replace(':', '_') + '.json'
    const filepath = join(outputDir, filename)
    writeFileSync(filepath, JSON.stringify(value, null, 2))
    console.log(`  wrote ${filepath}`)
  }

  console.log('\n--- KV seed commands ---')
  console.log('run these with your KV namespace ID:\n')
  for (const key of Object.keys(kvData)) {
    const filename = key.replace(':', '_') + '.json'
    console.log(`wrangler kv key put --namespace-id=YOUR_KV_ID "${key}" --path=scripts/data/${filename}`)
  }

  console.log('\ndone.')
  process.exit(0)
}

main().catch(error => {
  console.error('seed failed:', error)
  process.exit(1)
})
