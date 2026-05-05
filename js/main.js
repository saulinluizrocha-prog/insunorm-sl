/* Insunorm — vanilla JS (no framework) */

(function () {
	"use strict";

	const reduceMotion = window.matchMedia(
		"(prefers-reduced-motion: reduce)",
	).matches;
	const anyHover = window.matchMedia("(any-hover: hover)").matches;

	/* ============================================================
       Scroll reveal
       ============================================================ */
	function initReveal() {
		const items = document.querySelectorAll(".reveal");
		if (!items.length) return;

		if (reduceMotion) {
			items.forEach((el) => el.classList.add("is-static"));
			return;
		}

		items.forEach((el) => {
			const r = el.getBoundingClientRect();
			if (r.top < window.innerHeight && r.bottom > 0) {
				el.classList.add("is-static");
			}
		});

		const obs = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) {
						e.target.classList.add("is-visible");
						obs.unobserve(e.target);
					}
				});
			},
			{ threshold: 0, rootMargin: "0px 0px 200px 0px" },
		);

		items.forEach((el) => {
			if (!el.classList.contains("is-static")) obs.observe(el);
		});
	}

	/* ============================================================
       Problem grid: single observer for whole grid + CSS staggering
       ============================================================ */
	function initProblemGrid() {
		const grid = document.querySelector(".problem-grid");
		if (!grid) return;
		if (reduceMotion) {
			grid.setAttribute("data-reveal", "revealed");
			return;
		}

		const r = grid.getBoundingClientRect();
		if (r.top < window.innerHeight && r.bottom > 0) {
			grid.setAttribute("data-reveal", "revealed");
			return;
		}
		const obs = new IntersectionObserver(
			(entries) => {
				if (entries[0] && entries[0].isIntersecting) {
					grid.setAttribute("data-reveal", "revealed");
					obs.disconnect();
				}
			},
			{ threshold: 0, rootMargin: "0px 0px -8% 0px" },
		);
		obs.observe(grid);
	}

	/* ============================================================
       Animated number counter
       ============================================================ */
	function initCounters() {
		const counters = document.querySelectorAll("[data-counter]");
		if (!counters.length) return;

		const obs = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (!e.isIntersecting) return;
					const el = e.target;
					const target = parseInt(el.dataset.counter, 10) || 0;
					const duration = 1500;
					const start = performance.now();
					const step = (now) => {
						const p = Math.min((now - start) / duration, 1);
						const eased = 1 - Math.pow(1 - p, 3);
						el.textContent = Math.round(target * eased) + "%";
						if (p < 1) requestAnimationFrame(step);
					};
					requestAnimationFrame(step);
					obs.unobserve(el);
				});
			},
			{ threshold: 0.3 },
		);

		counters.forEach((el) => obs.observe(el));
	}

	/* ============================================================
       Offer countdown
       ============================================================ */
	function initCountdown() {
		const el = document.querySelector("[data-countdown]");
		if (!el) return;
		const hEl = el.querySelector("[data-h]");
		const mEl = el.querySelector("[data-m]");
		const sEl = el.querySelector("[data-s]");
		let h = 2,
			m = 47,
			s = 33;
		const pad = (n) => String(n).padStart(2, "0");
		setInterval(() => {
			s--;
			if (s < 0) {
				s = 59;
				m--;
			}
			if (m < 0) {
				m = 59;
				h--;
			}
			if (h < 0) {
				h = m = s = 0;
			}
			hEl.textContent = pad(h);
			mEl.textContent = pad(m);
			sEl.textContent = pad(s);
		}, 1000);
	}

	/* ============================================================
       Mobile nav toggle
       ============================================================ */
	function initMobileNav() {
		const burger = document.querySelector(".nav-burger");
		const menu = document.getElementById("mobile-menu");
		if (!burger || !menu) return;
		let open = false;
		const toggle = (state) => {
			open = state ?? !open;
			menu.hidden = !open;
			burger.setAttribute("aria-expanded", String(open));
			document.body.style.overflow = open ? "hidden" : "";
		};
		burger.addEventListener("click", () => toggle());
		menu.addEventListener("click", (e) => {
			if (e.target === menu) toggle(false);
			if (e.target.closest("a")) toggle(false);
		});
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && open) toggle(false);
		});
	}

	/* ============================================================
       Mobile floating order button — hidden when any form visible
       ============================================================ */
	function initMobileFloating() {
		const btn = document.getElementById("mobile-floating-btn");
		if (!btn) return;
		const forms = document.querySelectorAll(
			'[data-order-form] button[type="submit"]',
		);
		if (!forms.length) return;
		const visible = new Set();
		const obs = new IntersectionObserver(
			(entries) => {
				entries.forEach((e) => {
					if (e.isIntersecting) visible.add(e.target);
					else visible.delete(e.target);
				});
				btn.classList.toggle("is-hidden", visible.size > 0);
			},
			{ threshold: 0.4 },
		);
		forms.forEach((el) => obs.observe(el));
	}

	/* ============================================================
       Scroll-to-nearest-order-form (from nav CTA, mobile floating)
       ============================================================ */
	function initScrollToForm() {
		document.querySelectorAll("[data-scroll-to-form]").forEach((trigger) => {
			trigger.addEventListener("click", (e) => {
				e.preventDefault();
				const forms = Array.from(
					document.querySelectorAll("[data-order-form]"),
				);
				if (!forms.length) {
					window.scrollTo({ top: 0, behavior: "smooth" });
					return;
				}
				const rect = trigger.getBoundingClientRect();
				const triggerY = rect.top + window.scrollY + rect.height / 2;
				let nearest = forms[0];
				let bestDist = Infinity;
				forms.forEach((f) => {
					const fr = f.getBoundingClientRect();
					const fy = fr.top + window.scrollY + fr.height / 2;
					const d = Math.abs(fy - triggerY);
					if (d < bestDist) {
						bestDist = d;
						nearest = f;
					}
				});
				const nrect = nearest.getBoundingClientRect();
				const targetY = nrect.top + window.scrollY - 120;
				window.scrollTo({ top: targetY, behavior: "smooth" });
				const input = nearest.querySelector('input[name="name"]');
				if (input) setTimeout(() => input.focus({ preventScroll: true }), 600);
			});
		});
	}

	/* ============================================================
       Reviews carousel (simple loop, drag + arrows + dots + autoplay)
       ============================================================ */
	function initCarousel() {
		const root = document.querySelector("[data-carousel]");
		if (!root) return;
		const track = root.querySelector(".reviews-track");
		const viewport = root.querySelector(".reviews-viewport");
		const slides = Array.from(track.children);
		const dotsWrap = root.querySelector("[data-carousel-dots]");
		const prev = root.querySelector("[data-carousel-prev]");
		const next = root.querySelector("[data-carousel-next]");
		if (!track || !slides.length) return;

		let current = 0;
		let perView = getPerView();
		const maxIndex = () => Math.max(0, slides.length - perView);

		function getPerView() {
			const w = window.innerWidth;
			if (w >= 1024) return 3;
			if (w >= 640) return 2;
			return 1;
		}

		function renderDots() {
			if (!dotsWrap) return;
			const count = slides.length - perView + 1;
			dotsWrap.innerHTML = "";
			for (let i = 0; i < count; i++) {
				const b = document.createElement("button");
				b.type = "button";
				b.setAttribute("aria-label", "Перейти к отзыву " + (i + 1));
				if (i === current) b.classList.add("is-active");
				b.addEventListener("click", () => goTo(i));
				dotsWrap.appendChild(b);
			}
		}

		function update() {
			const slideWidth = slides[0].getBoundingClientRect().width;
			track.style.transform =
				"translate3d(-" + current * slideWidth + "px,0,0)";
			if (dotsWrap) {
				dotsWrap.querySelectorAll("button").forEach((b, i) => {
					b.classList.toggle("is-active", i === current);
				});
			}
		}

		function goTo(i) {
			const max = maxIndex();
			if (i < 0) i = max;
			if (i > max) i = 0;
			current = i;
			update();
		}

		if (prev) prev.addEventListener("click", () => goTo(current - 1));
		if (next) next.addEventListener("click", () => goTo(current + 1));

		// Autoplay, pause on hover
		let autoplay = setInterval(() => goTo(current + 1), 4000);
		root.addEventListener("mouseenter", () => clearInterval(autoplay));
		root.addEventListener("mouseleave", () => {
			autoplay = setInterval(() => goTo(current + 1), 4000);
		});

		// Drag / swipe
		let startX = 0,
			dragging = false,
			dragOffset = 0;
		const onDown = (x) => {
			dragging = true;
			startX = x;
			dragOffset = 0;
			track.style.transition = "none";
		};
		const onMove = (x) => {
			if (!dragging) return;
			dragOffset = x - startX;
			const slideWidth = slides[0].getBoundingClientRect().width;
			track.style.transform =
				"translate3d(" + (-current * slideWidth + dragOffset) + "px,0,0)";
		};
		const onUp = () => {
			if (!dragging) return;
			dragging = false;
			track.style.transition = "";
			if (Math.abs(dragOffset) > 40) goTo(current + (dragOffset < 0 ? 1 : -1));
			else update();
		};
		viewport.addEventListener("mousedown", (e) => onDown(e.clientX));
		window.addEventListener("mousemove", (e) => onMove(e.clientX));
		window.addEventListener("mouseup", onUp);
		viewport.addEventListener(
			"touchstart",
			(e) => onDown(e.touches[0].clientX),
			{ passive: true },
		);
		viewport.addEventListener(
			"touchmove",
			(e) => onMove(e.touches[0].clientX),
			{ passive: true },
		);
		viewport.addEventListener("touchend", onUp);

		// Handle resize
		let resizeTO;
		window.addEventListener("resize", () => {
			clearTimeout(resizeTO);
			resizeTO = setTimeout(() => {
				const next = getPerView();
				if (next !== perView) {
					perView = next;
					current = Math.min(current, maxIndex());
					renderDots();
				}
				update();
			}, 100);
		});

		renderDots();
		update();
	}

	/* ============================================================
       Mouse parallax (data-mouse-parallax="strengthX,strengthY")
       ============================================================ */
	function initMouseParallax() {
		const nodes = document.querySelectorAll("[data-mouse-parallax]");
		if (!nodes.length) return;
		if (reduceMotion || !anyHover) return;

		const targets = Array.from(nodes).map((el) => {
			const [x = 24, y = 0] = el.dataset.mouseParallax
				.split(",")
				.map((n) => parseFloat(n));
			return { el, sx: x, sy: y, cx: 0, cy: 0, tx: 0, ty: 0 };
		});

		let raf = 0;
		function loop() {
			raf = 0;
			let active = false;
			targets.forEach((t) => {
				t.cx += (t.tx - t.cx) * 0.08;
				t.cy += (t.ty - t.cy) * 0.08;
				t.el.style.setProperty("--mx", t.cx.toFixed(2) + "px");
				t.el.style.setProperty("--my", t.cy.toFixed(2) + "px");
				if (Math.abs(t.tx - t.cx) > 0.05 || Math.abs(t.ty - t.cy) > 0.05)
					active = true;
			});
			if (active) raf = requestAnimationFrame(loop);
		}

		window.addEventListener(
			"mousemove",
			(e) => {
				const nx = (e.clientX / window.innerWidth) * 2 - 1;
				const ny = (e.clientY / window.innerHeight) * 2 - 1;
				targets.forEach((t) => {
					t.tx = nx * t.sx;
					t.ty = ny * t.sy;
				});
				if (!raf) raf = requestAnimationFrame(loop);
			},
			{ passive: true },
		);
	}

	/* ============================================================
       Video player — show native controls on first play
       ============================================================ */
	function initVideo() {
		const frame = document.querySelector("[data-video-frame]");
		if (!frame) return;
		const video = frame.querySelector("[data-video]");
		const play = frame.querySelector("[data-video-play]");
		if (!video || !play) return;

		let started = false;
		const start = () => {
			if (started) return;
			started = true;
			frame.classList.add("is-playing");
			video.controls = true;
			video.play().catch(() => {
				/* ignore autoplay blocks */
			});
		};
		play.addEventListener("click", start);
	}

	/* ============================================================
       Nav shadow elevation on scroll
       ============================================================ */
	function initNavElevation() {
		const nav = document.querySelector(".floating-nav");
		if (!nav) return;
		const upd = () => {
			if (window.scrollY > 8)
				nav.style.boxShadow = "0 12px 40px rgba(74,20,140,0.16)";
			else nav.style.boxShadow = "";
		};
		upd();
		window.addEventListener("scroll", upd, { passive: true });
	}

	/* ============================================================
       Review popup ("Добавить комментарий")
       ============================================================ */
	function initReviewPopup() {
		const popup = document.getElementById("review-popup");
		if (!popup) return;
		const opens = document.querySelectorAll("[data-review-open]");
		const closes = popup.querySelectorAll("[data-review-close]");
		if (!opens.length) return;

		let lastFocus = null;
		const show = (trigger) => {
			lastFocus = trigger || document.activeElement;
			popup.hidden = false;
			document.body.style.overflow = "hidden";
			const firstBtn = popup.querySelector(".review-popup-close");
			if (firstBtn) setTimeout(() => firstBtn.focus(), 30);
		};
		const hide = () => {
			popup.hidden = true;
			document.body.style.overflow = "";
			if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
		};

		opens.forEach((btn) =>
			btn.addEventListener("click", (e) => {
				e.preventDefault();
				show(btn);
			}),
		);
		closes.forEach((btn) => btn.addEventListener("click", hide));
		document.addEventListener("keydown", (e) => {
			if (e.key === "Escape" && !popup.hidden) hide();
		});
	}

	/* ============================================================
       Bootstrap
       ============================================================ */
	function ready(fn) {
		if (document.readyState !== "loading") fn();
		else document.addEventListener("DOMContentLoaded", fn);
	}

	ready(() => {
		initReveal();
		initProblemGrid();
		initCounters();
		initCountdown();
		initMobileNav();
		initMobileFloating();
		initScrollToForm();
		initCarousel();
		initMouseParallax();
		initVideo();
		initNavElevation();
		initReviewPopup();
	});
})();
 