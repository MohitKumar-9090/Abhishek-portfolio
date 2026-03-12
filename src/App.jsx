import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import * as THREE from "three";
import emailjs from "@emailjs/browser";
import {
  ArrowDownToLine,
  Bot,
  Code2,
  ExternalLink,
  Github,
  Linkedin,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  Send,
  Sparkles,
  Star,
  Trash2,
  X
} from "lucide-react";
import { onValue, ref, runTransaction } from "firebase/database";
import { addDoc, collection, deleteDoc, doc, increment, limit, onSnapshot, orderBy, query as fsQuery, setDoc } from "firebase/firestore";
import { askGemini } from "./lib/gemini";
import { db, firestore } from "./lib/firebase";
import { emailJsConfig } from "./config";
import { getLocalItems, LOCAL_PROJECTS_KEY, LOCAL_REVIEWS_KEY, mergeByKey, saveLocalItems } from "./features/storage/localStore";
import { achievements, developer, education, experience, extracurricular, projects, roles, skills } from "./data";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const LOCAL_ANALYTICS_KEY = "portfolio_local_analytics";
const ANALYTICS_DOC = ["analytics", "global"];

function createVisitorId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readLocalAnalytics() {
  try {
    const parsed = JSON.parse(localStorage.getItem(LOCAL_ANALYTICS_KEY) || "{}");
    return {
      totalVisitors: Number(parsed.totalVisitors || 0),
      pageViews: Number(parsed.pageViews || 0),
      sections: parsed.sections && typeof parsed.sections === "object" ? parsed.sections : {}
    };
  } catch (_error) {
    return { totalVisitors: 0, pageViews: 0, sections: {} };
  }
}

function saveLocalAnalytics(nextAnalytics) {
  localStorage.setItem(LOCAL_ANALYTICS_KEY, JSON.stringify(nextAnalytics));
}

function mergeAnalytics(remote, local) {
  const mergedSections = {};
  const keys = new Set([
    ...Object.keys(remote?.sections || {}),
    ...Object.keys(local?.sections || {})
  ]);

  keys.forEach((key) => {
    mergedSections[key] = Math.max(Number(remote?.sections?.[key] || 0), Number(local?.sections?.[key] || 0));
  });

  return {
    totalVisitors: Math.max(Number(remote?.totalVisitors || 0), Number(local?.totalVisitors || 0)),
    pageViews: Math.max(Number(remote?.pageViews || 0), Number(local?.pageViews || 0)),
    sections: mergedSections
  };
}

function ResilientImage({ sources, alt, className }) {
  const [index, setIndex] = useState(0);
  const src = sources[index];

  if (!src) {
    return (
      <div className="grid min-h-40 place-items-center rounded-xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-300">
        {alt}
      </div>
    );
  }

  return (
    <img
      loading="lazy"
      src={src}
      alt={alt}
      className={className}
      onError={() => setIndex((prev) => prev + 1)}
    />
  );
}

function Section({ id, title, subtitle, action, children }) {
  return (
    <motion.section
      id={id}
      data-track={id}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55 }}
      className="mx-auto w-full max-w-6xl rounded-2xl border border-sky-200 bg-white/85 p-6 shadow-neon backdrop-blur md:p-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-bold text-sky-900 md:text-3xl">{title}</h2>
        {action ? <div>{action}</div> : null}
      </div>
      {subtitle ? <p className="mt-2 text-sky-700">{subtitle}</p> : null}
      <div className="mt-6">{children}</div>
    </motion.section>
  );
}

function ThreeBackground() {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const geometry = new THREE.BufferGeometry();
    const count = 700;
    const vertices = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i += 1) {
      vertices[i] = (Math.random() - 0.5) * 12;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.PointsMaterial({
      color: "#5eead4",
      size: 0.03,
      transparent: true,
      opacity: 0.9
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      points.rotation.x += 0.0006;
      points.rotation.y += 0.0008;
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="pointer-events-none fixed inset-0 -z-10 opacity-45" />;
}

function LoadingScreen({ done }) {
  if (done) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-white">
      <div className="flex flex-col items-center gap-4">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-sky-200 border-t-sky-500" />
        <p className="font-heading tracking-widest text-sky-700">LOADING PORTFOLIO</p>
      </div>
    </div>
  );
}

function useTypingText(words, speed = 110, pause = 1200) {
  const [wordIndex, setWordIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const current = words[wordIndex];
    const timer = setTimeout(
      () => {
        if (!isDeleting) {
          const next = current.slice(0, typed.length + 1);
          setTyped(next);
          if (next === current) {
            setTimeout(() => setIsDeleting(true), pause);
          }
        } else {
          const next = current.slice(0, typed.length - 1);
          setTyped(next);
          if (!next) {
            setIsDeleting(false);
            setWordIndex((prev) => (prev + 1) % words.length);
          }
        }
      },
      isDeleting ? speed / 2 : speed
    );
    return () => clearTimeout(timer);
  }, [isDeleting, pause, speed, typed, wordIndex, words]);

  return typed;
}

function useAnalyticsTracking() {
  const [analytics, setAnalytics] = useState(() => readLocalAnalytics());

  useEffect(() => {
    const visitorKey = "portfolio_visitor_key";
    const isNewVisitor = !localStorage.getItem(visitorKey);
    if (isNewVisitor) {
      localStorage.setItem(visitorKey, createVisitorId());
    }

    const localSnapshot = readLocalAnalytics();
    const localBootstrap = {
      ...localSnapshot,
      totalVisitors: localSnapshot.totalVisitors + (isNewVisitor ? 1 : 0),
      pageViews: localSnapshot.pageViews + 1
    };
    saveLocalAnalytics(localBootstrap);
    setAnalytics(localBootstrap);

    const incrementRemote = (path) => {
      try {
        const tx = runTransaction(ref(db, path), (val) => (val || 0) + 1);
        if (tx?.catch) {
          tx.catch(() => undefined);
        }
      } catch (_error) {
        // Keep local analytics even if Firebase is unreachable or blocked by rules.
      }
    };
    const incrementFirestoreAnalytics = (payload) => {
      setDoc(doc(firestore, ANALYTICS_DOC[0], ANALYTICS_DOC[1]), payload, { merge: true }).catch(() => undefined);
    };

    if (isNewVisitor) {
      incrementRemote("analytics/totalVisitors");
      incrementFirestoreAnalytics({ totalVisitors: increment(1) });
    }
    incrementRemote("analytics/pageViews");
    incrementFirestoreAnalytics({ pageViews: increment(1) });

    const viewed = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("data-track");
          if (!id || viewed.has(id)) return;
          viewed.add(id);

          const currentLocal = readLocalAnalytics();
          const nextLocal = {
            ...currentLocal,
            sections: {
              ...currentLocal.sections,
              [id]: Number(currentLocal.sections?.[id] || 0) + 1
            }
          };
          saveLocalAnalytics(nextLocal);
          setAnalytics((prev) => mergeAnalytics(prev, nextLocal));
          incrementRemote(`analytics/sections/${id}`);
          incrementFirestoreAnalytics({ [`sections.${id}`]: increment(1) });
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll("[data-track]").forEach((el) => observer.observe(el));

    const unsubRealtime = onValue(
      ref(db, "analytics"),
      (snap) => {
        const remoteData = snap.val() || {};
        const localData = readLocalAnalytics();
        setAnalytics(mergeAnalytics(remoteData, localData));
      },
      () => {
        setAnalytics(readLocalAnalytics());
      }
    );
    const unsubFirestore = onSnapshot(
      doc(firestore, ANALYTICS_DOC[0], ANALYTICS_DOC[1]),
      (snapshot) => {
        if (!snapshot.exists()) return;
        const remoteData = snapshot.data() || {};
        setAnalytics((prev) => mergeAnalytics(prev, remoteData));
      },
      () => undefined
    );

    return () => {
      observer.disconnect();
      unsubRealtime();
      unsubFirestore();
    };
  }, []);

  return analytics;
}

