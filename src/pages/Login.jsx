import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Check,
  X,
  KeyRound,
  User,
  MessageSquare,
  Phone,
  LogIn
} from 'lucide-react';
import { login as loginApi, forgotPasswordApi, clearAuthSession } from '../services/api';
import { useAuth } from '../context/AuthContext';
import sadewaLogo from '../assets/sadewa_blue.png';

// ============================================================================
// 1. ORGANIC NETWORK CONFIGURATION: "Pesan yang menempuh jarak"
// Asymmetrical layout:
// - Gugusan A (kecil, rapat, kiri-bawah): A1..A5
// - Jalur Utama (melengkung di atas kartu): A5 -> J1 -> J2 -> J3 -> J4 -> J5 -> B1
// - Gugusan B (besar, longgar, kanan-atas): B1..B9
// - Titik Menyendiri (tanpa garis): S1..S5
// ============================================================================
const INITIAL_NODES = [
  // Gugusan A (Kiri-Bawah)
  { id: 'a1', x: 8, y: 80, size: 6, isIcon: false, cluster: 'A' },
  { id: 'a2', x: 14, y: 72, size: 5, isIcon: true, iconType: 'chat', cluster: 'A' }, // Ikon Chat (index 1)
  { id: 'a3', x: 20, y: 82, size: 4, isIcon: false, cluster: 'A' },
  { id: 'a4', x: 11, y: 64, size: 4, isIcon: false, cluster: 'A' },
  { id: 'a5', x: 22, y: 70, size: 7, isIcon: false, cluster: 'A' },

  // Jalur Utama (Melengkung di atas kartu: y < 14 saat melintas di atas)
  { id: 'j1', x: 29, y: 55, size: 3, isIcon: false, cluster: 'J' },
  { id: 'j2', x: 25, y: 34, size: 4, isIcon: false, cluster: 'J' },
  { id: 'j3', x: 38, y: 11, size: 3, isIcon: false, cluster: 'J' },
  { id: 'j4', x: 58, y: 7, size: 4, isIcon: false, cluster: 'J' },
  { id: 'j5', x: 72, y: 14, size: 5, isIcon: false, cluster: 'J' },

  // Gugusan B (Kanan-Atas)
  { id: 'b1', x: 80, y: 22, size: 8, isIcon: false, isSignalEmitter: true, cluster: 'B' }, // Pemancar Riak Sinyal (index 10)
  { id: 'b2', x: 88, y: 12, size: 5, isIcon: false, cluster: 'B' },
  { id: 'b3', x: 94, y: 28, size: 4, isIcon: false, cluster: 'B' },
  { id: 'b4', x: 84, y: 36, size: 6, isIcon: true, iconType: 'phone', cluster: 'B' }, // Ikon Telepon (index 13)
  { id: 'b5', x: 76, y: 40, size: 3, isIcon: false, cluster: 'B' },
  { id: 'b6', x: 91, y: 46, size: 5, isIcon: false, cluster: 'B' },
  { id: 'b7', x: 82, y: 56, size: 4, isIcon: false, cluster: 'B' },
  { id: 'b8', x: 95, y: 62, size: 3, isIcon: false, cluster: 'B' },
  { id: 'b9', x: 70, y: 30, size: 3, isIcon: false, cluster: 'B' },

  // Titik Menyendiri (Tanpa Garis)
  { id: 's1', x: 30, y: 16, size: 3, isIcon: false, cluster: 'S' },
  { id: 's2', x: 6, y: 40, size: 4, isIcon: false, cluster: 'S' },
  { id: 's3', x: 74, y: 86, size: 3, isIcon: false, cluster: 'S' },
  { id: 's4', x: 50, y: 96, size: 2, isIcon: false, cluster: 'S' },
  { id: 's5', x: 88, y: 80, size: 5, isIcon: false, isDim: true, cluster: 'S' },
];

// Network connections (edges between nodes)
// Dalam tiap gugusan, tiap titik terhubung ke 2-3 tetangga terdekat.
// Jalur utama: A5 -> J1 -> J2 -> J3 -> J4 -> J5 -> B1 (garis lebih terang: ~30%, lain ~15%)
const INITIAL_EDGES = [
  // Gugusan A internal edges (7 edges)
  { from: 0, to: 1 },
  { from: 0, to: 2 },
  { from: 0, to: 3 },
  { from: 1, to: 3 },
  { from: 1, to: 4 },
  { from: 2, to: 4 },
  { from: 3, to: 4 },

  // Jalur Utama (6 edges, isMainPath = true)
  { from: 4, to: 5, isMainPath: true },
  { from: 5, to: 6, isMainPath: true },
  { from: 6, to: 7, isMainPath: true },
  { from: 7, to: 8, isMainPath: true },
  { from: 8, to: 9, isMainPath: true },
  { from: 9, to: 10, isMainPath: true },

  // Gugusan B internal edges (13 edges)
  { from: 10, to: 11 },
  { from: 10, to: 18 },
  { from: 10, to: 13 },
  { from: 11, to: 12 },
  { from: 12, to: 13 },
  { from: 12, to: 15 },
  { from: 13, to: 14 },
  { from: 13, to: 15 },
  { from: 14, to: 18 },
  { from: 14, to: 16 },
  { from: 15, to: 16 },
  { from: 15, to: 17 },
  { from: 16, to: 17 },
];

// Signal rings (C1..C7):
// C1: diameter ~75vh, pusat (4, 104) [sebagian keluar layar kiri-bawah]
// C2: diameter ~34vh, pusat (68, 66) [sebagian masuk tepi kanan kartu]
// C3: diameter ~20vh, pusat (31, 28) [sebagian masuk tepi kiri kartu]
// C4: kiri atas, outline + cincin dalam putus-putus, diameter 28vh, pusat (8, 10)
// C5: kiri atas, cincin kecil gradient lembut, diameter 12vh, pusat (6, 38)
// C6: kanan bawah, outline diameter 30vh, pusat (88, 84)
// C7: kanan bawah, cincin kecil diameter 10vh, pusat (78, 94)
const SIGNAL_RINGS = [
  { id: 'c1', x: 4, y: 104, radiusVh: 37.5, floatSpeed: 0.6, ampX: 4, ampY: 4, phase: 0.2, type: 'concentric' },
  { id: 'c2', x: 68, y: 66, radiusVh: 17, floatSpeed: 0.7, ampX: 5, ampY: 5, phase: 2.1, type: 'concentric' },
  { id: 'c3', x: 31, y: 28, radiusVh: 10, floatSpeed: 0.8, ampX: 4, ampY: 5, phase: 4.3, type: 'concentric' },
  { id: 'c4', x: 8, y: 10, radiusVh: 14, floatSpeed: 0.75, ampX: 4, ampY: 4, phase: 1.1, type: 'dashed-inner' },
  { id: 'c5', x: 6, y: 38, radiusVh: 6, floatSpeed: 0.85, ampX: 3, ampY: 4, phase: 3.4, type: 'soft-gradient' },
  { id: 'c6', x: 88, y: 84, radiusVh: 15, floatSpeed: 0.7, ampX: 4, ampY: 5, phase: 5.2, type: 'outline' },
  { id: 'c7', x: 78, y: 94, radiusVh: 5, floatSpeed: 0.9, ampX: 3, ampY: 4, phase: 0.8, type: 'small' },
];

// Seeded dust particles for empty corners
const LEFT_TOP_DUST = [
  { x: 5, y: 12, size: 2, delay: 0.2 },
  { x: 12, y: 8, size: 1.5, delay: 1.1 },
  { x: 18, y: 16, size: 2.5, delay: 2.3 },
  { x: 9, y: 24, size: 1, delay: 0.7 },
  { x: 22, y: 11, size: 2, delay: 3.1 },
  { x: 15, y: 28, size: 1.5, delay: 1.8 },
  { x: 27, y: 19, size: 2, delay: 2.7 },
  { x: 4, y: 32, size: 1, delay: 0.4 },
  { x: 21, y: 33, size: 2.5, delay: 3.5 },
  { x: 14, y: 20, size: 1.5, delay: 1.4 },
];

const RIGHT_BOTTOM_DUST = [
  { x: 76, y: 72, size: 2, color: 'blue', delay: 0.3 },
  { x: 84, y: 70, size: 1.5, color: 'gold', delay: 1.2 },
  { x: 92, y: 74, size: 2.5, color: 'blue', delay: 2.1 },
  { x: 74, y: 82, size: 1, color: 'blue', delay: 0.8 },
  { x: 81, y: 88, size: 2, color: 'blue', delay: 3.0 },
  { x: 89, y: 81, size: 2, color: 'gold', delay: 1.7 },
  { x: 95, y: 86, size: 1.5, color: 'blue', delay: 2.5 },
  { x: 79, y: 95, size: 2.5, color: 'blue', delay: 0.5 },
  { x: 87, y: 92, size: 2, color: 'gold', delay: 3.3 },
  { x: 94, y: 95, size: 1, color: 'blue', delay: 1.9 },
  { x: 75, y: 89, size: 1.5, color: 'blue', delay: 2.8 },
  { x: 83, y: 79, size: 2, color: 'blue', delay: 0.9 },
];

// Lifetime of brush stroke points in milliseconds (mudah diubah)
const BRUSH_LIFETIME_MS = 1000;

