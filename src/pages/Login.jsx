import LoginCard from '../components/auth/LoginCard'
import { useDriveStore } from '../hooks/useDriveStore'

function Login() {
  const { auth, backend, login } = useDriveStore()

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <LoginCard
        onSubmit={login}
        backendError={backend.error || auth.error}
        passwordConfigured={auth.passwordConfigured}
      />
    </div>
  )
}

export default Login
