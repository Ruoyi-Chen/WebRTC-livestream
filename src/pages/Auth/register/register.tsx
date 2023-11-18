import React, { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import {RegisterUser} from "../../../api";
import "./register.less"
export const Register: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await RegisterUser(name, email, password); // wait for RegisterUser to complete
      navigate("/login"); // redirect to /login on successful registration
    } catch (error) {
      alert(error); // display an error message
    }
    setName("");
    setPassword("");
    setEmail("");
  };

  return (
    <>
      <div className="register">
        <div className="auth-form-container">
          <h2 className="auth-form-header">Sign Up with STUDY-WITH-ME!</h2>

          <form className="register-form" onSubmit={handleSubmit}>
            <label htmlFor="name">Name</label>
            <input
              value={name}
              name="name"
              onChange={(e) => setName(e.target.value)}
              id="name"
              placeholder="Full Name"
              required
            />
            <label htmlFor="email">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="xxx@xx.com"
              id="email"
              name="email"
              required
            />
            <label htmlFor="password">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="********"
              id="password"
              name="password"
              required
            />
            <button className="Button" type="submit">
              Register
            </button>
          </form>

          <a href="/login">
            <button className="login-register-link-btn">
              Already have an account? Login here.
            </button>
          </a>
        </div>
      </div>
    </>
  );
};
