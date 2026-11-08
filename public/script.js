
document.addEventListener("DOMContentLoaded", () => {

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const recoveryForm = document.getElementById("recoveryForm");

    const formTitle = document.getElementById("formTitle");
    const formDescription = document.getElementById("formDescription");
    const mensaje = document.getElementById("mensaje");

    // Mostrar mensajes.
    function mostrarMensaje(texto, error = false) {
        mensaje.textContent = texto;
        mensaje.classList.toggle("error", error);
    }

    // Cambiar entre formularios.
    function mostrarFormulario(vista) {
        loginForm.classList.toggle("is-hidden", vista !== "login");
        registerForm.classList.toggle("is-hidden", vista !== "register");
        recoveryForm.classList.toggle("is-hidden", vista !== "recovery");

        const titulos = {
            login: "Iniciar sesión",
            register: "Crear cuenta",
            recovery: "Recuperar contraseña"
        };

        const descripciones = {
            login: "Ingresa tus datos para continuar.",
            register: "Completa tus datos para registrarte.",
            recovery: "Ingresa tu correo electrónico."
        };

        formTitle.textContent = titulos[vista];
        formDescription.textContent = descripciones[vista];
        mostrarMensaje("");
    }

    // Botones de navegación.
    document.querySelectorAll("[data-view]").forEach(boton => {
        boton.addEventListener("click", () => {
            mostrarFormulario(boton.dataset.view);
        });
    });

    document.querySelectorAll("[data-toggle-password]").forEach(boton => {
        boton.addEventListener("click", () => {
            const campo = document.getElementById(boton.dataset.togglePassword);
            const visible = campo.type === "password";

            campo.type = visible ? "text" : "password";
            boton.setAttribute("aria-label", visible ? "Ocultar contraseña" : "Mostrar contraseña");
            boton.setAttribute("aria-pressed", String(visible));
        });
    });

    // REGISTRO DE USUARIOS.
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const correo = document.getElementById("registroCorreo").value.trim();
        const contrasena = document.getElementById("registroContrasena").value;
        const confirmar = document.getElementById("confirmarContrasena").value;

        if (contrasena !== confirmar) {
            mostrarMensaje("Las contraseñas no coinciden.", true);
            return;
        }

        if (contrasena.length < 8) {
            mostrarMensaje("La contraseña debe tener mínimo 8 caracteres.", true);
            return;
        }

        try {
            const respuesta = await fetch("/api/usuarios/registro", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    nombre,
                    correo,
                    contrasena
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                mostrarMensaje(
                    datos.mensaje || "No se pudo registrar el usuario.",
                    true
                );
                return;
            }

            registerForm.reset();
            mostrarFormulario("login");
            mostrarMensaje("Cuenta creada correctamente. Inicia sesión.");

        } catch (error) {
            mostrarMensaje("Error de conexión con el servidor.", true);
        }
    });

    // INICIO DE SESIÓN.
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const correo = document.getElementById("usuario").value.trim();
        const contrasena = document.getElementById("contrasena").value;

        try {
            const respuesta = await fetch("/api/usuarios/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    correo,
                    contrasena
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                mostrarMensaje(
                    datos.mensaje || "Correo o contraseña incorrectos.",
                    true
                );
                return;
            }

            mostrarMensaje("Credenciales correctas.");
            window.location.href = "/dashboarrd.html";

        } catch (error) {
            mostrarMensaje("Error de conexión con el servidor.", true);
        }
    });

    // RECUPERACIÓN DE CONTRASEÑA.
    recoveryForm.addEventListener("submit", (event) => {
        event.preventDefault();

        mostrarMensaje(
            "La recuperación de contraseña estará disponible próximamente."
        );
    });

    // Mostrar inicialmente el inicio de sesión.
    mostrarFormulario("login");
});
