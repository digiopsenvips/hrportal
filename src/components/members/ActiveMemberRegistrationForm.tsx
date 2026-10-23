'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useData } from '@/context/DataContext';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Mail,
  GraduationCap,
  Award,
  Hash,
  Calendar,
  Building2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Users,
  ShieldCheck,
  Sparkles,
  Loader2,
  Clock,
  LogIn,
} from 'lucide-react';

export const COLLEGE_BRANCH_OPTIONS = [
  'Computer Science & Engineering',
  'Information Technology',
  'AI & Data Science',
  'BBA',
  'BBA LLB',
  'Bachelor of Commerce',
  'BA Journalism & Mass Communication',
  'Economics Honours',
];

export const SOCIETY_DESIGNATION_OPTIONS = [
  'Active Member',
  'General Member',
  'Associate',
  'Core Team Member',
  'Project Lead',
  'Department Coordinator',
];

export const SOCIETY_YEAR_OPTIONS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
];

interface ActiveMemberRegistrationFormProps {
  onCancel?: () => void;
  onSuccess?: (member: any) => void;
  isAdminMode?: boolean;
  initialDepartmentId?: string;
}

export default function ActiveMemberRegistrationForm({
  onCancel,
  onSuccess,
  isAdminMode = false,
  initialDepartmentId,
}: ActiveMemberRegistrationFormProps) {
  const router = useRouter();
  const { departments, addMember, refreshAll } = useData();
  const { register } = useAuth();

  // Step state: 1 = Member Details, 2 = Review, 3 = Confirmation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Form Fields in exact order:
  // 1. Name
  const [name, setName] = useState('');
  // 2. Email
  const [email, setEmail] = useState('');
  // 3. Branch
  const [branch, setBranch] = useState(COLLEGE_BRANCH_OPTIONS[0]);
  // 4. Designation
  const [designation, setDesignation] = useState(SOCIETY_DESIGNATION_OPTIONS[0]);
  // 5. Enrollment Number (string to preserve leading zeroes or letters)
  const [enrollment, setEnrollment] = useState('');
  // 6. Year in Society
  const [yearInSociety, setYearInSociety] = useState(SOCIETY_YEAR_OPTIONS[0]);
  // 7. Which Department Are You In?
  const [departmentId, setDepartmentId] = useState(
    initialDepartmentId || departments[0]?.id || 'digital-operations'
  );

  // Sync default department if loaded asynchronously
  useEffect(() => {
    if (departments.length > 0 && !departmentId) {
      setDepartmentId(initialDepartmentId || departments[0].id);
    }
  }, [departments, departmentId, initialDepartmentId]);

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Confirmation payload from backend
  const [createdMember, setCreatedMember] = useState<{
    id: string;
    memberId: string;
    name: string;
    email: string;
    branch: string;
    designation: string;
    collegeEnrollment: string;
    yearInSociety: string;
    departmentId: string;
    approvalStatus: string;
  } | null>(null);

  // Validate step 1 fields
  const validateStep1 = (): boolean => {
    const errs: { [key: string]: string } = {};

    if (!name.trim()) {
      errs.name = 'Full name is required as per college records.';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        errs.email = 'Please enter a valid email address format.';
      }
    }

    if (!branch.trim()) {
      errs.branch = 'Please select your college branch.';
    }

    if (!designation.trim()) {
      errs.designation = 'Please select your society designation.';
    }

    if (!enrollment.trim()) {
      errs.enrollment = 'Enrollment number is required.';
    } else if (enrollment.trim().length < 4) {
      errs.enrollment = 'Enrollment number must be at least 4 characters.';
    }

    if (!yearInSociety.trim()) {
      errs.yearInSociety = 'Please select your year in society.';
    }

    if (!departmentId.trim()) {
      errs.departmentId = 'Please select your department.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (validateStep1()) {
      setSubmitError('');
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setSubmitError('');
    setCurrentStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancel = () => {
    const hasValues =
      name.trim() !== '' ||
      email.trim() !== '' ||
      enrollment.trim() !== '';

    if (hasValues) {
      const confirmed = window.confirm(
        'You have unsaved changes in the registration form. Are you sure you want to cancel and exit?'
      );
      if (!confirmed) return;
    }

    if (onCancel) {
      onCancel();
    } else {
      router.push('/login');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');
    setIsSubmitting(true);

    try {
      if (isAdminMode) {
        // Admin onboarding directly through /api/members
        const res = await addMember({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          branch: branch.trim(),
          roleTitle: designation.trim(),
          designation: designation.trim(),
          collegeEnrollment: enrollment.trim(),
          academicYear: yearInSociety.trim(),
          yearInSociety: yearInSociety.trim(),
          primaryDepartmentId: departmentId.trim(),
          departmentId: departmentId.trim(),
          role: 'general_member',
          status: 'Active',
          approvalStatus: 'APPROVED',
        });

        if (res.success && res.data) {
          setCreatedMember({
            id: res.data.id,
            memberId: res.data.memberId,
            name: res.data.name,
            email: res.data.email,
            branch: res.data.branch,
            designation: res.data.roleTitle,
            collegeEnrollment: res.data.collegeEnrollment,
            yearInSociety: res.data.academicYear,
            departmentId: res.data.primaryDepartmentId,
            approvalStatus: res.data.approvalStatus,
          });
          setCurrentStep(3);
          if (onSuccess) onSuccess(res.data);
          await refreshAll();
        } else {
          setSubmitError(res.error || 'Failed to onboard member. Please check details and try again.');
        }
      } else {
        // Public Active Member Registration
        const res = await register({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          branch: branch.trim(),
          designation: designation.trim(),
          collegeEnrollment: enrollment.trim(),
          yearInSociety: yearInSociety.trim(),
          departmentId: departmentId.trim(),
        });

        if (res.success && res.user) {
          setCreatedMember({
            id: res.user.id,
            memberId: res.user.memberId || 'Pending Assignment',
            name: res.user.name,
            email: res.user.email,
            branch: res.user.branch || branch,
            designation: res.user.designation || designation,
            collegeEnrollment: res.user.collegeEnrollment || enrollment,
            yearInSociety: res.user.yearInSociety || yearInSociety,
            departmentId: res.user.departmentId || departmentId,
            approvalStatus: res.user.approvalStatus || 'PENDING',
          });
          setCurrentStep(3);
          if (onSuccess) onSuccess(res.user);
        } else {
          setSubmitError(res.message || 'Registration submission failed. Please try again.');
        }
      }
    } catch (err: any) {
      setSubmitError(err.message || 'A network error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDeptName =
    departments.find((d) => d.id === departmentId)?.name || departmentId;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ================= LEFT PANEL ================= */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-[#E3EBE7] bg-white p-6 sm:p-8 shadow-sm relative overflow-hidden min-h-[560px]">
          {/* Subtle background decoration */}
          <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-[#E7F3D7]/60 filter blur-2xl pointer-events-none" />
          <div className="absolute top-1/2 -right-16 h-40 w-40 rounded-full bg-[#DDF7EF]/70 filter blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            {/* Branding Header */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2FC3A5] text-[#263832] font-black text-xl shadow-sm">
                  E
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black tracking-tight text-[#263832]">
                      TeamHub
                    </span>
                    <span className="rounded-md bg-[#FFC220]/20 px-1.5 py-0.5 text-[10px] font-black text-[#B45309]">
                      ENACTUS VIPS
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-[#82918B]">
                    Student Leadership & Social Entrepreneurship
                  </p>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#263832] mt-4">
                Active Member Registration
              </h1>
              <p className="mt-2 text-xs text-[#82918B] leading-relaxed">
                Join the official Enactus VIPS-TC directory to collaborate on student-led ventures, record meeting attendance, receive project tasks, and build accredited leadership credentials.
              </p>
            </div>

            {/* Three Info Blocks */}
            <div className="space-y-3 pt-2">
              {/* Block 1 */}
              <div className="flex items-start gap-3 rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7]/80 p-3.5 transition hover:bg-[#DDF7EF]/40">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E7F3D7] text-[#0D5143]">
                  <Users className="h-4 w-4 text-[#2FC3A5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#263832]">Be Part of the Team</h4>
                  <p className="text-[11px] text-[#82918B] mt-0.5 leading-snug">
                    Collaborate with passionate student entrepreneurs delivering sustainable community impact.
                  </p>
                </div>
              </div>

              {/* Block 2 */}
              <div className="flex items-start gap-3 rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7]/80 p-3.5 transition hover:bg-[#DDF7EF]/40">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E7F3D7] text-[#0D5143]">
                  <Building2 className="h-4 w-4 text-[#2FC3A5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#263832]">Right Department Fit</h4>
                  <p className="text-[11px] text-[#82918B] mt-0.5 leading-snug">
                    Get aligned with domains matching your passion: Tech, Finance, Operations, PR, or Marketing.
                  </p>
                </div>
              </div>

              {/* Block 3 */}
              <div className="flex items-start gap-3 rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7]/80 p-3.5 transition hover:bg-[#DDF7EF]/40">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#E7F3D7] text-[#0D5143]">
                  <ShieldCheck className="h-4 w-4 text-[#2FC3A5]" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#263832]">Secure & Confidential</h4>
                  <p className="text-[11px] text-[#82918B] mt-0.5 leading-snug">
                    Enrollment records and contact details are encrypted and governed strictly under society bylaws.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom decorative badge */}
          <div className="relative z-10 pt-6 mt-4 border-t border-[#E3EBE7]/80 flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#E7F3D7] text-[#0D5143] text-[11px] font-semibold">
              <Sparkles className="h-3 w-3 text-[#2FC3A5]" />
              <span>Official Chapter Portal</span>
            </div>
            <span className="text-[11px] text-[#82918B]">Academic Year 2026–27</span>
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div className="lg:col-span-7 space-y-4">
          {/* Three-step progress indicator */}
          <div className="rounded-3xl border border-[#E3EBE7] bg-white px-6 py-4 shadow-sm">
            <div className="flex items-center justify-between">
              {/* Step 1 */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                    currentStep === 1
                      ? 'bg-[#2FC3A5] text-[#263832] ring-4 ring-[#E7F3D7]'
                      : currentStep > 1
                      ? 'bg-[#2FC3A5] text-[#263832]'
                      : 'bg-[#F7F9F7] text-[#82918B] border border-[#E3EBE7]'
                  }`}
                >
                  {currentStep > 1 ? <CheckCircle2 className="h-4 w-4 text-[#263832]" /> : '1'}
                </div>
                <div className="hidden sm:block">
                  <p className={`text-xs font-bold ${currentStep === 1 ? 'text-[#263832]' : 'text-[#82918B]'}`}>
                    Member Details
                  </p>
                  <p className="text-[10px] text-[#82918B]">Step 1 of 3</p>
                </div>
              </div>

              {/* Divider 1 */}
              <div
                className={`flex-1 mx-3 h-0.5 transition ${
                  currentStep > 1 ? 'bg-[#2FC3A5]' : 'bg-[#E3EBE7]'
                }`}
              />

              {/* Step 2 */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                    currentStep === 2
                      ? 'bg-[#2FC3A5] text-[#263832] ring-4 ring-[#E7F3D7]'
                      : currentStep > 2
                      ? 'bg-[#2FC3A5] text-[#263832]'
                      : 'bg-[#F7F9F7] text-[#82918B] border border-[#E3EBE7]'
                  }`}
                >
                  {currentStep > 2 ? <CheckCircle2 className="h-4 w-4 text-[#263832]" /> : '2'}
                </div>
                <div className="hidden sm:block">
                  <p className={`text-xs font-bold ${currentStep === 2 ? 'text-[#263832]' : 'text-[#82918B]'}`}>
                    Review
                  </p>
                  <p className="text-[10px] text-[#82918B]">Step 2 of 3</p>
                </div>
              </div>

              {/* Divider 2 */}
              <div
                className={`flex-1 mx-3 h-0.5 transition ${
                  currentStep > 2 ? 'bg-[#2FC3A5]' : 'bg-[#E3EBE7]'
                }`}
              />

              {/* Step 3 */}
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition ${
                    currentStep === 3
                      ? 'bg-[#2FC3A5] text-[#263832] ring-4 ring-[#E7F3D7]'
                      : 'bg-[#F7F9F7] text-[#82918B] border border-[#E3EBE7]'
                  }`}
                >
                  3
                </div>
                <div className="hidden sm:block">
                  <p className={`text-xs font-bold ${currentStep === 3 ? 'text-[#263832]' : 'text-[#82918B]'}`}>
                    Confirmation
                  </p>
                  <p className="text-[10px] text-[#82918B]">Step 3 of 3</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card Content */}
          <div className="rounded-3xl border border-[#E3EBE7] bg-white p-6 sm:p-8 shadow-sm">
            {/* ================= STEP 1: MEMBER DETAILS ================= */}
            {currentStep === 1 && (
              <div>
                <div className="mb-6 pb-4 border-b border-[#E3EBE7]">
                  <h2 className="text-xl font-bold text-[#263832]">Basic Information</h2>
                  <p className="mt-1 text-xs text-[#82918B]">
                    Please fill in your details as per your college records.
                  </p>
                </div>

                <form onSubmit={handleNext} className="space-y-4">
                  {/* Field 1: Name */}
                  <div>
                    <label htmlFor="reg-name" className="block text-xs font-bold text-[#263832] mb-1">
                      1. Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-[#82918B]" />
                      <input
                        id="reg-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        placeholder="e.g. Rohini Sen"
                        className={`w-full rounded-2xl border ${
                          errors.name ? 'border-rose-300 bg-rose-50/30' : 'border-[#E3EBE7] bg-[#F7F9F7]'
                        } pl-10 pr-4 py-2.5 text-xs text-[#263832] placeholder-[#82918B] focus:border-[#2FC3A5] focus:bg-white focus:outline-none transition`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.name}
                      </p>
                    )}
                  </div>

                  {/* Field 2: Email */}
                  <div>
                    <label htmlFor="reg-email" className="block text-xs font-bold text-[#263832] mb-1">
                      2. Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-[#82918B]" />
                      <input
                        id="reg-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                        }}
                        placeholder="e.g. rohini.sen@vips.edu"
                        className={`w-full rounded-2xl border ${
                          errors.email ? 'border-rose-300 bg-rose-50/30' : 'border-[#E3EBE7] bg-[#F7F9F7]'
                        } pl-10 pr-4 py-2.5 text-xs text-[#263832] placeholder-[#82918B] focus:border-[#2FC3A5] focus:bg-white focus:outline-none transition`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Field 3: Branch */}
                  <div>
                    <label htmlFor="reg-branch" className="block text-xs font-bold text-[#263832] mb-1">
                      3. Branch <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3.5 top-3 h-4 w-4 text-[#82918B]" />
                      <select
                        id="reg-branch"
                        required
                        value={branch}
                        onChange={(e) => {
                          setBranch(e.target.value);
                          if (errors.branch) setErrors((prev) => ({ ...prev, branch: '' }));
                        }}
                        className={`w-full rounded-2xl border ${
                          errors.branch ? 'border-rose-300 bg-rose-50/30' : 'border-[#E3EBE7] bg-[#F7F9F7]'
                        } pl-10 pr-4 py-2.5 text-xs text-[#263832] focus:border-[#2FC3A5] focus:bg-white focus:outline-none transition appearance-none`}
                      >
                        {COLLEGE_BRANCH_OPTIONS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.branch && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.branch}
                      </p>
                    )}
                  </div>

                  {/* Field 4: Designation */}
                  <div>
                    <label htmlFor="reg-designation" className="block text-xs font-bold text-[#263832] mb-1">
                      4. Designation <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Award className="absolute left-3.5 top-3 h-4 w-4 text-[#82918B]" />
                      <select
                        id="reg-designation"
                        required
                        value={designation}
                        onChange={(e) => {
                          setDesignation(e.target.value);
                          if (errors.designation) setErrors((prev) => ({ ...prev, designation: '' }));
                        }}
                        className={`w-full rounded-2xl border ${
                          errors.designation ? 'border-rose-300 bg-rose-50/30' : 'border-[#E3EBE7] bg-[#F7F9F7]'
                        } pl-10 pr-4 py-2.5 text-xs text-[#263832] focus:border-[#2FC3A5] focus:bg-white focus:outline-none transition appearance-none`}
                      >
                        {SOCIETY_DESIGNATION_OPTIONS.map((des) => (
                          <option key={des} value={des}>
                            {des}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.designation && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.designation}
                      </p>
                    )}
                  </div>

                  {/* Field 5: Enrollment Number (String field preserving leading zeros / letters) */}
                  <div>
                    <label htmlFor="reg-enrollment" className="block text-xs font-bold text-[#263832] mb-1">
                      5. Enrollment Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-3.5 top-3 h-4 w-4 text-[#82918B]" />
                      <input
                        id="reg-enrollment"
                        type="text"
                        required
                        value={enrollment}
                        onChange={(e) => {
                          setEnrollment(e.target.value);
                          if (errors.enrollment) setErrors((prev) => ({ ...prev, enrollment: '' }));
                        }}
                        placeholder="e.g. 04517702025"
                        className={`w-full rounded-2xl border ${
                          errors.enrollment ? 'border-rose-300 bg-rose-50/30' : 'border-[#E3EBE7] bg-[#F7F9F7]'
                        } pl-10 pr-4 py-2.5 text-xs text-[#263832] placeholder-[#82918B] focus:border-[#2FC3A5] focus:bg-white focus:outline-none transition`}
                      />
                    </div>
                    {errors.enrollment ? (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.enrollment}
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#82918B] mt-1">
                        Preserves leading zeros and alphanumeric characters as per your student identity card.
                      </p>
                    )}
                  </div>

                  {/* Field 6: Year in Society */}
                  <div>
                    <label htmlFor="reg-year" className="block text-xs font-bold text-[#263832] mb-1">
                      6. Year in Society <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-3 h-4 w-4 text-[#82918B]" />
                      <select
                        id="reg-year"
                        required
                        value={yearInSociety}
                        onChange={(e) => {
                          setYearInSociety(e.target.value);
                          if (errors.yearInSociety) setErrors((prev) => ({ ...prev, yearInSociety: '' }));
                        }}
                        className={`w-full rounded-2xl border ${
                          errors.yearInSociety ? 'border-rose-300 bg-rose-50/30' : 'border-[#E3EBE7] bg-[#F7F9F7]'
                        } pl-10 pr-4 py-2.5 text-xs text-[#263832] focus:border-[#2FC3A5] focus:bg-white focus:outline-none transition appearance-none`}
                      >
                        {SOCIETY_YEAR_OPTIONS.map((yr) => (
                          <option key={yr} value={yr}>
                            {yr}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.yearInSociety && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.yearInSociety}
                      </p>
                    )}
                  </div>

                  {/* Field 7: Which Department Are You In? */}
                  <div>
                    <label htmlFor="reg-department" className="block text-xs font-bold text-[#263832] mb-1">
                      7. Which Department Are You In? <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-[#82918B]" />
                      <select
                        id="reg-department"
                        required
                        value={departmentId}
                        onChange={(e) => {
                          setDepartmentId(e.target.value);
                          if (errors.departmentId) setErrors((prev) => ({ ...prev, departmentId: '' }));
                        }}
                        className={`w-full rounded-2xl border ${
                          errors.departmentId ? 'border-rose-300 bg-rose-50/30' : 'border-[#E3EBE7] bg-[#F7F9F7]'
                        } pl-10 pr-4 py-2.5 text-xs text-[#263832] focus:border-[#2FC3A5] focus:bg-white focus:outline-none transition appearance-none`}
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.departmentId && (
                      <p className="text-[11px] text-rose-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.departmentId}
                      </p>
                    )}
                  </div>

                  {/* Bottom Actions: Cancel and Next */}
                  <div className="flex items-center justify-between pt-6 border-t border-[#E3EBE7]">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="px-5 py-2.5 rounded-2xl border border-[#E3EBE7] bg-white text-xs font-semibold text-[#82918B] hover:bg-[#F7F9F7] hover:text-[#263832] transition"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#2FC3A5] px-7 py-2.5 text-xs font-bold text-[#263832] hover:bg-[#26B396] shadow-sm transition"
                    >
                      <span>Next</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* ================= STEP 2: REVIEW ================= */}
            {currentStep === 2 && (
              <div>
                <div className="mb-6 pb-4 border-b border-[#E3EBE7]">
                  <h2 className="text-xl font-bold text-[#263832]">Review Your Details</h2>
                  <p className="mt-1 text-xs text-[#82918B]">
                    Please verify all information before submitting your registration for HR verification.
                  </p>
                </div>

                {submitError && (
                  <div className="mb-5 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/80 p-3.5 text-xs text-rose-700 animate-fadeIn">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Submission Error</p>
                      <p className="mt-0.5 text-[11px]">{submitError}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {/* Summary Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7]/70 p-3.5">
                      <span className="text-[11px] font-semibold text-[#82918B] block">1. Full Name</span>
                      <span className="text-xs font-bold text-[#263832] mt-0.5 block">{name}</span>
                    </div>

                    <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7]/70 p-3.5">
                      <span className="text-[11px] font-semibold text-[#82918B] block">2. Email Address</span>
                      <span className="text-xs font-bold text-[#263832] mt-0.5 block break-all">{email}</span>
                    </div>

                    <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7]/70 p-3.5">
                      <span className="text-[11px] font-semibold text-[#82918B] block">3. College Branch</span>
                      <span className="text-xs font-bold text-[#263832] mt-0.5 block">{branch}</span>
                    </div>

                    <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7]/70 p-3.5">
                      <span className="text-[11px] font-semibold text-[#82918B] block">4. Society Designation</span>
                      <span className="text-xs font-bold text-[#263832] mt-0.5 block">{designation}</span>
                    </div>

                    <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7]/70 p-3.5">
                      <span className="text-[11px] font-semibold text-[#82918B] block">5. Enrollment Number</span>
                      <span className="text-xs font-bold font-mono text-[#263832] mt-0.5 block">{enrollment}</span>
                    </div>

                    <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7]/70 p-3.5">
                      <span className="text-[11px] font-semibold text-[#82918B] block">6. Year in Society</span>
                      <span className="text-xs font-bold text-[#263832] mt-0.5 block">{yearInSociety}</span>
                    </div>
                  </div>

                  {/* Department Highlight Box */}
                  <div className="rounded-2xl border border-[#2FC3A5]/30 bg-[#E7F3D7]/40 p-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[#0D5143]" />
                      <span className="text-xs font-bold text-[#0D5143]">
                        7. Assigned Primary Department
                      </span>
                    </div>
                    <p className="text-sm font-black text-[#263832] mt-1">{selectedDeptName}</p>
                  </div>

                  {/* Governance Notice */}
                  <div className="rounded-2xl border border-[#E3EBE7] bg-[#F7F9F7] p-4 text-[11px] text-[#82918B] leading-relaxed flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-[#2FC3A5] shrink-0 mt-0.5" />
                    <span>
                      {isAdminMode
                        ? 'Admin Mode: This member will be onboarded directly into the active team sheet with verified membership status.'
                        : 'Approval Gate: Applications are held in the HR Verification Queue. Access to portal modules will be unlocked upon review by the HR Head or President.'}
                    </span>
                  </div>

                  {/* Bottom Actions: Back and Submit */}
                  <div className="flex items-center justify-between pt-6 border-t border-[#E3EBE7]">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleBack}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl border border-[#E3EBE7] bg-white text-xs font-semibold text-[#82918B] hover:bg-[#F7F9F7] hover:text-[#263832] transition"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                      className="inline-flex items-center gap-2 rounded-2xl bg-[#2FC3A5] px-7 py-2.5 text-xs font-bold text-[#263832] hover:bg-[#26B396] shadow-sm transition disabled:opacity-60"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Saving Record...</span>
                        </>
                      ) : (
                        <>
                          <span>Submit Application</span>
                          <CheckCircle2 className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ================= STEP 3: CONFIRMATION ================= */}
            {currentStep === 3 && createdMember && (
              <div className="text-center py-4 space-y-6 animate-fadeIn">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-[#E7F3D7] text-[#0D5143] shadow-sm ring-8 ring-[#DDF7EF]">
                  <CheckCircle2 className="h-8 w-8 text-[#2FC3A5]" />
                </div>

                <div>
                  <h2 className="text-2xl font-black text-[#263832]">
                    Registration Submitted Successfully!
                  </h2>
                  <p className="mt-2 text-xs text-[#82918B] max-w-md mx-auto leading-relaxed">
                    Your active member registration has been logged in the Enactus VIPS-TC records and forwarded to the HR Administration review queue.
                  </p>
                </div>

                {/* Confirmed Record Summary Card */}
                <div className="rounded-3xl border border-[#E3EBE7] bg-[#F7F9F7] p-5 text-left max-w-md mx-auto space-y-3">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E3EBE7]">
                    <span className="text-[11px] font-semibold text-[#82918B]">Member ID / Reference</span>
                    <span className="text-xs font-mono font-bold text-[#263832] bg-white px-2.5 py-1 rounded-xl border border-[#E3EBE7]">
                      {createdMember.memberId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#82918B]">Candidate Name</span>
                    <span className="font-bold text-[#263832]">{createdMember.name}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#82918B]">Registered Email</span>
                    <span className="font-medium text-[#263832]">{createdMember.email}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#82918B]">Assigned Department</span>
                    <span className="font-bold text-[#263832]">
                      {departments.find((d) => d.id === createdMember.departmentId)?.name ||
                        createdMember.departmentId}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] font-semibold text-[#82918B]">Society Designation</span>
                    <span className="font-semibold text-[#263832]">{createdMember.designation}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[#E3EBE7]">
                    <span className="text-[11px] font-semibold text-[#82918B]">HR Verification Status</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                        createdMember.approvalStatus === 'APPROVED'
                          ? 'bg-[#E7F3D7] text-[#0D5143]'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {createdMember.approvalStatus === 'APPROVED'
                        ? 'Active & Approved'
                        : 'Pending HR Approval'}
                    </span>
                  </div>
                </div>

                {/* Information notice */}
                <p className="text-[11px] text-[#82918B] max-w-sm mx-auto">
                  {createdMember.approvalStatus === 'APPROVED'
                    ? 'The member account is active and visible in the Active Team Sheet.'
                    : 'Once verified by the HR Administrator, you will be able to log in with your credentials.'}
                </p>

                {/* Next Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                  {!isAdminMode ? (
                    <>
                      <Link
                        href="/pending-approval"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2FC3A5] px-6 py-2.5 text-xs font-bold text-[#263832] hover:bg-[#26B396] shadow-sm transition"
                      >
                        <Clock className="h-4 w-4" />
                        <span>Check Approval Status</span>
                      </Link>
                      <Link
                        href="/login"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-[#E3EBE7] bg-white px-6 py-2.5 text-xs font-semibold text-[#263832] hover:bg-[#F7F9F7] transition"
                      >
                        <LogIn className="h-4 w-4 text-[#82918B]" />
                        <span>Return to Sign In</span>
                      </Link>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        if (onCancel) onCancel();
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2FC3A5] px-6 py-2.5 text-xs font-bold text-[#263832] hover:bg-[#26B396] shadow-sm transition"
                    >
                      <span>Close & Return to Team Sheet</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
