"use client";

import { motion, useScroll, useTransform, useSpring, useInView, useMotionValue, type Variants } from "framer-motion";
import { Compass, Zap, ArrowRight, MapPin, DollarSign, Eye, Rocket, FileText, Star, Brain, Target, GraduationCap, Bell, BarChart3, Sparkles, Wifi, LayoutDashboard, Building2, Clock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import Header from "@/components/Header";
import { Job, fetchJobs } from "@/lib/api";
import { Button } from "@/components/ui/button";

/* ============================================================================
   Animation Variants
   ============================================================================ */

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.03,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 },
  },
};

/* ============================================================================
   Magnetic Button
   ============================================================================ */

function MagneticButton({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 25 });
  const springY = useSpring(y, { stiffness: 300, damping: 25 });

  return (
    <motion.div
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={(e: React.MouseEvent<HTMLDivElement>) => {
        const rect = ref.current?.getBoundingClientRect();
        if (!rect) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        x.set((e.clientX - cx) * 0.1);
        y.set((e.clientY - cy) * 0.1);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================================
   Animated Counter
   ============================================================================ */

function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const end = target;
    const duration = 2;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ============================================================================
   Typewriter Hook
   ============================================================================ */

function useTypewriter(words: string[], speed = 80, pause = 2000) {
  const [text, setText] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIdx];
    let timeout: NodeJS.Timeout;

    if (!isDeleting && text === current) {
      // Finished typing - wait then start deleting
      timeout = setTimeout(() => setIsDeleting(true), pause);
    } else if (isDeleting && text === "") {
      // Finished deleting - move to next word
      setIsDeleting(false);
      setWordIdx((prev) => (prev + 1) % words.length);
    } else {
      // Type or delete next character
      timeout = setTimeout(() => {
        setText(
          isDeleting
            ? current.slice(0, text.length - 1)
            : current.slice(0, text.length + 1)
        );
      }, isDeleting ? speed / 2 : speed);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [text, wordIdx, isDeleting, words, speed, pause]);

  return text;
}

/* ============================================================================
   Scroll Section
   ============================================================================ */

function ScrollSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.section
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={staggerContainer}
    >
      {children}
    </motion.section>
  );
}

