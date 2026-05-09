import React from "react";
import { Container } from "../layout/Container";
import { ContactForm } from "./ContactForm";
import { ContactInfo } from "./ContactInfo";

export function ContactSection() {
  return (
    <section id="contact" className="py-8 lg:py-10 bg-white dark:bg-slate-950 scroll-mt-16 lg:scroll-mt-20">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#0f172a] dark:text-slate-100 mb-2">
            Contact Us
          </h2>
          <p className="text-slate-600 dark:text-slate-300 text-base lg:text-lg max-w-2xl mx-auto">
            Get in touch with our support team for personalized assistance
          </p>
        </div>

        {/* Contact Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 max-w-5xl mx-auto">
          {/* Contact Form */}
          <ContactForm />

          {/* Contact Info */}
          <ContactInfo />
        </div>
      </Container>
    </section>
  );
}
