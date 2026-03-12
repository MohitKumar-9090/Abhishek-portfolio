import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import emailjs from "@emailjs/browser";
import { onValue, ref, runTransaction } from "firebase/database";
import { addDoc, collection, deleteDoc, doc, increment, limit, onSnapshot, orderBy, query as fsQuery, setDoc } from "firebase/firestore";
import { askGemini } from "./lib/gemini";
import { db, firestore } from "./lib/firebase";
import { emailJsConfig } from "./config";
import { getLocalItems, LOCAL_PROJECTS_KEY, LOCAL_REVIEWS_KEY, mergeByKey, saveLocalItems } from "./features/storage/localStore";
import { achievements, developer, education, experience, extracurricular, projects, roles, skills } from "./data";
import HeroSection from "./components/Hero/Hero";
import { heroHighlights, heroTechStack, mernGraphData } from "./components/Hero/heroData";
import AboutSection from "./components/About/About";
import EducationSection from "./components/Education/Education";
import SkillsSection from "./components/Skills/Skills";
import { skillOrbitPool, skillsPreferredOrder } from "./components/Skills/skillsData";
import ProjectsSection from "./components/Projects/Projects";
import ExperienceSection from "./components/Experience/Experience";
import GithubSection from "./components/Github/Github";
import ReviewsSection from "./components/Reviews/Reviews";
import AnalyticsSection from "./components/Analytics/Analytics";
import ContactSection from "./components/Contact/Contact";
import ProjectFormModal from "./components/modals/ProjectFormModal";
import Footer from "./components/layout/Footer";
import Chatbot from "./components/Chatbot/Chatbot";
import { CHATBOT_SECTION, INITIAL_CHAT_MESSAGES } from "./components/Chatbot/chatbotData";

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
  const [messages, setMessages] = useState(() => [...INITIAL_CHAT_MESSAGES]);
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

  const stackedSkills = useMemo(() => {
    return skillsPreferredOrder
      .map((name) => skills.find((group) => group.category === name))
      .filter(Boolean);
  }, []);
  const skillOrbitItems = useMemo(() => {
    return skillOrbitPool.slice(0, 8);
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

  const primaryEducation = education[0];

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
            {["about", "education", "skills", "projects", "experience", "github", "reviews", "analytics", "chatbot", "contact"].map((id) => (
              <a key={id} href={`#${id}`} className="text-slate-300 transition hover:text-accent">
                {id}
              </a>
            ))}
          </div>
        </nav>
      </header>

            <main className="space-y-8 px-4 py-8 md:px-6 md:py-10">
        <HeroSection
          developer={developer}
          experience={experience}
          primaryEducation={primaryEducation}
          typedRole={typedRole}
          handleResumeDownload={handleResumeDownload}
          heroHighlights={heroHighlights}
          heroTechStack={heroTechStack}
          mernGraphData={mernGraphData}
        />
        <AboutSection developer={developer} />
        <EducationSection education={education} />
        <SkillsSection stackedSkills={stackedSkills} skillOrbitItems={skillOrbitItems} />
        <ProjectsSection
          projectCategories={projectCategories}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          filteredProjects={filteredProjects}
          openProjectForm={openProjectForm}
        />
        <ExperienceSection
          experience={experience}
          achievements={achievements}
          extracurricular={extracurricular}
        />
        <GithubSection />
        <ReviewsSection
          submitReview={submitReview}
          reviewForm={reviewForm}
          setReviewForm={setReviewForm}
          reviewSubmitting={reviewSubmitting}
          reviewStatus={reviewStatus}
          reviews={reviews}
          handleDeleteReview={handleDeleteReview}
          deletingReviewId={deletingReviewId}
        />
        <AnalyticsSection analytics={analytics} sectionRanking={sectionRanking} />
        <section id={CHATBOT_SECTION.id} className="mx-auto w-[min(1120px,95vw)] rounded-3xl border border-sky-200 bg-white/90 px-6 py-8 shadow-xl md:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="font-heading text-3xl text-sky-900">{CHATBOT_SECTION.title}</h2>
              <p className="mt-2 max-w-2xl text-sky-700">
                {CHATBOT_SECTION.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-accent to-glow px-5 py-3 text-sm font-semibold text-slate-900"
            >
              {CHATBOT_SECTION.ctaLabel}
            </button>
          </div>
        </section>
        <ContactSection />
      </main>

      <ProjectFormModal
        projectFormOpen={projectFormOpen}
        closeProjectForm={closeProjectForm}
        handleProjectSubmit={handleProjectSubmit}
        projectForm={projectForm}
        setProjectForm={setProjectForm}
        setProjectBannerFile={setProjectBannerFile}
        projectFormStatus={projectFormStatus}
      />

      <Footer />

      <Chatbot
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        messages={messages}
        chatLoading={chatLoading}
        typingResponse={typingResponse}
        sendChat={sendChat}
        chatInput={chatInput}
        setChatInput={setChatInput}
      />
    </div>
  );
}

export default App;


