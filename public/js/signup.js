const form = document.querySelector(".form_sigin");
const emailError = document.querySelector(".email.error");
const codigo_tecnicoError = document.querySelector(".codigo_tecnico.error");
const passwordError = document.querySelector(".password.error");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // reset errors
  emailError.textContent = "";
  codigo_tecnicoError.textContent = "";
  passwordError.textContent = "";

  //get the values
  const email = form.email.value;
  const codigo_tecnico = form.codigo_tecnico.value;
  const password = form.password.value;

  try {
    const res = await fetch("/signup", {
      method: "POST",
      body: JSON.stringify({ email, codigo_tecnico, password }),
      headers: { "content-type": "application/json" },
    });
    const data = await res.json();
    if (data.errors) {
      emailError.textContent = data.errors.email;
      codigo_tecnicoError.textContent = data.errors.codigo_tecnico;
      passwordError.textContent = data.errors.password;
    }
    if (data.user) {
      location.assign("/");
    }
  } catch (err) {
    console.log(err);
  }
});
