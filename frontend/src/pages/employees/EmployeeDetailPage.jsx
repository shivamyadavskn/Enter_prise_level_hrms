import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { employeesApi } from '../../api/index.js'
import Badge from '../../components/common/Badge.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { ArrowLeftIcon, EnvelopeIcon, PhoneIcon, MapPinIcon } from '@heroicons/react/24/outline'

function InfoRow({ label, value }) {
  if (!value) return null
  return (
    <div className="sm:col-span-1">
      <dt className="text-sm font-medium text-gray-500">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value}</dd>
    </div>
  )
}

export default function EmployeeDetailPage() {
  const { id } = useParams()

  const { data, isLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeesApi.getById(id),
    enabled: !!id,
  })

  if (isLoading) return <PageLoader />

  const emp = data?.data?.data
  if (!emp) return <div className="text-center py-12 text-gray-500">Employee not found</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/employees" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeftIcon className="h-4 w-4" /> Back
        </Link>
      </div>

      {/* Profile Header */}
      <div className="rounded-lg bg-white shadow overflow-hidden">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 h-24" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10">
            <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-md text-primary-700 font-bold text-2xl border-4 border-white">
              {emp.firstName?.[0]}{emp.lastName?.[0]}
            </div>
            <div className="mb-1">
              <h1 className="text-xl font-bold text-gray-900">{emp.firstName} {emp.lastName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500">{emp.employeeCode}</span>
                <Badge status={emp.employmentStatus} label={emp.employmentStatus} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            {emp.email && <span className="flex items-center gap-1 text-sm text-gray-500"><EnvelopeIcon className="h-4 w-4" />{emp.email}</span>}
            {emp.phone && <span className="flex items-center gap-1 text-sm text-gray-500"><PhoneIcon className="h-4 w-4" />{emp.phone}</span>}
            {emp.city && <span className="flex items-center gap-1 text-sm text-gray-500"><MapPinIcon className="h-4 w-4" />{emp.city}, {emp.country}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Work Info */}
        <div className="lg:col-span-2 rounded-lg bg-white shadow p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Work Information</h2>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
            <InfoRow label="Department" value={emp.department?.name} />
            <InfoRow label="Designation" value={emp.designation?.name} />
            <InfoRow label="Manager" value={emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : null} />
            <InfoRow label="Date of Joining" value={emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString('en-IN') : null} />
            <InfoRow label="Date of Confirmation" value={emp.dateOfConfirmation ? new Date(emp.dateOfConfirmation).toLocaleDateString('en-IN') : null} />
            <InfoRow label="Employment Status" value={emp.employmentStatus} />
          </dl>
        </div>

        {/* Personal Info */}
        <div className="rounded-lg bg-white shadow p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Personal Information</h2>
          <dl className="space-y-4">
            <InfoRow label="Date of Birth" value={emp.dateOfBirth ? new Date(emp.dateOfBirth).toLocaleDateString('en-IN') : null} />
            <InfoRow label="Gender" value={emp.gender} />
            <InfoRow label="Address" value={[emp.address, emp.city, emp.state, emp.postalCode, emp.country].filter(Boolean).join(', ')} />
            <InfoRow label="Emergency Contact" value={emp.emergencyContactName} />
            <InfoRow label="Emergency Phone" value={emp.emergencyContactPhone} />
          </dl>
        </div>
      </div>

      {/* Subordinates */}
      {emp.subordinates?.length > 0 && (
        <div className="rounded-lg bg-white shadow p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Team Members ({emp.subordinates.length})</h2>
          <div className="flex flex-wrap gap-3">
            {emp.subordinates.map((s) => (
              <Link key={s.id} to={`/employees/${s.id}`} className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-100 text-primary-700 text-xs font-semibold">
                  {s.firstName?.[0]}{s.lastName?.[0]}
                </div>
                <span className="text-sm text-gray-700">{s.firstName} {s.lastName}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
