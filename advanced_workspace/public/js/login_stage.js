// The sign-in page's moving background: one scene at a time, every 7 seconds, with its
// numbers counting up. Still when the visitor asks for reduced motion.
(function () {
	const stage = document.querySelector(".awl-stage");
	if (!stage) return;
	const slides = [...stage.querySelectorAll(".awl-slide")];
	const dots = [...stage.querySelectorAll("[data-go]")];
	const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const HOLD = 7000;
	let current = 0;
	let timer = null;
	let counters = [];

	const format = (value, dec) =>
		value.toLocaleString("en-US", { minimumFractionDigits: dec, maximumFractionDigits: dec });

	function count(el) {
		const target = parseFloat(el.dataset.count);
		const dec = parseInt(el.dataset.dec || "0", 10);
		if (still) {
			el.textContent = format(target, dec);
			return;
		}
		const start = performance.now();
		const length = 1100;
		const step = (now) => {
			const p = Math.min(1, (now - start) / length);
			el.textContent = format(target * (1 - Math.pow(1 - p, 3)), dec);
			if (p < 1) requestAnimationFrame(step);
		};
		requestAnimationFrame(step);
	}

	function show(index) {
		counters.forEach(clearTimeout);
		counters = [];
		slides.forEach((slide, k) => slide.classList.toggle("is-on", k === index));
		dots.forEach((dot, k) => dot.classList.toggle("is-on", k === index));
		current = index;
		slides[index].querySelectorAll("[data-count]").forEach((el) => {
			el.textContent = format(0, parseInt(el.dataset.dec || "0", 10));
			counters.push(setTimeout(() => count(el), still ? 0 : parseInt(el.dataset.at || "800", 10)));
		});
		schedule();
	}

	function schedule() {
		clearTimeout(timer);
		if (still || document.hidden) return;
		timer = setTimeout(() => show((current + 1) % slides.length), HOLD);
	}

	dots.forEach((dot) => dot.addEventListener("click", () => show(parseInt(dot.dataset.go, 10))));
	document.addEventListener("visibilitychange", schedule);
	if (still) stage.classList.add("is-still");
	show(0);

	// The card's own words over Frappe's sign-in heading; its other screens keep theirs.
	const card = document.querySelector(".awl-card");
	const head = card && card.querySelector(".for-login .page-card-head");
	if (head) {
		const title = head.querySelector("h4");
		const sub = head.querySelector(".page-card-subtitle");
		if (title) title.textContent = card.dataset.heading;
		if (sub) sub.textContent = card.dataset.sub;
	}
})();
