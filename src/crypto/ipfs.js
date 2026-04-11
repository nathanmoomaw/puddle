/**
 * IPFS metadata pinning via Pinata.
 *
 * Set VITE_PINATA_JWT in your .env to enable. If unset, pinPuddleMetadata
 * returns null and minting proceeds without IPFS (tokenURI will be empty
 * until a metadata URI is set, which is fine for Phase 1).
 *
 * Metadata follows the OpenSea NFT standard so Puddles are immediately
 * visible on marketplaces once the contract is indexed.
 */

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT

// Cute deterministic name generator for unnamed puddles
// Uses contentHash to pick consistent adjective + noun
const ADJECTIVES = ['amber', 'azure', 'bismuth', 'cobalt', 'coral', 'crimson', 'ember', 'fern',
  'gilded', 'indigo', 'jade', 'lunar', 'midnight', 'neon', 'obsidian', 'opal', 'pearlescent',
  'prism', 'quartz', 'sable', 'spectral', 'sterling', 'tidal', 'umber', 'verdant', 'violet']
const NOUNS = ['basin', 'bloom', 'cascade', 'cavern', 'crest', 'current', 'drift', 'echo',
  'flare', 'glyph', 'haven', 'hollow', 'lens', 'loop', 'mantle', 'mirage', 'murk',
  'orbit', 'prism', 'ripple', 'slick', 'surge', 'tide', 'veil', 'wake', 'whorl']

export function autoName(contentHash) {
  // Use first 4 bytes of contentHash as seed
  const seed = parseInt(contentHash.slice(2, 10), 16)
  const adj = ADJECTIVES[seed % ADJECTIVES.length]
  const noun = NOUNS[Math.floor(seed / ADJECTIVES.length) % NOUNS.length]
  return `${adj} ${noun}`
}

export function puddleDisplayName(name, contentHash) {
  const base = name?.trim() || autoName(contentHash)
  return `Puddle ${base}`
}

const PINATA_PIN_URL  = 'https://api.pinata.cloud/pinning/pinFileToIPFS'
const PINATA_JSON_URL = 'https://api.pinata.cloud/pinning/pinJSONToIPFS'
const IPFS_GATEWAY    = 'https://gateway.pinata.cloud/ipfs'

/**
 * Pin the QR canvas image to IPFS and return its CID.
 * @param {HTMLCanvasElement} canvas  - the rendered QR canvas
 * @param {string} name               - preset name (used as filename)
 * @returns {Promise<string|null>}    - IPFS CID or null on failure
 */
async function pinQRImage(canvas, name) {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) { resolve(null); return }

      const filename = `puddle-${name ? name.replace(/\s+/g, '-').toLowerCase() : 'preset'}.png`
      const form = new FormData()
      form.append('file', blob, filename)
      form.append('pinataOptions', JSON.stringify({ cidVersion: 1 }))
      form.append('pinataMetadata', JSON.stringify({ name: filename }))

      try {
        const res = await fetch(PINATA_PIN_URL, {
          method:  'POST',
          headers: { Authorization: `Bearer ${PINATA_JWT}` },
          body:    form,
        })
        const data = await res.json()
        resolve(data.IpfsHash || null)
      } catch {
        resolve(null)
      }
    }, 'image/png')
  })
}

/**
 * Pin NFT metadata JSON to IPFS.
 * @returns {Promise<string|null>} - IPFS CID of the metadata JSON
 */
async function pinMetadataJSON(metadata) {
  try {
    const res = await fetch(PINATA_JSON_URL, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  `Bearer ${PINATA_JWT}`,
      },
      body: JSON.stringify({
        pinataOptions:  { cidVersion: 1 },
        pinataMetadata: { name: `puddle-${metadata.name || 'preset'}-metadata.json` },
        pinataContent:  metadata,
      }),
    })
    const data = await res.json()
    return data.IpfsHash || null
  } catch {
    return null
  }
}

/**
 * Pin a full Puddle preset to IPFS: uploads the QR image then the metadata JSON.
 *
 * @param {object} options
 * @param {object}            options.settings    - full synth settings object
 * @param {string}            options.name        - preset name
 * @param {string}            options.contentHash - 0x-prefixed keccak256 hash
 * @param {string}            options.presetUrl   - shareable preset URL
 * @param {HTMLCanvasElement} options.canvas      - the rendered QR canvas
 *
 * @returns {Promise<string|null>} - full ipfs:// URI for the metadata, or null
 */
export async function pinPuddleMetadata({ settings, name, contentHash, presetUrl, canvas }) {
  if (!PINATA_JWT) return null

  // 1. Pin the QR image
  const imageCid = await pinQRImage(canvas, name)

  // 2. Build OpenSea-compatible metadata
  const displayName = puddleDisplayName(name, contentHash)
  const metadata = {
    name:        displayName,
    description: `A unique Puddle synth preset. Scan the QR code to load this sound at puddle.obfusco.us`,
    image:       imageCid ? `${IPFS_GATEWAY}/${imageCid}` : '',
    external_url: presetUrl,
    attributes: [
      { trait_type: 'Mode',    value: settings.mode   },
      { trait_type: 'Octaves', value: settings.octaves },
      { trait_type: 'Scale',   value: settings.scale?.join('+') || 'chromatic' },
      { trait_type: 'Poly',    value: settings.poly ? 'Poly' : 'Mono' },
      { trait_type: 'Marbles', value: settings.marbles?.length ?? 0   },
    ],
    properties: {
      contentHash,
      presetUrl,
    },
  }

  // 3. Pin the metadata JSON
  const metaCid = await pinMetadataJSON(metadata)
  return metaCid ? `ipfs://${metaCid}` : null
}