function escapePdfText(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "");
}

function wrapLine(text, maxChars = 92) {
  const words = text.split(" ");
  const lines = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word;
  });

  if (current) lines.push(current);
  return lines;
}

function parseJpegDimensions(bytes) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    const length = (bytes[offset + 2] << 8) + bytes[offset + 3];
    if (length < 2) break;
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const height = (bytes[offset + 5] << 8) + bytes[offset + 6];
      const width = (bytes[offset + 7] << 8) + bytes[offset + 8];
      return { width, height };
    }
    offset += 2 + length;
  }
  return null;
}

function concatUint8Arrays(chunks) {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  chunks.forEach((chunk) => {
    out.set(chunk, offset);
    offset += chunk.length;
  });
  return out;
}

async function loadProfilePhotoJpeg() {
  try {
    const response = await fetch("/profile-photo.jpeg", { cache: "no-store" });
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const dimensions = parseJpegDimensions(bytes);
    if (!dimensions) return null;
    return { bytes, ...dimensions };
  } catch {
    return null;
  }
}

async function buildTemplateResumePdf() {
  const commands = [];
  const sidebarWidth = 190;
  const leftX = 24;
  const mainX = 220;
  let leftY = 650;
  let mainY = 798;
  const photo = await loadProfilePhotoJpeg();

  const pushText = (x, y, size, font, text, color = "0.12 0.17 0.27") => {
    commands.push(`${color} rg`);
    commands.push("BT");
    commands.push(`/${font} ${size} Tf`);
    commands.push(`1 0 0 1 ${x} ${y} Tm`);
    commands.push(`(${escapePdfText(text)}) Tj`);
    commands.push("ET");
  };

  const drawSectionTitle = (x, y, title, lineTo) => {
    pushText(x, y, 10, "F2", title, "0.1 0.14 0.22");
    commands.push("0.72 0.76 0.84 RG");
    commands.push(`${x} ${y - 4} m ${lineTo} ${y - 4} l S`);
  };

  const writeWrapped = (startX, startY, widthChars, lines, font = "F1", size = 9.2, step = 11) => {
    let y = startY;
    lines.forEach((line) => {
      pushText(startX, y, size, font, line, "0.2 0.24 0.3");
      y -= step;
    });
    return y;
  };

  commands.push("0.96 0.97 0.99 rg");
  commands.push(`0 0 ${sidebarWidth} 842 re f`);
  commands.push("1 1 1 rg");
  commands.push("34 676 132 132 re f");
  commands.push("0.85 0.87 0.92 RG");
  commands.push("34 676 132 132 re S");
  if (photo) {
    commands.push("q");
    commands.push("132 0 0 132 34 676 cm");
    commands.push("/Im1 Do");
    commands.push("Q");
  } else {
    pushText(76, 736, 30, "F2", "AK", "0.22 0.28 0.42");
  }

  pushText(leftX, leftY, 18, "F2", developer.name.toUpperCase(), "0.12 0.17 0.27");
  leftY -= 18;
  writeWrapped(leftX, leftY, 28, wrapLine(developer.role, 30), "F1", 8.6, 10);
  leftY -= 28;

  drawSectionTitle(leftX, leftY, "CONTACT", sidebarWidth - 16);
  leftY -= 18;
  const contactLines = [
    developer.location,
    "+91 6202000340",
    "abhishek8579013@gmail.com",
    "github.com/abhishekgfg",
    "linkedin.com/in/abhishek-kumar-847b74241"
  ];
  leftY = writeWrapped(leftX, leftY, 30, contactLines.flatMap((line) => wrapLine(line, 32)), "F1", 8.3, 10);
  leftY -= 8;

  drawSectionTitle(leftX, leftY, "SKILLS", sidebarWidth - 16);
  leftY -= 18;
  const leftSkills = skills
    .slice(0, 4)
    .flatMap((group) => group.items.slice(0, 3).map((item) => `- ${item}`))
    .slice(0, 12);
  leftY = writeWrapped(leftX, leftY, 30, leftSkills, "F1", 8.2, 9.6);
  leftY -= 8;

  drawSectionTitle(leftX, leftY, "ACHIEVEMENTS", sidebarWidth - 16);
  leftY -= 18;
  const achievementsShort = achievements.slice(0, 4).flatMap((item) => wrapLine(`- ${item}`, 32));
  leftY = writeWrapped(leftX, leftY, 30, achievementsShort, "F1", 8.2, 9.6);
  leftY -= 8;

  drawSectionTitle(leftX, leftY, "LANGUAGES", sidebarWidth - 16);
  leftY -= 18;
  const languageSkills = skills.find((group) => group.category === "Languages")?.items || [];
  leftY = writeWrapped(
    leftX,
    leftY,
    30,
    languageSkills.slice(0, 5).map((item) => `- ${item}`),
    "F1",
    8.2,
    9.6
  );

  drawSectionTitle(mainX, mainY, "PROFILE", 572);
  mainY -= 18;
  mainY = writeWrapped(mainX, mainY, 88, wrapLine(developer.summary, 92), "F1", 10, 12);
  mainY -= 12;

  drawSectionTitle(mainX, mainY, "WORK EXPERIENCE", 572);
  mainY -= 18;
  pushText(mainX, mainY, 10.5, "F2", experience.role);
  mainY -= 13;
  pushText(mainX, mainY, 9.4, "F1", experience.company, "0.32 0.37 0.44");
  mainY -= 14;
  const expLines = experience.responsibilities
    .slice(0, 3)
    .flatMap((item) => wrapLine(`- ${item}`, 92));
  mainY = writeWrapped(mainX, mainY, 88, expLines, "F1", 9.3, 11);
  mainY -= 8;
  mainY = writeWrapped(mainX, mainY, 88, wrapLine(`Tech Stack: ${experience.techStack.join(", ")}`, 92), "F1", 9, 10.8);
  mainY -= 10;

  drawSectionTitle(mainX, mainY, "PROJECTS", 572);
  mainY -= 18;
  projects.slice(0, 3).forEach((project) => {
    pushText(mainX, mainY, 9.8, "F2", project.title.toUpperCase());
    mainY -= 12;
    mainY = writeWrapped(mainX, mainY, 88, wrapLine(project.description, 92), "F1", 9.1, 10.8);
    mainY = writeWrapped(mainX, mainY, 88, wrapLine(`Stack: ${project.tech.join(", ")}`, 92), "F1", 8.9, 10.5);
    mainY -= 7;
  });

  drawSectionTitle(mainX, mainY, "EDUCATION", 572);
  mainY -= 18;
  const eduLines = education
    .slice(0, 3)
    .flatMap((item) => {
      const year = item.year ? ` (${item.year})` : "";
      return wrapLine(`${item.degree} - ${item.institute}${year}`, 92);
    });
  mainY = writeWrapped(mainX, mainY, 88, eduLines, "F1", 9, 10.8);
  mainY -= 12;
  drawSectionTitle(mainX, mainY, "EXTRACURRICULAR", 572);
  mainY -= 18;
  mainY = writeWrapped(
    mainX,
    mainY,
    88,
    extracurricular.slice(0, 2).flatMap((item) => wrapLine(`- ${item}`, 92)),
    "F1",
    9,
    10.6
  );
  mainY -= 10;
  pushText(mainX, mainY, 8.5, "F1", `Generated: ${new Date().toLocaleDateString()}`, "0.45 0.48 0.54");

  const content = commands.join("\n");
  const obj1 = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  const obj2 = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  const pageResources = photo
    ? "<< /Font << /F1 5 0 R /F2 6 0 R >> /XObject << /Im1 7 0 R >> >>"
    : "<< /Font << /F1 5 0 R /F2 6 0 R >> >>";
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources ${pageResources} /Contents 4 0 R >>\nendobj\n`;
  const obj4 = `4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj\n`;
  const obj5 = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
  const obj6 = "6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
  const encoder = new TextEncoder();
  const chunks = [
    encoder.encode("%PDF-1.4\n"),
    encoder.encode(obj1),
    encoder.encode(obj2),
    encoder.encode(obj3),
    encoder.encode(obj4),
    encoder.encode(obj5),
    encoder.encode(obj6)
  ];

  if (photo) {
    const imageHeader = encoder.encode(
      `7 0 obj\n<< /Type /XObject /Subtype /Image /Width ${photo.width} /Height ${photo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${photo.bytes.length} >>\nstream\n`
    );
    const imageFooter = encoder.encode("\nendstream\nendobj\n");
    chunks.push(imageHeader, photo.bytes, imageFooter);
  }

  const offsets = [];
  let cursor = chunks[0].length;
  for (let i = 1; i < chunks.length; i += 1) {
    offsets.push(cursor);
    cursor += chunks[i].length;
  }

  const objectCount = photo ? 7 : 6;
  const xrefRows = ["0000000000 65535 f "];
  offsets.forEach((offset) => {
    xrefRows.push(`${String(offset).padStart(10, "0")} 00000 n `);
  });
  const xrefStart = cursor;
  const trailerText = `xref\n0 ${objectCount + 1}\n${xrefRows.join("\n")}\ntrailer\n<< /Size ${
    objectCount + 1
  } /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  chunks.push(encoder.encode(trailerText));
  return concatUint8Arrays(chunks);
}

function App() {
  const [loading, setLoading] = useState(true);
  const [scroll, setScroll] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Hi! Ask me anything."
    }
  ]);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({
    name: "",
    email: "",
    rating: 5,
    comment: ""
  });
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState("");
  const [typingResponse, setTypingResponse] = useState("");
  const [projectFormOpen, setProjectFormOpen] = useState(false);
  const [customProjects, setCustomProjects] = useState([]);
  const [projectForm, setProjectForm] = useState({
    title: "",
    description: "",
    github: "",
    website: "",
    languages: "",
    category: "Custom",
    bannerUrl: ""
  });
  const [projectBannerFile, setProjectBannerFile] = useState(null);
  const [projectFormStatus, setProjectFormStatus] = useState("");
  const analytics = useAnalyticsTracking();
  const typedRole = useTypingText(roles);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const progress = (doc.scrollTop / (doc.scrollHeight - doc.clientHeight)) * 100;
      setScroll(progress || 0);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const localItems = getLocalItems(LOCAL_REVIEWS_KEY);
    if (localItems.length) {
      setReviews(localItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }

    const reviewsQuery = fsQuery(collection(firestore, "reviews"), orderBy("createdAt", "desc"), limit(100));
    const unsub = onSnapshot(
      reviewsQuery,
      (snapshot) => {
        const remoteItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const merged = mergeByKey(remoteItems, getLocalItems(LOCAL_REVIEWS_KEY), (item) => `${item.email || ""}-${item.createdAt || 0}-${item.comment || ""}`).slice(0, 100);
        setReviews(merged);
        saveLocalItems(LOCAL_REVIEWS_KEY, merged);
      },
      (error) => {
        console.error("Reviews subscription failed:", error);
        const fallbackItems = getLocalItems(LOCAL_REVIEWS_KEY).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setReviews(fallbackItems);
        setReviewStatus("Live review sync unavailable. Showing local reviews.");
      }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const localItems = getLocalItems(LOCAL_PROJECTS_KEY);
    if (localItems.length) {
      setCustomProjects(localItems.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    }

    const projectsQuery = fsQuery(collection(firestore, "projects"), orderBy("createdAt", "desc"), limit(100));
    const unsub = onSnapshot(
      projectsQuery,
      (snapshot) => {
        const remoteItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const merged = mergeByKey(remoteItems, getLocalItems(LOCAL_PROJECTS_KEY), (item) => `${item.title || ""}-${item.createdAt || 0}`).slice(0, 100);
        setCustomProjects(merged);
        saveLocalItems(LOCAL_PROJECTS_KEY, merged);
      },
      (error) => {
        console.error("Projects subscription failed:", error);
        const fallbackItems = getLocalItems(LOCAL_PROJECTS_KEY).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setCustomProjects(fallbackItems);
      }
    );

    return () => unsub();
  }, []);

  const allProjects = useMemo(() => [...customProjects, ...projects], [customProjects]);

  const filteredProjects = useMemo(() => {
    if (selectedCategory === "All") return allProjects;
    return allProjects.filter((p) => p.category === selectedCategory);
  }, [allProjects, selectedCategory]);

  const projectCategories = useMemo(() => {
    return ["All", ...new Set(allProjects.map((project) => project.category))];
  }, [allProjects]);

  const sectionRanking = useMemo(() => {
    return Object.entries(analytics.sections).sort((a, b) => b[1] - a[1]);
  }, [analytics.sections]);

  const mernCore = ["MongoDB", "Express.js", "React", "Node.js"];
  const mernGraphData = [
    { name: "MongoDB", score: 92, tone: "from-cyan-500 to-sky-500" },
    { name: "Express", score: 88, tone: "from-indigo-500 to-blue-500" },
    { name: "React", score: 90, tone: "from-sky-500 to-cyan-400" },
    { name: "Node.js", score: 86, tone: "from-emerald-500 to-cyan-500" }
  ];
  const stackedSkills = useMemo(() => {
    const preferredOrder = ["Frameworks", "Databases", "Languages", "Tools", "Concepts"];
    return preferredOrder
      .map((name) => skills.find((group) => group.category === name))
      .filter(Boolean);
  }, []);
  const skillOrbitItems = useMemo(() => {
    const pool = [...mernCore, "Redux", "REST APIs", "JavaScript", "Git", "SQL"];
    return pool.slice(0, 8);
  }, []);

  const submitReview = async (event) => {
    event.preventDefault();
    if (!reviewForm.name || !reviewForm.email || !reviewForm.comment || reviewSubmitting) return;

    const isEmailJsConfigured =
      Boolean(emailJsConfig.serviceId) &&
      Boolean(emailJsConfig.templateId) &&
      Boolean(emailJsConfig.publicKey) &&
      !emailJsConfig.serviceId.includes("xxxxx") &&
      !emailJsConfig.templateId.includes("xxxxx") &&
      !emailJsConfig.publicKey.includes("xxxx");

    setReviewSubmitting(true);
    setReviewStatus("Submitting review...");
    let reviewSaved = false;
    try {
      const payload = {
        name: reviewForm.name.trim(),
        email: reviewForm.email.trim(),
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
        createdAt: Date.now()
      };

      const reviewRef = await addDoc(collection(firestore, "reviews"), payload);
      reviewSaved = true;
      const syncedLocal = mergeByKey(
        [{ ...payload, id: reviewRef.id }],
        getLocalItems(LOCAL_REVIEWS_KEY),
        (item) => `${item.email || ""}-${item.createdAt || 0}-${item.comment || ""}`
      );
      setReviews(syncedLocal);
      saveLocalItems(LOCAL_REVIEWS_KEY, syncedLocal);

      if (!isEmailJsConfigured) {
        setReviewForm({ name: "", email: "", rating: 5, comment: "" });
        setReviewStatus("Review saved to Firestore, but EmailJS is not configured. Set VITE_EMAILJS_* values in .env.");
        return;
      }

      const submittedAt = new Date(payload.createdAt).toLocaleString();
      const templateParams = {
        subject: "New Portfolio Review Received",
        to_email: emailJsConfig.toEmail || undefined,
        from_name: payload.name,
        from_email: payload.email,
        reply_to: payload.email,
        rating: String(payload.rating),
        message: payload.comment,
        submitted_at: submittedAt,
        name: payload.name,
        email: payload.email,
        review: payload.comment
      };

      const emailResponse = await emailjs.send(
        emailJsConfig.serviceId,
        emailJsConfig.templateId,
        templateParams,
        { publicKey: emailJsConfig.publicKey }
      );

      if (emailResponse?.status !== 200) {
        throw new Error(`EmailJS returned unexpected status: ${emailResponse?.status}`);
      }

      setReviewForm({ name: "", email: "", rating: 5, comment: "" });
      setReviewStatus("Review submitted successfully. Email notification sent.");
    } catch (error) {
      const payload = {
        name: reviewForm.name.trim(),
        email: reviewForm.email.trim(),
        rating: Number(reviewForm.rating),
        comment: reviewForm.comment.trim(),
        createdAt: Date.now()
      };
      const localOnlyItems = mergeByKey(
        [{ ...payload, id: `${payload.email}-${payload.createdAt}` }],
        getLocalItems(LOCAL_REVIEWS_KEY),
        (item) => `${item.email || ""}-${item.createdAt || 0}-${item.comment || ""}`
      );
      saveLocalItems(LOCAL_REVIEWS_KEY, localOnlyItems);
      setReviews(localOnlyItems);
      setReviewStatus(
        reviewSaved
          ? "Review saved, but email notification failed. Check EmailJS template variables and service settings."
          : "Firestore unavailable. Review saved locally in this browser."
      );
      console.error(error);
      if (!reviewSaved) {
        setReviewForm({ name: "", email: "", rating: 5, comment: "" });
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleDeleteReview = async (review) => {
    if (!review?.id) return;
    setDeletingReviewId(review.id);

    try {
      if (!review.id.startsWith("local-") && !review.id.includes("@")) {
        await deleteDoc(doc(firestore, "reviews", review.id));
      }

      const remaining = reviews.filter((item) => item.id !== review.id);
      setReviews(remaining);
      saveLocalItems(LOCAL_REVIEWS_KEY, remaining);
      setReviewStatus("Review deleted successfully.");
    } catch (error) {
      console.error("Delete review failed:", error);
      const remaining = reviews.filter((item) => item.id !== review.id);
      setReviews(remaining);
      saveLocalItems(LOCAL_REVIEWS_KEY, remaining);
      setReviewStatus("Review removed locally. Firestore delete failed.");
    } finally {
      setDeletingReviewId("");
    }
  };

  const animateBotText = (text) =>
    new Promise((resolve) => {
      let index = 0;
      setTypingResponse("");
      const timer = setInterval(() => {
        index += 1;
        setTypingResponse(text.slice(0, index));
        if (index >= text.length) {
          clearInterval(timer);
          setTypingResponse("");
          resolve(text);
        }
      }, 16);
    });
  const sendChat = async (event) => {
    event.preventDefault();
    const prompt = chatInput.trim();
    if (!prompt || chatLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await askGemini(prompt);
      const content = response?.trim();
      if (!content) {
        throw new Error("Empty Gemini response");
      }
      await animateBotText(content);
      setMessages((prev) => [...prev, { role: "bot", text: content }]);
    } catch (error) {
      const fallback = "Sorry, the AI service is temporarily unavailable.";
      await animateBotText(fallback);
      setMessages((prev) => [...prev, { role: "bot", text: fallback }]);
      console.error(error);
    } finally {
      setChatLoading(false);
    }
  };

  const resetProjectForm = () => {
    setProjectForm({
      title: "",
      description: "",
      github: "",
      website: "",
      languages: "",
      category: "Custom",
      bannerUrl: ""
    });
    setProjectBannerFile(null);
    setProjectFormStatus("");
  };

  const openProjectForm = () => {
    resetProjectForm();
    setProjectFormOpen(true);
  };

  const closeProjectForm = () => {
    setProjectFormOpen(false);
  };

  const handleProjectSubmit = async (event) => {
    event.preventDefault();
    if (!projectForm.title.trim() || !projectForm.description.trim() || !projectForm.languages.trim()) {
      setProjectFormStatus("Please fill title, description, and programming language.");
      return;
    }

    const bannerFromUpload = projectBannerFile ? URL.createObjectURL(projectBannerFile) : "";
    const banner =
      projectForm.bannerUrl.trim() ||
      bannerFromUpload ||
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80";

    const parsedLanguages = projectForm.languages
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const newProject = {
      title: projectForm.title.trim(),
      description: projectForm.description.trim(),
      tech: parsedLanguages,
      category: projectForm.category.trim() || "Custom",
      github: projectForm.github.trim() || "https://github.com/abhishekgfg?tab=repositories",
      demo: projectForm.website.trim() || "#",
      image: banner,
      createdAt: Date.now()
    };

    try {
      const docRef = await addDoc(collection(firestore, "projects"), newProject);
      const savedProject = { ...newProject, id: docRef.id };
      const merged = mergeByKey(
        [savedProject],
        getLocalItems(LOCAL_PROJECTS_KEY),
        (item) => `${item.title || ""}-${item.createdAt || 0}`
      );
      setCustomProjects(merged);
      saveLocalItems(LOCAL_PROJECTS_KEY, merged);
      setSelectedCategory(newProject.category);
      setProjectFormStatus("Project added successfully to Firestore.");
      setProjectFormOpen(false);
      resetProjectForm();
    } catch (error) {
      console.error("Project save failed:", error);
      const localProject = { ...newProject, id: `local-${newProject.createdAt}` };
      const merged = mergeByKey(
        [localProject],
        getLocalItems(LOCAL_PROJECTS_KEY),
        (item) => `${item.title || ""}-${item.createdAt || 0}`
      );
      setCustomProjects(merged);
      saveLocalItems(LOCAL_PROJECTS_KEY, merged);
      setSelectedCategory(newProject.category);
      setProjectFormStatus("Firestore unavailable. Project saved locally in this browser.");
      setProjectFormOpen(false);
      resetProjectForm();
    }
  };

  const handleResumeDownload = async () => {
    const pdfBytes = await buildTemplateResumePdf();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `Abhishek_Kumar_Resume_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const heroTechStack = ["Python", "Machine Learning", "React JS", "Java", "Node.js", "MongoDB", "Git & GitHub"];
  const primaryEducation = education[0];
  const heroHighlights = [
    { value: "10+", label: "Projects" },
    { value: "500+", label: "Problems Solved" },
    { value: "2+", label: "Years Exp" },
    { value: "4★", label: "HackerRank C++" }
  ];

  return (
    <div className="min-h-screen font-body text-slate-900">
      <LoadingScreen done={!loading} />
      <ThreeBackground />

      <div
        className="fixed left-0 top-0 z-50 h-1 bg-gradient-to-r from-accent to-glow transition-all"
        style={{ width: `${scroll}%` }}
      />

      <header className="sticky top-0 z-30 border-b border-sky-200 bg-white/85 backdrop-blur">
        <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <a className="font-heading text-lg font-semibold text-slate-900" href="#hero">
            Abhishek Kumar
          </a>
          <div className="hidden items-center gap-5 text-sm md:flex">
            {["about", "education", "skills", "projects", "experience", "github", "reviews", "analytics", "contact"].map((id) => (
              <a key={id} href={`#${id}`} className="text-slate-300 transition hover:text-accent">
                {id}
              </a>
            ))}
          </div>
        </nav>
      </header>

      <main className="space-y-8 px-4 py-8 md:px-6 md:py-10">
        <section
          id="hero"
          data-track="hero"
          className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-br from-slate-50 via-white to-sky-50 p-6 shadow-neon md:p-10"
        >
          <div className="pointer-events-none absolute -left-12 top-16 -z-10 h-44 w-44 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 -z-10 h-56 w-56 rounded-full bg-indigo-200/40 blur-3xl" />

          <div className="grid items-start gap-8 lg:grid-cols-[1.32fr_0.9fr]">
            <div>
              <div className="mb-4 flex items-center gap-4">
                <div className="relative rounded-full border-[3px] border-sky-300 bg-white p-1">
                  <img
                    src="/profile-photo.jpeg"
                    alt="Profile"
                    className="h-20 w-20 rounded-full object-cover object-top md:h-24 md:w-24"
                  />
                  <span className="absolute -right-1 top-2 h-3 w-3 rounded-full bg-blue-500" />
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-700">
                  <Sparkles size={14} />
                  Portfolio Profile
                </div>
              </div>

              <h1 className="hero-name-title font-heading text-5xl font-extrabold leading-tight md:text-7xl">
                {developer.name}
              </h1>
              <p className="mt-2 text-xl font-semibold text-slate-700 md:text-4xl">{developer.role}</p>
              <p className="mt-3 inline-flex items-center gap-2 text-lg text-slate-600">
                <MapPin size={18} />
                {developer.location}
              </p>

              <p className="mt-4 max-w-3xl rounded-lg border border-dashed border-sky-200 bg-white px-4 py-2 text-lg font-medium text-slate-700">
                Building Intelligent <span className="font-bold text-sky-700">AI Solutions</span> and modern web applications
              </p>

              <p className="mt-3 text-base font-semibold text-indigo-600">
                {typedRole}
                <span className="animate-pulse">|</span>
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-slate-700">
                <a href="mailto:abhishek8579013@gmail.com" className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm">
                  <Mail size={16} />
                  abhishek8579013@gmail.com
                </a>
                <a href="tel:6202000340" className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-white px-3 py-2 text-sm">
                  <Phone size={16} />
                  +91 6202000340
                </a>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <article className="rounded-2xl border border-sky-200 bg-white p-4">
                  <p className="text-sm font-semibold text-blue-700">{experience.company}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">{experience.role}</p>
                </article>
                <article className="rounded-2xl border border-sky-200 bg-white p-4">
                  <p className="text-sm font-semibold text-amber-600">{primaryEducation?.institute}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-800">{primaryEducation?.degree}</p>
                </article>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <a href="#projects" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-5 py-3 text-base font-semibold text-white">
                  View Projects
                  <ExternalLink size={16} />
                </a>
                <button
                  type="button"
                  onClick={handleResumeDownload}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-base font-semibold text-white"
                >
                  <ArrowDownToLine size={16} />
                  Download Resume
                </button>
              </div>

              <div className="mt-5 grid gap-3 rounded-2xl border border-sky-200 bg-white p-3 sm:grid-cols-4">
                {heroHighlights.map((item) => (
                  <article key={item.label} className="rounded-lg border border-sky-100 bg-slate-50 px-3 py-2 text-center">
                    <p className="text-2xl font-extrabold text-sky-700">{item.value}</p>
                    <p className="text-xs font-semibold text-slate-600">{item.label}</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="relative space-y-5">
              <article className="rounded-3xl border border-sky-200 bg-white p-5 shadow-lg">
                <h3 className="mb-4 inline-flex items-center gap-2 font-heading text-3xl font-bold text-slate-800">
                  <Code2 size={22} className="text-sky-700" />
                  Tech Stack
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {heroTechStack.map((tech) => (
                    <p key={tech} className="rounded-xl border border-sky-100 bg-slate-50 px-3 py-2 text-base font-semibold text-slate-700">
                      {tech}
                    </p>
                  ))}
                </div>
              </article>

              <article className="ml-auto w-full max-w-[280px] rotate-3 rounded-[2rem] border border-indigo-200 bg-gradient-to-br from-white to-indigo-50 p-5 shadow-lg">
                <p className="text-2xl font-extrabold text-indigo-700">Resume</p>
                <button
                  type="button"
                  onClick={handleResumeDownload}
                  className="mt-3 inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 font-semibold text-indigo-700"
                >
                  <ArrowDownToLine size={16} />
                  Download PDF
                </button>
                <ul className="mt-4 space-y-2 text-sm font-medium text-slate-600">
                  <li>Education</li>
                  <li>Projects</li>
                  <li>Skills</li>
                </ul>
              </article>

              <article className="relative hidden overflow-hidden rounded-3xl border border-sky-200/80 bg-gradient-to-br from-sky-100 via-white to-indigo-100 p-4 lg:block">
                <motion.div
                  className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-cyan-400/30 blur-2xl"
                  animate={{ scale: [1, 1.25, 1], opacity: [0.45, 0.8, 0.45] }}
                  transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="pointer-events-none absolute -bottom-10 right-2 h-32 w-32 rounded-full bg-indigo-400/25 blur-2xl"
                  animate={{ scale: [1.2, 1, 1.2], opacity: [0.55, 0.25, 0.55] }}
                  transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="h-full rounded-2xl border border-dashed border-sky-300/80 bg-white/70 p-4">
                  <p className="text-sm font-semibold text-sky-700">MERN Focus</p>
                  <div className="mt-3 space-y-2">
                    {mernGraphData.map((item, index) => (
                      <div key={item.name}>
                        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-slate-600">
                          <span>{item.name}</span>
                          <span>{item.score}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-sky-100">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${item.score}%` }}
                            viewport={{ once: true, amount: 0.7 }}
                            transition={{ duration: 0.9, delay: index * 0.08 }}
                            className={`h-2 rounded-full bg-gradient-to-r ${item.tone}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-sky-200 bg-white/80 p-2">
                    <svg viewBox="0 0 220 50" className="h-12 w-full">
                      <polyline fill="none" stroke="#0ea5e9" strokeWidth="3" points="0,38 45,30 95,34 145,22 220,16" />
                      <polyline fill="none" stroke="#4f46e5" strokeWidth="2.4" points="0,42 45,36 95,28 145,26 220,20" />
                      {[0, 45, 95, 145, 220].map((x) => (
                        <circle key={x} cx={x} cy={x === 145 ? 22 : x === 220 ? 16 : x === 45 ? 30 : x === 95 ? 34 : 38} r="2.6" fill="#06b6d4" />
                      ))}
                    </svg>
                  </div>
                </div>
                {[...Array(10)].map((_, i) => (
                  <motion.span
                    key={`particle-${i}`}
                    className="pointer-events-none absolute h-1.5 w-1.5 rounded-full bg-cyan-400/70"
                    style={{ left: `${8 + i * 9}%`, bottom: `${6 + (i % 4) * 8}%` }}
                    animate={{ y: [0, -10, 0], opacity: [0.25, 0.9, 0.25] }}
                    transition={{ duration: 1.8 + (i % 3) * 0.5, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
                  />
                ))}
              </article>
            </div>
          </div>
        </section>

        <Section id="about" title="About" subtitle={developer.role}>
          <p className="leading-7 text-slate-300">
            {developer.summary}
          </p>
        </Section>

        <Section id="education" title="Education" subtitle="Academic background">
          <div className="grid gap-3 md:grid-cols-3">
            {education.map((item) => (
              <article key={`${item.degree}-${item.institute}`} className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
                <h3 className="font-heading text-base text-white">{item.degree}</h3>
                <p className="mt-1 text-sm text-slate-300">{item.institute}</p>
                <p className="text-sm text-slate-400">{item.location}</p>
                {item.year ? <p className="mt-1 text-xs text-cyan-200">{item.year}</p> : null}
              </article>
            ))}
          </div>
        </Section>

        <Section id="skills" title="My Skills" subtitle="MERN stack focused profile with supporting technologies.">
          <div className="grid gap-5 lg:grid-cols-2">
            <motion.article
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              className="relative overflow-hidden rounded-3xl border border-cyan-400/30 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white"
            >
              <div className="pointer-events-none absolute -right-16 -top-12 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">Primary Focus</p>
              <h3 className="mt-2 font-heading text-4xl font-bold">MERN Stack Developer</h3>
              <p className="mt-2 max-w-xl text-sm text-slate-300">
                React frontends, Node and Express APIs, MongoDB data modeling, and deployment-ready full-stack workflows.
              </p>

              <div className="relative mt-6 grid place-items-center">
                <div className="h-56 w-56 rounded-full border border-cyan-400/30 bg-slate-950/80 shadow-[0_0_45px_rgba(56,189,248,0.3)]" />
                <div className="pointer-events-none absolute inset-0 grid place-items-center">
                  <div className="rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-4 py-2 text-xl font-bold text-cyan-200">MERN</div>
                </div>
                {skillOrbitItems.map((item, index) => {
                  const angle = (360 / skillOrbitItems.length) * index;
                  return (
                    <span
                      key={item}
                      className="absolute inline-flex -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/30 bg-slate-900 px-3 py-1 text-xs font-semibold text-cyan-100"
                      style={{
                        left: `calc(50% + ${Math.cos((angle * Math.PI) / 180) * 120}px)`,
                        top: `calc(50% + ${Math.sin((angle * Math.PI) / 180) * 120}px)`
                      }}
                    >
                      {item}
                    </span>
                  );
                })}
              </div>
            </motion.article>

            <div className="space-y-4">
              {stackedSkills.map((group, index) => (
                <motion.article
                  key={group.category}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-indigo-400/30 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 text-white"
                >
                  <p className="text-sm font-semibold uppercase tracking-wider text-indigo-200">{group.category}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span key={`${group.category}-${item}`} className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100">
                        {item}
                      </span>
                    ))}
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </Section>

        <Section
          id="projects"
          title="Projects"
          subtitle="Filter projects by category."
          action={(
            <button
              type="button"
              onClick={openProjectForm}
              className="inline-flex items-center gap-2 rounded-lg border border-sky-300 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:border-sky-500 hover:text-sky-600"
            >
              <Plus size={16} />
              Add Project
            </button>
          )}
        >
          <div className="mb-4 flex flex-wrap gap-2">
            {projectCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  selectedCategory === category
                    ? "bg-gradient-to-r from-accent to-glow text-slate-900"
                    : "border border-white/20 text-slate-300 hover:border-accent"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProjects.map((project) => (
              <motion.article
                key={project.title}
                whileHover={{ y: -6 }}
                className="overflow-hidden rounded-xl border border-white/10 bg-slate-800/70"
              >
                <img src={project.image} alt={project.title} loading="lazy" className="h-40 w-full object-cover" />
                <div className="p-4">
                  <h3 className="font-heading text-lg text-white">{project.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{project.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {project.tech.map((tech) => (
                      <span key={tech} className="rounded border border-sky-300 bg-white px-2 py-1 text-xs text-sky-800">
                        {tech}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-3">
                    <a href={project.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-3 py-2 text-sm hover:border-accent">
                      <Github size={14} />
                      GitHub
                    </a>
                    <a href={project.demo} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-glow px-3 py-2 text-sm font-semibold text-slate-900">
                      <ExternalLink size={14} />
                      Live Demo
                    </a>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </Section>

        <Section id="experience" title="Experience, Achievements & Leadership" subtitle={experience.role}>
          <div className="grid gap-4 lg:grid-cols-2">
            <article className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
              <h3 className="font-heading text-lg text-white">{experience.company}</h3>
              <p className="mt-1 text-sm text-cyan-200">{experience.role}</p>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-300">
                {experience.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                {experience.techStack.map((tech) => (
                  <span key={tech} className="rounded border border-sky-300 bg-white px-2 py-1 text-xs text-sky-800">
                    {tech}
                  </span>
                ))}
              </div>
            </article>
            <article className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
              <h3 className="font-heading text-lg text-white">Achievements</h3>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-300">
                {achievements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <h3 className="mt-4 font-heading text-lg text-white">Extracurricular</h3>
              <ul className="mt-3 list-disc space-y-1 pl-4 text-sm text-slate-300">
                {extracurricular.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </Section>

        <Section id="github" title="GitHub" subtitle="Contribution graph and profile stats placeholders.">
          <div className="grid gap-4 lg:grid-cols-2">
            <ResilientImage
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-2"
              alt="GitHub contribution graph"
              sources={[
                "https://ghchart.rshah.org/00ffff/abhishekgfg",
                "https://ghchart.rshah.org/abhishekgfg",
                "https://github-readme-activity-graph.vercel.app/graph?username=abhishekgfg&theme=react-dark&hide_border=true"
              ]}
            />
            <ResilientImage
              className="w-full rounded-xl border border-white/10 bg-slate-950 p-2"
              alt="GitHub stats card"
              sources={[
                "https://github-readme-stats.vercel.app/api?username=abhishekgfg&show_icons=true&theme=tokyonight",
                "https://github-readme-stats-git-masterrstaa-rickstaa.vercel.app/api?username=abhishekgfg&show_icons=true&theme=tokyonight",
                "https://github-profile-summary-cards.vercel.app/api/cards/stats?username=abhishekgfg&theme=github_dark"
              ]}
            />
          </div>
        </Section>

        <Section id="reviews" title="Review / Feedback" subtitle="Visitor reviews are stored in Firebase and shown latest first.">
          <div className="grid gap-4 lg:grid-cols-2">
            <form onSubmit={submitReview} className="space-y-4 rounded-2xl border border-sky-300/40 bg-slate-900/70 p-5">
              <h3 className="font-heading text-2xl font-bold text-white">Share Your Experience</h3>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Your Name *</label>
                <input
                  placeholder="Enter your name"
                  value={reviewForm.name}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-sky-300/30 bg-slate-950/80 p-3 text-slate-100 placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Email Address *</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={reviewForm.email}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, email: e.target.value }))}
                  className="w-full rounded-xl border border-sky-300/30 bg-slate-950/80 p-3 text-slate-100 placeholder:text-slate-400"
                  required
                />
              </div>
              <div>
                <p className="mb-2 text-sm font-semibold text-slate-200">Rating *</p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      type="button"
                      key={n}
                      onClick={() => setReviewForm((prev) => ({ ...prev, rating: n }))}
                      className="rounded p-1"
                    >
                      <Star className={n <= reviewForm.rating ? "fill-amber-300 text-amber-300" : "text-slate-500"} size={28} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-200">Your Review *</label>
                <textarea
                  placeholder="Share your thoughts about my work..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                  className="min-h-32 w-full rounded-xl border border-sky-300/30 bg-slate-950/80 p-3 text-slate-100 placeholder:text-slate-400"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={reviewSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-glow via-accent to-glow px-4 py-3 text-base font-semibold text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
                {reviewSubmitting ? "Submitting..." : "Submit Review"}
              </button>
              <p className="text-sm text-cyan-200">{reviewStatus}</p>
            </form>

            <div className="max-h-[380px] space-y-3 overflow-y-auto rounded-xl border border-white/10 bg-slate-800/70 p-4">
              {reviews.length ? (
                reviews.map((item) => (
                  <article key={item.id} className="rounded-lg border border-white/10 bg-slate-900 p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="font-semibold text-white">{item.name}</p>
                      <button
                        type="button"
                        onClick={() => handleDeleteReview(item)}
                        disabled={deletingReviewId === item.id}
                        className="inline-flex items-center gap-1 rounded-md border border-rose-300/60 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Trash2 size={12} />
                        {deletingReviewId === item.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                    <p className="mb-1 text-amber-300">{`${"\u2605".repeat(item.rating)}${"\u2606".repeat(5 - item.rating)}`}</p>
                    <p className="text-sm text-slate-300">{item.comment}</p>
                    <p className="mt-1 text-xs text-slate-500">{new Date(item.createdAt).toLocaleString()}</p>
                  </article>
                ))
              ) : (
                <p className="text-slate-400">No reviews yet.</p>
              )}
            </div>
          </div>
        </Section>

        <Section id="analytics" title="Visitor Analytics" subtitle="Live visitor stats connected with Firebase Realtime Database + Firestore.">
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
              <p className="text-sm text-slate-300">Total Visitors</p>
              <p className="mt-2 text-3xl font-bold text-accent">{analytics.totalVisitors}</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
              <p className="text-sm text-slate-300">Page Views</p>
              <p className="mt-2 text-3xl font-bold text-accent">{analytics.pageViews}</p>
            </article>
            <article className="rounded-xl border border-white/10 bg-slate-800/70 p-4">
              <p className="text-sm text-slate-300">Most Visited Sections</p>
              <ul className="mt-2 space-y-1 text-sm text-slate-200">
                {sectionRanking.length ? (
                  sectionRanking.map(([name, count]) => <li key={name}>{`${name}: ${count}`}</li>)
                ) : (
                  <li>No data yet.</li>
                )}
              </ul>
            </article>
          </div>
        </Section>

        <Section id="contact" title="Contact" subtitle="Professional links">
          <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-sky-50 to-blue-50 p-4 md:p-6">
            <div className="flex flex-wrap gap-3">
              <a href="mailto:abhishek8579013@gmail.com" className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-5 py-3 text-sky-800 transition hover:-translate-y-0.5 hover:shadow-md">
                <Mail size={18} />
                abhishek8579013@gmail.com
              </a>
              <a href="tel:6202000340" className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-5 py-3 text-sky-800 transition hover:-translate-y-0.5 hover:shadow-md">
                <Phone size={18} />
                +91 6202000340
              </a>
              <a href="https://github.com/abhishekgfg?tab=repositories" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-5 py-3 text-sky-800 transition hover:-translate-y-0.5 hover:shadow-md">
                <Github size={18} />
                github.com/abhishekgfg
              </a>
              <a href="https://www.linkedin.com/in/abhishek-kumar-847b74241/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-sky-300 bg-white px-5 py-3 text-sky-800 transition hover:-translate-y-0.5 hover:shadow-md">
                <Linkedin size={18} />
                linkedin.com/in/abhishek-kumar-847b74241
              </a>
            </div>
          </div>
        </Section>
      </main>

      {projectFormOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 px-4 py-8 backdrop-blur-sm">
          <div className="mx-auto w-full max-w-3xl rounded-2xl border border-sky-200 bg-white p-6 shadow-2xl md:p-8">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h3 className="font-heading text-2xl font-bold text-sky-900">Add New Project</h3>
              <button
                type="button"
                onClick={closeProjectForm}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 text-sky-700 transition hover:border-sky-400"
                aria-label="Close add project form"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleProjectSubmit} className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-semibold text-sky-800">Project Title *</label>
                <input
                  value={projectForm.title}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
                  placeholder="e.g. Portfolio Builder"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-sky-800">Description *</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="min-h-28 w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
                  placeholder="Brief project summary"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-sky-800">GitHub Link</label>
                  <input
                    type="url"
                    value={projectForm.github}
                    onChange={(e) => setProjectForm((prev) => ({ ...prev, github: e.target.value }))}
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
                    placeholder="https://github.com/username/repo"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-sky-800">Website Link</label>
                  <input
                    type="url"
                    value={projectForm.website}
                    onChange={(e) => setProjectForm((prev) => ({ ...prev, website: e.target.value }))}
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
                    placeholder="https://your-project-site.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-sky-800">Programming Language(s) *</label>
                  <input
                    value={projectForm.languages}
                    onChange={(e) => setProjectForm((prev) => ({ ...prev, languages: e.target.value }))}
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
                    placeholder="JavaScript, React, Node.js"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-sky-800">Category</label>
                  <input
                    value={projectForm.category}
                    onChange={(e) => setProjectForm((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
                    placeholder="Web Apps / Desktop Apps / Custom"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-sky-800">Banner URL</label>
                  <input
                    type="url"
                    value={projectForm.bannerUrl}
                    onChange={(e) => setProjectForm((prev) => ({ ...prev, bannerUrl: e.target.value }))}
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
                    placeholder="https://image-link.com/banner.jpg"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-semibold text-sky-800">Or Upload Banner</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProjectBannerFile(e.target.files?.[0] || null)}
                    className="w-full rounded-lg border border-sky-200 bg-white px-3 py-2 text-slate-800"
                  />
                </div>
              </div>

              {projectFormStatus ? <p className="text-sm text-sky-700">{projectFormStatus}</p> : null}

              <div className="mt-2 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={closeProjectForm}
                  className="rounded-lg border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-accent to-glow px-4 py-2 text-sm font-semibold text-slate-900"
                >
                  <Plus size={15} />
                  Add Project
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <footer className="mx-auto mb-6 w-[min(1120px,95vw)] rounded-3xl border border-sky-200 bg-gradient-to-br from-white to-sky-50 px-6 py-8 md:px-10">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-sky-300 bg-sky-100 font-heading text-xl font-semibold text-sky-700">
                AK
              </div>
              <h3 className="font-heading text-3xl text-sky-900">Abhishek Kumar</h3>
            </div>
            <p className="mt-4 max-w-sm text-sky-700">
              MERN stack developer building practical, scalable products with clean architecture.
            </p>
            <div className="mt-4 flex gap-2">
              <a href="https://github.com/abhishekgfg?tab=repositories" target="_blank" rel="noreferrer" className="rounded-full border border-sky-300 bg-white p-2 text-sky-700 hover:text-sky-500">
                <Github size={18} />
              </a>
              <a href="mailto:abhishek8579013@gmail.com" className="rounded-full border border-sky-300 bg-white p-2 text-sky-700 hover:text-sky-500">
                <Mail size={18} />
              </a>
              <a href="tel:6202000340" className="rounded-full border border-sky-300 bg-white p-2 text-sky-700 hover:text-sky-500">
                <Phone size={18} />
              </a>
              <a href="https://www.linkedin.com/in/abhishek-kumar-847b74241/" target="_blank" rel="noreferrer" className="rounded-full border border-sky-300 bg-white p-2 text-sky-700 hover:text-sky-500">
                <Linkedin size={18} />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-heading text-xl text-sky-900">Quick Links</h4>
            <ul className="mt-3 space-y-2 text-sky-700">
              {["Home", "About", "Reviews", "Projects", "Contact"].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-heading text-xl text-sky-900">Technologies</h4>
            <ul className="mt-3 space-y-2 text-sky-700">
              {["MongoDB", "Express.js", "React", "Node.js", "JavaScript"].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-6 border-t border-sky-200 pt-5 text-center text-sky-600">
          (c) {new Date().getFullYear()} Abhishek Kumar. All rights reserved.
        </div>
      </footer>

      <button
        type="button"
        onClick={() => setChatOpen(true)}
        className="chat-fab"
        aria-label="Open chatbot"
      >
        <Bot />
      </button>

      {chatOpen ? (
        <div className="chat-shell">
          <div className="chat-head">
            <div className="flex items-center gap-2">
              <MessageSquare size={16} />
              <p className="font-heading">Portfolio AI Chat</p>
            </div>
          </div>
          <div className="chat-body">
            {messages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`chat-bubble ${m.role === "user" ? "chat-user" : "chat-bot"}`}
              >
                {m.text}
              </div>
            ))}
            {chatLoading && typingResponse ? (
              <div className="chat-bubble chat-bot">{typingResponse}</div>
            ) : null}
          </div>
          <form onSubmit={sendChat} className="chat-form">
            <button
              type="button"
              className="chat-close chat-close-inline"
              onClick={() => setChatOpen(false)}
              aria-label="Close chatbot"
              title="Close chat"
            >
              <X size={14} />
            </button>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="chat-input"
              placeholder="Ask about skills, projects, contact..."
            />
            <button
              type="submit"
              disabled={chatLoading}
              className="chat-send"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export default App;

