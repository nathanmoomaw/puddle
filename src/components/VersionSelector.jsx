import './VersionSelector.css'

const VERSIONS = [
  { key: 'v1', label: 'v1', href: '/v1/' },
  { key: 'v2', label: 'v2', href: '/v2/' },
]

function getCurrentVersion() {
  const path = window.location.pathname
  if (path.startsWith('/v2')) return 'v2'
  if (path.startsWith('/v1')) return 'v1'
  return null
}

function handleVersionClick(e, href) {
  localStorage.removeItem('puddle_visual_mode')
  window.location.href = href
  e.preventDefault()
}

export function VersionSelector() {
  const current = getCurrentVersion()

  return (
    <nav className="version-selector" aria-label="App versions">
      {VERSIONS.map((v, i) => (
        <span key={v.key} className="version-selector__entry">
          {i > 0 && <span className="version-selector__sep">|</span>}
          <a
            href={v.href}
            onClick={(e) => handleVersionClick(e, v.href)}
            className={`version-selector__item${current === v.key ? ' version-selector__item--active' : ''}`}
            aria-current={current === v.key ? 'page' : undefined}
          >
            {v.label}
          </a>
        </span>
      ))}
    </nav>
  )
}
