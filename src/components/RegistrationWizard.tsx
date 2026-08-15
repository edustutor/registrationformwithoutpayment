"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, CaretRight, CaretLeft, WhatsappLogo, PhoneCall, PlusCircle, WarningCircle } from "@phosphor-icons/react";
import Image from "next/image";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

import { SYLLABUS_OPTIONS, GRADE_OPTIONS, MEDIUM_OPTIONS, SUBJECT_MAPPINGS } from "@/lib/constants";
import { locales } from "@/lib/locales";

// Form Validation Schema
const schema = z.object({
  language: z.string().optional(),
  
  // Student Details
  studentName: z.string().min(2, "Name must be at least 2 characters").optional(),
  studentPhone: z.string().regex(/^[0-9]+$/, "Must contain numbers only").optional(),
  school: z.string().optional(),

  // Academic Details
  syllabus: z.string().optional(),
  grade: z.string().optional(),
  medium: z.string().optional(),
  subjects: z.array(z.string()).optional(),

  // Parent Details
  parentName: z.union([z.literal(""), z.string().min(2, "Name must be at least 2 characters")]).optional(),
  parentPhone: z.union([z.literal(""), z.string().regex(/^[0-9]+$/, "Must contain numbers only")]).optional(),
  address: z.string().optional(),
  district: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function RegistrationWizard() {
  const [step, setStep] = useState(0);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const { width, height } = useWindowSize();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subjects: [],
    },
    mode: "onChange",
  });

  const { watch, setValue, trigger, formState: { errors } } = form;
  const values = watch();
  
  const t = locales[values.language || "English"];

  const nextStep = async (fieldsToValidate?: (keyof FormData)[]) => {
    let isValid = true;
    if (fieldsToValidate) {
      isValid = await trigger(fieldsToValidate);
    }
    if (isValid) {
      setStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLanguageSelect = (lang: string) => {
    setValue("language", lang);
    nextStep();
  };

  const generateWhatsAppLink = () => {
    const text = `Hi, I would like to join EDUS!
Here are my details:
*Student Name*: ${values.studentName}
*Student Phone*: ${values.studentPhone}
*School*: ${values.school || "N/A"}
*Syllabus*: ${values.syllabus}
*Grade*: ${values.grade}
*Medium*: ${values.medium}
*Subjects*: ${values.subjects && values.subjects.length > 0 ? values.subjects.join(", ") : "N/A"}
*Parent Name*: ${values.parentName}
*Parent Phone*: ${values.parentPhone}
*Address*: ${values.address || "N/A"}
*District*: ${values.district || "N/A"}`;
    return `https://wa.me/94707072072?text=${encodeURIComponent(text)}`;
  };

  // Determine available subjects based on current selections
  const availableSubjects = (values.grade && values.medium) 
    ? SUBJECT_MAPPINGS[values.grade]?.[values.medium] || [] 
    : [];

  const isOtherSyllabus = values.syllabus === "Cambridge" || values.syllabus === "Edexcel";

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-3 sm:py-12 sm:px-6 relative min-h-[100dvh] flex flex-col justify-center font-sans safe-p-bottom">
      {/* Confetti animation for success step */}
      {step === 4 && <Confetti width={width} height={height} numberOfPieces={500} recycle={false} />}
      
      <div className="border border-white/50 shadow-2xl bg-white/90 backdrop-blur-3xl rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden">
        
        {/* Playful Progress Bar */}
        {step > 0 && step < 4 && (
          <div className="w-full bg-slate-100/50 h-1.5 sm:h-2">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-r-full"
              initial={{ width: `${((step - 1) / 3) * 100}%` }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        )}

        <div className="p-6 sm:p-12">
          <AnimatePresence mode="wait">
            
            {/* STEP 0: LANGUAGE SELECTION */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="py-10 sm:py-16 flex flex-col items-center justify-center text-center"
              >
                <div className="mb-8 flex justify-center">
                  <Image 
                    src="/edus_logo_blue.webp" 
                    alt="EDUS Logo" 
                    width={160} 
                    height={65} 
                    className="object-contain w-36 sm:w-44"
                    priority
                  />
                </div>
                <h1 className="text-3xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-blue-700 to-indigo-800 mb-4 tracking-tight leading-tight">
                  Welcome to EDUS
                </h1>
                <p className="text-slate-500 mb-10 sm:mb-12 text-sm sm:text-base font-medium">Choose your preferred language to begin</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm sm:max-w-md">
                  <button 
                    type="button"
                    className="flex items-center justify-center min-h-[4rem] sm:min-h-[5rem] text-lg sm:text-xl font-bold border-2 border-blue-100 bg-white hover:bg-blue-50/50 hover:border-blue-500 hover:text-blue-700 hover:shadow-xl hover:shadow-blue-500/10 transition-all rounded-2xl sm:rounded-3xl cursor-pointer active:scale-[0.98]"
                    onClick={() => handleLanguageSelect("English")}
                  >
                    English
                  </button>
                  <button 
                    type="button"
                    className="flex items-center justify-center min-h-[4rem] sm:min-h-[5rem] text-lg sm:text-xl font-bold border-2 border-indigo-100 bg-white hover:bg-indigo-50/50 hover:border-indigo-500 hover:text-indigo-700 hover:shadow-xl hover:shadow-indigo-500/10 transition-all rounded-2xl sm:rounded-3xl cursor-pointer active:scale-[0.98]"
                    onClick={() => handleLanguageSelect("Tamil")}
                  >
                    தமிழ்
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 1: STUDENT DETAILS */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="pb-8 text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{t.studentDetailsTitle}</h2>
                  <p className="text-sm sm:text-base font-medium text-slate-500 mt-2">{t.studentDetailsDesc}</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="studentName" className="block text-sm font-bold text-slate-700">{t.fullNameLabel} <span className="text-red-500">*</span></label>
                    <input 
                      id="studentName" 
                      type="text"
                      placeholder={t.fullNamePlaceholder} 
                      {...form.register("studentName")}
                      className="w-full text-base sm:text-sm px-5 min-h-[3.5rem] bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 rounded-2xl transition-all shadow-sm placeholder:text-slate-400"
                    />
                    {errors.studentName && <p className="text-xs font-semibold text-red-500 ml-1">{errors.studentName.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="studentPhone" className="block text-sm font-bold text-slate-700">{t.phoneLabel} <span className="text-red-500">*</span></label>
                    <input 
                      id="studentPhone" 
                      type="tel"
                      placeholder={t.phonePlaceholder} 
                      {...form.register("studentPhone")}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                      }}
                      className="w-full text-base sm:text-sm px-5 min-h-[3.5rem] bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 rounded-2xl transition-all shadow-sm placeholder:text-slate-400"
                    />
                    {errors.studentPhone && <p className="text-xs font-semibold text-red-500 ml-1">{errors.studentPhone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="school" className="block text-sm font-bold text-slate-700">{t.schoolLabel} <span className="text-slate-400 font-medium ml-1">{t.optionalText}</span></label>
                    <input 
                      id="school" 
                      type="text"
                      placeholder={t.schoolPlaceholder} 
                      {...form.register("school")}
                      className="w-full text-base sm:text-sm px-5 min-h-[3.5rem] bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 rounded-2xl transition-all shadow-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>
                
                <div className="pt-10 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 justify-between">
                  <button type="button" onClick={prevStep} className="flex items-center justify-center w-full sm:w-auto px-6 min-h-[3.5rem] text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-2xl transition-colors active:scale-[0.98]">
                    <CaretLeft className="mr-1.5" weight="bold" /> {t.backBtn}
                  </button>
                  <button 
                    type="button"
                    onClick={() => nextStep(["studentName", "studentPhone"])}
                    className="flex items-center justify-center w-full sm:w-auto px-10 min-h-[3.5rem] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                  >
                    {t.continueBtn} <CaretRight className="ml-1.5" weight="bold" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: ACADEMIC DETAILS */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="pb-8 text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{t.academicTitle}</h2>
                  <p className="text-sm sm:text-base font-medium text-slate-500 mt-2">{t.academicDesc}</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="syllabus" className="block text-sm font-bold text-slate-700">{t.syllabusLabel} <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <select 
                        id="syllabus"
                        className="w-full text-base sm:text-sm px-5 min-h-[3.5rem] bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 rounded-2xl transition-all shadow-sm appearance-none cursor-pointer"
                        value={values.syllabus || ""}
                        onChange={(e) => setValue("syllabus", e.target.value || undefined)}
                      >
                        <option value="" disabled hidden>{t.syllabusPlaceholder}</option>
                        {SYLLABUS_OPTIONS.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-slate-400">
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                      </div>
                    </div>
                  </div>

                  {values.syllabus && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="grade" className="block text-sm font-bold text-slate-700">{t.gradeLabel} <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <select 
                              id="grade"
                              className="w-full text-base sm:text-sm px-5 min-h-[3.5rem] bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 rounded-2xl transition-all shadow-sm appearance-none cursor-pointer"
                              value={values.grade || ""}
                              onChange={(e) => { setValue("grade", e.target.value || undefined); setValue("subjects", []); }}
                            >
                              <option value="" disabled hidden>{t.gradePlaceholder}</option>
                              {GRADE_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-slate-400">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="medium" className="block text-sm font-bold text-slate-700">{t.mediumLabel} <span className="text-red-500">*</span></label>
                          <div className="relative">
                            <select 
                              id="medium"
                              className="w-full text-base sm:text-sm px-5 min-h-[3.5rem] bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 rounded-2xl transition-all shadow-sm appearance-none cursor-pointer"
                              value={values.medium || ""}
                              onChange={(e) => { setValue("medium", e.target.value || undefined); setValue("subjects", []); }}
                            >
                              <option value="" disabled hidden>{t.mediumPlaceholder}</option>
                              {MEDIUM_OPTIONS.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-slate-400">
                              <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Subjects Logic */}
                      {isOtherSyllabus ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="bg-blue-50/50 border-2 border-blue-100 rounded-2xl p-5 text-blue-800"
                        >
                          <p className="font-bold text-sm mb-1">{t.customReqTitle}</p>
                          <p className="text-blue-700/80 text-sm leading-relaxed">
                            {t.customReqDesc(values.syllabus)}
                          </p>
                        </motion.div>
                      ) : (
                        availableSubjects.length > 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-4">
                            <label className="block text-sm font-bold text-slate-700">{t.selectSubjectsLabel}</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {availableSubjects.map((subject) => (
                                <Controller
                                  key={subject}
                                  control={form.control}
                                  name="subjects"
                                  render={({ field }) => {
                                    return (
                                      <label className="flex items-center space-x-3 bg-white p-4 sm:p-3 rounded-2xl sm:rounded-xl border-2 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-all shadow-sm active:scale-[0.98]">
                                        <input 
                                          type="checkbox"
                                          checked={field.value?.includes(subject)}
                                          onChange={(e) => {
                                            return e.target.checked
                                              ? field.onChange([...(field.value || []), subject])
                                              : field.onChange(field.value?.filter((value) => value !== subject))
                                          }}
                                          className="w-5 h-5 sm:w-4 sm:h-4 text-indigo-600 bg-slate-50 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2 focus:ring-offset-1 accent-indigo-600 transition-all"
                                        />
                                        <span className="text-base sm:text-sm font-semibold text-slate-700 select-none">
                                          {subject}
                                        </span>
                                      </label>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )
                      )}
                    </>
                  )}
                </div>
                
                <div className="pt-10 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 justify-between">
                  <button type="button" onClick={prevStep} className="flex items-center justify-center w-full sm:w-auto px-6 min-h-[3.5rem] text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-2xl transition-colors active:scale-[0.98]">
                    <CaretLeft className="mr-1.5" weight="bold" /> {t.backBtn}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (!values.syllabus || !values.grade || !values.medium) {
                        setAlertMessage(t.selectSyllabusAlert);
                        return;
                      }
                      nextStep();
                    }}
                    className="flex items-center justify-center w-full sm:w-auto px-10 min-h-[3.5rem] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl text-sm font-bold text-white shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]"
                  >
                    {t.continueBtn} <CaretRight className="ml-1.5" weight="bold" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: PARENT / GUARDIAN DETAILS */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="pb-8 text-center sm:text-left">
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">{t.parentTitle}</h2>
                  <p className="text-sm sm:text-base font-medium text-slate-500 mt-2">{t.parentDesc}</p>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="parentName" className="block text-sm font-bold text-slate-700">{t.parentNameLabel}</label>
                    <input 
                      id="parentName" 
                      type="text"
                      placeholder={t.parentNamePlaceholder} 
                      {...form.register("parentName")}
                      className="w-full text-base sm:text-sm px-5 min-h-[3.5rem] bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 rounded-2xl transition-all shadow-sm placeholder:text-slate-400"
                    />
                    {errors.parentName && <p className="text-xs font-semibold text-red-500 ml-1">{errors.parentName.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="parentPhone" className="block text-sm font-bold text-slate-700">{t.phoneLabel}</label>
                    <input 
                      id="parentPhone" 
                      type="tel"
                      placeholder={t.phonePlaceholder} 
                      {...form.register("parentPhone")}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                      }}
                      className="w-full text-base sm:text-sm px-5 min-h-[3.5rem] bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 rounded-2xl transition-all shadow-sm placeholder:text-slate-400"
                    />
                    {errors.parentPhone && <p className="text-xs font-semibold text-red-500 ml-1">{errors.parentPhone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="address" className="block text-sm font-bold text-slate-700">{t.addressLabel}</label>
                    <input 
                      id="address" 
                      type="text"
                      placeholder={t.addressPlaceholder} 
                      {...form.register("address")}
                      className="w-full text-base sm:text-sm px-5 min-h-[3.5rem] bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 rounded-2xl transition-all shadow-sm placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="district" className="block text-sm font-bold text-slate-700">{t.districtLabel}</label>
                    <input 
                      id="district" 
                      type="text"
                      placeholder={t.districtPlaceholder} 
                      {...form.register("district")}
                      className="w-full text-base sm:text-sm px-5 min-h-[3.5rem] bg-slate-50/50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 rounded-2xl transition-all shadow-sm placeholder:text-slate-400"
                    />
                  </div>
                </div>
                
                <div className="pt-10 flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 justify-between">
                  <button type="button" onClick={prevStep} className="flex items-center justify-center w-full sm:w-auto px-6 min-h-[3.5rem] text-sm font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 rounded-2xl transition-colors active:scale-[0.98]">
                    <CaretLeft className="mr-1.5" weight="bold" /> {t.backBtn}
                  </button>
                  <button 
                    type="button"
                    onClick={() => nextStep(["parentName", "parentPhone"])}
                    className="flex items-center justify-center w-full sm:w-auto px-10 min-h-[3.5rem] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-2xl text-sm font-bold text-white shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.98]"
                  >
                    {t.submitBtn} <Check className="ml-1.5" weight="bold" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="py-10 flex flex-col items-center justify-center text-center relative"
              >
                <div className="w-24 h-24 sm:w-20 sm:h-20 bg-gradient-to-br from-green-300 to-emerald-500 text-white rounded-full flex items-center justify-center mb-8 sm:mb-6 shadow-xl shadow-green-500/20 border-4 border-white z-10">
                  <Check size={48} weight="bold" />
                </div>
                <h2 className="text-3xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-green-700 to-emerald-800 mb-3 z-10 tracking-tight">
                  {t.successTitle}
                </h2>
                <p className="text-slate-500 mb-10 text-base sm:text-sm max-w-sm leading-relaxed z-10">
                  {t.successDesc}
                </p>
                
                <div className="w-full max-w-sm sm:max-w-xs space-y-4 z-10">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.contactTitle}</div>
                  
                  <a href={generateWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="block">
                    <button type="button" className="flex items-center justify-center w-full min-h-[3.5rem] text-sm sm:text-base font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-[#25D366]/25 rounded-2xl transition-transform active:scale-[0.98] cursor-pointer">
                      <WhatsappLogo size={24} weight="fill" className="mr-2" />
                      {t.sendWhatsapp}
                    </button>
                  </a>
                  
                  <a href="tel:+94707072072" className="block">
                    <button type="button" className="flex items-center justify-center w-full min-h-[3.5rem] text-sm sm:text-base font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 rounded-2xl transition-transform active:scale-[0.98] cursor-pointer">
                      <PhoneCall size={24} weight="fill" className="mr-2" />
                      {t.callUs} +94 70 707 2072
                    </button>
                  </a>

                  <div className="flex justify-center pt-6">
                    <button 
                      type="button"
                      onClick={() => {
                        form.reset({
                          studentName: "",
                          studentPhone: "",
                          school: "",
                          syllabus: "",
                          grade: "",
                          medium: "",
                          subjects: [],
                          parentName: "",
                          parentPhone: "",
                          address: "",
                          district: "",
                          language: form.getValues("language")
                        });
                        setStep(1);
                      }}
                      className="flex items-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-bold text-sm h-12 px-6 rounded-2xl transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      <PlusCircle size={20} weight="fill" className="mr-2" />
                      {t.newRegistration}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Custom Alert Modal */}
      <AnimatePresence>
        {alertMessage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2rem] shadow-2xl p-6 sm:p-8 max-w-sm w-full border border-slate-100 flex flex-col items-center text-center"
            >
              <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-5">
                <WarningCircle size={32} weight="fill" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800 mb-2 tracking-tight">Almost there</h3>
              <p className="text-slate-500 text-sm font-medium mb-8 leading-relaxed">
                {alertMessage}
              </p>
              <button
                type="button"
                onClick={() => setAlertMessage(null)}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold min-h-[3.5rem] rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-slate-900/20"
              >
                Okay
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
