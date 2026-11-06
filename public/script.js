const views = {
    login: {
        form: document.getElementById('loginForm'),
        title: 'Iniciar sesión',
        description: 'Ingresa tus datos para continuar.'
    },
    register: {
        form: document.getElementById('registerForm'),
        title: 'Crear una cuenta',
        description: 'Regístrate para comenzar a gestionar tus citas.'
    },
    recovery: {
        form: document.getElementById('recoveryForm'),
        title: 'Recuperar contraseña',
        description: 'Recupera el acceso a tu cuenta.'
    }
};

const formTitle = document.getElementById('formTitle');
const formDescription = document.getElementById('formDescription');
const message = document.getElementById('mensaje');

function showView(viewName) {
    const view = views[viewName];

    Object.values(views).forEach(({ form }) => form.classList.add('is-hidden'));
    view.form.classList.remove('is-hidden');
    formTitle.textContent = view.title;
    formDescription.textContent = view.description;
    message.textContent = '';
    message.classList.remove('error');
    view.form.querySelector('input').focus();
}

document.querySelectorAll('[data-view]').forEach((button) => {
    button.addEventListener('click', () => showView(button.dataset.view));
});

document.querySelectorAll('.password-toggle').forEach((button) => {
    button.addEventListener('click', () => {
        const passwordInput = document.getElementById(button.getAttribute('aria-controls'));
        const isVisible = passwordInput.type === 'text';

        passwordInput.type = isVisible ? 'password' : 'text';
        button.classList.toggle('is-visible', !isVisible);
        button.setAttribute('aria-label', isVisible ? 'Mostrar contraseña' : 'Ocultar contraseña');
    });
});

views.login.form.addEventListener('submit', (event) => {
    event.preventDefault();
    message.textContent = 'Formulario listo para conectarse con el servicio de autenticación.';
});

views.register.form.addEventListener('submit', (event) => {
    event.preventDefault();
    const password = document.getElementById('registroContrasena').value;
    const confirmation = document.getElementById('confirmarContrasena').value;

    if (password !== confirmation) {
        message.textContent = 'Las contraseñas no coinciden.';
        message.classList.add('error');
        return;
    }

    message.textContent = 'Cuenta lista para registrarse en el sistema.';
});

views.recovery.form.addEventListener('submit', (event) => {
    event.preventDefault();
    message.textContent = 'Si el correo está registrado, recibirás instrucciones para recuperar tu contraseña.';
});