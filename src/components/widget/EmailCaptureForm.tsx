import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import "./EmailCaptureForm.css";
import { useChatWidget } from "../../context/ChatWidgetContext.tsx";

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
}

const EmailCaptureForm = () => {
  const { navigateTo, setUserInfo, widgetSettings } = useChatWidget();
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (widgetSettings && !widgetSettings.email_capture) {
      navigateTo("chat");
    }
  }, [widgetSettings]);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: FormData) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev: FormErrors) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validateForm()) {
      setUserInfo({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
      });
      if (widgetSettings?.chat_priority === "human") {
        navigateTo("chat");
      } else {
        navigateTo("ai-chat");
      }
    }
  };

  return (
    <div className="email-capture-form">
      <div className="form-header">
        <h4>Let's get started!</h4>
        <p>Please provide your information to begin chatting</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="firstName">First Name</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={errors.firstName ? "error" : ""}
            placeholder="Enter your first name"
          />
          {errors.firstName && (
            <span className="error-message">{errors.firstName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="lastName">Last Name</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={errors.lastName ? "error" : ""}
            placeholder="Enter your last name"
          />
          {errors.lastName && (
            <span className="error-message">{errors.lastName}</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? "error" : ""}
            placeholder="Enter your email address"
          />
          {errors.email && (
            <span className="error-message">{errors.email}</span>
          )}
        </div>

        <button type="submit" className="submit-button">
          Start Chat
        </button>
      </form>
    </div>
  );
};

export default EmailCaptureForm;
