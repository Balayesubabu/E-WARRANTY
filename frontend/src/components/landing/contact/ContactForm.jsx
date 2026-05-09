import React, { useState } from "react";
import { toast } from "sonner";
import { api } from "../../../utils/api";

export function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    corporateEmail: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { firstName, lastName, corporateEmail, message } = formData;
    if (!firstName.trim() || !lastName.trim() || !corporateEmail.trim() || !message.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data } = await api.post("/public/contact-inquiry", {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        corporateEmail: corporateEmail.trim(),
        message: message.trim(),
      });
      toast.success(data?.message || "Inquiry sent! We'll respond within 24 business hours.");
      setFormData({ firstName: "", lastName: "", corporateEmail: "", message: "" });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 lg:p-6 border border-slate-200 shadow-sm">
      <h3 className="text-xl font-bold text-slate-900 mb-1">Send us a Message</h3>
      <p className="text-sm text-slate-500 mb-4">Expect a response within 24 business hours.</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-slate-700 mb-1.5">
              First name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] bg-white"
              placeholder="John"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-slate-700 mb-1.5">
              Last name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] bg-white"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label htmlFor="corporateEmail" className="block text-sm font-medium text-slate-700 mb-1.5">
            Corporate Email
          </label>
          <input
            type="email"
            id="corporateEmail"
            name="corporateEmail"
            value={formData.corporateEmail}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] bg-white"
            placeholder="john.doe@company.com"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0284c7]/20 focus:border-[#0284c7] bg-white resize-none"
            placeholder="How can we help your business today?"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-[#0284c7] text-white font-semibold rounded-lg hover:bg-[#0369a1] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Sending..." : "Send Inquiry"}
        </button>
      </form>
    </div>
  );
}
