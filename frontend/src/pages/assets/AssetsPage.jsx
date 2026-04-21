import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assetsApi, employeesApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import Pagination from '../../components/common/Pagination.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx'
import { 
  PlusIcon, ComputerDesktopIcon, PencilIcon, TrashIcon,
  UserIcon, CalendarIcon, FunnelIcon, ChartBarIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const inputCls = 'mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm'
const labelCls = 'block text-sm font-medium text-gray-700'

const ASSET_CONDITIONS = [
  { value: 'NEW', label: 'New', color: 'green' },
  { value: 'GOOD', label: 'Good', color: 'blue' },
  { value: 'FAIR', label: 'Fair', color: 'yellow' },
  { value: 'POOR', label: 'Poor', color: 'orange' },
  { value: 'DAMAGED', label: 'Damaged', color: 'red' },
  { value: 'RETIRED', label: 'Retired', color: 'gray' },
]

const ASSET_CATEGORIES = ['Laptop', 'Desktop', 'Monitor', 'Phone', 'Tablet', 'Keyboard', 'Mouse', 'Headset', 'Other']

function AssetFormModal({ open, onClose, asset, onSubmit, loading }) {
  const [form, setForm] = useState(asset || {
    assetCode: '',
    name: '',
    category: 'Laptop',
    brand: '',
    modelName: '',
    serialNumber: '',
    purchaseDate: '',
    purchasePrice: '',
    condition: 'GOOD',
    notes: '',
  })

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (payload.purchasePrice) payload.purchasePrice = parseFloat(payload.purchasePrice)
    if (!payload.purchaseDate) delete payload.purchaseDate
    if (!payload.purchasePrice) delete payload.purchasePrice
    onSubmit(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title={asset ? 'Edit Asset' : 'Add New Asset'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Asset Code *</label>
            <input
              type="text"
              required
              value={form.assetCode}
              onChange={handleChange('assetCode')}
              placeholder="e.g., LAP-001"
              className={inputCls}
              disabled={!!asset}
            />
          </div>

          <div>
            <label className={labelCls}>Category *</label>
            <select
              value={form.category}
              onChange={handleChange('category')}
              className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm"
            >
              {ASSET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Asset Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={handleChange('name')}
            placeholder="e.g., MacBook Pro 16-inch"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Brand</label>
            <input
              type="text"
              value={form.brand}
              onChange={handleChange('brand')}
              placeholder="e.g., Apple"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Model</label>
            <input
              type="text"
              value={form.modelName}
              onChange={handleChange('modelName')}
              placeholder="e.g., M1 Pro"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Serial Number</label>
          <input
            type="text"
            value={form.serialNumber}
            onChange={handleChange('serialNumber')}
            placeholder="e.g., C02XYZ123456"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Purchase Date</label>
            <input
              type="date"
              value={form.purchaseDate ? form.purchaseDate.split('T')[0] : ''}
              onChange={handleChange('purchaseDate')}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Purchase Price</label>
            <input
              type="number"
              step="0.01"
              value={form.purchasePrice}
              onChange={handleChange('purchasePrice')}
              placeholder="e.g., 150000"
              className={inputCls}
            />
          </div>
        </div>

        <div>
          <label className={labelCls}>Condition *</label>
          <select
            value={form.condition}
            onChange={handleChange('condition')}
            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm"
          >
            {ASSET_CONDITIONS.map((cond) => (
              <option key={cond.value} value={cond.value}>{cond.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={handleChange('notes')}
            placeholder="Additional information..."
            className={inputCls}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : asset ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function AssignAssetModal({ open, onClose, asset, onSubmit, loading }) {
  const [employeeId, setEmployeeId] = useState('')

  const { data: employeesData } = useQuery({
    queryKey: ['employees-list'],
    queryFn: () => employeesApi.getAll({ limit: 200, status: 'ACTIVE' }),
    enabled: open,
  })

  const employees = employeesData?.data?.data || []

  const handleSubmit = (e) => {
    e.preventDefault()
    if (employeeId) {
      onSubmit({ employeeId: Number(employeeId) })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Assign Asset" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Select Employee *</label>
          <select
            required
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm"
          >
            <option value="">Choose employee...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName} - {emp.employeeCode}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            <strong>Asset:</strong> {asset?.name} ({asset?.assetCode})
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !employeeId}
            className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
          >
            {loading ? 'Assigning...' : 'Assign'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function StatsCard({ title, value, icon: Icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    orange: 'bg-orange-50 text-orange-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}

export default function AssetsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({ category: '', condition: '', assigned: '' })
  const [showForm, setShowForm] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [editingAsset, setEditingAsset] = useState(null)
  const [assigningAsset, setAssigningAsset] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const limit = 10

  const canManage = user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role)

  const { data, isLoading } = useQuery({
    queryKey: ['assets', page, filters],
    queryFn: () => assetsApi.getAll({ page, limit, ...filters }),
  })

  const { data: statsData } = useQuery({
    queryKey: ['assets-stats'],
    queryFn: assetsApi.getStats,
    enabled: canManage,
  })

  const createMutation = useMutation({
    mutationFn: assetsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['assets'])
      queryClient.invalidateQueries(['assets-stats'])
      toast.success('Asset created successfully')
      setShowForm(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create asset')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => assetsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets'])
      queryClient.invalidateQueries(['assets-stats'])
      toast.success('Asset updated successfully')
      setShowForm(false)
      setEditingAsset(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update asset')
    },
  })

  const assignMutation = useMutation({
    mutationFn: ({ id, data }) => assetsApi.assign(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['assets'])
      queryClient.invalidateQueries(['assets-stats'])
      toast.success('Asset assigned successfully')
      setShowAssign(false)
      setAssigningAsset(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to assign asset')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: assetsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['assets'])
      queryClient.invalidateQueries(['assets-stats'])
      toast.success('Asset deleted successfully')
      setDeleteConfirm(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete asset')
    },
  })

  const handleSubmit = (formData) => {
    if (editingAsset) {
      updateMutation.mutate({ id: editingAsset.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleAssign = (data) => {
    if (assigningAsset) {
      assignMutation.mutate({ id: assigningAsset.id, data })
    }
  }

  const handleEdit = (asset) => {
    setEditingAsset(asset)
    setShowForm(true)
  }

  const handleAssignClick = (asset) => {
    setAssigningAsset(asset)
    setShowAssign(true)
  }

  const handleDelete = (asset) => {
    setDeleteConfirm(asset)
  }

  const confirmDelete = () => {
    if (deleteConfirm) {
      deleteMutation.mutate(deleteConfirm.id)
    }
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingAsset(null)
  }

  const handleCloseAssign = () => {
    setShowAssign(false)
    setAssigningAsset(null)
  }

  const handleFilterChange = (field) => (e) => {
    setFilters({ ...filters, [field]: e.target.value })
    setPage(1)
  }

  if (isLoading) return <PageLoader />

  const assets = data?.data?.data || []
  const pagination = data?.data?.pagination || {}
  const stats = statsData?.data || {}

  const conditionConfig = (condition) => ASSET_CONDITIONS.find(c => c.value === condition)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track and manage company assets
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500"
          >
            <PlusIcon className="h-5 w-5" />
            Add Asset
          </button>
        )}
      </div>

      {canManage && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatsCard title="Total Assets" value={stats.total || 0} icon={ComputerDesktopIcon} color="blue" />
          <StatsCard title="Assigned" value={stats.assigned || 0} icon={UserIcon} color="green" />
          <StatsCard title="Available" value={stats.available || 0} icon={ChartBarIcon} color="purple" />
          <StatsCard title="Needs Attention" value={stats.needsAttention || 0} icon={FunnelIcon} color="orange" />
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
            <select
              value={filters.category}
              onChange={handleFilterChange('category')}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600"
            >
              <option value="">All Categories</option>
              {ASSET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Condition</label>
            <select
              value={filters.condition}
              onChange={handleFilterChange('condition')}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600"
            >
              <option value="">All Conditions</option>
              {ASSET_CONDITIONS.map((cond) => (
                <option key={cond.value} value={cond.value}>{cond.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Assignment Status</label>
            <select
              value={filters.assigned}
              onChange={handleFilterChange('assigned')}
              className="block w-full rounded-md border-0 py-1.5 pl-3 pr-8 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600"
            >
              <option value="">All Assets</option>
              <option value="true">Assigned</option>
              <option value="false">Available</option>
            </select>
          </div>
        </div>
      </div>

      {assets.length === 0 ? (
        <EmptyState
          icon={ComputerDesktopIcon}
          title="No assets found"
          description={canManage ? "Add your first asset to start tracking" : "No assets match your filters"}
          action={canManage ? {
            label: 'Add Asset',
            onClick: () => setShowForm(true)
          } : undefined}
        />
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase Date</th>
                  {canManage && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((asset) => {
                  const condition = conditionConfig(asset.condition)
                  return (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                          <div className="text-sm text-gray-500">{asset.assetCode}</div>
                          {asset.brand && <div className="text-xs text-gray-400">{asset.brand} {asset.modelName}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color="gray">{asset.category}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge color={condition?.color}>{condition?.label}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {asset.assignedTo ? (
                          <div className="text-sm">
                            <div className="font-medium text-gray-900">
                              {asset.assignedTo.firstName} {asset.assignedTo.lastName}
                            </div>
                            <div className="text-gray-500">{asset.assignedTo.employeeCode}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {asset.purchaseDate ? format(new Date(asset.purchaseDate), 'MMM dd, yyyy') : '-'}
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            {!asset.assignedTo && (
                              <button
                                onClick={() => handleAssignClick(asset)}
                                className="text-primary-600 hover:text-primary-900"
                              >
                                Assign
                              </button>
                            )}
                            <button
                              onClick={() => handleEdit(asset)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(asset)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {pagination.totalPages > 1 && (
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          )}
        </>
      )}

      <AssetFormModal
        open={showForm}
        onClose={handleCloseForm}
        asset={editingAsset}
        onSubmit={handleSubmit}
        loading={createMutation.isPending || updateMutation.isPending}
      />

      <AssignAssetModal
        open={showAssign}
        onClose={handleCloseAssign}
        asset={assigningAsset}
        onSubmit={handleAssign}
        loading={assignMutation.isPending}
      />

      <ConfirmDialog
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Delete Asset"
        message={`Are you sure you want to delete "${deleteConfirm?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmColor="red"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
