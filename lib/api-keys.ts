import crypto from 'crypto'

export function generateApiKey(): { fullKey: string; keyHash: string; keyPrefix: string } {
  const randomPart = crypto.randomBytes(24).toString('hex')
  const fullKey = `aexum_live_${randomPart}`
  const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex')
  const keyPrefix = `aexum_live_${randomPart.substring(0, 8)}...`
  return { fullKey, keyHash, keyPrefix }
}

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function validateApiKey(
  key: string,
  supabaseAdmin: any
): Promise<{ valid: boolean; owner_id?: string; key_id?: string }> {
  const keyHash = hashApiKey(key)
  const { data, error } = await supabaseAdmin
    .from('api_keys')
    .select('id, owner_id, is_active')
    .eq('key_hash', keyHash)
    .eq('is_active', true)
    .single()

  if (error || !data) return { valid: false }

  supabaseAdmin.rpc('update_api_key_last_used', { key_hash_param: keyHash })

  return { valid: true, owner_id: data.owner_id, key_id: data.id }
}
