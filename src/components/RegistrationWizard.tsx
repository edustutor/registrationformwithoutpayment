"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  ArrowLeft, Question, CaretRight, CheckCircle, 
  Clock, ShareNetwork, Trophy, Translate, 
  Student, Users, BookOpen
} from "@phosphor-icons/react";
import Image from "next/image";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import html2canvas from "html2canvas-pro";

import { GRADE_OPTIONS, SUBJECT_MAPPINGS } from "@/lib/constants";
import { locales } from "@/lib/locales";

const schema = z.object({
  language: z.string().optional(),
  studentName: z.string().min(2, "Required").optional(),
  studentPhone: z.string().min(9, "Required").optional(),
  numberOwner: z.string().optional(),
  school: z.string().optional(),
  district: z.string().optional(),
  grade: z.string().optional(),
  medium: z.string().optional(),
  consent: z.boolean().optional(),
  subjects: z.array(z.string()).optional(),
  classType: z.string().optional(),
  startDate: z.string().optional(),
  quizScore: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

const DISTRICTS = ["Jaffna", "Colombo", "Kandy", "Galle", "Other"];
const LETTERS = ["A", "B", "C", "D"];

export default function RegistrationWizard() {
  const [step, setStep] = useState(0);
  const [sessionId, setSessionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { width, height } = useWindowSize();
  
  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [isFetchingQuiz, setIsFetchingQuiz] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(60);
  const [timerActive, setTimerActive] = useState(false);
  
  const scorecardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0 && timerActive) {
      setTimerActive(false);
      finishQuiz();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      subjects: [],
      numberOwner: "Student",
      consent: false,
    },
    mode: "onChange",
  });

  const { watch, setValue, register, formState: { errors } } = form;
  const values = watch();
  
  const isEnglish = values.language !== "Tamil";
  
  const availableSubjects = (values.grade && values.medium) 
    ? SUBJECT_MAPPINGS[values.grade]?.[values.medium] || [] 
    : ["Mathematics", "Science", "English", "History"];

  const nextStep = () => {
    setStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitFinal = async () => {
    setIsSubmitting(true);
    try {
      const payload = form.getValues();
      if (payload.numberOwner === "Parent / Guardian") {
        (payload as any).parentPhone = payload.studentPhone;
      }
      
      await fetch("/api/registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          step: 99,
          sessionId,
          values: payload,
        }),
      });
      window.location.href = "https://edustutor.com";
    } catch (error) {
      console.error("Failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startQuiz = async () => {
    if (!values.grade) return;
    setIsFetchingQuiz(true);
    try {
      const res = await fetch(`/api/questions?grade=${encodeURIComponent(values.grade)}`);
      const data = await res.json();
      setQuizQuestions(data);
      setCurrentQIndex(0);
      setScore(0);
      setTimeLeft(60);
      setTimerActive(true);
      nextStep();
    } catch (err) {
      console.error(err);
    } finally {
      setIsFetchingQuiz(false);
    }
  };

  const finishQuiz = () => {
    setTimerActive(false);
    setValue("quizScore", score);
    setStep(5);
  };

  const handleNextClick = () => {
    if (selectedOption === null) return;
    
    // Evaluate correctness using the index
    const currentQuestion = quizQuestions[currentQIndex];
    const isCorrect = currentQuestion?.options[parseInt(selectedOption)]?.isCorrect;
    
    if (isCorrect) setScore(s => s + 1);

    setSelectedOption(null);
    if (currentQIndex < quizQuestions.length - 1) {
      setCurrentQIndex(q => q + 1);
    } else {
      finishQuiz();
    }
  };

  const TopNav = () => (
    <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-gray-100 sticky top-0 z-20 relative">
      <button onClick={prevStep} className="p-2 -ml-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors relative z-10">
        <ArrowLeft size={24} weight="bold" />
      </button>
      <div className="absolute left-1/2 -translate-x-1/2 font-bold text-blue-800 text-lg tracking-tight">EDUS Challenge</div>
      <div className="w-10"></div>
    </div>
  );

  return (
    <div className="w-full min-h-[100dvh] bg-gray-100 flex flex-col font-sans md:py-10 md:px-4 items-center md:justify-center">
      <div className="w-full md:max-w-4xl mx-auto bg-white min-h-[100dvh] md:min-h-[80vh] md:rounded-[2.5rem] relative md:shadow-2xl flex flex-col overflow-hidden">
        
        {step === 5 && <Confetti width={width} height={height} numberOfPieces={300} recycle={false} style={{ zIndex: 100 }} />}
        
        {step > 0 && <TopNav />}

        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            
            {/* SCREEN 1: WELCOME */}
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col md:flex-row flex-1"
              >
                {/* Desktop/Tablet Image Side */}
                <div className="w-full md:w-1/2 bg-blue-50 flex items-center justify-center p-8 md:p-12 relative overflow-hidden">
                  <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/40 via-transparent to-transparent z-0"></div>
                  <Image 
                    src="/hero_avatar.jpg" 
                    alt="EDUS Challenge Hero" 
                    width={500} 
                    height={500} 
                    className="object-contain w-full max-w-sm rounded-3xl mix-blend-multiply z-10 hover:scale-105 transition-transform duration-700"
                    priority
                  />
                  <div className="absolute top-6 left-6">
                    <Image src="/edus_logo_blue.webp" alt="EDUS" width={120} height={48} className="drop-shadow-sm" />
                  </div>
                </div>

                {/* Content Side */}
                <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 md:p-12">
                  <div className="bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider mb-8 flex items-center shadow-sm">
                    <Clock size={16} className="mr-1.5" weight="bold" /> Fast-Paced Learning
                  </div>
                  
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-blue-900 text-center mb-6 leading-tight tracking-tight">
                    Can You Beat the <br className="hidden md:block" /> EDUS 60-Second <br className="hidden md:block"/> Challenge?
                  </h1>
                  
                  <p className="text-gray-500 text-center mb-10 md:mb-12 font-medium text-sm md:text-base max-w-md leading-relaxed">
                    5 questions. 60 seconds. One place on the leaderboard. Test your knowledge against the clock!
                  </p>
                  
                  <button 
                    onClick={nextStep}
                    className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 md:py-5 rounded-full text-lg shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
                  >
                    Start Challenge &rarr;
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 2: LANGUAGE SELECTION */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col flex-1 p-6 md:p-12 items-center justify-center max-w-2xl mx-auto w-full"
              >
                <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mb-6">
                  <Translate size={32} weight="duotone" className="text-blue-600" />
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-blue-900 text-center mb-2 tracking-tight">Choose your display language</h2>
                <h3 className="text-xl md:text-2xl font-bold text-blue-800 text-center mb-10 md:mb-12 opacity-80">காட்சிமொழியைத் தெரிவுசெய்யுங்கள்</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <button 
                    onClick={() => { setValue("language", "English"); nextStep(); }}
                    className="w-full bg-white border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all"
                  >
                    <span className="font-bold text-gray-800 text-xl">English</span>
                  </button>

                  <button 
                    onClick={() => { setValue("language", "Tamil"); nextStep(); }}
                    className="w-full bg-white border-2 border-gray-100 hover:border-blue-400 hover:bg-blue-50 hover:shadow-md rounded-3xl p-8 flex flex-col items-center justify-center gap-4 transition-all"
                  >
                    <span className="font-bold text-gray-800 text-xl">தமிழ்</span>
                  </button>
                </div>
                
                <div className="mt-12 flex items-center gap-4 text-sm text-gray-500 bg-gray-50 p-5 rounded-2xl w-full">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 text-gray-400 font-bold">i</div>
                  <p className="font-medium leading-relaxed">Select your preferred language to begin the challenge! You can always change this later in your profile settings.</p>
                </div>
              </motion.div>
            )}

            {/* SCREEN 3: STUDENT PROFILE */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col flex-1 p-6 md:p-12 items-center justify-center max-w-4xl mx-auto w-full"
              >
                <div className="text-center mb-10 w-full max-w-2xl">
                  <h2 className="text-2xl md:text-3xl font-bold text-blue-900 mb-3 tracking-tight">Tell us who is taking the challenge</h2>
                  <p className="text-gray-500 font-medium md:text-lg">Let's get your profile set up so you can start competing!</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 w-full mb-10">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Student Full Name <span className="text-blue-500">*</span></label>
                      <input 
                        type="text"
                        placeholder="e.g. A. Nimal" 
                        {...register("studentName")}
                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white font-medium text-gray-900 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">WhatsApp Number <span className="text-blue-500">*</span></label>
                      <div className="flex">
                        <div className="px-5 py-4 bg-gray-100 border border-gray-200 border-r-0 rounded-l-xl font-bold text-gray-600">
                          +94
                        </div>
                        <input 
                          type="tel"
                          placeholder="77 123 4567" 
                          {...register("studentPhone")}
                          className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-r-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white font-medium text-gray-900 transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Whose number is this?</label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${values.numberOwner === 'Student' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
                          <input type="radio" value="Student" {...register("numberOwner")} className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2" />
                          <span className="text-sm font-bold text-gray-700">Student</span>
                        </label>
                        <label className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${values.numberOwner === 'Parent / Guardian' ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 bg-white hover:border-gray-300'}`}>
                          <input type="radio" value="Parent / Guardian" {...register("numberOwner")} className="w-5 h-5 text-blue-600 border-gray-300 focus:ring-blue-500 focus:ring-2" />
                          <span className="text-sm font-bold text-gray-700">Parent</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">School</label>
                      <input 
                        type="text"
                        placeholder="Search school name..." 
                        {...register("school")}
                        className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white font-medium text-gray-900 transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">District</label>
                        <select 
                          {...register("district")}
                          className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white font-medium text-gray-900 cursor-pointer transition-all"
                        >
                          <option value="">Select</option>
                          {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Grade <span className="text-blue-500">*</span></label>
                        <select 
                          {...register("grade")}
                          className="w-full px-5 py-4 bg-gray-50/50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-white font-medium text-gray-900 cursor-pointer transition-all"
                        >
                          <option value="">Select</option>
                          {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">Medium <span className="text-blue-500">*</span></label>
                      <div className="grid grid-cols-2 gap-3">
                        {[{value: "Tamil Medium (TM)", label: "TAMIL"}, {value: "English Medium (EM)", label: "ENGLISH"}].map((med) => (
                          <label key={med.value} className={`flex items-center justify-center p-4 border-2 rounded-xl cursor-pointer transition-all ${values.medium === med.value ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-sm' : 'border-gray-100 bg-white text-gray-600 font-medium hover:border-gray-300'}`}>
                            <input type="radio" className="hidden" value={med.value} {...register("medium")} />
                            {med.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="w-full max-w-md mx-auto pt-4 border-t border-gray-100">
                  <button 
                    onClick={() => {
                      if (!values.studentName || !values.studentPhone || !values.grade || !values.medium) return;
                      nextStep();
                    }}
                    disabled={!values.studentName || !values.studentPhone || !values.grade || !values.medium}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:shadow-none text-white font-bold py-4 rounded-full text-lg shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
                  >
                    Next &rarr;
                  </button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 4: READY? GO! */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center justify-center flex-1 p-6 md:p-12 max-w-2xl mx-auto w-full"
              >
                <div className="relative w-48 h-48 mb-12 flex items-center justify-center">
                  <div className="absolute inset-0 border-[6px] border-gray-100 rounded-full"></div>
                  <div className="absolute inset-0 border-[6px] border-blue-500 rounded-full border-t-transparent animate-[spin_2s_linear_infinite]"></div>
                  <div className="w-32 h-32 bg-yellow-50 rounded-full flex items-center justify-center shadow-inner">
                    <Clock size={56} className="text-yellow-500" weight="fill" />
                  </div>
                </div>

                <div className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm md:text-base font-bold mb-10 shadow-md">
                  60 Seconds
                </div>
                
                <h2 className="text-4xl font-extrabold text-blue-900 mb-4 tracking-tight">Ready?</h2>
                <p className="text-gray-500 text-center mb-12 font-medium text-lg md:text-xl max-w-sm leading-relaxed">
                  Your 60 seconds start when you tap GO.
                </p>
                
                <div className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 mb-10 flex items-start gap-4 w-full cursor-pointer hover:border-gray-200 transition-colors" onClick={() => setValue("consent", !values.consent)}>
                  <div className="mt-0.5">
                    <input type="checkbox" checked={values.consent} readOnly className="w-6 h-6 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 pointer-events-none" />
                  </div>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    I agree that EDUS may use these details to run the challenge and contact me or my parent/guardian regarding the results.
                  </p>
                </div>
                
                <button 
                  onClick={startQuiz}
                  disabled={!values.consent || isFetchingQuiz}
                  className="w-full max-w-sm bg-blue-500 hover:bg-blue-600 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none text-white font-extrabold py-5 rounded-full text-xl shadow-xl shadow-blue-500/40 transition-all hover:-translate-y-1 active:translate-y-0"
                >
                  {isFetchingQuiz ? "Loading..." : "GO! \u2192"}
                </button>
              </motion.div>
            )}

            {/* SCREEN 5: QUIZ IN PROGRESS */}
            {step === 4 && quizQuestions.length > 0 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="flex flex-col flex-1 p-6 md:p-12 max-w-3xl mx-auto w-full"
              >
                <div className="flex justify-between items-center mb-8 md:mb-12">
                  <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-full text-xs md:text-sm font-bold uppercase tracking-wider">
                    Question {currentQIndex + 1} of 5
                  </div>
                  
                  {/* Timer */}
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full border-[3px] border-gray-100 flex items-center justify-center relative bg-white shadow-sm">
                      <svg className="absolute inset-0 w-full h-full -rotate-90">
                        <circle cx="50%" cy="50%" r="46%" stroke="currentColor" strokeWidth="3" fill="none" className="text-gray-100" />
                        <circle 
                          cx="50%" cy="50%" r="46%" 
                          stroke="currentColor" strokeWidth="3" fill="none" 
                          strokeDasharray={100} 
                          strokeDashoffset={100 - (100 * timeLeft) / 60}
                          className="text-blue-500 transition-all duration-1000 ease-linear" 
                        />
                      </svg>
                      <div className="font-bold text-gray-900 text-lg leading-none">{timeLeft}</div>
                    </div>
                    <span className="text-xs font-bold text-gray-400">SEC</span>
                  </div>
                </div>

                <div className="bg-green-50 text-green-700 px-4 py-2.5 rounded-xl text-sm md:text-base font-bold flex items-center gap-2 w-max mb-8 md:mb-10 shadow-sm border border-green-100">
                  <div className="w-6 h-6 bg-green-200 rounded-full flex items-center justify-center text-green-800"><CheckCircle weight="fill" size={16} /></div>
                  You got this! Focus.
                </div>

                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-10 md:mb-12 leading-relaxed">
                  {isEnglish ? quizQuestions[currentQIndex]?.prompt?.en : quizQuestions[currentQIndex]?.prompt?.ta}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-auto">
                  {(quizQuestions[currentQIndex]?.options || []).map((opt: any, idx: number) => {
                    const isSelected = selectedOption === idx.toString();
                    let btnClass = "bg-white border-gray-200 text-gray-700 shadow-sm hover:border-blue-400 hover:shadow-md";
                    let letterClass = "bg-gray-100 text-gray-500";
                    
                    if (isSelected) {
                      btnClass = "bg-blue-50 border-blue-500 text-blue-900 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-2 ring-blue-500/20";
                      letterClass = "bg-blue-200 text-blue-900";
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedOption(idx.toString())}
                        className={`w-full text-left p-5 md:p-6 rounded-2xl border-2 flex items-center gap-5 transition-all font-bold text-lg ${btnClass}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 transition-colors ${letterClass}`}>
                          {LETTERS[idx] || "A"}
                        </div>
                        {isEnglish ? opt.text?.en : opt.text?.ta}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  onClick={handleNextClick}
                  disabled={selectedOption === null}
                  className="w-full mt-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:shadow-none text-white font-bold py-4 rounded-full text-lg shadow-lg shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  {currentQIndex < 4 ? 'Next Question \u2192' : 'Submit Quiz \u2192'}
                </button>
              </motion.div>
            )}

            {/* SCREEN 6: YOUR RESULTS */}
            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="flex flex-col flex-1 p-0 md:p-6"
              >
                <div className="max-w-xl mx-auto w-full md:bg-white md:shadow-xl md:rounded-[3rem] md:border border-gray-100 overflow-hidden pb-8">
                  <div className="bg-blue-600 pt-16 pb-20 px-6 md:rounded-t-[3rem] rounded-b-[3rem] md:rounded-b-[2rem] flex flex-col items-center text-center relative mb-16 shadow-lg shadow-blue-600/20" ref={scorecardRef}>
                    
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                    
                    <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-8 relative z-10 shadow-[0_0_40px_rgba(255,255,255,0.4)]">
                      <Trophy size={56} className="text-yellow-500" weight="fill" />
                    </div>
                    
                    <h2 className="text-4xl font-black text-white mb-3 relative z-10 tracking-tight">EDUS Champion!</h2>
                    <p className="text-blue-100 text-base md:text-lg font-medium mb-8 relative z-10 opacity-90">{score === 5 ? "You nailed it! Perfect score." : "Awesome effort on the challenge!"}</p>
                    
                    <div className="bg-white px-10 py-5 rounded-[2rem] shadow-2xl shadow-blue-900/50 relative z-10 absolute -bottom-12 border-2 border-gray-50 flex items-baseline">
                      <div className="text-6xl font-black text-green-500 leading-none">{score}</div>
                      <div className="text-3xl font-black text-gray-300 ml-1">/5</div>
                    </div>
                  </div>

                  <div className="px-6 md:px-10">
                    <div className="grid grid-cols-2 gap-4 md:gap-6 mb-10">
                      <div className="bg-gray-50 border border-gray-100 rounded-3xl p-5 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                        <Clock size={28} className="text-blue-500 mb-3" weight="duotone" />
                        <div className="text-xs text-gray-500 font-bold mb-1 uppercase tracking-widest">Time Taken</div>
                        <div className="text-2xl font-black text-gray-900">{60 - timeLeft}s</div>
                      </div>
                      <div className="bg-yellow-50/50 border border-yellow-100 rounded-3xl p-5 flex flex-col items-center justify-center shadow-sm relative overflow-hidden hover:shadow-md transition-shadow">
                        <div className="absolute -top-4 -right-4 p-1 opacity-10"><Trophy size={80} weight="fill" className="text-yellow-500" /></div>
                        <Users size={28} className="text-yellow-600 mb-3 relative z-10" weight="duotone" />
                        <div className="text-xs text-yellow-700 font-bold mb-1 uppercase tracking-widest relative z-10">Grade Rank</div>
                        <div className="text-2xl font-black text-yellow-800 relative z-10">#{Math.floor(Math.random() * 5) + 1}</div>
                      </div>
                    </div>

                    <button className="w-full border-2 border-gray-200 text-gray-700 font-bold py-4 rounded-full flex items-center justify-center gap-3 mb-4 hover:bg-gray-50 hover:border-gray-300 transition-all text-lg">
                      <ShareNetwork size={22} weight="bold" /> Share your result
                    </button>

                    <button 
                      onClick={nextStep}
                      className="w-full bg-blue-600 text-white font-bold py-4.5 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all mb-4 text-lg"
                    >
                      Continue to Registration &rarr;
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCREEN 7: NEXT STEPS */}
            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col md:flex-row flex-1"
              >
                {/* Desktop/Tablet Image Side */}
                <div className="hidden md:flex md:w-1/3 lg:w-2/5 bg-green-50 items-center justify-center p-8 relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-20%] w-[140%] h-[140%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent z-0"></div>
                  <Image 
                    src="/success_avatar.jpg" 
                    alt="Success Avatar" 
                    width={400} 
                    height={400} 
                    className="object-contain w-full max-w-sm rounded-3xl mix-blend-multiply z-10 hover:scale-105 transition-transform duration-700"
                    priority
                  />
                </div>

                {/* Form Side */}
                <div className="w-full md:w-2/3 lg:w-3/5 flex flex-col p-6 md:p-12 lg:p-16 overflow-y-auto">
                  <div className="bg-green-50 p-5 rounded-2xl mb-8 border border-green-100 shadow-sm md:hidden">
                    <p className="text-green-800 text-sm font-semibold leading-relaxed text-center">
                      Awesome job completing the challenge! <br/>
                      Let's craft your perfect learning path. <br/>
                      What are your goals?
                    </p>
                  </div>
                  
                  <div className="hidden md:block mb-8">
                    <h2 className="text-3xl font-extrabold text-blue-900 tracking-tight mb-2">Awesome job!</h2>
                    <p className="text-gray-500 font-medium text-lg">Let's craft your perfect learning path. What are your goals?</p>
                  </div>

                  <div className="flex justify-center mb-8 md:hidden">
                    <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center shadow-inner">
                      <Student size={48} className="text-blue-500" weight="duotone" />
                    </div>
                  </div>

                  <h2 className="text-2xl font-extrabold text-blue-900 text-center md:text-left mb-8 tracking-tight md:hidden">What would you like to improve next?</h2>
                  
                  <div className="space-y-8">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Subject Interest (Select all that apply)</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                        {availableSubjects.map((sub: string) => (
                          <label key={sub} className={`flex flex-col items-center justify-center p-4 border-2 rounded-2xl cursor-pointer transition-all text-center ${values.subjects?.includes(sub) ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50/50'}`}>
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              value={sub}
                              checked={values.subjects?.includes(sub) || false}
                              onChange={(e) => {
                                const current = values.subjects || [];
                                if (e.target.checked) {
                                  setValue("subjects", [...current, sub]);
                                } else {
                                  setValue("subjects", current.filter((s: string) => s !== sub));
                                }
                              }}
                            />
                            <BookOpen size={28} className="text-blue-500 mb-3 opacity-80" weight="duotone" />
                            <span className="text-sm font-bold text-gray-700 leading-tight">{sub}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Preferred Class Type</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                        {[
                          { id: 'Group Classes', icon: Users, desc: 'Learn with peers' },
                          { id: '1-to-1 Tutoring', icon: Student, desc: 'Personalized focus' }
                        ].map(type => (
                          <label key={type.id} className={`flex items-center gap-4 p-5 md:p-6 border-2 rounded-2xl cursor-pointer transition-all ${values.classType?.includes(type.id) ? 'border-blue-500 bg-blue-50 shadow-sm' : 'border-gray-100 hover:border-blue-300 hover:bg-blue-50/50'}`}>
                            <input 
                              type="checkbox" 
                              className="hidden" 
                              value={type.id}
                              checked={values.classType?.includes(type.id) || false}
                              onChange={(e) => {
                                const current = values.classType || [];
                                if (e.target.checked) {
                                  setValue("classType", [...current, type.id]);
                                } else {
                                  setValue("classType", current.filter((s: string) => s !== type.id));
                                }
                              }}
                            />
                            <div className="w-12 h-12 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center flex-shrink-0 text-blue-600">
                              <type.icon size={24} weight="duotone" />
                            </div>
                            <div>
                              <div className="font-bold text-gray-900 text-lg">{type.id}</div>
                              <div className="text-sm text-gray-500 font-medium">{type.desc}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">When do you want to start?</label>
                      <select 
                        {...register("startDate")}
                        className="w-full px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-gray-800 cursor-pointer transition-all text-base"
                      >
                        <option value="">Select your timeline...</option>
                        <option value="Immediately">Immediately</option>
                        <option value="Next Week">Next Week</option>
                        <option value="Next Month">Next Month</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-8 space-y-4">
                    <button 
                      onClick={onSubmit} 
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white font-bold py-4.5 rounded-full shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all text-lg flex items-center justify-center gap-2"
                    >
                      <span>{isSubmitting ? 'Submitting...' : 'Complete Registration \u2192'}</span>
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
