import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { pulseApi } from '../../api/index.js'
import { useAuth } from '../../contexts/AuthContext.jsx'
import Badge from '../../components/common/Badge.jsx'
import Modal from '../../components/common/Modal.jsx'
import EmptyState from '../../components/common/EmptyState.jsx'
import { PageLoader } from '../../components/common/LoadingSpinner.jsx'
import { 
  PlusIcon, HeartIcon, FaceSmileIcon, FaceFrownIcon,
  ChartBarIcon, CalendarIcon, XMarkIcon
} from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const inputCls = 'mt-1 block w-full rounded-md border-0 py-1.5 px-3 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm'
const labelCls = 'block text-sm font-medium text-gray-700'

const FREQUENCY_OPTIONS = [
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'BIWEEKLY', label: 'Bi-weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
]

const RATING_EMOJIS = [
  { value: 1, emoji: '😞', label: 'Very Unhappy', color: 'text-red-500' },
  { value: 2, emoji: '😕', label: 'Unhappy', color: 'text-orange-500' },
  { value: 3, emoji: '😐', label: 'Neutral', color: 'text-yellow-500' },
  { value: 4, emoji: '🙂', label: 'Happy', color: 'text-green-500' },
  { value: 5, emoji: '😄', label: 'Very Happy', color: 'text-blue-500' },
]