const FEAT_DEPT: Record<string, { bg: string; text: string; border: string }> = {
  engineering:  { bg: "bg-violet-50 dark:bg-violet-900/30",  text: "text-violet-700 dark:text-violet-300",  border: "border-violet-200 dark:border-violet-700"  },
  data_science: { bg: "bg-indigo-50 dark:bg-indigo-900/30",  text: "text-indigo-700 dark:text-indigo-300",  border: "border-indigo-200 dark:border-indigo-700"  },
  product:      { bg: "bg-sky-50 dark:bg-sky-900/30",        text: "text-sky-700 dark:text-sky-300",        border: "border-sky-200 dark:border-sky-700"        },
  design:       { bg: "bg-pink-50 dark:bg-pink-900/30",      text: "text-pink-700 dark:text-pink-300",      border: "border-pink-200 dark:border-pink-700"      },
  marketing:    { bg: "bg-orange-50 dark:bg-orange-900/30",  text: "text-orange-700 dark:text-orange-300",  border: "border-orange-200 dark:border-orange-700"  },
  sales:        { bg: "bg-teal-50 dark:bg-teal-900/30",      text: "text-teal-700 dark:text-teal-300",      border: "border-teal-200 dark:border-teal-700"      },
  finance:      { bg: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-700" },
  hr:           { bg: "bg-rose-50 dark:bg-rose-900/30",      text: "text-rose-700 dark:text-rose-300",      border: "border-rose-200 dark:border-rose-700"      },
  operations:   { bg: "bg-slate-50 dark:bg-slate-900/30",    text: "text-slate-700 dark:text-slate-300",    border: "border-slate-200 dark:border-slate-700"    },
  healthcare:   { bg: "bg-red-50 dark:bg-red-900/30",        text: "text-red-700 dark:text-red-300",        border: "border-red-200 dark:border-red-700"        },
};
const FEAT_DEPT_DEFAULT = { bg: "bg-gray-50 dark:bg-gray-700", text: "text-gray-700 dark:text-gray-200", border: "border-gray-200 dark:border-gray-600" };

function fmtDept(d: string) {
  return d.split("_").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
}
function fmtSeniority(s: string) {
  return s === "c-suite" ? "C-Suite" : s[0].toUpperCase() + s.slice(1);
}
function fmtTimeAgo(dateStr: string) {
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

// Companies for infinite scroll with local logos
const companies = [
  { name: "Google", logo: "/logos/google-logo-transparent.png" },
  { name: "Meta", logo: "/logos/Meta-Logo.png" },
  { name: "Apple", logo: "/logos/apple-logo-transparent.png" },
  { name: "Amazon", logo: "/logos/amazon-logo-amazon-icon-transparent-free-png.png" },
  { name: "Microsoft", logo: "/logos/Microsoft-Logo.png" },
  { name: "Tesla", logo: "/logos/Tesla_logo.png" },
  { name: "OpenAI", logo: "/logos/OpenAI_Logo.svg.png" },
  { name: "Uber", logo: "/logos/Uber_logo_2018.png" },
  { name: "Stripe", logo: "/logos/Stripe_Logo,_revised_2016.svg.png" },
  { name: "Nvidia", logo: "/logos/Logo-nvidia-transparent-PNG.png" },
  { name: "Databricks", logo: "/logos/Databricks_Logo.png" },
  { name: "IBM", logo: "/logos/ibm-logo-black-transparent.png" },
];


/* ============================================================================
   HOME PAGE
   ============================================================================ */

export default function HomePage() {
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -100]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);


  const typewriterText = useTypewriter(
    [
      "engineering talent",
      "marketing leaders",
      "design experts",
      "product managers",
      "data scientists",
      "creative minds",
      "sales professionals",
      "technical talent",
      "your perfect match"
    ],
    60,
    2000
  );

  useEffect(() => {
    async function loadFeaturedJobs() {
      try {
        const response = await fetchJobs({ page: 1, page_size: 6 });
        setFeaturedJobs(response.jobs);
      } catch (error) {
        console.error("Failed to fetch featured jobs:", error);
      }
    }
    loadFeaturedJobs();
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col bg-white dark:bg-gray-900 overflow-x-hidden">
      <Header />

      {/* ================================================================
          HERO SECTION
          ================================================================ */}
      <motion.section
        className="relative min-h-[95vh] z-10 overflow-hidden pt-16 bg-white dark:bg-gray-900"
        style={{ y: heroY, opacity: heroOpacity }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,0,0,0.02)_0%,_transparent_50%)] dark:bg-[radial-gradient(circle_at_top_right,_rgba(251,146,60,0.06)_0%,_transparent_50%)]" />

        <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-12 gap-8 sm:gap-12 lg:gap-16 items-center">
            {/* Left: Content */}
            <div className="lg:col-span-7 space-y-6 sm:space-y-8">
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 shadow-sm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <Compass className="w-3.5 h-3.5 text-gray-900 dark:text-orange-400" />
                AI-Powered Matching
              </motion.div>

              <motion.h1
                className="text-6xl sm:text-7xl md:text-8xl font-black tracking-tight leading-[0.95] text-gray-900 dark:text-white"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                Discover Your
                <br />
                Perfect Path
              </motion.h1>

              <motion.p
                className="text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-xl min-h-[3.5rem] sm:min-h-[4rem]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
              >
                Connecting{" "}
                <span className="font-semibold text-gray-900 dark:text-white relative">
                  {typewriterText}
                  <motion.span
                    className="inline-block w-[2px] h-5 sm:h-6 bg-gray-900 dark:bg-white ml-1 align-middle"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                  />
                </span>
                {" "}with opportunities through precision AI matching.
              </motion.p>

              <motion.div
                className="flex flex-wrap items-center gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                <MagneticButton>
                  <Link href="/jobs">
                    <Button size="lg" className="gap-2 group">
                      Explore Positions
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </MagneticButton>

                <MagneticButton>
                  <Link href="/jobs">
                    <Button size="lg" variant="outline" className="gap-2">
                      <FileText className="w-5 h-5" />
                      Upload Resume
                    </Button>
                  </Link>
                </MagneticButton>
              </motion.div>

              <motion.div
                className="flex flex-wrap items-center gap-6 pt-4 text-sm text-gray-500 dark:text-gray-400"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {[
                      "/logos/google-logo-transparent.png",
                      "/logos/Meta-Logo.png",
                      "/logos/apple-logo-transparent.png",
                      "/logos/Microsoft-Logo.png"
                    ].map((logo, i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-700 shadow-sm overflow-hidden flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo} alt="Company" className="w-5 h-5 object-contain" />
                      </div>
                    ))}
                  </div>
                  <span><strong className="text-gray-900 dark:text-white">10K+</strong> hired</span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 fill-gray-900 dark:fill-white text-gray-900 dark:text-white" />
                  ))}
                  <span className="ml-1"><strong className="text-gray-900 dark:text-white">4.9</strong> rating</span>
                </div>
              </motion.div>
            </div>

            {/* Right: Simple Floating Cards */}
            <motion.div
              className="lg:col-span-5 relative hidden lg:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              <div className="relative h-[500px] w-full">
                {/* Floating Job Cards */}
                {[
                  { title: "Senior Software Engineer", company: "Google", logo: "/logos/google-logo-transparent.png", match: "95%", salary: "$180K - $250K", x: "0%", y: "0%", delay: 0.4, rotate: -2, floatDelay: 0 },
                  { title: "Product Designer", company: "Apple", logo: "/logos/apple-logo-transparent.png", match: "92%", salary: "$150K - $200K", x: "40%", y: "15%", delay: 0.6, rotate: 1, floatDelay: 0.5 },
                  { title: "Data Scientist", company: "Meta", logo: "/logos/Meta-Logo.png", match: "88%", salary: "$170K - $230K", x: "10%", y: "45%", delay: 0.8, rotate: -1, floatDelay: 1 },
                  { title: "Engineering Manager", company: "Microsoft", logo: "/logos/Microsoft-Logo.png", match: "85%", salary: "$200K - $280K", x: "45%", y: "60%", delay: 1.0, rotate: 2, floatDelay: 1.5 },
                ].map((job) => (
                  <motion.div
                    key={job.title}
                    className="absolute w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-shadow cursor-pointer"
                    style={{ left: job.x, top: job.y }}
                    initial={{ opacity: 0, y: 20, rotate: 0 }}
                    animate={{
                      opacity: 1,
                      y: [-2, 2, -2],
                      rotate: job.rotate,
                    }}
                    transition={{
                      opacity: { delay: job.delay, duration: 0.8, ease: "easeOut" },
                      rotate: { delay: job.delay, duration: 0.8, ease: "easeOut" },
                      y: {
                        delay: job.delay + job.floatDelay,
                        duration: 3,
                        repeat: Infinity,
                        repeatType: "reverse",
                        ease: "easeInOut"
                      }
                    }}
                    whileHover={{
                      scale: 1.03,
                      rotate: 0,
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }
                    }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 flex items-center justify-center p-2 overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={job.logo} alt={job.company} className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-bold text-gray-900 dark:text-white">{job.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{job.company}</div>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-gray-900 text-white rounded-lg text-xs font-bold shrink-0">
                        {job.match}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{job.salary}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Remote</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ================================================================
          INFINITE SCROLLING COMPANIES
          ================================================================ */}
      <section className="relative z-10 py-16 bg-white dark:bg-gray-900 border-y border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
        <div className="container mx-auto px-4 max-w-6xl mb-8">
          <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 tracking-wide">
            JOBS FROM COMPANIES LIKE
          </p>
        </div>

        {/* Infinite scroll container */}
        <div className="relative">
          <div className="flex gap-12 animate-scroll">
            {/* Duplicate the array for seamless loop */}
            {[...companies, ...companies].map((company, i) => (
              <div
                key={i}
                className="flex-shrink-0 h-16 flex items-center justify-center px-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={company.logo}
                  alt={`${company.name} logo`}
                  className="h-10 w-auto object-contain dark:brightness-0 dark:invert dark:opacity-70"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          STATS - Clean Minimal Design
          ================================================================ */}
      <ScrollSection className="relative z-10 py-20 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-16">
            <motion.div
              className="text-center"
              variants={fadeUp}
              custom={0}
            >
              <div className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-2">
                <AnimatedCounter target={500} suffix="+" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                Active Jobs
              </div>
            </motion.div>

            <motion.div
              className="text-center"
              variants={fadeUp}
              custom={1}
            >
              <div className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-2">
                <AnimatedCounter target={50} suffix="+" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                Companies
              </div>
            </motion.div>

            <motion.div
              className="text-center"
              variants={fadeUp}
              custom={2}
            >
              <div className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-2">
                <AnimatedCounter target={95} suffix="%" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                Match Rate
              </div>
            </motion.div>

            <motion.div
              className="text-center"
              variants={fadeUp}
              custom={3}
            >
              <div className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white mb-2">
                <AnimatedCounter target={10} suffix="K+" />
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wide">
                Candidates
              </div>
            </motion.div>
          </div>
        </div>
      </ScrollSection>

      {/* ================================================================
          HOW IT WORKS
          ================================================================ */}
      <ScrollSection className="relative z-10 py-24 bg-white dark:bg-gray-900 transition-colors duration-300">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <motion.div variants={slideInLeft} className="space-y-8">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 shadow-sm mb-6">
                  <Zap className="w-3.5 h-3.5 text-[#f46c38]" />
                  Simple Process
                </span>
                <h2 className="text-5xl font-black mb-4 text-gray-900 dark:text-white">
                  How It Works
                </h2>
                <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                  Get matched with your ideal role in minutes.
                </p>
              </div>

              <div className="space-y-6">
                {[
                  {
                    icon: Eye,
                    title: "Browse Live Jobs",
                    desc: "Real-time job feed powered by WebSocket — new postings appear instantly without refreshing. Filter by department, seniority, or search by keyword.",
                  },
                  {
                    icon: FileText,
                    title: "Upload Your Resume",
                    desc: "Drop a PDF or DOCX. GPT-4o-mini extracts your domain, seniority, skills, and experience in seconds. Your profile drives everything that follows.",
                  },
                  {
                    icon: Rocket,
                    title: "Get AI-Ranked Matches",
                    desc: "Vector embeddings (text-embedding-3-small) compare your resume against every job. Results are ranked by match score and filtered to your domain — no nurse jobs if you're a software engineer.",
                  },
                ].map((step, i) => (
                  <motion.div
                    key={step.title}
                    className="flex gap-4 group"
                    variants={fadeUp}
                    custom={i}
                  >
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gray-900 dark:bg-gray-700 text-white rounded-xl flex items-center justify-center font-bold shadow-sm group-hover:bg-orange-500 dark:group-hover:bg-orange-500 transition-colors">
                        {i + 1}
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{step.title}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">{step.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Simple visual flow */}
            <motion.div
              variants={slideInRight}
              className="grid grid-cols-3 gap-6"
            >
              {/* Step 1: Upload */}
              <motion.div
                className="bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-600 rounded-2xl p-6 text-center shadow-sm hover:shadow-lg hover:border-orange-500 transition-all group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <motion.div
                  className="w-16 h-16 bg-gray-900 dark:bg-gray-700 group-hover:bg-orange-500 dark:group-hover:bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <FileText className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Upload Resume</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Share your profile</p>
              </motion.div>

              {/* Step 2: AI Analysis */}
              <motion.div
                className="bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-600 rounded-2xl p-6 text-center shadow-sm hover:shadow-lg hover:border-orange-500 transition-all group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <motion.div
                  className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 relative overflow-hidden"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-orange-400 to-orange-600"
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                  <Compass className="w-8 h-8 text-white relative z-10" />
                </motion.div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                  Path<span className="text-orange-500">AI</span> Analyzes
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Intelligent matching</p>
              </motion.div>

              {/* Step 3: Results */}
              <motion.div
                className="bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-600 rounded-2xl p-6 text-center shadow-sm hover:shadow-lg hover:border-orange-500 transition-all group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.4 }}
                whileHover={{ y: -4 }}
              >
                <motion.div
                  className="w-16 h-16 bg-gray-900 dark:bg-gray-700 group-hover:bg-orange-500 dark:group-hover:bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                >
                  <Rocket className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">Get Matched</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">95% accuracy</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </ScrollSection>

      {/* ================================================================
          FEATURES GRID
          ================================================================ */}
      <ScrollSection className="relative z-10 py-24 bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <div className="container mx-auto px-4 max-w-7xl">
          <motion.div className="text-center mb-16" variants={fadeUp} custom={0}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-full text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 shadow-sm mb-6">
              <Sparkles className="w-3.5 h-3.5 text-orange-500" />
              Everything You Need
            </span>
            <h2 className="text-5xl font-black text-gray-900 dark:text-white mb-4">
              Built Different
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Not just a job board. A full AI-powered career platform — from discovery to interview prep.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Brain,
                label: "Vector Matching",
                title: "AI Resume Analysis",
                desc: "OpenAI embeddings convert your resume into a 1536-dimension vector. Every job is scored by semantic similarity — not just keyword overlap.",
              },
              {
                icon: Target,
                label: "Skills Intelligence",
                title: "Skill Gap Analysis",
                desc: "After matching, see exactly which skills you already have (✓) and which ones you're missing (+) for each role. Know before you apply.",
              },
              {
                icon: GraduationCap,
                label: "Interview Prep",
                title: "AI Interview Coach",
                desc: "GPT-4o-mini generates 8–10 role-specific questions across Technical, Behavioral, and Culture Fit — each with a why-asked explanation and answering tip.",
              },
              {
                icon: Wifi,
                label: "Live Feed",
                title: "Real-Time Job Feed",
                desc: "WebSocket connection streams new jobs the moment they're posted. A toast notification fires instantly — no polling, no refresh needed.",
              },
              {
                icon: LayoutDashboard,
                label: "ATS Dashboard",
                title: "Application Tracker",
                desc: "Track every application through stages: Applied → Phone Screen → Interview → Offer. Add notes, update status, withdraw — all in one place.",
              },
              {
                icon: BarChart3,
                label: "Market Data",
                title: "Salary Insights",
                desc: "See where each role falls relative to all jobs in the same department and seniority. Know if you're looking at above or below market before you apply.",
              },
              {
                icon: Bell,
                label: "Smart Alerts",
                title: "Job Alerts",
                desc: "Set preferences by department, seniority, or keyword. Get an in-app notification the moment a matching job is posted — via the live WebSocket feed.",
              },
              {
                icon: FileText,
                label: "Cover Letter",
                title: "AI Cover Letters",
                desc: "Generate a tailored cover letter for any role in seconds. Upload your resume once — PathAI saves it and uses it automatically every time.",
              },
            ].map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                custom={i}
                className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 hover:border-orange-300 hover:shadow-md transition-all group cursor-default"
              >
                <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-700 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 flex items-center justify-center mb-4 transition-colors">
                  <f.icon className="text-gray-500 dark:text-gray-400 group-hover:text-orange-500 transition-colors" style={{ width: 18, height: 18 }} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-gray-400 dark:text-gray-500">
                  {f.label}
                </p>
                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </ScrollSection>

      {/* ================================================================
          FEATURED JOBS - Premium Cards
          ================================================================ */}
      <ScrollSection className="relative z-10 py-24 bg-gray-50 dark:bg-gray-800 transition-colors duration-300">
        <div className="container mx-auto px-4 max-w-6xl">
          <motion.div className="text-center mb-16" variants={fadeUp} custom={0}>
            <h2 className="text-5xl font-black mb-4 text-gray-900 dark:text-white">
              Featured Opportunities
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Discover top positions
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6 mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {featuredJobs.map((job, index) => {
              const dept = FEAT_DEPT[job.department] || FEAT_DEPT_DEFAULT;
              const isLarge = index === 0;
              return (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className={`group relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-xl transition-all duration-300 flex flex-col ${
                    isLarge ? "md:col-span-2 md:row-span-2" : ""
                  }`}
                >
                  <div className="px-5 pt-5 pb-4 flex flex-col flex-1">
                    {/* Title + company + chips */}
                    <div className="min-w-0">
                      <h3 className={`font-bold text-gray-900 dark:text-white leading-snug group-hover:text-orange-500 transition-colors duration-200 line-clamp-2 ${isLarge ? "text-xl" : "text-base"}`}>
                        {job.title}
                      </h3>
                      {job.company && (
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
                          <Building2 className="w-3.5 h-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
                          {job.company}
                        </p>
                      )}
                      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                        <span className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold border ${dept.bg} ${dept.text} ${dept.border}`}>
                          {fmtDept(job.department)}
                        </span>
                        <span className="inline-flex items-center rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                          {fmtSeniority(job.seniority)}
                        </span>
                      </div>
                    </div>

                    {/* Meta row */}
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {job.location}
                      </span>
                      {job.salary_range && (
                        <span className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-200">
                          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                          {job.salary_range}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {fmtTimeAgo(job.posted_date)}
                      </span>
                    </div>

                    {/* Description preview */}
                    <p className={`mt-3 text-sm text-gray-500 dark:text-gray-400 leading-relaxed ${isLarge ? "line-clamp-3" : "line-clamp-2"}`}>
                      {job.description.replace(/<[^>]+>/g, "")}
                    </p>

                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        {job.applicant_count} applicants
                      </span>
                      <span className="text-xs font-semibold text-orange-500 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        View Job <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </motion.div>

          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <MagneticButton>
              <Link href="/jobs">
                <Button size="lg" className="gap-2 group">
                  View All Positions
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </MagneticButton>
          </motion.div>
        </div>
      </ScrollSection>

      {/* ================================================================
          FINAL CTA
          ================================================================ */}
      <ScrollSection className="relative z-10 py-32 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            variants={fadeUp}
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-gray-900 dark:text-white leading-tight">
              Your Career,<br />
              <span className="text-orange-500">Supercharged by AI</span>
            </h2>
            <p className="text-xl text-gray-500 dark:text-gray-400 mb-4 max-w-2xl mx-auto">
              Upload your resume and get AI-matched job results in seconds — with skill gap analysis, salary insights, and interview prep built in.
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-12">
              Powered by OpenAI GPT-4o-mini · text-embedding-3-small · pgvector · WebSocket
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <MagneticButton>
                <Link href="/jobs">
                  <Button size="lg" className="gap-2 shadow-xl">
                    Browse All Jobs
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
              </MagneticButton>

              <MagneticButton>
                <Link href="/jobs">
                  <Button size="lg" variant="outline" className="gap-2">
                    <FileText className="w-5 h-5" />
                    Upload Resume
                  </Button>
                </Link>
              </MagneticButton>
            </div>
          </motion.div>
        </div>
      </ScrollSection>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="relative z-10 py-12 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Compass className="w-5 h-5 text-orange-500" />
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              Path<span className="text-orange-500">AI</span>
            </span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by Next.js, FastAPI, and OpenAI
          </p>
        </div>
      </footer>
    </div>
  );
}
