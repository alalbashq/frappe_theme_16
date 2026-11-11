// The sign-in page: one line of work at a time, a photograph with a slow camera move, its line of
// words and its name lit in the index, which can be clicked. The greeting follows the visitor's clock.
(function () {
	const form = document.querySelector(".awl-form");
	const head = form && form.querySelector(".for-login .page-card-head");
	if (head) {
		const hour = new Date().getHours();
		const title = head.querySelector("h4");
		const sub = head.querySelector(".page-card-subtitle");
		const greeting = hour >= 4 && hour < 12 ? form.dataset.morning : hour >= 12 ? form.dataset.evening : form.dataset.hello;
		if (title) title.textContent = greeting || form.dataset.hello;
		if (sub) sub.textContent = form.dataset.sub;
	}

	const stage = document.querySelector(".awl-stage");
	if (!stage) return;
	const frames = [...stage.querySelectorAll("[data-frame]")];
	const says = [...stage.querySelectorAll("[data-say]")];
	const steps = [...stage.querySelectorAll("[data-go]")];
	const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
	const HOLD = 7000;
	const FADE = 1700;
	stage.style.setProperty("--awl-hold", `${HOLD}ms`);
	let current = 0;
	let timer = null;

	// Only the first photograph loads with the page; the rest follow once it is up.
	function load(frame) {
		const img = frame && frame.querySelector("img[data-src]");
		if (!img) return;
		img.srcset = img.dataset.srcset;
		img.src = img.dataset.src;
		img.removeAttribute("data-src");
	}

	function show(index) {
		if (index === current) return schedule();
		const leaving = frames[current];
		const coming = frames[index];
		load(coming);
		load(frames[(index + 1) % frames.length]);
		coming.classList.remove("run");
		void coming.offsetWidth; // restart its camera move
		coming.classList.add("run", "is-on");
		leaving.classList.remove("is-on");
		setTimeout(() => leaving.classList.contains("is-on") || leaving.classList.remove("run"), FADE);
		says.forEach((say, k) => say.classList.toggle("is-on", k === index));
		steps.forEach((step, k) => {
			step.classList.toggle("is-on", k === index);
			step.classList.toggle("is-done", k < index);
		});
		current = index;
		schedule();
	}

	function schedule() {
		clearTimeout(timer);
		if (still || document.hidden) return;
		timer = setTimeout(() => show((current + 1) % frames.length), HOLD);
	}

	steps.forEach((step) => step.addEventListener("click", () => show(parseInt(step.dataset.go, 10))));
	document.addEventListener("visibilitychange", schedule);
	window.addEventListener("load", () => load(frames[1]));
	schedule();

	// A little depth: the photographs drift against the pointer.
	if (!still && window.matchMedia("(pointer: fine)").matches) {
		stage.addEventListener("pointermove", (event) => {
			const box = stage.getBoundingClientRect();
			const x = (event.clientX - box.left) / box.width - 0.5;
			const y = (event.clientY - box.top) / box.height - 0.5;
			stage.style.setProperty("--px", `${(-x * 12).toFixed(1)}px`);
			stage.style.setProperty("--py", `${(-y * 10).toFixed(1)}px`);
		});
		stage.addEventListener("pointerleave", () => {
			stage.style.setProperty("--px", "0px");
			stage.style.setProperty("--py", "0px");
		});
	}
})();
