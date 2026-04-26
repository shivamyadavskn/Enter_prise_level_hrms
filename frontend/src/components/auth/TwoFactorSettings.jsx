import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { ShieldCheckIcon, ShieldExclamationIcon, KeyIcon } from '@heroicons/react/24/outline'
import { authApi } from '../../api/index.js'

/**
 * Self-service 2FA panel.
 * - Shows current status
 * - Lets the user enroll (QR + verify) or disable (password + code)
 *
 * Drop into any page (e.g. MyProfilePage) as <TwoFactorSettings />.
 */
export default function TwoFactorSettings() {
  const [status, setStatus] = useState({ enabled: false, backupCodesRemaining: 0 })
  const [loading, setLoading] = useState(true)

  // Enrollment state
  const [enrolling, setEnrolling] = useState(false)
  const [enrollData, setEnrollData] = useState(null)   // { qrCode, secret }
  const [enrollToken, setEnrollToken] = useState('')
  const [backupCodes, setBackupCodes] = useState(null)

  // Disable state
  const [disabling, setDisabling] = useState(false)
  const [disableForm, setDisableForm] = useState({ password: '', token: '' })

  const refresh = async () => {
    try {
      setLoading(true)
      const { data } = await authApi.twofaStatus()
      setStatus(data.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { refresh() }, [])

  const startEnroll = async () => {
    try {
      setEnrolling(true)
      const { data } = await authApi.twofaEnroll()
      setEnrollData(data.data)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start enrollment')
      setEnrolling(false)
    }
  }

  const verifyEnroll = async (e) => {
    e.preventDefault()
    try {
      const { data } = await authApi.twofaVerifyEnroll(enrollToken)
      setBackupCodes(data.data.backupCodes)
      setEnrollData(null)
      setEnrollToken('')
      toast.success('Two-factor authentication enabled')
      refresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed')
    }
  }

  const disable = async (e) => {
    e.preventDefault()
    try {
      await authApi.twofaDisable(disableForm)
      toast.success('Two-factor authentication disabled')
      setDisabling(false)
      setDisableForm({ password: '', token: '' })
      refresh()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to disable')
    }
  }

  if (loading) {
    return <div className="card p-6 animate-pulse h-32" />
  }

  return (
    <div className="card p-6 space-y-5">
      <div className="flex items-start gap-3">
        {status.enabled ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100">
            <ShieldCheckIcon className="h-5 w-5 text-emerald-600" />
          </div>
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 ring-1 ring-amber-100">
            <ShieldExclamationIcon className="h-5 w-5 text-amber-600" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">Two-factor authentication</h3>
          <p className="text-sm text-gray-500">
            {status.enabled
              ? `Enabled. ${status.backupCodesRemaining} backup code${status.backupCodesRemaining === 1 ? '' : 's'} remaining.`
              : 'Add a second layer of security using an authenticator app like Google Authenticator, 1Password, or Authy.'}
          </p>
        </div>
        {!status.enabled && !enrolling && !backupCodes && (
          <button onClick={startEnroll} className="btn-primary">Enable 2FA</button>
        )}
        {status.enabled && !disabling && (
          <button onClick={() => setDisabling(true)} className="btn-secondary">Disable</button>
        )}
      </div>

      {/* Enrollment flow */}
      {enrolling && enrollData && (
        <form onSubmit={verifyEnroll} className="rounded-lg border border-gray-200 bg-gray-50 p-5 space-y-4">
          <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
            <img src={enrollData.qrCode} alt="2FA QR code" className="h-44 w-44 rounded-lg bg-white p-2 ring-1 ring-gray-200" />
            <div className="mt-4 sm:mt-0 flex-1 space-y-3">
              <p className="text-sm text-gray-700">
                <strong>Step 1.</strong> Scan this QR code with your authenticator app.
              </p>
              <details className="text-xs text-gray-500">
                <summary className="cursor-pointer hover:text-gray-700">Can't scan? Enter the secret manually</summary>
                <code className="mt-2 block break-all rounded bg-white p-2 ring-1 ring-gray-200 font-mono text-[11px]">
                  {enrollData.secret}
                </code>
              </details>
              <p className="text-sm text-gray-700">
                <strong>Step 2.</strong> Enter the 6-digit code from the app.
              </p>
              <div className="flex gap-2">
                <input
                  type="text" inputMode="numeric" autoFocus required
                  pattern="[0-9]{6}" maxLength={6}
                  value={enrollToken}
                  onChange={(e) => setEnrollToken(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="block w-32 rounded-lg border-0 py-2 px-3 text-center font-mono tracking-widest shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-500 sm:text-sm"
                />
                <button type="submit" className="btn-primary">Verify & enable</button>
                <button type="button" onClick={() => { setEnrolling(false); setEnrollData(null) }} className="btn-secondary">Cancel</button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Backup codes — shown once after successful enrollment */}
      {backupCodes && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3">
            <KeyIcon className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-amber-900">Save your backup codes</h4>
              <p className="text-sm text-amber-800 mt-1">
                These codes will <strong>not be shown again</strong>. Each code can be used once if you lose access to your authenticator app.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {backupCodes.map((c) => (
                  <code key={c} className="rounded bg-white px-2 py-1.5 text-center text-xs font-mono ring-1 ring-amber-200">
                    {c}
                  </code>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(backupCodes.join('\n'))
                    toast.success('Copied to clipboard')
                  }}
                  className="btn-secondary text-xs"
                >Copy all</button>
                <button onClick={() => setBackupCodes(null)} className="btn-primary text-xs">I've saved them</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Disable flow */}
      {disabling && (
        <form onSubmit={disable} className="rounded-lg border border-red-200 bg-red-50 p-5 space-y-3">
          <p className="text-sm text-red-800">
            Disabling 2FA reduces account security. Confirm your password and current 2FA code to proceed.
          </p>
          <input
            type="password" required placeholder="Current password"
            value={disableForm.password}
            onChange={(e) => setDisableForm({ ...disableForm, password: e.target.value })}
            className="block w-full rounded-lg border-0 py-2 px-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-500"
          />
          <input
            type="text" inputMode="numeric" required placeholder="6-digit code"
            pattern="[0-9A-Za-z]{6,12}"
            value={disableForm.token}
            onChange={(e) => setDisableForm({ ...disableForm, token: e.target.value.replace(/\s/g, '') })}
            className="block w-full rounded-lg border-0 py-2 px-3 text-sm font-mono ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-red-500"
          />
          <div className="flex gap-2">
            <button type="submit" className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Disable 2FA</button>
            <button type="button" onClick={() => setDisabling(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}
    </div>
  )
}
