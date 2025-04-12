import React from 'react'
import '../styles/SignUp.css';


const SignUpPage = () => {
    return (
        <section className="signup-section">
          <form action="/login" method="post">
            <article className="signup-article">
              <h1>Crafts and Grain</h1>
              <button type="submit" className="google-button">
                <i className="fa-brands fa-google"></i> Sign Up with Google
              </button>
            </article>
          </form>
        </section>
      );
}

export default SignUpPage;