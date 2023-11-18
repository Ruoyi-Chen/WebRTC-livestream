import React, { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginUser } from "../../../api";
import "./login.less"

export const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (email === "") {
      alert("Email required!");
      return;
    }
    if (password === "") {
      alert("Password required!");
      return;
    }
    try {
      await LoginUser(email, password);
      navigate("/homepage");
    } catch (error) {
      alert(error);
      window.location.reload();
    }
  };
  

  return (
    <>
      <div className="login">
        <div className="auth-form-container">
          <h2 className="auth-form-header">STUDY-WITH-ME!</h2>

          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="xxx@xx.com"
              id="email"
              name="email"
            />
            <label htmlFor="password">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="********"
              id="password"
              name="password"
            />
            <button className="Button" type="submit">
              Log In
            </button>
          </form>

          <a href="/register">
            <button className="login-register-link-btn">
              Don{`'`}t have an account? Register here.
            </button>
          </a>
        </div>
      </div>
    </>
  );
};
