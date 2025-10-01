// -- get doms
const lightBtn = document.getElementById("light-btn");
const darkBtn = document.getElementById("dark-btn");
const greenBtn = document.getElementById("green-btn");
// -- events
lightBtn.addEventListener("click", () => {
  lightBtn.classList.add("active");
  darkBtn.classList.remove("active");
  greenBtn.classList.remove("active");
  document.documentElement.setAttribute("data-theme", "light");
});

darkBtn.addEventListener("click", () => {
  darkBtn.classList.add("active");
  lightBtn.classList.remove("active");
  greenBtn.classList.remove("active");
  document.documentElement.setAttribute("data-theme", "dark");
});

greenBtn.addEventListener("click", () => {
  greenBtn.classList.add("active");
  lightBtn.classList.remove("active");
  darkBtn.classList.remove("active");
  document.documentElement.setAttribute("data-theme", "green");
});