function CreateSurveyModal({ open, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    title: '',
    question: 'How are you feeling about work this week?',
    frequency: 'WEEKLY',
    endsAt: '',
  })

  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const payload = { ...form }
    if (!payload.endsAt) delete payload.endsAt
    onSubmit(payload)
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Pulse Survey">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className={labelCls}>Survey Title *</label>
          <input
            type="text"
            required
            value={form.title}
            onChange={handleChange('title')}
            placeholder="e.g., Weekly Team Pulse"
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Question *</label>
          <textarea
            required
            rows={3}
            value={form.question}
            onChange={handleChange('question')}
            placeholder="What would you like to ask your team?"
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Frequency *</label>
            <select
              value={form.frequency}
              onChange={handleChange('frequency')}
              className="mt-1 block w-full rounded-md border-0 py-1.5 pl-3 pr-8 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-primary-600 sm:text-sm"
            >
              {FREQUENCY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>End Date (Optional)</label>
            <input
              type="date"
              value={form.endsAt ? form.endsAt.split('T')[0] : ''}
              onChange={handleChange('endsAt')}
              className={inputCls}
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
          <p className="text-sm text-blue-800">
            Employees will rate their mood on a scale of 1-5 using emoji reactions.
          </p>
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
            {loading ? 'Creating...' : 'Create Survey'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function RespondModal({ open, onClose, survey, onSubmit, loading }) {
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (rating > 0) {
      onSubmit({ rating, comment: comment || null })
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Share Your Feedback" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">{survey?.question}</h3>
          
          <div className="flex justify-center gap-4 mb-6">
            {RATING_EMOJIS.map((emoji) => (
              <button
                key={emoji.value}
                type="button"
                onClick={() => setRating(emoji.value)}
                className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all ${
                  rating === emoji.value
                    ? 'border-primary-500 bg-primary-50 scale-110'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <span className="text-4xl mb-2">{emoji.emoji}</span>
                <span className="text-xs font-medium text-gray-600">{emoji.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={labelCls}>Additional Comments (Optional)</label>
          <textarea
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share any thoughts or feedback..."
            className={inputCls}
          />
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
            disabled={loading || rating === 0}
            className="rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

function SurveyResultsModal({ open, onClose, survey, results }) {
  if (!results) return null

  const totalResponses = results.totalResponses || 0
  const averageRating = results.averageRating || 0
  const distribution = results.distribution || {}

  return (
    <Modal open={open} onClose={onClose} title="Survey Results" size="lg">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{survey?.title}</h3>
          <p className="text-gray-600">{survey?.question}</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 font-medium">Total Responses</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{totalResponses}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 font-medium">Average Rating</p>
            <p className="text-3xl font-bold text-green-900 mt-1">{averageRating.toFixed(1)} / 5</p>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Rating Distribution</h4>
          <div className="space-y-2">
            {RATING_EMOJIS.map((emoji) => {
              const count = distribution[emoji.value] || 0
              const percentage = totalResponses > 0 ? (count / totalResponses) * 100 : 0
              return (
                <div key={emoji.value} className="flex items-center gap-3">
                  <span className="text-2xl w-10">{emoji.emoji}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{emoji.label}</span>
                      <span className="text-sm text-gray-500">{count} ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {results.recentComments && results.recentComments.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Recent Comments</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {results.recentComments.map((comment, idx) => (
                <div key={idx} className="bg-gray-50 rounded-md p-3 text-sm text-gray-700">
                  "{comment.comment}"
                  <div className="text-xs text-gray-500 mt-1">
                    Rating: {RATING_EMOJIS.find(e => e.value === comment.rating)?.emoji}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function PulseSurveyPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [showCreate, setShowCreate] = useState(false)
  const [showRespond, setShowRespond] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedSurvey, setSelectedSurvey] = useState(null)
  const [surveyResults, setSurveyResults] = useState(null)

  const canManage = user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role)

  const { data: surveysData, isLoading } = useQuery({
    queryKey: ['pulse-surveys'],
    queryFn: pulseApi.getAll,
  })

  const { data: myHistoryData } = useQuery({
    queryKey: ['pulse-my-history'],
    queryFn: pulseApi.getMyHistory,
  })

  const createMutation = useMutation({
    mutationFn: pulseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries(['pulse-surveys'])
      toast.success('Pulse survey created successfully')
      setShowCreate(false)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create survey')
    },
  })

  const respondMutation = useMutation({
    mutationFn: ({ id, data }) => pulseApi.respond(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['pulse-surveys'])
      queryClient.invalidateQueries(['pulse-my-history'])
      toast.success('Thank you for your feedback!')
      setShowRespond(false)
      setSelectedSurvey(null)
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit response')
    },
  })

  const closeMutation = useMutation({
    mutationFn: pulseApi.close,
    onSuccess: () => {
      queryClient.invalidateQueries(['pulse-surveys'])
      toast.success('Survey closed successfully')
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to close survey')
    },
  })

  const handleCreateSurvey = (formData) => {
    createMutation.mutate(formData)
  }

  const handleRespond = (survey) => {
    setSelectedSurvey(survey)
    setShowRespond(true)
  }

  const handleSubmitResponse = (data) => {
    if (selectedSurvey) {
      respondMutation.mutate({ id: selectedSurvey.id, data })
    }
  }

  const handleViewResults = async (survey) => {
    try {
      const response = await pulseApi.getResults(survey.id)
      setSurveyResults(response.data?.data || response.data)
      setSelectedSurvey(survey)
      setShowResults(true)
    } catch (error) {
      toast.error('Failed to load results')
    }
  }

  const handleCloseSurvey = (surveyId) => {
    if (confirm('Are you sure you want to close this survey? No more responses will be accepted.')) {
      closeMutation.mutate(surveyId)
    }
  }

  if (isLoading) return <PageLoader />

  const surveys = surveysData?.data?.data || []
  const myHistory = myHistoryData?.data?.data || []
  const activeSurveys = surveys.filter(s => s.isActive)
  const closedSurveys = surveys.filter(s => !s.isActive)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pulse Surveys</h1>
          <p className="mt-1 text-sm text-gray-500">
            Quick team mood checks and engagement tracking
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500"
          >
            <PlusIcon className="h-5 w-5" />
            Create Survey
          </button>
        )}
      </div>

      {!canManage && myHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
            Your Response History
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {myHistory.slice(0, 3).map((response) => {
              const emoji = RATING_EMOJIS.find(e => e.value === response.rating)
              return (
                <div key={response.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{emoji?.emoji}</span>
                    <Badge color="gray">{format(new Date(response.createdAt), 'MMM dd')}</Badge>
                  </div>
                  <p className="text-sm text-gray-600">{emoji?.label}</p>
                  {response.comment && (
                    <p className="text-xs text-gray-500 mt-2 italic">"{response.comment}"</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeSurveys.length === 0 && closedSurveys.length === 0 ? (
        <EmptyState
          icon={HeartIcon}
          title="No pulse surveys yet"
          description={canManage ? "Create your first pulse survey to track team engagement" : "No active surveys at the moment"}
          action={canManage ? {
            label: 'Create Survey',
            onClick: () => setShowCreate(true)
          } : undefined}
        />
      ) : (
        <div className="space-y-6">
          {activeSurveys.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HeartSolidIcon className="h-5 w-5 text-red-500" />
                Active Surveys
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSurveys.map((survey) => {
                  const hasResponded = myHistory.some(h => h.surveyId === survey.id)
                  return (
                    <div key={survey.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{survey.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{survey.question}</p>
                        </div>
                        <Badge color="green">Active</Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-4 w-4" />
                          <span>{survey.frequency}</span>
                        </div>
                        {survey.endsAt && (
                          <span>Ends: {format(new Date(survey.endsAt), 'MMM dd, yyyy')}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!hasResponded ? (
                          <button
                            onClick={() => handleRespond(survey)}
                            className="flex-1 rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white hover:bg-primary-500"
                          >
                            Respond Now
                          </button>
                        ) : (
                          <div className="flex-1 rounded-md bg-green-50 px-3 py-2 text-sm font-semibold text-green-700 text-center">
                            ✓ Responded
                          </div>
                        )}
                        {canManage && (
                          <>
                            <button
                              onClick={() => handleViewResults(survey)}
                              className="rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                            >
                              Results
                            </button>
                            <button
                              onClick={() => handleCloseSurvey(survey.id)}
                              className="rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                            >
                              Close
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {closedSurveys.length > 0 && canManage && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Closed Surveys</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {closedSurveys.map((survey) => (
                  <div key={survey.id} className="bg-gray-50 rounded-lg border border-gray-200 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-700">{survey.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">{survey.question}</p>
                      </div>
                      <Badge color="gray">Closed</Badge>
                    </div>
                    <button
                      onClick={() => handleViewResults(survey)}
                      className="w-full rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-300"
                    >
                      View Results
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <CreateSurveyModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={handleCreateSurvey}
        loading={createMutation.isPending}
      />

      <RespondModal
        open={showRespond}
        onClose={() => {
          setShowRespond(false)
          setSelectedSurvey(null)
        }}
        survey={selectedSurvey}
        onSubmit={handleSubmitResponse}
        loading={respondMutation.isPending}
      />

      <SurveyResultsModal
        open={showResults}
        onClose={() => {
          setShowResults(false)
          setSelectedSurvey(null)
          setSurveyResults(null)
        }}
        survey={selectedSurvey}
        results={surveyResults}
      />
    </div>
  )
}
