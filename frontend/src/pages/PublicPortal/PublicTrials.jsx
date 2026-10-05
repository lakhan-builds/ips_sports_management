import React, { useState, useEffect } from 'react';
import { trialsApi } from '../../api/trials';
import { formsApi } from '../../api/forms';
import { branchesApi } from '../../api/branches';
import { submissionsApi } from '../../api/submissions';
import Modal from '../../components/common/Modal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import {
  Trophy,
  Calendar,
  MapPin,
  Clock,
  ArrowRight,
  FileCheck2,
  Sparkles,
  CheckCircle,
  Building2,
  LogIn
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PublicTrials() {
  const [trials, setTrials] = useState([]);
  const [forms, setForms] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form Registration Modal
  const [selectedForm, setSelectedForm] = useState(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [studentInfo, setStudentInfo] = useState({
    student_name: '',
    enrollment_number: '',
    branch_id: '',
    semester: '',
    email: '',
    phone: '',
  });
  const [dynamicAnswers, setDynamicAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadPublicData = async () => {
      setLoading(true);
      try {
        const [tData, fData, bData] = await Promise.all([
          trialsApi.list({ status: 'PUBLISHED' }),
          formsApi.list({ status: 'PUBLISHED' }),
          branchesApi.list({ is_active: 'true' })
        ]);
        setTrials(Array.isArray(tData) ? tData : (tData.results || []));
        setForms(Array.isArray(fData) ? fData : (fData.results || []));
        setBranches(Array.isArray(bData) ? bData : (bData.results || []));
      } catch (err) {
        console.error("Failed to load public portal data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadPublicData();
  }, []);

  const openRegistration = (formObj) => {
    setSelectedForm(formObj);
    setStudentInfo({
      student_name: '',
      enrollment_number: '',
      branch_id: branches[0]?.id || '',
      semester: '1',
      email: '',
      phone: '',
    });
    setDynamicAnswers({});
    setSubmitSuccess(false);
    setErrorMessage('');
    setIsRegisterOpen(true);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage('');

    const payload = {
      form_id: selectedForm.id,
      ...studentInfo,
      answers: dynamicAnswers,
    };

    try {
      await submissionsApi.submit(payload);
      setSubmitSuccess(true);
    } catch (err) {
      setErrorMessage(err.response?.data?.message || 'Submission failed. Please check required fields.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-md">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight">University Sports Trials</h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Official Athlete Portal</p>
            </div>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition border border-indigo-200"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Coordinator Login</span>
          </Link>
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 space-y-10">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2026 Varsity Tryouts & Auditions</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Represent Your University On The Field
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Check upcoming trial dates, report to your venue on time, and submit your registration details directly to branch and sports coordinators.
          </p>
        </div>

        {/* Section 1: Upcoming Trials & Posters */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>Upcoming Trial Schedules</span>
            </h3>
          </div>

          {loading ? (
            <LoadingSpinner text="Loading published trials..." />
          ) : trials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trials.map((t) => (
                <div
                  key={t.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div className="h-44 bg-slate-900 relative flex items-center justify-center overflow-hidden">
                    {t.poster ? (
                      <img src={t.poster} alt={t.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center p-4">
                        <Trophy className="w-12 h-12 text-indigo-400/50 mx-auto mb-2" />
                        <span className="text-xs font-bold text-slate-300 uppercase">{t.sport_details?.name}</span>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg text-white text-xs font-semibold flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{t.trial_date}</span>
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">
                        {t.sport_details?.name} • {t.branch_details ? t.branch_details.code : 'All Branches'}
                      </div>
                      <h4 className="font-bold text-slate-900 text-base">{t.title}</h4>
                      <p className="mt-2 text-xs text-slate-500 line-clamp-2">{t.description}</p>

                      <div className="mt-4 space-y-1.5 text-xs text-slate-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.start_time} - {t.end_time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{t.venue}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No active trials posted" description="Check back soon for upcoming trial announcements." />
          )}
        </section>

        {/* Section 2: Published Dynamic Registration Forms */}
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-600" />
              <span>Open Trial Registration Forms</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Submit your student information and dynamic trial questionnaire online</p>
          </div>

          {forms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {forms.map((f) => (
                <div
                  key={f.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-indigo-600 uppercase tracking-wide">
                      <span>{f.sport_details?.name}</span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Accepting Submissions
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mt-2">{f.title}</h4>
                    <p className="mt-1 text-xs text-slate-500 line-clamp-2">{f.description}</p>
                    <div className="mt-3 text-xs text-slate-400">
                      Eligible Branch: <span className="font-semibold text-slate-700">{f.branch_details ? f.branch_details.code : 'All Branches'}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">{f.fields?.length ?? 0} questionnaire fields</span>
                    <button
                      onClick={() => openRegistration(f)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                    >
                      <span>Register Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No registration forms open" description="Forms will appear here once coordinators open trials." />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        Sports Management Progressive Web Application • College & University Sports Directorate
      </footer>

      {/* Dynamic Registration Modal */}
      <Modal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        title={submitSuccess ? "Registration Received!" : `Register for: ${selectedForm?.title}`}
        maxWidth="max-w-2xl"
      >
        {submitSuccess ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Registration Successfully Submitted!</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Your trial registration has been routed directly to the sports coordinators. Please be present at the venue on the scheduled trial date with your student ID card.
            </p>
            <button
              onClick={() => setIsRegisterOpen(false)}
              className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-5 max-h-[75vh] overflow-y-auto px-1">
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                {errorMessage}
              </div>
            )}

            {/* Default Student Identity Fields */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-600">Student Identity & Academic Info</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={studentInfo.student_name}
                    onChange={(e) => setStudentInfo({ ...studentInfo, student_name: e.target.value })}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Enrollment Number *</label>
                  <input
                    type="text"
                    required
                    value={studentInfo.enrollment_number}
                    onChange={(e) => setStudentInfo({ ...studentInfo, enrollment_number: e.target.value })}
                    placeholder="e.g. 20260123"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Branch *</label>
                  <select
                    required
                    value={studentInfo.branch_id}
                    onChange={(e) => setStudentInfo({ ...studentInfo, branch_id: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.code} - {b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Semester</label>
                  <input
                    type="text"
                    value={studentInfo.semester}
                    onChange={(e) => setStudentInfo({ ...studentInfo, semester: e.target.value })}
                    placeholder="e.g. 3"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={studentInfo.email}
                    onChange={(e) => setStudentInfo({ ...studentInfo, email: e.target.value })}
                    placeholder="student@institution.edu"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-600 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={studentInfo.phone}
                    onChange={(e) => setStudentInfo({ ...studentInfo, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Form Custom Questions */}
            {selectedForm?.fields?.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-slate-600">Trial Specific Questions</h4>
                <div className="space-y-3">
                  {selectedForm.fields.map((fld) => (
                    <div key={fld.id} className="bg-white p-3.5 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-800 mb-1">
                        {fld.label} {fld.is_required && <span className="text-rose-500">*</span>}
                      </label>

                      {fld.field_type === 'textarea' ? (
                        <textarea
                          required={fld.is_required}
                          rows={2}
                          placeholder={fld.placeholder}
                          value={dynamicAnswers[fld.field_name] || ''}
                          onChange={(e) => setDynamicAnswers({ ...dynamicAnswers, [fld.field_name]: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      ) : fld.field_type === 'dropdown' ? (
                        <select
                          required={fld.is_required}
                          value={dynamicAnswers[fld.field_name] || ''}
                          onChange={(e) => setDynamicAnswers({ ...dynamicAnswers, [fld.field_name]: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                          <option value="">Choose an option</option>
                          {fld.options?.map((opt, i) => (
                            <option key={i} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : fld.field_type === 'radio' ? (
                        <div className="flex flex-wrap gap-3 mt-1">
                          {fld.options?.map((opt, i) => (
                            <label key={i} className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer">
                              <input
                                type="radio"
                                name={fld.field_name}
                                value={opt}
                                checked={dynamicAnswers[fld.field_name] === opt}
                                onChange={(e) => setDynamicAnswers({ ...dynamicAnswers, [fld.field_name]: e.target.value })}
                                className="text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : fld.field_type === 'checkbox' ? (
                        <div className="flex flex-col gap-1.5 mt-1">
                          {fld.options?.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={dynamicAnswers[fld.field_name] === opt}
                                onChange={(e) => setDynamicAnswers({ ...dynamicAnswers, [fld.field_name]: e.target.checked ? opt : '' })}
                                className="rounded text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <input
                          type={fld.field_type === 'number' ? 'number' : fld.field_type === 'date' ? 'date' : 'text'}
                          required={fld.is_required}
                          placeholder={fld.placeholder}
                          value={dynamicAnswers[fld.field_name] || ''}
                          onChange={(e) => setDynamicAnswers({ ...dynamicAnswers, [fld.field_name]: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsRegisterOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                {submitting ? 'Submitting Registration...' : 'Submit Trial Registration'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
