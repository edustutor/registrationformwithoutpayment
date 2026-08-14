"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Check, CaretRight, CaretLeft, WhatsappLogo, PhoneCall, Student, PlusCircle } from "@phosphor-icons/react";
import Image from "next/image";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="w-full max-w-3xl mx-auto py-8 px-4 relative">
      {/* Confetti animation for success step */}
      {step === 4 && <Confetti width={width} height={height} numberOfPieces={500} recycle={false} />}
      


      <Card className="border border-white/40 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] bg-white/80 backdrop-blur-2xl rounded-3xl overflow-hidden">
        
        {/* Playful Progress Bar */}
        {step > 0 && step < 4 && (
          <div className="w-full bg-slate-100 h-3">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 h-full rounded-r-full"
              initial={{ width: `${((step - 1) / 3) * 100}%` }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        )}

        <div className="p-4 sm:p-8">
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
                <div className="mb-8 flex justify-center">
                  <Image 
                    src="/edus_logo_blue.webp" 
                    alt="EDUS Logo" 
                    width={200} 
                    height={80} 
                    className="object-contain"
                    priority
                  />
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-indigo-700 mb-4 tracking-tight">
                  Welcome to EDUS
                </h1>
                <p className="text-slate-600 mb-12 text-lg font-medium">Choose your preferred language to begin</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-md">
                  <Button 
                    variant="outline" 
                    className="h-28 text-2xl font-bold border-2 border-blue-100 bg-white hover:bg-blue-50 hover:border-blue-500 hover:text-blue-700 hover:shadow-xl hover:shadow-blue-500/20 transition-all rounded-3xl"
                    onClick={() => handleLanguageSelect("English")}
                  >
                    English
                  </Button>
                  <Button 
                    variant="outline" 
                    className="h-28 text-2xl font-bold border-2 border-indigo-100 bg-white hover:bg-indigo-50 hover:border-indigo-500 hover:text-indigo-700 hover:shadow-xl hover:shadow-indigo-500/20 transition-all rounded-3xl"
                    onClick={() => handleLanguageSelect("Tamil")}
                  >
                    தமிழ்
                  </Button>
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
                <CardHeader className="px-0 pb-8 text-center sm:text-left">
                  <CardTitle className="text-3xl font-extrabold text-slate-800">{t.studentDetailsTitle}</CardTitle>
                  <CardDescription className="text-base font-medium text-slate-500 mt-2">{t.studentDetailsDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-0">
                  <div className="space-y-3">
                    <Label htmlFor="studentName" className="text-base font-semibold text-slate-700">{t.fullNameLabel} <span className="text-red-500">*</span></Label>
                    <Input 
                      id="studentName" 
                      placeholder={t.fullNamePlaceholder} 
                      {...form.register("studentName")}
                      className="h-14 text-lg bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-2xl shadow-sm"
                    />
                    {errors.studentName && <p className="text-sm font-medium text-red-500">{errors.studentName.message}</p>}
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="studentPhone" className="text-base font-semibold text-slate-700">{t.phoneLabel} <span className="text-red-500">*</span></Label>
                    <Input 
                      id="studentPhone" 
                      type="tel"
                      placeholder={t.phonePlaceholder} 
                      {...form.register("studentPhone")}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                      }}
                      className="h-14 text-lg bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-2xl shadow-sm"
                    />
                    {errors.studentPhone && <p className="text-sm font-medium text-red-500">{errors.studentPhone.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="school" className="text-base font-semibold text-slate-700">{t.schoolLabel} <span className="text-slate-400 font-normal">{t.optionalText}</span></Label>
                    <Input 
                      id="school" 
                      placeholder={t.schoolPlaceholder} 
                      {...form.register("school")}
                      className="h-14 text-lg bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-2xl shadow-sm"
                    />
                  </div>
                </CardContent>
                <CardFooter className="px-0 pt-8 flex flex-col-reverse sm:flex-row gap-4 justify-between">
                  <Button variant="ghost" onClick={prevStep} className="w-full sm:w-auto text-slate-500 hover:text-slate-900 h-14 rounded-2xl text-lg font-semibold">
                    <CaretLeft className="mr-2" weight="bold" /> {t.backBtn}
                  </Button>
                  <Button 
                    onClick={() => nextStep(["studentName", "studentPhone"])}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-14 px-10 rounded-2xl text-lg font-bold text-white shadow-lg shadow-blue-500/30"
                  >
                    {t.continueBtn} <CaretRight className="ml-2" weight="bold" />
                  </Button>
                </CardFooter>
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
                <CardHeader className="px-0 pb-8 text-center sm:text-left">
                  <CardTitle className="text-3xl font-extrabold text-slate-800">{t.academicTitle}</CardTitle>
                  <CardDescription className="text-base font-medium text-slate-500 mt-2">{t.academicDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-0">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold text-slate-700">{t.syllabusLabel} <span className="text-red-500">*</span></Label>
                    <Select onValueChange={(val) => setValue("syllabus", val || undefined)} value={values.syllabus || undefined}>
                      <SelectTrigger className="h-14 text-lg bg-slate-50/50 border-slate-200 focus:ring-blue-500 rounded-2xl shadow-sm">
                        <SelectValue placeholder={t.syllabusPlaceholder} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200">
                        {SYLLABUS_OPTIONS.map(opt => (
                          <SelectItem key={opt} value={opt} className="text-base py-3 cursor-pointer rounded-lg">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {values.syllabus && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <Label className="text-base font-semibold text-slate-700">{t.gradeLabel} <span className="text-red-500">*</span></Label>
                          <Select onValueChange={(val) => { setValue("grade", val || undefined); setValue("subjects", []); }} value={values.grade || undefined}>
                            <SelectTrigger className="h-14 text-lg bg-slate-50/50 border-slate-200 focus:ring-blue-500 rounded-2xl shadow-sm">
                              <SelectValue placeholder={t.gradePlaceholder} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200 max-h-60">
                              {GRADE_OPTIONS.map(opt => (
                                <SelectItem key={opt} value={opt} className="text-base py-3 cursor-pointer rounded-lg">{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-3">
                          <Label className="text-base font-semibold text-slate-700">{t.mediumLabel} <span className="text-red-500">*</span></Label>
                          <Select onValueChange={(val) => { setValue("medium", val || undefined); setValue("subjects", []); }} value={values.medium || undefined}>
                            <SelectTrigger className="h-14 text-lg bg-slate-50/50 border-slate-200 focus:ring-blue-500 rounded-2xl shadow-sm">
                              <SelectValue placeholder={t.mediumPlaceholder} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-slate-200">
                              {MEDIUM_OPTIONS.map(opt => (
                                <SelectItem key={opt} value={opt} className="text-base py-3 cursor-pointer rounded-lg">{opt}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Subjects Logic */}
                      {isOtherSyllabus ? (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-3xl p-6 text-blue-800 shadow-inner"
                        >
                          <p className="font-bold text-xl mb-2">{t.customReqTitle}</p>
                          <p className="text-blue-700/80 text-base font-medium">
                            {t.customReqDesc(values.syllabus)}
                          </p>
                        </motion.div>
                      ) : (
                        availableSubjects.length > 0 && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-4">
                            <Label className="text-base font-semibold text-slate-700">{t.selectSubjectsLabel}</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              {availableSubjects.map((subject) => (
                                <Controller
                                  key={subject}
                                  control={form.control}
                                  name="subjects"
                                  render={({ field }) => {
                                    return (
                                      <label className="flex items-center space-x-3 bg-white p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-300 hover:bg-indigo-50/50 cursor-pointer transition-all shadow-sm">
                                        <Checkbox 
                                          checked={field.value?.includes(subject)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...(field.value || []), subject])
                                              : field.onChange(field.value?.filter((value) => value !== subject))
                                          }}
                                          className="data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600 w-6 h-6 rounded-md"
                                        />
                                        <span className="text-base font-bold text-slate-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
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
                </CardContent>
                <CardFooter className="px-0 pt-8 flex flex-col-reverse sm:flex-row gap-4 justify-between">
                  <Button variant="ghost" onClick={prevStep} className="w-full sm:w-auto text-slate-500 hover:text-slate-900 h-14 rounded-2xl text-lg font-semibold">
                    <CaretLeft className="mr-2" weight="bold" /> {t.backBtn}
                  </Button>
                  <Button 
                    onClick={() => {
                      if (!values.syllabus || !values.grade || !values.medium) {
                        alert(t.selectSyllabusAlert);
                        return;
                      }
                      nextStep();
                    }}
                    className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-14 px-10 rounded-2xl text-lg font-bold text-white shadow-lg shadow-blue-500/30"
                  >
                    {t.continueBtn} <CaretRight className="ml-2" weight="bold" />
                  </Button>
                </CardFooter>
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
                <CardHeader className="px-0 pb-8 text-center sm:text-left">
                  <CardTitle className="text-3xl font-extrabold text-slate-800">{t.parentTitle}</CardTitle>
                  <CardDescription className="text-base font-medium text-slate-500 mt-2">{t.parentDesc}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-0">
                  <div className="space-y-3">
                    <Label htmlFor="parentName" className="text-base font-semibold text-slate-700">{t.parentNameLabel} <span className="text-slate-400 font-normal">{t.optionalText}</span></Label>
                    <Input 
                      id="parentName" 
                      placeholder={t.parentNamePlaceholder} 
                      {...form.register("parentName")}
                      className="h-14 text-lg bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-2xl shadow-sm"
                    />
                    {errors.parentName && <p className="text-sm font-medium text-red-500">{errors.parentName.message}</p>}
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="parentPhone" className="text-base font-semibold text-slate-700">{t.phoneLabel} <span className="text-slate-400 font-normal">{t.optionalText}</span></Label>
                    <Input 
                      id="parentPhone" 
                      type="tel"
                      placeholder={t.phonePlaceholder} 
                      {...form.register("parentPhone")}
                      onInput={(e) => {
                        e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                      }}
                      className="h-14 text-lg bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-2xl shadow-sm"
                    />
                    {errors.parentPhone && <p className="text-sm font-medium text-red-500">{errors.parentPhone.message}</p>}
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="address" className="text-base font-semibold text-slate-700">{t.addressLabel} <span className="text-slate-400 font-normal">{t.optionalText}</span></Label>
                    <Input 
                      id="address" 
                      placeholder={t.addressPlaceholder} 
                      {...form.register("address")}
                      className="h-14 text-lg bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-2xl shadow-sm"
                    />
                  </div>

                  <div className="space-y-3">
                    <Label htmlFor="district" className="text-base font-semibold text-slate-700">{t.districtLabel} <span className="text-slate-400 font-normal">{t.optionalText}</span></Label>
                    <Input 
                      id="district" 
                      placeholder={t.districtPlaceholder} 
                      {...form.register("district")}
                      className="h-14 text-lg bg-slate-50/50 border-slate-200 focus-visible:ring-blue-500 rounded-2xl shadow-sm"
                    />
                  </div>
                </CardContent>
                <CardFooter className="px-0 pt-8 flex flex-col-reverse sm:flex-row gap-4 justify-between">
                  <Button variant="ghost" onClick={prevStep} className="w-full sm:w-auto text-slate-500 hover:text-slate-900 h-14 rounded-2xl text-lg font-semibold">
                    <CaretLeft className="mr-2" weight="bold" /> {t.backBtn}
                  </Button>
                  <Button 
                    onClick={() => nextStep(["parentName", "parentPhone"])}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 h-14 px-10 rounded-2xl text-lg font-bold text-white shadow-lg shadow-green-500/30"
                  >
                    {t.submitBtn} <Check className="ml-2" weight="bold" />
                  </Button>
                </CardFooter>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.90 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", bounce: 0.5 }}
                className="py-16 flex flex-col items-center justify-center text-center relative"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-green-50 to-transparent pointer-events-none rounded-b-3xl"></div>
                
                <div className="w-28 h-28 bg-gradient-to-br from-green-300 to-emerald-500 text-white rounded-full flex items-center justify-center mb-8 shadow-xl shadow-green-500/30 border-4 border-white z-10">
                  <Check size={64} weight="bold" />
                </div>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-green-700 to-emerald-700 mb-4 z-10">
                  {t.successTitle}
                </h2>
                <p className="text-slate-600 mb-12 text-lg font-medium max-w-lg leading-relaxed z-10">
                  {t.successDesc}
                </p>
                
                <div className="w-full max-w-md space-y-5 z-10">
                  <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">{t.contactTitle}</div>
                  
                  <a href={generateWhatsAppLink()} target="_blank" rel="noopener noreferrer" className="block mb-4">
                    <Button className="w-full h-16 text-xl font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-xl shadow-[#25D366]/30 rounded-2xl transition-transform hover:scale-[1.02]">
                      <WhatsappLogo size={32} weight="fill" className="mr-3" />
                      {t.sendWhatsapp}
                    </Button>
                  </a>
                  
                  <a href="tel:+94707072072" className="block">
                    <Button variant="outline" className="w-full h-16 text-xl font-bold border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-blue-400 hover:text-blue-600 rounded-2xl transition-transform hover:scale-[1.02]">
                      <PhoneCall size={32} weight="fill" className="mr-3" />
                      {t.callUs} +94 70 707 2072
                    </Button>
                  </a>

                  <div className="flex justify-center mt-6">
                    <Button 
                      variant="ghost"
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
                      className="text-slate-500 hover:text-blue-600 hover:bg-blue-50 font-semibold h-12 px-6 rounded-2xl"
                    >
                      <PlusCircle size={24} weight="fill" className="mr-2" />
                      {t.newRegistration}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
