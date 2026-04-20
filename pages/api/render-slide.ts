import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const config = { runtime: 'edge' }

export default function handler(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const bg       = searchParams.get('bg')       || '#1a1a2e'
  const tc       = searchParams.get('tc')       || '#ffffff'
  const ac       = searchParams.get('ac')       || '#e94560'
  const headline = searchParams.get('headline') || ''
  const corpo    = searchParams.get('corpo')    || ''
  const brandName = searchParams.get('brand')  || ''
  const num      = parseInt(searchParams.get('num')   || '1')
  const total    = parseInt(searchParams.get('total') || '1')

  return new ImageResponse(
    (
      <div style={{
        width: '1080px', height: '1080px',
        background: bg,
        display: 'flex', flexDirection: 'column',
        padding: '80px', position: 'relative',
        fontFamily: 'sans-serif',
      }}>
        {/* canto superior esquerdo */}
        <div style={{ position: 'absolute', top: 80, left: 80, display: 'flex' }}>
          <div style={{ width: 120, height: 2, background: ac, position: 'absolute', top: 0, left: 0 }} />
          <div style={{ width: 2, height: 120, background: ac, position: 'absolute', top: 0, left: 0 }} />
        </div>
        {/* canto inferior direito */}
        <div style={{ position: 'absolute', bottom: 80, right: 80, display: 'flex' }}>
          <div style={{ width: 120, height: 2, background: ac, position: 'absolute', bottom: 0, right: 0 }} />
          <div style={{ width: 2, height: 120, background: ac, position: 'absolute', bottom: 0, right: 0 }} />
        </div>

        {/* número do slide */}
        {total > 1 && (
          <div style={{ position: 'absolute', top: 140, left: 80, fontSize: 72, fontWeight: 300, color: ac, opacity: 0.8 }}>
            {String(num).padStart(2, '0')}
          </div>
        )}

        {/* headline */}
        <div style={{
          position: 'absolute', top: 380, left: 80, right: 80,
          fontSize: 84, fontWeight: 700, color: tc,
          lineHeight: 1.05, letterSpacing: '-0.02em',
        }}>
          {headline}
        </div>

        {/* corpo */}
        <div style={{
          position: 'absolute', top: 720, left: 80, right: 80,
          fontSize: 32, color: tc, opacity: 0.85, lineHeight: 1.4,
        }}>
          {corpo}
        </div>

        {/* brand name */}
        <div style={{
          position: 'absolute', bottom: 80, left: 80,
          fontSize: 22, color: tc, opacity: 0.5,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          {brandName}
        </div>

        {/* dots carrossel */}
        {total > 1 && (
          <div style={{ position: 'absolute', bottom: 80, right: 80, display: 'flex', gap: 16 }}>
            {Array.from({ length: total }).map((_, i) => (
              <div key={i} style={{
                width: 12, height: 12, borderRadius: '50%',
                background: i === num - 1 ? ac : tc,
                opacity: i === num - 1 ? 1 : 0.3,
              }} />
            ))}
          </div>
        )}
      </div>
    ),
    { width: 1080, height: 1080 }
  )
}
