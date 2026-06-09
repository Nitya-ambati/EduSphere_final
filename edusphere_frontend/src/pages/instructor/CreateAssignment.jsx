import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { assignmentService } from '../../services/assignmentService'
import { ArrowLeft, Plus, Trash2, CheckCircle, FileSpreadsheet, Upload, Info, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const OPTION_KEYS = ['A', 'B', 'C', 'D']
const emptyQ = () => ({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: '' })

export default function CreateAssignment() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState('manual') // 'manual' | 'excel'
  const [form, setForm] = useState({
    title: '',
    instructions: '',
    timeLimitMinutes: 30,
    submissionDeadline: '',
  })
  const [questions, setQuestions] = useState([emptyQ()])
  const [excelFile, setExcelFile] = useState(null)

  const createMutation = useMutation({
    mutationFn: (data) => assignmentService.create(courseId, data),
    onSuccess: () => {
      toast.success('Assignment created!')
      navigate(-1)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Failed to create assignment'),
  })

  const uploadMutation = useMutation({
    mutationFn: (formData) => assignmentService.uploadBulk(courseId, formData),
    onSuccess: () => {
      toast.success('Assignment created from Excel!')
      navigate(-1)
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Excel upload failed'),
  })

  const downloadTemplate = () => {
    const header = 'questionText,optionA,optionB,optionC,optionD,correctOption'
    const rows = [
      'What is Java?,A programming language,A database tool,A web browser,A design app,A',
      'What does HTML stand for?,HyperText Markup Language,High Transfer Mode Language,Hyper Tool Markup Language,Hyper Terminal Machine Language,A',
      'Which symbol is used for comments in Java?,//,##,**,&&,A',
    ]
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'assignment_questions_template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const addQuestion = () => setQuestions([...questions, emptyQ()])
  const removeQuestion = (i) => setQuestions(questions.filter((_, qi) => qi !== i))

  const updateQ = (i, field, val) => {
    const q = [...questions]
    q[i] = { ...q[i], [field]: val }
    setQuestions(q)
  }

  const submitManual = (e) => {
    e.preventDefault()
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.questionText.trim()) {
        toast.error(`Please enter question text for Question ${i + 1}`)
        return
      }
      if (!q.correctOption) {
        toast.error(`Please select the correct answer for Question ${i + 1}`)
        return
      }
      if (!q.optionA || !q.optionB || !q.optionC || !q.optionD) {
        toast.error(`Please fill in all 4 options for Question ${i + 1}`)
        return
      }
    }
    const payload = {
      ...form,
      questions: questions.map((q, idx) => ({
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        correctOption: q.correctOption,
        sequenceNumber: idx + 1,
      })),
    }
    createMutation.mutate(payload)
  }

  const submitExcel = (e) => {
    e.preventDefault()
    if (!form.title.trim()) { toast.error('Please enter assignment title'); return }
    if (!form.submissionDeadline) { toast.error('Please set a submission deadline'); return }
    if (!excelFile) { toast.error('Please select an Excel file'); return }
    const fd = new FormData()
    fd.append('file', excelFile)
    fd.append('title', form.title)
    fd.append('instructions', form.instructions || '')
    fd.append('timeLimitMinutes', form.timeLimitMinutes)
    fd.append('submissionDeadline', form.submissionDeadline)
    uploadMutation.mutate(fd)
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <button type="button" onClick={() => navigate(-1)} className="btn-ghost -ml-2 flex items-center gap-1">
        <ArrowLeft size={16} /> Back
      </button>

      <p className="text-slate-500 text-sm">Add MCQ questions manually or upload via Excel</p>

      {/* Mode selector */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { key: 'manual', label: 'Manual Entry', icon: Plus },
          { key: 'excel',  label: 'Upload Excel', icon: FileSpreadsheet },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => setMode(m.key)}
            className={clsx(
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5',
              mode === m.key ? 'bg-white text-primary-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <m.icon size={14} />
            {m.label}
          </button>
        ))}
      </div>

      {/* Assignment details (shared) */}
      <div className="card space-y-4">
        <h3 className="section-title">Assignment Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="label">Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Quiz 1: Introduction" className="input" />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Instructions</label>
            <textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} rows={2} placeholder="Answer all questions carefully…" className="input resize-none" />
          </div>
          <div>
            <label className="label">Time Limit (minutes)</label>
            <input type="number" min={1} value={form.timeLimitMinutes} onChange={(e) => setForm({ ...form, timeLimitMinutes: +e.target.value })} className="input" />
          </div>
          <div>
            <label className="label">Submission Deadline *</label>
            <input type="datetime-local" required value={form.submissionDeadline} onChange={(e) => setForm({ ...form, submissionDeadline: e.target.value })} className="input" />
          </div>
        </div>
      </div>

      {mode === 'manual' ? (
        <form onSubmit={submitManual} className="space-y-6">
          {/* Questions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="section-title">Questions ({questions.length})</h3>
              <button type="button" onClick={addQuestion} className="btn-secondary flex items-center gap-1">
                <Plus size={16} /> Add Question
              </button>
            </div>

            {questions.map((q, qi) => (
              <div key={qi} className="card space-y-4 border-l-4 border-l-primary-300">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-primary-100 text-primary-700 text-sm font-bold flex items-center justify-center">
                      {qi + 1}
                    </span>
                    <span className="text-sm font-medium text-slate-600">Question {qi + 1}</span>
                  </div>
                  {questions.length > 1 && (
                    <button type="button" onClick={() => removeQuestion(qi)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <div>
                  <label className="label">Question Text *</label>
                  <textarea
                    required
                    value={q.questionText}
                    onChange={(e) => updateQ(qi, 'questionText', e.target.value)}
                    rows={2}
                    placeholder="Enter your question…"
                    className="input resize-none"
                  />
                </div>

                <div>
                  <label className="label">
                    Options — <span className="text-emerald-600 font-normal">click the circle to mark the correct answer</span>
                  </label>
                  <div className="space-y-2">
                    {OPTION_KEYS.map((letter) => {
                      const fieldKey = `option${letter}`
                      const isCorrect = q.correctOption === letter
                      return (
                        <div key={letter} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQ(qi, 'correctOption', letter)}
                            className={clsx(
                              'w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                              isCorrect
                                ? 'border-emerald-500 bg-emerald-500 text-white'
                                : 'border-slate-200 hover:border-emerald-300'
                            )}
                            title={`Mark ${letter} as correct`}
                          >
                            {isCorrect && <CheckCircle size={14} />}
                          </button>
                          <span className="w-6 text-xs font-bold text-slate-400">{letter}.</span>
                          <input
                            required
                            value={q[fieldKey]}
                            onChange={(e) => updateQ(qi, fieldKey, e.target.value)}
                            placeholder={`Option ${letter}`}
                            className="input"
                          />
                        </div>
                      )
                    })}
                  </div>
                  {!q.correctOption && (
                    <p className="text-xs text-amber-600 mt-1.5">⚠ Click the circle next to the correct answer</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pb-6">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending ? 'Creating…' : 'Create Assignment'}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitExcel} className="space-y-6">
          {/* Excel template info */}
          <div className="card bg-blue-50 border border-blue-100 space-y-3">
            <div className="flex items-start gap-3">
              <Info size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Excel File Format</p>
                <p className="text-xs text-slate-600 mt-1">Your Excel file must have the following columns in order:</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="text-xs w-full border-collapse">
                <thead>
                  <tr className="bg-blue-100">
                    {['questionText', 'optionA', 'optionB', 'optionC', 'optionD', 'correctOption'].map((h) => (
                      <th key={h} className="text-left py-2 px-3 text-blue-800 font-semibold border border-blue-200">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="py-2 px-3 border border-blue-200 text-slate-600">What is Java?</td>
                    <td className="py-2 px-3 border border-blue-200 text-slate-600">A language</td>
                    <td className="py-2 px-3 border border-blue-200 text-slate-600">A tool</td>
                    <td className="py-2 px-3 border border-blue-200 text-slate-600">A database</td>
                    <td className="py-2 px-3 border border-blue-200 text-slate-600">A framework</td>
                    <td className="py-2 px-3 border border-blue-200 font-bold text-emerald-600">A</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-slate-500">
              <strong>correctOption</strong> must be A, B, C, or D. The first row should be the header row.
            </p>
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors w-fit"
            >
              <Download size={15} />
              Download Demo Template (.csv)
            </button>
          </div>

          {/* File upload */}
          <div className="card space-y-4">
            <h3 className="section-title">Upload Questions File</h3>
            <div className="border-2 border-dashed border-primary-200 rounded-xl p-8 text-center hover:border-primary-400 transition-colors">
              <FileSpreadsheet size={36} className="mx-auto text-primary-300 mb-3" />
              <p className="text-sm text-slate-500 mb-3">Select an Excel (.xlsx) or CSV file</p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setExcelFile(e.target.files[0])}
                className="text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary-100 file:text-primary-700 file:font-medium cursor-pointer"
              />
            </div>
            {excelFile && (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                <FileSpreadsheet size={16} className="text-emerald-500 flex-shrink-0" />
                <p className="text-sm text-emerald-700 font-medium">{excelFile.name}</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pb-6">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            <button
              type="submit"
              disabled={uploadMutation.isPending || !excelFile}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              <Upload size={16} />
              {uploadMutation.isPending ? 'Uploading…' : 'Create from Excel'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
