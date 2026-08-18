import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, ScanCommand } from '@aws-sdk/lib-dynamodb'
import { randomUUID } from 'node:crypto'

const TABLE_NAME = process.env.TABLE_NAME || 'puddle-presets'
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean)

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))

function corsHeaders(origin) {
  const allowOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  }
}

function respond(statusCode, body, origin) {
  return { statusCode, headers: corsHeaders(origin), body: JSON.stringify(body) }
}

export const handler = async (event) => {
  const method = event.requestContext?.http?.method || 'GET'
  const origin = event.headers?.origin || event.headers?.Origin || ''

  if (method === 'OPTIONS') return respond(204, {}, origin)

  if (method === 'POST') {
    if (!ALLOWED_ORIGINS.includes(origin)) {
      return respond(403, { error: 'origin not allowed' }, origin)
    }
    if ((event.body || '').length > 8192) {
      return respond(413, { error: 'payload too large' }, origin)
    }

    let payload
    try {
      payload = JSON.parse(event.body || '{}')
    } catch {
      return respond(400, { error: 'invalid JSON body' }, origin)
    }

    const { url, name, contentHash, version, gitSha, visualMode, walletAddress } = payload
    if (!url || !contentHash) {
      return respond(400, { error: 'url and contentHash are required' }, origin)
    }

    const item = {
      presetId: randomUUID(),
      createdAt: new Date().toISOString(),
      url,
      name: name || '',
      contentHash,
      version: version || '',
      gitSha: gitSha || '',
      visualMode: visualMode || '',
      walletAddress: walletAddress || '',
    }

    await client.send(new PutCommand({ TableName: TABLE_NAME, Item: item }))
    return respond(201, { presetId: item.presetId }, origin)
  }

  if (method === 'GET') {
    const result = await client.send(new ScanCommand({ TableName: TABLE_NAME, Limit: 50 }))
    const items = (result.Items || []).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return respond(200, { presets: items }, origin)
  }

  return respond(405, { error: 'method not allowed' }, origin)
}
