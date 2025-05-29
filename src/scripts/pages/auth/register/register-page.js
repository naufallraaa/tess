import RegisterPresenter from './register-presenter';
import * as StoryAPI from '../../../data/api';

export default class RegisterPage {
  #presenter = null;

  async render() {
    return `
      <section class="auth-container">
        <div class="auth-card">
          <div class="auth-header">
            <h1 class="auth-title">Buat Akun</h1>
          </div>

          <form id="register-form" class="auth-form">
            <div class="form-control">
              <label for="name-input" class="form-label">Nama Lengkap</label>
              <div class="input-group">
                <i class="fas fa-user input-icon"></i>
                <input 
                  id="name-input" 
                  type="text" 
                  name="name" 
                  placeholder="Masukan Nama Lengkap" 
                  aria-describedby="name-help"
                  required
                >
              </div>
              <div id="name-help" class="form-help">Masukan Nama Lengkapmu</div>
            </div>
            
            <div class="form-control">
              <label for="email-input" class="form-label">Email</label>
              <div class="input-group">
                <i class="fas fa-envelope input-icon"></i>
                <input 
                  id="email-input" 
                  type="email" 
                  name="email" 
                  placeholder="example@email.com" 
                  aria-describedby="email-help"
                  required
                >
              </div>
              <div id="email-help" class="form-help">Masukan email-mu dengan benar</div>
            </div>
            
            <div class="form-control">
              <label for="password-input" class="form-label">Password</label>
              <div class="input-group">
                <i class="fas fa-lock input-icon"></i>
                <input 
                  id="password-input" 
                  type="password" 
                  name="password" 
                  placeholder="Buat Pasword" 
                  aria-describedby="password-help"
                  required
                  minlength="8"
                >
              </div>
              <div id="password-help" class="form-help">Gunakan minimal 8 huruf, dengan menggunakan simbol dan angka</div>
            </div>
            
            <div class="form-buttons auth-form-buttons">
              <div id="submit-button-container">
                <button class="btn auth-submit-btn" type="submit" aria-label="Register">Buat Akun</button>
              </div>
              <p class="auth-alternate-action">Sudah punya akun? <a href="#/login">Masuk</a></p>
            </div>
          </form>
        </div>
      </section>
    `;
  }

  async afterRender() {
    this.#presenter = new RegisterPresenter({
      view: this,
      model: StoryAPI,
    });

    this.#setupForm();
  }

  #setupForm() {
    document.getElementById('register-form').addEventListener('submit', async (event) => {
      event.preventDefault();

      const data = {
        name: document.getElementById('name-input').value,
        email: document.getElementById('email-input').value,
        password: document.getElementById('password-input').value,
      };
      await this.#presenter.getRegistered(data);
    });
  }

  registeredSuccessfully(message) {
    console.log(message);

    location.hash = '/login';
  }

  registeredFailed(message) {
    alert(message);
  }

  showSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn auth-submit-btn" type="submit" disabled aria-label="Creating Account">
        <i class="fas fa-spinner loader-button"></i> Creating Account
      </button>
    `;
  }

  hideSubmitLoadingButton() {
    document.getElementById('submit-button-container').innerHTML = `
      <button class="btn auth-submit-btn" type="submit" aria-label="Register">Create Account</button>
    `;
  }
}
