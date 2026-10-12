import { useEffect, useRef, useState } from 'react'
import { onValue, ref, serverTimestamp, set } from 'firebase/database'
import { database } from './firebase'
import { useGeolocation } from './useGeolocation'
import TrackingMap from './components/TrackingMap'
import './App.css'

const LOCATION_PATH = 'ubicacion'
const WRITE_INTERVAL_MS = 2000

function formatTime(value) {
  if (!value) return '--'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  return date.toLocaleTimeString()
}

function formatAccuracy(accuracy) {
  if (typeof accuracy !== 'number') return '--'
  return `${accuracy.toFixed(0)} m`
}

export default function App() {
  const [tracking, setTracking] = useState(false)
  const [remote, setRemote] = useState(null)
  const [connected, setConnected] = useState(false)
  const [lastWrite, setLastWrite] = useState(null)
  const [dbError, setDbError] = useState(null)
  const { position, error: geoError } = useGeolocation({ enabled: tracking })
  const lastWriteAt = useRef(0)

  useEffect(() => {
    const locationRef = ref(database, LOCATION_PATH)
    const unsubscribe = onValue(
      locationRef,
      (snapshot) => {
        setRemote(snapshot.val())
        setConnected(true)
        setDbError(null)
      },
      (err) => {
        setConnected(false)
        setDbError(err.message)
      },
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!tracking || !position) return
    const now = Date.now()
    if (now - lastWriteAt.current < WRITE_INTERVAL_MS) return
    lastWriteAt.current = now

    set(ref(database, LOCATION_PATH), {
      lat: position.lat,
      lng: position.lng,
      accuracy: position.accuracy,
      updatedAt: serverTimestamp(),
    })
      .then(() => {
        setLastWrite(new Date())
        setDbError(null)
      })
      .catch((err) => setDbError(err.message))
  }, [position, tracking])

  const displayPosition = remote || position
  const updatedAt = remote?.updatedAt || lastWrite || position?.timestamp

  const gpsState = geoError
    ? { label: 'Error de GPS', tone: 'error' }
    : position
      ? { label: 'GPS activo', tone: 'ok' }
      : tracking
        ? { label: 'Buscando senal...', tone: 'wait' }
        : { label: 'Inactivo', tone: 'off' }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Rastreo en tiempo real</h1>
        <span className={`badge badge--${connected ? 'ok' : 'error'}`}>
          <span className="badge__dot" />
          Firebase {connected ? 'conectado' : 'desconectado'}
        </span>
      </header>

      <div className="app__body">
        <aside className="panel">
          <button
            type="button"
            className={`btn ${tracking ? 'btn--stop' : ''}`}
            onClick={() => setTracking((value) => !value)}
          >
            {tracking ? 'Detener rastreo' : 'Iniciar rastreo'}
          </button>

          <dl className="stats">
            <div className="stats__row">
              <dt>Estado GPS</dt>
              <dd>
                <span className={`dot dot--${gpsState.tone}`} />
                {gpsState.label}
              </dd>
            </div>
            <div className="stats__row">
              <dt>Latitud</dt>
              <dd>{displayPosition ? displayPosition.lat.toFixed(6) : '--'}</dd>
            </div>
            <div className="stats__row">
              <dt>Longitud</dt>
              <dd>{displayPosition ? displayPosition.lng.toFixed(6) : '--'}</dd>
            </div>
            <div className="stats__row">
              <dt>Precision</dt>
              <dd>{formatAccuracy(displayPosition?.accuracy)}</dd>
            </div>
            <div className="stats__row">
              <dt>Ultima actualizacion</dt>
              <dd>{formatTime(updatedAt)}</dd>
            </div>
          </dl>

          {(geoError || dbError) && (
            <p className="alert">{geoError || dbError}</p>
          )}

          <p className="hint">
            Los datos se guardan en Realtime Database en{' '}
            <code>/{LOCATION_PATH}</code>. Abre esta pagina en otra pestana para
            ver la ubicacion moverse sola.
          </p>
        </aside>

        <main className="map">
          <TrackingMap position={displayPosition} />
        </main>
      </div>
    </div>
  )
}