export default function Login() {
  const navigate = useNavigate();
  const { login: setAuthContextSession } = useAuth();

  // Form State
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [isSubmittingForgot, setIsSubmittingForgot] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');

  // Card Active (Interactive Scale on Click & Interaction) State & Ref
  const [isCardActive, setIsCardActive] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);
  const cardRef = useRef(null);

  // Background Paint Brush Canvas Refs
  const canvasRef = useRef(null);
  const strokesRef = useRef([]); // array of { id, points: [{ x, y, time, rawWidth }], isFinished: boolean }
  const clickDotsRef = useRef([]); // array of { x, y, time }
  const isDrawingRef = useRef(false);
  const currentStrokeIdRef = useRef(0);
  const strokeCounterRef = useRef(0);
  const pointerDownPosRef = useRef({ x: 0, y: 0, time: 0, moved: false });
  const isBrushLoopRunningRef = useRef(false);
  const brushFrameIdRef = useRef(null);

  // Refs for Nodes, Edges, and Rings
  const nodesRef = useRef(INITIAL_NODES.map(n => ({ ...n })));
  const nodeElementsRef = useRef([]);

  // Base solid lines + soft glow lines + flowing flash lines
  const edgeBaseElementsRef = useRef([]);
  const edgeGlowElementsRef = useRef([]);
  const edgeFlowElementsRef = useRef([]);
  const edgeStatesRef = useRef(INITIAL_EDGES.map((edge) => ({
    speed: 0,
    opacity: 0,
    glowOpacity: 0,
    baseOpacity: edge.isMainPath ? 0.30 : 0.15,
    dashOffset: 0,
  })));

  const ringsRef = useRef(SIGNAL_RINGS.map(r => ({ ...r })));
  const ringElementsRef = useRef([]);
  const ringStatesRef = useRef(SIGNAL_RINGS.map(() => ({ currentX: 0, currentY: 0 })));

  // Tracking interactive elements for single cursor follower
  const iconBadgeStatesRef = useRef({
    chat: { currentX: 0, currentY: 0 },
    phone: { currentX: 0, currentY: 0 },
  });

  const mouseRef = useRef({
    rawX: -9999,
    rawY: -9999,
    hasMoved: false,
  });

  // ============================================================================
  // UNIFIED ANIMATION & PHYSICS LOOP (requestAnimationFrame)
  // ============================================================================
  useEffect(() => {
    let animationFrameId;
    let lastTime = performance.now();

    const handleMouseMove = (e) => {
      mouseRef.current.rawX = e.clientX;
      mouseRef.current.rawY = e.clientY;
      mouseRef.current.hasMoved = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.rawX = -9999;
      mouseRef.current.rawY = -9999;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true });

    const animate = (timestamp) => {
      // Respect prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      const dt = Math.min((timestamp - lastTime) * 0.001, 0.1);
      lastTime = timestamp;

      const isCoarse = window.matchMedia('(pointer: coarse)').matches;
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const mouse = mouseRef.current;
      const t = timestamp * 0.001;

      // ----------------------------------------------------------------------
      // 1. UPDATE NETWORK NODES (Positions & DOM transforms)
      // ----------------------------------------------------------------------
      // Check single hovered icon badge
      let hoveredIconType = null;
      let minIconDist = Infinity;

      if (!isCoarse && mouse.hasMoved && mouse.rawX > -1000) {
        ['chat', 'phone'].forEach((type) => {
          const nodeIdx = type === 'chat' ? 1 : 13; // a2 is index 1, b4 is index 13
          const node = nodesRef.current[nodeIdx];
          if (!node) return;
          const cx = (node.x / 100) * winW;
          const cy = (node.y / 100) * winH;
          const dist = Math.hypot(mouse.rawX - cx, mouse.rawY - cy);
          if (dist <= 24 && dist < minIconDist) {
            minIconDist = dist;
            hoveredIconType = type;
          }
        });
      }

      // Animate Nodes
      nodesRef.current.forEach((node, idx) => {
        const el = nodeElementsRef.current[idx];
        if (!el || el.dataset.popping === 'true') return;

        if (node.isIcon) {
          // Icon glyph cursor following (strictly clamped to 65px)
          const state = iconBadgeStatesRef.current[node.iconType];
          let targetX = 0;
          let targetY = 0;

          if (hoveredIconType === node.iconType) {
            const cx = (node.x / 100) * winW;
            const cy = (node.y / 100) * winH;
            const dx = mouse.rawX - cx;
            const dy = mouse.rawY - cy;
            const dist = Math.hypot(dx, dy);
            const pull = Math.min(65, dist * 0.7);
            if (dist > 0.1) {
              targetX = (dx / dist) * pull;
              targetY = (dy / dist) * pull;
            }
          }

          state.currentX += (targetX - state.currentX) * 0.08;
          state.currentY += (targetY - state.currentY) * 0.08;

          const idleX = Math.sin(t * 0.9 + idx) * 3;
          const idleY = Math.cos(t * 0.9 + idx) * 4;

          el.style.transform = `translate3d(${(state.currentX + idleX).toFixed(1)}px, ${(state.currentY + idleY).toFixed(1)}px, 0)`;
        } else {
          // Small nodes subtle breathing drift
          const idleX = Math.sin(t * 1.2 + idx) * 2;
          const idleY = Math.cos(t * 1.2 + idx) * 2.5;
          el.style.transform = `translate3d(${idleX.toFixed(1)}px, ${idleY.toFixed(1)}px, 0)`;
        }
      });

      // ----------------------------------------------------------------------
      // 2. NETWORK LINES: Accurate Point-to-Segment Distance & Soft Glowing Flashes
      // - Solid base line (opasitas ~30% untuk jalur utama, ~15% untuk garis lain)
      // - Lapisan glow (6px blur) + lapisan tajam (#BFDBFE) saat kursor < 200px
      // - Storytelling Pulse: Tiap ~9s, pulsa berjalan dari A5 sepanjang jalur utama ke B1 (4s)
      // ----------------------------------------------------------------------
      const cycleTime = 9.0;
      const storyDur = 4.0;
      const cycleT = t % cycleTime;
      const isStoryActive = !isCoarse && cycleT < storyDur;
      const storyProgress = isStoryActive ? (cycleT / storyDur) : -1; // 0..1

      INITIAL_EDGES.forEach((edge, idx) => {
        const baseEl = edgeBaseElementsRef.current[idx];
        const glowEl = edgeGlowElementsRef.current[idx];
        const flowEl = edgeFlowElementsRef.current[idx];
        if (!baseEl || !glowEl || !flowEl) return;

        const nodeA = nodesRef.current[edge.from];
        const nodeB = nodesRef.current[edge.to];

        const ax = (nodeA.x / 100) * winW;
        const ay = (nodeA.y / 100) * winH;
        const bx = (nodeB.x / 100) * winW;
        const by = (nodeB.y / 100) * winH;

        // Update path line endpoints
        baseEl.setAttribute('x1', ax.toFixed(1));
        baseEl.setAttribute('y1', ay.toFixed(1));
        baseEl.setAttribute('x2', bx.toFixed(1));
        baseEl.setAttribute('y2', by.toFixed(1));

        glowEl.setAttribute('x1', ax.toFixed(1));
        glowEl.setAttribute('y1', ay.toFixed(1));
        glowEl.setAttribute('x2', bx.toFixed(1));
        glowEl.setAttribute('y2', by.toFixed(1));

        flowEl.setAttribute('x1', ax.toFixed(1));
        flowEl.setAttribute('y1', ay.toFixed(1));
        flowEl.setAttribute('x2', bx.toFixed(1));
        flowEl.setAttribute('y2', by.toFixed(1));

        // Line length and 15% pulse dash configuration
        const lineLen = Math.hypot(bx - ax, by - ay);
        const dashLen = Math.max(12, lineLen * 0.15);
        const gapLen = Math.max(10, lineLen * 0.85);
        const dashPattern = `${dashLen.toFixed(1)} ${gapLen.toFixed(1)}`;
        flowEl.setAttribute('stroke-dasharray', dashPattern);
        glowEl.setAttribute('stroke-dasharray', dashPattern);

        // Point-to-segment distance calculation from cursor
        let dist = 99999;
        if (!isCoarse && mouse.hasMoved && mouse.rawX > -1000) {
          const vx = bx - ax;
          const vy = by - ay;
          const lenSq = vx * vx + vy * vy;
          if (lenSq > 0) {
            let u = ((mouse.rawX - ax) * vx + (mouse.rawY - ay) * vy) / lenSq;
            u = Math.max(0, Math.min(1, u));
            const projX = ax + u * vx;
            const projY = ay + u * vy;
            dist = Math.hypot(mouse.rawX - projX, mouse.rawY - projY);
          }
        }

        const state = edgeStatesRef.current[idx];
        const isNear = dist < 200;

        // Check storytelling pulse along main path (indices 7 to 12)
        let storyBoost = 0;
        let isStorySegment = false;
        let storySegmentOffset = 0;

        if (edge.isMainPath && isStoryActive && storyProgress >= 0) {
          const mainSegIdx = idx - 7; // 7..12 maps to 0..5
          const segStart = mainSegIdx / 6;
          const segEnd = (mainSegIdx + 1) / 6;
          if (storyProgress >= segStart && storyProgress <= segEnd) {
            isStorySegment = true;
            const u = (storyProgress - segStart) * 6;
            storySegmentOffset = -(u * (lineLen + dashLen));
            storyBoost = Math.sin(u * Math.PI) * 0.85;
          }
        }

        const baseIdle = edge.isMainPath ? (isStoryActive ? 0.45 : 0.30) : 0.15;
        const targetBaseOpacity = isNear ? (edge.isMainPath ? 0.55 : 0.32) : baseIdle;

        const targetSpeed = isNear ? 2.5 : 0;
        const targetFlowOpacity = isNear ? 0.85 : (isStorySegment ? storyBoost : 0);
        const targetGlowOpacity = isNear ? 0.35 : (isStorySegment ? storyBoost * 0.35 : 0);

        state.speed += (targetSpeed - state.speed) * 0.05;
        state.opacity += (targetFlowOpacity - state.opacity) * 0.08;
        state.glowOpacity += (targetGlowOpacity - state.glowOpacity) * 0.08;
        state.baseOpacity += (targetBaseOpacity - state.baseOpacity) * 0.05;

        // Flow dashes along line when speed > 0 or story segment active
        if (isStorySegment) {
          state.dashOffset = storySegmentOffset;
        } else if (state.speed > 0.01) {
          state.dashOffset -= state.speed * dt * 42;
        }

        baseEl.setAttribute('stroke-opacity', state.baseOpacity.toFixed(2));
        glowEl.setAttribute('stroke-opacity', state.glowOpacity.toFixed(2));
        glowEl.setAttribute('stroke-dashoffset', state.dashOffset.toFixed(1));
        flowEl.setAttribute('stroke-opacity', state.opacity.toFixed(2));
        flowEl.setAttribute('stroke-dashoffset', state.dashOffset.toFixed(1));
      });

      // ----------------------------------------------------------------------
      // 3. CONCENTRIC SIGNAL RINGS: 3 Unaligned Sizes (C1 ~75vh, C2 ~34vh, C3 ~20vh)
      // Only ONE Closest Ring Group within (radius * 1.25) of CURRENT center follows cursor
      // ----------------------------------------------------------------------
      let closestRingIdx = -1;
      let minRingDist = Infinity;

      if (!isCoarse && mouse.hasMoved && mouse.rawX > -1000) {
        ringsRef.current.forEach((r, idx) => {
          const originX = (r.x / 100) * winW;
          const originY = (r.y / 100) * winH;
          const state = ringStatesRef.current[idx];
          const currentCx = originX + state.currentX;
          const currentCy = originY + state.currentY;
          const distToCurrent = Math.hypot(mouse.rawX - currentCx, mouse.rawY - currentCy);
          const rPx = (r.radiusVh / 100) * winH;
          const radiusThreshold = rPx * 1.25;

          if (distToCurrent <= radiusThreshold && distToCurrent < minRingDist) {
            minRingDist = distToCurrent;
            closestRingIdx = idx;
          }
        });
      }

      ringsRef.current.forEach((r, idx) => {
        const el = ringElementsRef.current[idx];
        if (!el) return;
        const state = ringStatesRef.current[idx];

        let targetX = 0;
        let targetY = 0;

        if (idx === closestRingIdx) {
          const originX = (r.x / 100) * winW;
          const originY = (r.y / 100) * winH;
          const dx = (mouse.rawX - originX) * 0.30;
          const dy = (mouse.rawY - originY) * 0.30;
          const dist = Math.hypot(dx, dy);
          if (dist > 70) {
            targetX = (dx / dist) * 70;
            targetY = (dy / dist) * 70;
          } else {
            targetX = dx;
            targetY = dy;
          }
        }

        // Lerp 0.10 each frame
        state.currentX += (targetX - state.currentX) * 0.10;
        state.currentY += (targetY - state.currentY) * 0.10;

        const idleX = Math.sin(t * r.floatSpeed + r.phase) * r.ampX;
        const idleY = Math.cos(t * r.floatSpeed + r.phase) * r.ampY;

        el.style.transform = `translate3d(${(state.currentX + idleX).toFixed(1)}px, ${(state.currentY + idleY).toFixed(1)}px, 0)`;
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  // ----------------------------------------------------------------------------
  // ACCESSIBILITY: prefers-reduced-motion listener
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(media.matches);
    const handler = (e) => setIsReducedMotion(e.matches);
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, []);

  // ----------------------------------------------------------------------------
  // CARD INTERACTIVE SCALE (Click / Focus-within detection)
  // - Enlarge to scale(1.025) on click or keyboard focus anywhere in card
  // - Stays enlarged while filling form / interacting
  // - Returns to scale(1) when clicking outside or focus leaves card
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const handleDocumentPointerDown = (e) => {
      if (cardRef.current && cardRef.current.contains(e.target)) {
        setIsCardActive(true);
      } else {
        setTimeout(() => {
          if (!cardRef.current?.contains(document.activeElement)) {
            setIsCardActive(false);
          }
        }, 40);
      }
    };

    document.addEventListener('pointerdown', handleDocumentPointerDown);
    return () => {
      document.removeEventListener('pointerdown', handleDocumentPointerDown);
    };
  }, []);

  // ----------------------------------------------------------------------------
  // BACKGROUND PAINT BRUSH CANVAS (Soft Luminous Brush, Velocity Width, Fade in 1s)
  // - Cursor moving alone does NOT draw anything
  // - Draws ONLY on pointer drag started on empty background (ignored on card & clickable icons)
  // - Single click without drag: creates a 5px glowing dot that fades in ~0.6s
  // - Line width varies with speed: slower -> thicker (up to 9px), faster -> thinner (down to 3px)
  // - Tapered ends (smoothed over ~8 points at start and end)
  // - Midpoint quadratic bezier curves, dual-layer glow + core line (#DBEAFE to #60A5FA)
  // - Fades out via ease-out in ~1.0s (BRUSH_LIFETIME_MS) from oldest to newest point
  // - rAF loop runs only when points exist, stops completely when idle
  // ----------------------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resizeCanvas = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const renderBrush = () => {
      const now = performance.now();

      // 1. Filter out stroke points older than BRUSH_LIFETIME_MS
      strokesRef.current = strokesRef.current
        .map((stroke) => {
          const alivePoints = stroke.points.filter(
            (pt) => now - pt.time <= BRUSH_LIFETIME_MS
          );
          return {
            ...stroke,
            points: alivePoints,
          };
        })
        .filter((stroke) => stroke.points.length > 0);

      // Filter out click dots older than 600ms
      clickDotsRef.current = clickDotsRef.current.filter(
        (dot) => now - dot.time <= 600
      );

      // Stop loop completely if no strokes and no click dots remain
      if (strokesRef.current.length === 0 && clickDotsRef.current.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        isBrushLoopRunningRef.current = false;
        brushFrameIdRef.current = null;
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 2. Render each brush stroke
      strokesRef.current.forEach((stroke) => {
        const pts = stroke.points;
        const n = pts.length;
        if (n < 2) return;

        // Calculate midpoints between consecutive points
        const midpoints = [];
        for (let i = 0; i < n - 1; i++) {
          midpoints.push({
            x: (pts[i].x + pts[i + 1].x) * 0.5 * dpr,
            y: (pts[i].y + pts[i + 1].y) * 0.5 * dpr,
          });
        }

        // Precompute taper, fading, and color per point
        const segProps = [];
        for (let i = 0; i < n; i++) {
          const pt = pts[i];
          // Tapering: first 8 points scale up, last 8 points scale down if finished
          const startTaper = Math.min(1, (i + 1) / 8);
          const endTaper = stroke.isFinished ? Math.min(1, (n - i) / 8) : 1;
          const taper = startTaper * endTaper;

          // Ease-out fading based on point age
          const age = Math.min(Math.max((now - pt.time) / BRUSH_LIFETIME_MS, 0), 1);
          const progress = 1 - age; // 1 = brand new, 0 = expired
          const fadeEase = progress * (2 - progress); // ease-out

          const width = pt.rawWidth * taper * fadeEase * dpr;
          const opacity = 0.70 * fadeEase;

          // Color interpolation: #60A5FA (tail / older) to #DBEAFE (head / newer)
          const colorRatio = n > 1 ? i / (n - 1) : 1;
          const r = Math.round(96 + (219 - 96) * colorRatio);
          const g = Math.round(165 + (234 - 165) * colorRatio);
          const b = Math.round(250 + (254 - 250) * colorRatio);

          segProps.push({ width, opacity, r, g, b });
        }

        // LAYER 1: Wide Soft Glow (shadowBlur ~14 * dpr, low-opacity light blue)
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 14 * dpr;
        ctx.shadowColor = 'rgba(96, 165, 250, 0.40)';

        for (let i = 1; i < n; i++) {
          const p = segProps[i];
          if (p.opacity <= 0.005 || p.width <= 0.1) continue;

          const startX = i === 1 ? pts[0].x * dpr : midpoints[i - 2].x;
          const startY = i === 1 ? pts[0].y * dpr : midpoints[i - 2].y;
          const endX = i === n - 1 ? pts[n - 1].x * dpr : midpoints[i - 1].x;
          const endY = i === n - 1 ? pts[n - 1].y * dpr : midpoints[i - 1].y;
          const ctrlX = pts[i].x * dpr;
          const ctrlY = pts[i].y * dpr;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
          ctx.lineWidth = p.width + 4.5 * dpr;
          ctx.strokeStyle = `rgba(96, 165, 250, ${(p.opacity * 0.35).toFixed(3)})`;
          ctx.stroke();
        }
        ctx.restore();

        // LAYER 2: Luminous Core Line (#DBEAFE at newer parts to #60A5FA at older parts)
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 0;

        for (let i = 1; i < n; i++) {
          const p = segProps[i];
          if (p.opacity <= 0.005 || p.width <= 0.1) continue;

          const startX = i === 1 ? pts[0].x * dpr : midpoints[i - 2].x;
          const startY = i === 1 ? pts[0].y * dpr : midpoints[i - 2].y;
          const endX = i === n - 1 ? pts[n - 1].x * dpr : midpoints[i - 1].x;
          const endY = i === n - 1 ? pts[n - 1].y * dpr : midpoints[i - 1].y;
          const ctrlX = pts[i].x * dpr;
          const ctrlY = pts[i].y * dpr;

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
          ctx.lineWidth = Math.max(0.6, p.width);
          ctx.strokeStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${p.opacity.toFixed(3)})`;
          ctx.stroke();
        }
        ctx.restore();
      });

      // 3. Render Single Click Glowing Dots (radius ~5px, glow, fades in ~0.6s)
      clickDotsRef.current.forEach((dot) => {
        const age = (now - dot.time) / 600;
        const progress = Math.max(0, Math.min(1, 1 - age));
        const fadeEase = progress * (2 - progress);
        const radius = 5 * fadeEase * dpr;
        const opacity = 0.85 * fadeEase;

        if (radius <= 0.2 || opacity <= 0.01) return;

        // Glow Layer
        ctx.save();
        ctx.shadowBlur = 14 * dpr;
        ctx.shadowColor = 'rgba(96, 165, 250, 0.65)';
        ctx.fillStyle = `rgba(219, 234, 254, ${opacity.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(dot.x * dpr, dot.y * dpr, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Core Center Dot
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${(opacity * 0.95).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(dot.x * dpr, dot.y * dpr, Math.max(0.5, radius * 0.52), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      brushFrameIdRef.current = requestAnimationFrame(renderBrush);
    };

    const startBrushLoop = () => {
      if (!isBrushLoopRunningRef.current) {
        isBrushLoopRunningRef.current = true;
        brushFrameIdRef.current = requestAnimationFrame(renderBrush);
      }
    };

    const handlePointerDown = (e) => {
      // Mouse and pen only; touchscreen devices do not draw
      if (e.pointerType === 'touch') return;
      if (window.innerWidth < 768) return;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      // Ignore if clicking inside card or clickable elements (buttons, inputs, links, icon glyphs)
      const isInsideCard = cardRef.current && cardRef.current.contains(e.target);
      const isClickable = e.target.closest(
        'button, [role="button"], input, label, a, textarea, select, .badge-glyph'
      );
      if (isInsideCard || isClickable) return;

      // Prevent text selection on background drag
      e.preventDefault();
      document.body.style.userSelect = 'none';

      isDrawingRef.current = true;
      const strokeId = ++strokeCounterRef.current;
      currentStrokeIdRef.current = strokeId;

      pointerDownPosRef.current = {
        x: e.clientX,
        y: e.clientY,
        time: performance.now(),
        moved: false,
      };

      strokesRef.current.push({
        id: strokeId,
        points: [
          {
            x: e.clientX,
            y: e.clientY,
            time: performance.now(),
            rawWidth: 7, // Initial medium brush width
          },
        ],
        isFinished: false,
      });

      startBrushLoop();
    };

    const handlePointerMove = (e) => {
      // ONLY draw when pointer is actively held down
      if (!isDrawingRef.current) return;
      if (e.pointerType === 'touch') return;

      const currentStroke = strokesRef.current.find(
        (s) => s.id === currentStrokeIdRef.current && !s.isFinished
      );
      if (!currentStroke) return;

      const x = e.clientX;
      const y = e.clientY;
      const now = performance.now();
      const lastPt = currentStroke.points[currentStroke.points.length - 1];

      const dist = Math.hypot(x - lastPt.x, y - lastPt.y);
      if (dist < 4) return; // Add point only if moved >= 4px

      pointerDownPosRef.current.moved = true;

      // Speed-dependent width: slower -> up to ~9px, faster -> down to ~3px
      const dt = Math.max(1, now - lastPt.time);
      const speed = dist / dt; // px per ms
      const targetWidth = Math.max(3, Math.min(9, 9 - speed * 3.5));
      // Smoothed width to avoid jitter
      const smoothedWidth = lastPt.rawWidth * 0.65 + targetWidth * 0.35;

      currentStroke.points.push({
        x,
        y,
        time: now,
        rawWidth: smoothedWidth,
      });

      startBrushLoop();
    };

    const endStroke = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      document.body.style.userSelect = '';

      const now = performance.now();
      if (!pointerDownPosRef.current.moved) {
        // Single click without drag: spawn a small 5px glowing dot fading in ~0.6s
        clickDotsRef.current.push({
          x: pointerDownPosRef.current.x,
          y: pointerDownPosRef.current.y,
          time: now,
        });
        // Remove the 1-point stroke that wasn't dragged
        strokesRef.current = strokesRef.current.filter(
          (s) => s.id !== currentStrokeIdRef.current
        );
        startBrushLoop();
      } else {
        // Mark stroke finished so ending points taper down
        const currentStroke = strokesRef.current.find(
          (s) => s.id === currentStrokeIdRef.current
        );
        if (currentStroke) {
          currentStroke.isFinished = true;
        }
      }
    };

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', endStroke);
    window.addEventListener('pointercancel', endStroke);
    window.addEventListener('blur', endStroke);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endStroke);
      window.removeEventListener('pointercancel', endStroke);
      window.removeEventListener('blur', endStroke);
      if (brushFrameIdRef.current) {
        cancelAnimationFrame(brushFrameIdRef.current);
      }
      isBrushLoopRunningRef.current = false;
      document.body.style.userSelect = '';
    };
  }, []);

  // ============================================================================
  // CLICK-TO-EXPLODE HANDLER FOR ICON GLYPHS (Phone & Chat)
  // Sequence:
  // a) swell in ~80ms (scale 1.3)
  // b) explode! thin blue ring expands and fades (320ms)
  // c) 8 sparks scatter outward and fade (350ms)
  // d) 1.2s delay, respawns in new random spot in its cluster zone:
  //    Chat: x: 5-24%, y: 60-88% | Phone: x: 70-96%, y: 14-60%
  // ============================================================================
  const triggerBadgeExplosion = (index) => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const el = nodeElementsRef.current[index];
    const node = nodesRef.current[index];
    if (!el || !node.isIcon || el.dataset.popping === 'true') return;
    el.dataset.popping = 'true';

    const glyphEl = el.querySelector('.badge-glyph');
    const ringEl = el.querySelector('.badge-shockwave-ring');
    const sparks = el.querySelectorAll('.badge-spark-particle');

    // 1. Swell up slightly in 80ms
    if (glyphEl) {
      glyphEl.style.transition = 'transform 80ms cubic-bezier(0.2, 0.8, 0.2, 1)';
      glyphEl.style.transform = `${node.iconType === 'chat' ? 'rotate(-8deg)' : 'rotate(14deg)'} scale(1.35)`;
    }

    setTimeout(() => {
      // 2. Hide glyph abruptly
      if (glyphEl) {
        glyphEl.style.transition = 'transform 100ms ease, opacity 80ms ease';
        glyphEl.style.transform = `${node.iconType === 'chat' ? 'rotate(-8deg)' : 'rotate(14deg)'} scale(0)`;
        glyphEl.style.opacity = '0';
      }

      // 3. Expanding shockwave ring (320ms)
      if (ringEl) {
        ringEl.style.transition = 'transform 320ms cubic-bezier(0.1, 0.8, 0.3, 1), opacity 280ms ease';
        ringEl.style.transform = 'scale(3.2)';
        ringEl.style.opacity = '0';
      }

      // 4. Scatter 8 sparks (350ms)
      sparks.forEach((p) => {
        const angle = parseFloat(p.dataset.angle || 0);
        const burstDist = 32 + Math.random() * 24;
        const tx = Math.cos(angle) * burstDist;
        const ty = Math.sin(angle) * burstDist;
        p.style.transition = 'transform 340ms cubic-bezier(0.1, 0.8, 0.3, 1), opacity 300ms ease';
        p.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) scale(0.2)`;
        p.style.opacity = '0';
      });

      // 5. Respawn after 1.2s delay outside card in cluster zone
      setTimeout(() => {
        const isChat = node.iconType === 'chat';
        // Chat zone: x 5..24, y 60..88; Phone zone: x 70..96, y 14..60
        const newX = isChat ? 5 + Math.random() * 19 : 70 + Math.random() * 26;
        const newY = isChat ? 60 + Math.random() * 28 : 14 + Math.random() * 46;

        node.x = newX;
        node.y = newY;
        el.style.left = `${newX.toFixed(1)}%`;
        el.style.top = `${newY.toFixed(1)}%`;

        // Reset ring and sparks
        if (ringEl) {
          ringEl.style.transition = 'none';
          ringEl.style.transform = 'scale(0.3)';
          ringEl.style.opacity = '0.9';
        }
        sparks.forEach((p) => {
          p.style.transition = 'none';
          p.style.transform = 'translate3d(0, 0, 0) scale(1)';
          p.style.opacity = '0.9';
        });

        // Smooth grow back (slow zoom in)
        if (glyphEl) {
          glyphEl.style.transition = 'transform 480ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 380ms ease';
          glyphEl.style.transform = `${isChat ? 'rotate(-8deg)' : 'rotate(14deg)'} scale(1)`;
          glyphEl.style.opacity = '1';
        }

        setTimeout(() => {
          if (glyphEl) glyphEl.style.transition = '';
          el.dataset.popping = 'false';
        }, 500);
      }, 1200);
    }, 80);
  };

  // ============================================================================
  // LOGIN SUBMIT HANDLER (Preserved 100% untouched)
  // ============================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setError('');

    if (!identifier.trim()) {
      setError('Nomor HP atau email tidak boleh kosong.');
      return;
    }

    if (!password) {
      setError('Kata sandi tidak boleh kosong.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal harus terdiri dari 6 karakter.');
      return;
    }

    setIsLoading(true);

    try {
      let responseData;
      try {
        responseData = await loginApi(identifier, password);
      } catch (apiErr) {
        if (apiErr.status === 401 || apiErr.status === 400) {
          throw apiErr;
        }

        const idLower = identifier.trim().toLowerCase();
        if (import.meta.env.DEV) {
          if (idLower.includes('kantin') || idLower.includes('kasir')) {
            responseData = {
              token: 'mock-jwt-token-kantin-' + Date.now(),
              user: {
                id: 'u-kantin-demo',
                name: 'Siti Aminah',
                email: idLower.includes('@') ? idLower : 'kantin@sadewa.id',
                role: 'operator_kantin',
                branchId: 'b1',
                branchName: 'Lapas Cipinang',
                branch: { id: 'b1', name: 'Lapas Kelas I Cipinang' },
              },
            };
          } else if (idLower.includes('superadmin') || idLower.includes('super')) {
            responseData = {
              token: 'mock-jwt-token-superadmin-' + Date.now(),
              user: {
                id: '9bad760c-2ae8-4879-a1e7-fdb4cb50c9fc',
                name: 'Super Administrator',
                email: idLower.includes('@') ? idLower : 'superadmin@sadewa.id',
                role: 'superadmin',
              },
            };
          } else if (idLower.includes('spv') || idLower.includes('supervisor')) {
            responseData = {
              token: 'mock-jwt-token-spv-' + Date.now(),
              user: {
                id: 'u-spv-demo',
                name: 'Budi Santoso',
                email: idLower.includes('@') ? idLower : 'supervisor.lapas@sadewa.id',
                role: 'supervisor',
                branchId: 'b1',
                branchName: 'Lapas Cipinang',
                branch: { id: 'b1', name: 'Lapas Kelas I Cipinang' },
              },
            };
          } else if (idLower.includes('kepala') || idLower.includes('upt')) {
            responseData = {
              token: 'mock-jwt-token-upt-' + Date.now(),
              user: {
                id: 'u-upt-demo',
                name: 'Hendra (Kepala UPT)',
                email: idLower.includes('@') ? idLower : 'kepala.bandung@sadewa.id',
                role: 'kepala_upt',
                branchId: 'b1',
                branchName: 'Lapas Cipinang',
                branch: { id: 'b1', name: 'Lapas Kelas I Cipinang' },
              },
            };
          } else if (idLower.includes('kanwil')) {
            responseData = {
              token: 'mock-jwt-token-kanwil-' + Date.now(),
              user: {
                id: 'u-kanwil-demo',
                name: 'Admin Kanwil',
                email: idLower.includes('@') ? idLower : 'admin.jateng@sadewa.id',
                role: 'admin_kanwil',
              },
            };
          } else if (idLower.includes('finance') || idLower.includes('keuangan')) {
            responseData = {
              token: 'mock-jwt-token-finance-' + Date.now(),
              user: {
                id: 'u-finance-demo',
                name: 'Dewi Lestari (Finance)',
                email: idLower.includes('@') ? idLower : 'finance@sadewa.id',
                role: 'finance',
              },
            };
          } else {
            throw apiErr;
          }
        } else {
          throw apiErr;
        }
      }

      const token = responseData?.token ||
        responseData?.data?.token ||
        responseData?.accessToken ||
        responseData?.data?.accessToken;

      if (!token) {
        clearAuthSession();
        setError('Respons server tidak valid (token tidak ditemukan).');
        return;
      }

      const user = responseData?.user ||
        responseData?.data?.user ||
        responseData?.data ||
        {};

      let role = user?.role ||
        responseData?.role ||
        responseData?.data?.role;

      if (!role && typeof token === 'string' && token.split('.').length === 3) {
        try {
          const payloadBase64 = token.split('.')[1];
          const decoded = JSON.parse(atob(payloadBase64));
          role = decoded.role || decoded.userRole;
          if (!user.role && role) {
            user.role = role;
          }
        } catch (e) {
          console.warn('Could not decode JWT payload:', e);
        }
      }

      const normalizedRole = (role || '').toString().trim().toLowerCase();

      if (normalizedRole === 'superadmin' && user.branchId && !user.branchName && !user.branch?.name) {
        try {
          const { getBranchById } = await import('../services/branchService');
          const branchObj = await getBranchById(user.branchId);
          if (branchObj && branchObj.name) {
            user.branchName = branchObj.name;
            user.branch = branchObj;
          }
        } catch (e) {
          console.log('[Login] Could not resolve branch details for superadmin:', e);
        }
      }

      if (normalizedRole === 'superadmin') {
        setAuthContextSession(token, { ...user, role: 'superadmin' });
        navigate('/dashboard');
      } else if (normalizedRole === 'kepala_upt' || normalizedRole === 'branch_admin' || normalizedRole === 'branch-admin' || normalizedRole === 'admin') {
        setAuthContextSession(token, { ...user, role: 'kepala_upt' });
        navigate('/branch/dashboard');
      } else if (normalizedRole === 'supervisor') {
        setAuthContextSession(token, { ...user, role: 'supervisor' });
        navigate('/branch/dashboard');
      } else if (normalizedRole === 'operator_kantin' || normalizedRole === 'canteen_staff' || normalizedRole === 'kantin') {
        setAuthContextSession(token, { ...user, role: 'operator_kantin' });
        navigate('/kantin');
      } else if (normalizedRole === 'admin_kanwil' || normalizedRole === 'kanwil_admin' || normalizedRole === 'kanwil') {
        setAuthContextSession(token, { ...user, role: 'admin_kanwil' });
        navigate('/kanwil/dashboard');
      } else if (normalizedRole === 'finance' || normalizedRole === 'admin_finance' || normalizedRole === 'keuangan') {
        setAuthContextSession(token, { ...user, role: 'finance' });
        navigate('/finance/dashboard');
      } else {
        clearAuthSession();
        setError('Akun ini tidak memiliki hak akses ke dashboard ini.');
      }
    } catch (err) {
      clearAuthSession();
      console.error('Login error:', err);
      if (err.status === 401 || err.status === 400) {
        setError('Email atau password salah');
      } else if (err.status === 0 || err.isNetworkError) {
        setError('Server tidak dapat dihubungi, coba lagi nanti');
      } else {
        const errorMsg = err.data?.message || err.data?.error || err.message;
        setError(errorMsg || 'Email atau password salah');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 text-white select-none overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at 50% 15%, #1e3a8a 0%, #0c215e 40%, #061138 75%, #030822 100%)',
        fontFamily: "'Inter', 'Montserrat', -apple-system, sans-serif"
      }}
    >
      {/* Global CSS style override for browser autofill & animations */}
      <style>{`
        .pill-field-input:-webkit-autofill,
        .pill-field-input:-webkit-autofill:hover, 
        .pill-field-input:-webkit-autofill:focus, 
        .pill-field-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px rgb(26, 56, 140) inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff !important;
          transition: background-color 9999s ease-in-out 0s !important;
          border-radius: 9999px !important;
        }

        @keyframes signalRipple {
          0% {
            width: 0px;
            height: 0px;
            opacity: 0.85;
          }
          100% {
            width: 60px;
            height: 60px;
            opacity: 0;
          }
        }
        .signal-ripple-1 {
          animation: signalRipple 3.5s cubic-bezier(0.1, 0.4, 0.2, 1) infinite;
        }
        .signal-ripple-2 {
          animation: signalRipple 3.5s cubic-bezier(0.1, 0.4, 0.2, 1) infinite 1.75s;
        }

        @keyframes nodeBreathe {
          0%, 100% {
            opacity: var(--base-op, 1);
            transform: scale(1);
          }
          50% {
            opacity: calc(var(--base-op, 1) * 0.65);
            transform: scale(0.92);
          }
        }
        .node-breathing {
          animation: nodeBreathe var(--pulse-dur, 4s) ease-in-out infinite var(--pulse-del, 0s);
        }
      `}</style>

      {/* Vignette Layer across the entire screen */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(2, 6, 23, 0.65) 100%)',
        }}
      />

      {/* ======================================================================
          1. AMBIENT LIGHTS & BEAMS (z-0, extending to all edges)
          ====================================================================== */}
      {/* Top Center Spotlight */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[750px] h-[380px] pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.42) 0%, rgba(30, 64, 175, 0.15) 50%, transparent 75%)',
          filter: 'blur(45px)',
        }}
      />

      {/* Pojok Kiri Atas: 2 Berkas Cahaya Diagonal Lembut (-35 deg, blur 20px, rgba(96,165,250,0.18) to transparent) */}
      <div
        aria-hidden="true"
        className="absolute -top-14 -left-8 w-[185px] h-[520px] pointer-events-none z-0 origin-top-left"
        style={{
          background: 'linear-gradient(180deg, rgba(96, 165, 250, 0.18) 0%, rgba(96, 165, 250, 0.05) 50%, transparent 85%)',
          transform: 'rotate(-35deg)',
          filter: 'blur(20px)',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-8 left-14 w-[130px] h-[450px] pointer-events-none z-0 origin-top-left"
        style={{
          background: 'linear-gradient(180deg, rgba(96, 165, 250, 0.15) 0%, rgba(96, 165, 250, 0.03) 45%, transparent 80%)',
          transform: 'rotate(-35deg)',
          filter: 'blur(20px)',
        }}
      />

      {/* Pojok Kanan Bawah: Cahaya Emas Hangat Sangat Lembut (radius 35vh, pusat ~92,92, rgba(217,160,40,0.16) - emas HANYA di sini) */}
      <div
        aria-hidden="true"
        className="absolute pointer-events-none z-0 rounded-full"
        style={{
          left: '92%',
          top: '92%',
          width: '70vh',
          height: '70vh',
          marginLeft: '-35vh',
          marginTop: '-35vh',
          background: 'radial-gradient(circle, rgba(217, 160, 40, 0.16) 0%, rgba(217, 160, 40, 0.05) 45%, transparent 70%)',
          filter: 'blur(35px)',
        }}
      />

      {/* ======================================================================
          2. INTERACTIVE NETWORK LAYER (SVG Edges, Signal Rings, Light Nodes)
          ====================================================================== */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-0 overflow-hidden"
      >
        {/* SVG Network Lines (Base solid line + Soft glow line + Flash pulse line) */}
        <svg
          className="w-full h-full absolute inset-0 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="softGlowBlur" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
            </filter>
          </defs>
          {INITIAL_EDGES.map((edge, idx) => (
            <g key={idx}>
              {/* Solid base line (1px, light blue, opacity ~30% for main path, ~15% for others) */}
              <line
                ref={(el) => (edgeBaseElementsRef.current[idx] = el)}
                stroke="#93c5fd"
                strokeWidth="1"
                strokeOpacity={edge.isMainPath ? "0.30" : "0.15"}
                className="will-change-transform"
              />
              {/* Wider blurred glow line (6px, #60a5fa, opasitas ~35% when active) */}
              <line
                ref={(el) => (edgeGlowElementsRef.current[idx] = el)}
                stroke="#60a5fa"
                strokeWidth="6"
                strokeLinecap="round"
                strokeOpacity="0"
                filter="url(#softGlowBlur)"
                className="will-change-transform"
              />
              {/* Sharp flash pulse line (#BFDBFE, 1.8px, round end, ~15% line length) */}
              <line
                ref={(el) => (edgeFlowElementsRef.current[idx] = el)}
                stroke="#BFDBFE"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeOpacity="0"
                className="will-change-transform"
              />
            </g>
          ))}
        </svg>

        {/* Signal Rings (Concentric + Corner Rings) */}
        {ringsRef.current.map((r, idx) => {
          // Responsive hiding for mobile (<768px): C1, C5, C7 show; C2, C3, C4, C6 hidden
          const isMobileHidden = ['c2', 'c3', 'c4', 'c6'].includes(r.id);
          const mobileClass = isMobileHidden ? 'hidden md:flex' : 'flex';

          return (
            <div
              key={r.id}
              ref={(el) => (ringElementsRef.current[idx] = el)}
              className={`absolute rounded-full pointer-events-none items-center justify-center will-change-transform ${mobileClass}`}
              style={{
                left: `${r.x}%`,
                top: `${r.y}%`,
                width: `${r.radiusVh * 2}vh`,
                height: `${r.radiusVh * 2}vh`,
                marginLeft: `-${r.radiusVh}vh`,
                marginTop: `-${r.radiusVh}vh`,
              }}
            >
              {r.type === 'concentric' && (
                <>
                  <div className="absolute inset-0 rounded-full border border-sky-400/25 shadow-[0_0_15px_rgba(56,189,248,0.2)]" />
                  <div className="absolute inset-[24%] rounded-full border border-dashed border-blue-400/20" />
                  <div className="absolute inset-[52%] rounded-full border border-sky-300/30 shadow-[0_0_12px_rgba(147,197,253,0.3)]" />
                </>
              )}
              {r.type === 'dashed-inner' && (
                <>
                  <div className="absolute inset-0 rounded-full border border-sky-400/25 shadow-[0_0_14px_rgba(56,189,248,0.18)]" />
                  <div className="absolute inset-[28%] rounded-full border border-dashed border-sky-300/25" />
                </>
              )}
              {r.type === 'soft-gradient' && (
                <div
                  className="absolute inset-0 rounded-full border border-sky-400/20"
                  style={{
                    background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(30, 64, 175, 0.04) 55%, transparent 80%)',
                  }}
                />
              )}
              {r.type === 'outline' && (
                <div className="absolute inset-0 rounded-full border border-sky-400/25 shadow-[0_0_14px_rgba(56,189,248,0.18)]" />
              )}
              {r.type === 'small' && (
                <div className="absolute inset-0 rounded-full border border-sky-300/30 shadow-[0_0_8px_rgba(147,197,253,0.22)]" />
              )}
            </div>
          );
        })}

        {/* Pojok Kiri Atas: 10 Debu Cahaya Tambahan (1-3px, seeded) */}
        {LEFT_TOP_DUST.map((d, idx) => (
          <div
            key={`lt-dust-${idx}`}
            aria-hidden="true"
            className={`absolute rounded-full pointer-events-none select-none node-breathing ${
              idx % 2 === 1 ? 'hidden md:block' : ''
            }`}
            style={{
              left: `${d.x}%`,
              top: `${d.y}%`,
              width: `${d.size}px`,
              height: `${d.size}px`,
              marginLeft: `-${d.size / 2}px`,
              marginTop: `-${d.size / 2}px`,
              backgroundColor: '#93c5fd',
              boxShadow: '0 0 6px 1px rgba(96, 165, 250, 0.7)',
              '--base-op': '0.7',
              '--pulse-dur': '3.5s',
              '--pulse-del': `${d.delay}s`,
            }}
          />
        ))}

        {/* Pojok Kanan Bawah: 12 Debu Cahaya Tambahan (3 emas pucat, 9 biru) */}
        {RIGHT_BOTTOM_DUST.map((d, idx) => {
          const isGold = d.color === 'gold';
          return (
            <div
              key={`rb-dust-${idx}`}
              aria-hidden="true"
              className={`absolute rounded-full pointer-events-none select-none node-breathing ${
                idx % 2 === 1 ? 'hidden md:block' : ''
              }`}
              style={{
                left: `${d.x}%`,
                top: `${d.y}%`,
                width: `${d.size}px`,
                height: `${d.size}px`,
                marginLeft: `-${d.size / 2}px`,
                marginTop: `-${d.size / 2}px`,
                backgroundColor: isGold ? '#fef08a' : '#93c5fd',
                boxShadow: isGold
                  ? '0 0 7px 1px rgba(250, 204, 21, 0.65)'
                  : '0 0 6px 1px rgba(96, 165, 250, 0.7)',
                '--base-op': isGold ? '0.75' : '0.65',
                '--pulse-dur': '3.8s',
                '--pulse-del': `${d.delay}s`,
              }}
            />
          );
        })}

        {/* Light Nodes & Icon Glyphs */}
        {nodesRef.current.map((node, idx) => {
          // Responsive filtering: ~8 key nodes shown on mobile (<768px)
          const isMobileKeyNode = [0, 1, 4, 5, 7, 9, 10, 13].includes(idx);
          const mobileClass = isMobileKeyNode ? '' : 'hidden md:flex';

          if (node.isIcon) {
            // Glowing line glyph (Chat or Phone) without template border circle!
            const isChat = node.iconType === 'chat';
            return (
              <div
                key={node.id}
                ref={(el) => (nodeElementsRef.current[idx] = el)}
                onClick={() => triggerBadgeExplosion(idx)}
                onTouchStart={() => triggerBadgeExplosion(idx)}
                role="button"
                tabIndex={0}
                aria-label={isChat ? 'Ikon interaktif Chat' : 'Ikon interaktif Telepon'}
                className={`absolute flex items-center justify-center w-12 h-12 -ml-6 -mt-6 cursor-pointer pointer-events-auto will-change-transform select-none ${mobileClass}`}
                style={{
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                }}
              >
                {/* Expanding Shockwave Ring on Click */}
                <div
                  className="badge-shockwave-ring absolute inset-1 rounded-full border border-sky-300 pointer-events-none opacity-0 scale-50"
                />

                {/* 8 Scattering Sparks */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, pi) => (
                  <div
                    key={pi}
                    data-angle={(angle * Math.PI) / 180}
                    className="badge-spark-particle absolute w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9] pointer-events-none opacity-0"
                  />
                ))}

                {/* Pure Line Glyph with Soft Blue Glow */}
                <div
                  className="badge-glyph flex items-center justify-center transition-transform duration-100"
                  style={{
                    transform: isChat ? 'rotate(-8deg)' : 'rotate(14deg)',
                    color: '#BFDBFE',
                    filter: 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.85)) drop-shadow(0 0 16px rgba(59, 130, 246, 0.5))',
                  }}
                >
                  {isChat ? (
                    <MessageSquare size={26} strokeWidth={1.5} />
                  ) : (
                    <Phone size={32} strokeWidth={1.5} />
                  )}
                </div>
              </div>
            );
          }

          // Small Star Nodes & Signal Emitter B1
          const isSmall = node.size <= 3;
          const isLarge = node.size >= 6;
          const baseOp = isSmall ? 0.45 : (node.isDim ? 0.35 : 1);
          const pulseDur = `${(3.5 + (idx % 5) * 0.6).toFixed(1)}s`;
          const pulseDel = `${(idx * 0.35).toFixed(1)}s`;

          return (
            <div
              key={node.id}
              ref={(el) => (nodeElementsRef.current[idx] = el)}
              aria-hidden="true"
              className={`absolute flex items-center justify-center rounded-full pointer-events-none will-change-transform select-none node-breathing ${mobileClass}`}
              style={{
                left: `${node.x}%`,
                top: `${node.y}%`,
                width: `${node.size}px`,
                height: `${node.size}px`,
                marginLeft: `-${node.size / 2}px`,
                marginTop: `-${node.size / 2}px`,
                backgroundColor: '#93c5fd',
                borderRadius: '9999px',
                filter: isSmall ? 'blur(0.6px)' : 'none',
                boxShadow: isLarge
                  ? '0 0 14px 4px rgba(96, 165, 250, 0.9), 0 0 4px #ffffff'
                  : '0 0 9px 2px rgba(96, 165, 250, 0.75), 0 0 3px #ffffff',
                '--base-op': baseOp,
                '--pulse-dur': pulseDur,
                '--pulse-del': pulseDel,
              }}
            >
              {/* B1 Ripple Sinyal Pemancar (2 cincin riak tipis melebar 0->60px bergantian tiap 3.5s) */}
              {node.isSignalEmitter && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="signal-ripple-1 absolute rounded-full border border-sky-400/50" />
                  <div className="signal-ripple-2 absolute rounded-full border border-sky-300/40" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fullscreen 2D Canvas for Cursor Light Trail (Behind card, above background, pointer-events: none) */}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0"
      />

      {/* ======================================================================
          3. CENTRAL FROSTED GLASS LOGIN CARD & FOOTER (z-10)
          Card STAYS STILL with interactive micro-scale (scale 1.025 on click/focus):
          - Blue light reflection ellipse under card
          - Multi-layer box-shadow (intensified on active)
          - Surface sheen overlay (kilau permukaan 135deg)
          - Wrapper has no overflow-hidden so shadows are never clipped
          ====================================================================== */}
      <div className="relative z-10 w-full max-w-[420px] my-auto flex flex-col items-center">
        {/* Blue light reflection under the bottom edge of the card */}
        <div
          aria-hidden="true"
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-14 pointer-events-none -z-10"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.35) 0%, transparent 70%)',
            filter: 'blur(40px)',
          }}
        />

        <main
          ref={cardRef}
          tabIndex={-1}
          onFocus={() => setIsCardActive(true)}
          onBlur={(e) => {
            if (!cardRef.current?.contains(e.relatedTarget)) {
              setIsCardActive(false);
            }
          }}
          className="relative w-full rounded-[32px] sm:rounded-[38px] p-7 sm:p-9 flex flex-col items-center overflow-hidden focus:outline-none"
          style={{
            background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.35) 0%, rgba(14, 38, 105, 0.40) 50%, rgba(10, 26, 74, 0.48) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(191, 219, 254, 0.35)',
            transform: isCardActive && !isReducedMotion ? 'scale(1.025)' : 'scale(1)',
            transformOrigin: 'center',
            transition: 'transform 250ms cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 250ms cubic-bezier(0.2, 0.8, 0.2, 1)',
            boxShadow: isCardActive && !isReducedMotion
              ? `
                0 45px 90px -18px rgba(2, 8, 32, 0.85),
                0 25px 45px -8px rgba(2, 8, 32, 0.6),
                0 0 120px rgba(59, 130, 246, 0.38),
                inset 0 1px 0 rgba(255, 255, 255, 0.45),
                inset 0 -1px 0 rgba(0, 0, 0, 0.30),
                inset 1px 0 0 rgba(255, 255, 255, 0.15)
              `
              : `
                0 40px 80px -20px rgba(2, 8, 32, 0.75),
                0 20px 40px -10px rgba(2, 8, 32, 0.5),
                0 0 100px rgba(59, 130, 246, 0.25),
                inset 0 1px 0 rgba(255, 255, 255, 0.40),
                inset 0 -1px 0 rgba(0, 0, 0, 0.30),
                inset 1px 0 0 rgba(255, 255, 255, 0.12)
              `,
          }}
        >
          {/* Surface Sheen Overlay (kilau permukaan 135deg) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none rounded-[inherit]"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, transparent 35%)',
            }}
          />

          {/* Brand Logo (sadewa_blue.png lockup) */}
          <div className="relative mb-3 flex items-center justify-center">
            {/* Soft luminous backlight behind logo so blue letters and gold wayang pop vividly */}
            <div
              aria-hidden="true"
              className="absolute -inset-3 rounded-full pointer-events-none -z-0"
              style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.25) 0%, rgba(147, 197, 253, 0.15) 50%, transparent 80%)',
                filter: 'blur(18px)',
              }}
            />
            <h1 className="sr-only">Sadewa</h1>
            <img
              src={sadewaLogo}
              alt="Sadewa"
              className="relative z-10 w-52 sm:w-60 h-auto max-h-[76px] object-contain transition-transform duration-300 hover:scale-[1.03]"
              style={{
                filter: 'brightness(1.3) contrast(1.15) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 14px rgba(191, 219, 254, 0.45))',
              }}
            />
          </div>

          {/* Subtitle */}
          <p className="text-xs sm:text-[13px] text-[#bfdbfe] font-medium mb-6 text-center leading-relaxed">
            Welcome Back! Please login to continue.
          </p>

          {/* Error Alert Message */}
          {error && (
            <div
              className="w-full mb-4 p-3 rounded-2xl text-xs font-semibold text-rose-200 flex items-center gap-2.5 bg-rose-950/60 border border-rose-500/40 backdrop-blur-xs shadow-sm animate-in fade-in"
            >
              <AlertCircle size={16} className="shrink-0 text-rose-400" />
              <span className="text-[12px]">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-4">
            {/* Input 1: Nomor HP atau Email (Pill-shaped, protected background & autofill) */}
            <div className="space-y-1.5">
              <label className="block text-[11.5px] font-bold text-[#dbeafe] ml-3">
                Nomor HP atau Email
              </label>
              <div
                className="relative flex items-center rounded-full overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#60a5fa]/70 border border-[#93c5fd]/30"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div className="pl-4 text-[#60a5fa] pointer-events-none flex items-center justify-center shrink-0">
                  <User size={18} strokeWidth={2.2} />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Masukkan email"
                  className="pill-field-input w-full py-3 pl-3 pr-4 bg-transparent text-xs sm:text-sm font-semibold text-white placeholder-[#93c5fd]/70 focus:outline-none"
                />
              </div>
            </div>

            {/* Input 2: Kata Sandi (Pill-shaped, protected background & autofill) */}
            <div className="space-y-1.5">
              <label className="block text-[11.5px] font-bold text-[#dbeafe] ml-3">
                Kata Sandi
              </label>
              <div
                className="relative flex items-center rounded-full overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#60a5fa]/70 border border-[#93c5fd]/30"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
                }}
              >
                <div className="pl-4 text-[#60a5fa] pointer-events-none flex items-center justify-center shrink-0">
                  <Lock size={18} strokeWidth={2.2} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi Anda"
                  className="pill-field-input w-full py-3 pl-3 pr-11 bg-transparent text-xs sm:text-sm font-semibold text-white placeholder-[#93c5fd]/70 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 p-1 text-[#93c5fd] hover:text-white transition-colors cursor-pointer rounded-lg"
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {/* Ingat Saya & Lupa Kata Sandi Row */}
            <div className="flex items-center justify-between pt-0.5 px-1 text-xs">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 cursor-pointer select-none text-[#bfdbfe] hover:text-white font-medium transition-colors"
              >
                <div
                  className="w-4 h-4 rounded-md flex items-center justify-center transition-all border border-blue-400/50"
                  style={{
                    backgroundColor: rememberMe ? '#2563eb' : 'rgba(255, 255, 255, 0.1)',
                    boxShadow: rememberMe ? '0 0 8px rgba(37, 99, 235, 0.8)' : 'none',
                  }}
                >
                  {rememberMe && <Check size={11} className="text-white stroke-[3.5]" />}
                </div>
                <span className="text-[11.5px] font-medium text-[#dbeafe]">Ingat saya</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setForgotEmail('');
                  setForgotNewPassword('');
                  setForgotConfirmPassword('');
                  setForgotError('');
                  setForgotSuccess('');
                  setIsForgotModalOpen(true);
                }}
                className="text-[11.5px] font-bold text-[#93c5fd] hover:text-[#60a5fa] transition-colors cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* Primary Submit Button: Pill-shaped with glowing light ring */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 sm:py-4 px-6 rounded-full font-bold text-white text-xs sm:text-sm flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed focus:outline-none"
                style={{
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                  boxShadow: '0 0 0 2px rgba(96, 165, 250, 0.4), 0 0 28px rgba(37, 99, 235, 0.65), inset 0 1px 2px rgba(255, 255, 255, 0.7)',
                }}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Memverifikasi...</span>
                  </span>
                ) : (
                  <>
                    <LogIn size={17} className="stroke-[2.5]" />
                    <span className="tracking-wide">Login</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </main>

        {/* Footer: Light blue ~70% opacity, untouched by network elements */}
        <footer className="mt-5 text-center text-[10.5px] font-medium text-[#93c5fd]/70">
          &copy; {new Date().getFullYear()} Sadewa. Sistem Layanan Terpadu Lembaga Pemasyarakatan.
        </footer>
      </div>

      {/* ======================================================================
          MODAL LUPA KATA SANDI (Frosted Glass Theme matching Login aesthetic)
          ====================================================================== */}
      {isForgotModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmittingForgot) {
              setIsForgotModalOpen(false);
            }
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
        >
          {/* Modal Container with blue light reflection */}
          <div className="relative w-full max-w-[440px] my-auto max-h-[90vh] overflow-y-auto">
            {/* Luminous blue glow reflection under modal card */}
            <div
              aria-hidden="true"
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-[70%] h-14 pointer-events-none -z-10"
              style={{
                background: 'radial-gradient(ellipse at 50% 50%, rgba(59, 130, 246, 0.4) 0%, transparent 70%)',
                filter: 'blur(35px)',
              }}
            />

            <div
              className="relative w-full rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 overflow-hidden text-white shadow-2xl animate-in zoom-in-95 duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(30, 64, 175, 0.45) 0%, rgba(14, 38, 105, 0.52) 50%, rgba(10, 26, 74, 0.62) 100%)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(191, 219, 254, 0.35)',
                boxShadow: `
                  0 40px 80px -20px rgba(2, 8, 32, 0.85),
                  0 20px 40px -10px rgba(2, 8, 32, 0.6),
                  0 0 70px rgba(59, 130, 246, 0.28),
                  inset 0 1px 0 rgba(255, 255, 255, 0.40),
                  inset 0 -1px 0 rgba(0, 0, 0, 0.30),
                  inset 1px 0 0 rgba(255, 255, 255, 0.12)
                `,
              }}
            >
              {/* Surface Sheen Overlay (kilau permukaan 135deg) */}
              <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none rounded-[inherit]"
                style={{
                  background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.14) 0%, transparent 35%)',
                }}
              />

              {/* Modal Header */}
              <div className="relative z-10 flex items-start justify-between pb-4 border-b border-[#93c5fd]/20">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-[#60a5fa] shrink-0"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(147, 197, 253, 0.35)',
                      boxShadow: '0 0 15px rgba(59, 130, 246, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
                    }}
                  >
                    <KeyRound size={20} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-white via-blue-100 to-sky-200 bg-clip-text text-transparent">
                      Reset Kata Sandi
                    </h2>
                    <p className="text-[11.5px] sm:text-xs text-[#bfdbfe] font-medium mt-0.5">
                      Atur ulang kata sandi akun petugas Anda
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  disabled={isSubmittingForgot}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#93c5fd] hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0 mt-0.5 border border-transparent hover:border-[#93c5fd]/30"
                  title="Tutup"
                >
                  <X size={17} strokeWidth={2.2} />
                </button>
              </div>

              {/* Error Alert Message */}
              {forgotError && (
                <div className="relative z-10 mt-3.5 p-3 rounded-2xl text-xs font-semibold text-rose-200 flex items-center gap-2.5 bg-rose-950/60 border border-rose-500/40 backdrop-blur-xs shadow-sm animate-in fade-in">
                  <AlertCircle size={16} className="shrink-0 text-rose-400" />
                  <span className="text-[12px]">{forgotError}</span>
                </div>
              )}

              {/* Success Alert Message */}
              {forgotSuccess && (
                <div className="relative z-10 mt-3.5 p-3 rounded-2xl text-xs font-semibold text-emerald-200 flex items-center gap-2.5 bg-emerald-950/60 border border-emerald-500/40 backdrop-blur-xs shadow-sm animate-in fade-in">
                  <Check size={16} className="shrink-0 text-emerald-400 stroke-[2.5]" />
                  <span className="text-[12px]">{forgotSuccess}</span>
                </div>
              )}

              {/* Form Content */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setForgotError('');
                  setForgotSuccess('');

                  const cleanEmail = forgotEmail.trim();
                  if (!cleanEmail) {
                    setForgotError('Alamat email atau nomor HP akun wajib diisi.');
                    return;
                  }

                  if (!forgotNewPassword || forgotNewPassword.length < 6) {
                    setForgotError('Kata sandi baru minimal harus terdiri dari 6 karakter.');
                    return;
                  }

                  if (forgotNewPassword !== forgotConfirmPassword) {
                    setForgotError('Konfirmasi kata sandi tidak cocok dengan kata sandi baru.');
                    return;
                  }

                  setIsSubmittingForgot(true);
                  try {
                    const res = await forgotPasswordApi({
                      email: cleanEmail,
                      newPassword: forgotNewPassword,
                      confirmPassword: forgotConfirmPassword,
                    });

                    setForgotSuccess(res?.message || 'Kata sandi berhasil diperbarui. Mengarahkan ke form login...');
                    setTimeout(() => {
                      setIdentifier(cleanEmail);
                      setPassword('');
                      setIsForgotModalOpen(false);
                    }, 1800);
                  } catch (err) {
                    console.error('[Login] Forgot password error:', err);
                    if (err?.status === 400 || err?.status === 404) {
                      setForgotError(err?.message || 'Akun dengan email tersebut tidak ditemukan.');
                    } else if (err?.isNetworkError || err?.status === 0) {
                      setForgotError('Server tidak dapat dihubungi. Pastikan backend aktif.');
                    } else {
                      setForgotError(err?.message || 'Gagal mereset kata sandi. Silakan coba lagi.');
                    }
                  } finally {
                    setIsSubmittingForgot(false);
                  }
                }}
                className="relative z-10 mt-4 space-y-3.5 text-xs"
              >
                {/* Field 1: Email Akun Terdaftar */}
                <div className="space-y-1.5">
                  <label className="block text-[11.5px] font-bold text-[#dbeafe] ml-3">
                    Email Akun Terdaftar <span className="text-rose-400">*</span>
                  </label>
                  <div
                    className="relative flex items-center rounded-full overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#60a5fa]/70 border border-[#93c5fd]/30"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <div className="pl-4 text-[#60a5fa] pointer-events-none flex items-center justify-center shrink-0">
                      <Mail size={18} strokeWidth={2.2} />
                    </div>
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      placeholder="email@sadewa.id / 0812xxxxxx"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="pill-field-input w-full py-2.5 sm:py-3 pl-3 pr-4 bg-transparent text-xs sm:text-sm font-semibold text-white placeholder-[#93c5fd]/70 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Field 2: Kata Sandi Baru */}
                <div className="space-y-1.5">
                  <label className="block text-[11.5px] font-bold text-[#dbeafe] ml-3">
                    Kata Sandi Baru <span className="text-rose-400">*</span>
                  </label>
                  <div
                    className="relative flex items-center rounded-full overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#60a5fa]/70 border border-[#93c5fd]/30"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <div className="pl-4 text-[#60a5fa] pointer-events-none flex items-center justify-center shrink-0">
                      <Lock size={18} strokeWidth={2.2} />
                    </div>
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Minimal 6 karakter"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="pill-field-input w-full py-2.5 sm:py-3 pl-3 pr-11 bg-transparent text-xs sm:text-sm font-semibold text-white placeholder-[#93c5fd]/70 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute right-4 p-1 text-[#93c5fd] hover:text-white transition-colors cursor-pointer rounded-lg"
                      title={showForgotNewPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    >
                      {showForgotNewPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Field 3: Konfirmasi Kata Sandi Baru */}
                <div className="space-y-1.5">
                  <label className="block text-[11.5px] font-bold text-[#dbeafe] ml-3">
                    Konfirmasi Kata Sandi Baru <span className="text-rose-400">*</span>
                  </label>
                  <div
                    className="relative flex items-center rounded-full overflow-hidden transition-all focus-within:ring-2 focus-within:ring-[#60a5fa]/70 border border-[#93c5fd]/30"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
                    }}
                  >
                    <div className="pl-4 text-[#60a5fa] pointer-events-none flex items-center justify-center shrink-0">
                      <Lock size={18} strokeWidth={2.2} />
                    </div>
                    <input
                      type={showForgotConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Ulangi kata sandi baru"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      className="pill-field-input w-full py-2.5 sm:py-3 pl-3 pr-11 bg-transparent text-xs sm:text-sm font-semibold text-white placeholder-[#93c5fd]/70 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                      className="absolute right-4 p-1 text-[#93c5fd] hover:text-white transition-colors cursor-pointer rounded-lg"
                      title={showForgotConfirmPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                    >
                      {showForgotConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center gap-3 pt-3.5 border-t border-[#93c5fd]/20">
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    disabled={isSubmittingForgot}
                    className="py-3 px-5 rounded-full font-bold text-xs sm:text-sm text-[#bfdbfe] hover:text-white hover:bg-white/10 transition-colors border border-[#93c5fd]/30 cursor-pointer disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingForgot}
                    className="flex-1 py-3 sm:py-3.5 px-6 rounded-full font-bold text-white text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed focus:outline-none"
                    style={{
                      background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                      boxShadow: '0 0 0 2px rgba(96, 165, 250, 0.4), 0 0 24px rgba(37, 99, 235, 0.65), inset 0 1px 2px rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    {isSubmittingForgot ? (
                      <span className="inline-flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Menyimpan...</span>
                      </span>
                    ) : (
                      <>
                        <Check size={16} className="stroke-[3]" />
                        <span className="tracking-wide">Simpan Kata Sandi</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
