"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, CaretRight, CaretLeft, WhatsappLogo, PhoneCall, PlusCircle } from "@phosphor-icons/react";
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
    <div className="w-full max-w-2xl mx-auto py-8 px-4 relative">
      {/* Confetti animation for success step */}
      {step === 4 && <Confetti width={width} height={height} numberOfPieces={500} recycle={false} />}
      
      <div className="border border-white/40 shadow-xl bg-white/80 backdrop-blur-2xl rounded-3xl overflow-hidden">
        
        {/* Playful Progress Bar */}
        {step > 0 && step < 4 && (
          <div className="w-full bg-slate-100 h-2">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-r-full"
              initial={{ width: `${((step - 1) / 3) * 100}%` }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        )}

        <div className="p-6 sm:p-10">
          <AnimatePresence mode="wait">
            
            {/* STEP 0: LANGUAGE SELECTION */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="py-12 flex flex-col items-center justify-center text-center"
              >
                <div className="mb-6 flex justify-center">
                  <Image 
                    src="/edus_logo_blue.webp" 
                    alt="EDUS Logo" 
                    width={180} 
                    height={70} 
                    className="object-contain"
                    priority
                  />
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 mb-3 tracking-tight">
                  Welcome to EDUS
                </h1>
                <p className="text-slate-500 mb-10 text-sm font-medium">Choose your preferred language to begin</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-sm">
                  <button 
                    type="button"
                    className="flex items-center justify-center h-20 text-xl font-bold border-2 border-blue-100 bg-white hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 hover:shadow-lg hover:shadow-blue-500/10 transition-all rounded-2xl cursor-pointer"
                    onClick={() => handleLanguageSelect("English")}
                  >
                    English
                  </button>
                  <button 
                    type="button"
                    className="flex items-center justify-center h-20 text-xl font-bold border-2 border-indigo-100 bg-white hover:bg-indigo-50 hover:border-indigo-500 hover:text-indigo-700 hover:shadow-lg hover:shadow-indigo-500/10 transition-all rounded-2xl cursor-pointer"
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
                <div className="pb-6 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-slate-800">{t.studentDetailsTitle}</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">{t.studentDetailsDesc}</p>
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="studentName" className="block text-sm font-semibold text-slate-700">{t.fullNameLabel} <span className="text-red-500">*</span></label>
                    <input 
                      id="studentName" 
                      type="text"
                      placeholder={t.fullNamePlaceholder} 
                      {...form.register("studentName")}
                      className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-shadow shadow-sm"
                    />
                    {errors.studentName && <p className="text-xs font-medium text-red-500">{errors.studentName.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="studentPhone" className="block text-sm font-semibold text-slate-700">{t.phoneLabel} <span className="text-red-500">*</span></label>
                    <input 
                      id="studentPhone" 
                      type="tel"
                      placeholder={t.phonePlaceholder} 
                      {...form.register("studentPhone")}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                      }}
                      className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-shadow shadow-sm"
                    />
                    {errors.studentPhone && <p className="text-xs font-medium text-red-500">{errors.studentPhone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="school" className="block text-sm font-semibold text-slate-700">{t.schoolLabel} <span className="text-slate-400 font-normal">{t.optionalText}</span></label>
                    <input 
                      id="school" 
                      type="text"
                      placeholder={t.schoolPlaceholder} 
                      {...form.register("school")}
                      className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-shadow shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="pt-8 flex flex-col-reverse sm:flex-row gap-3 justify-between">
                  <button type="button" onClick={prevStep} className="flex items-center justify-center w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                    <CaretLeft className="mr-1.5" weight="bold" /> {t.backBtn}
                  </button>
                  <button 
                    type="button"
                    onClick={() => nextStep(["studentName", "studentPhone"])}
                    className="flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
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
                <div className="pb-6 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-slate-800">{t.academicTitle}</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">{t.academicDesc}</p>
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="syllabus" className="block text-sm font-semibold text-slate-700">{t.syllabusLabel} <span className="text-red-500">*</span></label>
                    <select 
                      id="syllabus"
                      className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-shadow shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:0.65em_auto]"
                      value={values.syllabus || ""}
                      onChange={(e) => setValue("syllabus", e.target.value || undefined)}
                    >
                      <option value="" disabled hidden>{t.syllabusPlaceholder}</option>
                      {SYLLABUS_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  {values.syllabus && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <label htmlFor="grade" className="block text-sm font-semibold text-slate-700">{t.gradeLabel} <span className="text-red-500">*</span></label>
                          <select 
                            id="grade"
                            className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-shadow shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:0.65em_auto]"
                            value={values.grade || ""}
                            onChange={(e) => { setValue("grade", e.target.value || undefined); setValue("subjects", []); }}
                          >
                            <option value="" disabled hidden>{t.gradePlaceholder}</option>
                            {GRADE_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="medium" className="block text-sm font-semibold text-slate-700">{t.mediumLabel} <span className="text-red-500">*</span></label>
                          <select 
                            id="medium"
                            className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-shadow shadow-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] bg-[length:0.65em_auto]"
                            value={values.medium || ""}
                            onChange={(e) => { setValue("medium", e.target.value || undefined); setValue("subjects", []); }}
                          >
                            <option value="" disabled hidden>{t.mediumPlaceholder}</option>
                            {MEDIUM_OPTIONS.map(opt => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Subjects Logic */}
                      {isOtherSyllabus ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="bg-blue-50/80 border border-blue-100 rounded-2xl p-5 text-blue-800"
                        >
                          <p className="font-semibold text-sm mb-1">{t.customReqTitle}</p>
                          <p className="text-blue-700/80 text-xs">
                            {t.customReqDesc(values.syllabus)}
                          </p>
                        </motion.div>
                      ) : (
                        availableSubjects.length > 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 pt-3">
                            <label className="block text-sm font-semibold text-slate-700">{t.selectSubjectsLabel}</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                              {availableSubjects.map((subject) => (
                                <Controller
                                  key={subject}
                                  control={form.control}
                                  name="subjects"
                                  render={({ field }) => {
                                    return (
                                      <label className="flex items-center space-x-3 bg-white p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 cursor-pointer transition-colors shadow-sm">
                                        <input 
                                          type="checkbox"
                                          checked={field.value?.includes(subject)}
                                          onChange={(e) => {
                                            return e.target.checked
                                              ? field.onChange([...(field.value || []), subject])
                                              : field.onChange(field.value?.filter((value) => value !== subject))
                                          }}
                                          className="w-4 h-4 text-indigo-600 bg-slate-100 border-slate-300 rounded focus:ring-indigo-500 focus:ring-2 accent-indigo-600"
                                        />
                                        <span className="text-sm font-medium text-slate-700 select-none">
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
                
                <div className="pt-8 flex flex-col-reverse sm:flex-row gap-3 justify-between">
                  <button type="button" onClick={prevStep} className="flex items-center justify-center w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                    <CaretLeft className="mr-1.5" weight="bold" /> {t.backBtn}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (!values.syllabus || !values.grade || !values.medium) {
                        alert(t.selectSyllabusAlert);
                        return;
                      }
                      nextStep();
                    }}
                    className="flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
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
                <div className="pb-6 text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-slate-800">{t.parentTitle}</h2>
                  <p className="text-sm font-medium text-slate-500 mt-1">{t.parentDesc}</p>
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="parentName" className="block text-sm font-semibold text-slate-700">{t.parentNameLabel} <span className="text-slate-400 font-normal">{t.optionalText}</span></label>
                    <input 
                      id="parentName" 
                      type="text"
                      placeholder={t.parentNamePlaceholder} 
                      {...form.register("parentName")}
                      className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-shadow shadow-sm"
                    />
                    {errors.parentName && <p className="text-xs font-medium text-red-500">{errors.parentName.message}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="parentPhone" className="block text-sm font-semibold text-slate-700">{t.phoneLabel} <span className="text-slate-400 font-normal">{t.optionalText}</span></label>
                    <input 
                      id="parentPhone" 
                      type="tel"
                      placeholder={t.phonePlaceholder} 
                      {...form.register("parentPhone")}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                      }}
                      className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-shadow shadow-sm"
                    />
                    {errors.parentPhone && <p className="text-xs font-medium text-red-500">{errors.parentPhone.message}</p>}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="address" className="block text-sm font-semibold text-slate-700">{t.addressLabel} <span className="text-slate-400 font-normal">{t.optionalText}</span></label>
                    <input 
                      id="address" 
                      type="text"
                      placeholder={t.addressPlaceholder} 
                      {...form.register("address")}
                      className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-shadow shadow-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="district" className="block text-sm font-semibold text-slate-700">{t.districtLabel} <span className="text-slate-400 font-normal">{t.optionalText}</span></label>
                    <input 
                      id="district" 
                      type="text"
                      placeholder={t.districtPlaceholder} 
                      {...form.register("district")}
                      className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl transition-shadow shadow-sm"
                    />
                  </div>
                </div>
                
                <div className="pt-8 flex flex-col-reverse sm:flex-row gap-3 justify-between">
                  <button type="button" onClick={prevStep} className="flex items-center justify-center w-full sm:w-auto px-6 py-3 text-sm font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors">
                    <CaretLeft className="mr-1.5" weight="bold" /> {t.backBtn}
                  </button>
                  <button 
                    type="button"
                    onClick={() => nextStep(["parentName", "parentPhone"])}
                    className="flex items-center justify-center w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl text-sm font-bold text-white shadow-md shadow-green-500/20 transition-all active:scale-[0.98]"
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
                <div className="w-20 h-20 bg-gradient-to-br from-green-300 to-emerald-500 text-white rounded-full flex items-center justify-center mb-6 shadow-lg shadow-green-500/20 border-4 border-white z-10">
                  <Check size={40} weight="bold" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-700 mb-3 z-10">
                  {t.successTitle}
                </h2>
                <p className="text-slate-500 mb-8 text-sm max-w-sm leading-relaxed z-10">
                  {t.successDesc}
                </p>
                
                <div className="w-full max-w-xs space-y-4 z-10">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.contactTitle}</div>
                  
                  <a href={generateWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="block">
                    <button type="button" className="flex items-center justify-center w-full h-12 text-sm font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-md shadow-[#25D366]/20 rounded-xl transition-transform active:scale-[0.98] cursor-pointer">
                      <WhatsappLogo size={20} weight="fill" className="mr-2" />
                      {t.sendWhatsapp}
                    </button>
                  </a>
                  
                  <a href="tel:+94707072072" className="block">
                    <button type="button" className="flex items-center justify-center w-full h-12 text-sm font-bold border-2 border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-blue-300 hover:text-blue-600 rounded-xl transition-transform active:scale-[0.98] cursor-pointer">
                      <PhoneCall size={20} weight="fill" className="mr-2" />
                      {t.callUs} +94 70 707 2072
                    </button>
                  </a>

                  <div className="flex justify-center pt-4">
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
                      className="flex items-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 font-semibold text-xs h-10 px-4 rounded-xl transition-colors cursor-pointer"
                    >
                      <PlusCircle size={18} weight="fill" className="mr-1.5" />
                      {t.newRegistration}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
