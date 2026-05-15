import { useState } from 'react'
import Button from '../ui/Button'

function LoginCard({ backendError, onSubmit, passwordConfigured }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await onSubmit(password)
    } catch (submitError) {
      setError(submitError.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="panel-surface w-full max-w-md rounded-[32px] px-7 py-8">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-farros-ink">Farros Drive</p>
      <h1 className="mt-3 font-serif text-4xl text-farros-navy">Masuk</h1>
      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-farros-ink">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="h-12 w-full rounded-2xl border border-black/8 bg-white px-4 text-farros-navy"
            autoFocus
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {backendError ? <p className="text-sm text-amber-700">{backendError}</p> : null}
        {!passwordConfigured ? <p className="text-sm text-amber-700">Password belum disetel di backend.</p> : null}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? 'Memeriksa...' : 'Masuk'}
        </Button>
      </form>
    </div>
  )
}

export default LoginCard
