export type AssetDescriptor = {
  id: string
  kind: 'gltf' | 'three-json' | 'texture'
  url: string
  scale: number
  materialHint?: string
  source: 'cs3d' | 'arena' | 'local'
}

/**
 * Converts a reviewed CS3D/Arena model manifest into an allow-listed browser descriptor.
 * It intentionally rejects absolute, remote and path-traversal URLs.
 */
export function cs3dManifestToDescriptors(manifest: unknown): AssetDescriptor[] {
  if (!Array.isArray(manifest)) return []
  return manifest.flatMap((entry, index) => {
    if (!entry || typeof entry !== 'object') return []
    const raw = entry as Record<string, unknown>
    const url = typeof raw.url === 'string' ? raw.url : typeof raw.path === 'string' ? raw.path : ''
    if (!url || url.startsWith('http') || url.startsWith('/') || url.includes('..')) return []
    const kind = raw.kind === 'texture' || raw.kind === 'three-json' ? raw.kind : 'gltf'
    return [{ id: String(raw.id ?? `cs3d-${index}`).slice(0, 64), kind, url, scale: Number.isFinite(Number(raw.scale)) ? Math.max(0.001, Math.min(100, Number(raw.scale))) : 1, materialHint: typeof raw.materialHint === 'string' ? raw.materialHint.slice(0, 80) : undefined, source: raw.source === 'arena' ? 'arena' : 'cs3d' }]
  })
}
