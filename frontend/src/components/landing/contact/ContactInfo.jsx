import React from "react";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

const contactDetails = [
  {
    icon: Mail,
    label: "Email",
    value: "support@ewarrantify.com",
    href: "mailto:support@ewarrantify.com",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+91 98765 43210",
    href: "tel:+919876543210",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "E-Warrantify Private Limited, Tech Park, Bangalore, India 560001",
    href: null,
  },
];

export function ContactInfo() {
  return (
    <div className="space-y-6">
      {/* Contact Details */}
      <div>
        <h3 className="text-xl font-semibold text-[#0f172a] dark:text-slate-100 mb-6">Get in Touch</h3>
        <div className="space-y-4">
          {contactDetails.map((detail, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="w-10 h-10 bg-sky-50 dark:bg-sky-950 rounded-lg flex items-center justify-center flex-shrink-0">
                <detail.icon className="w-5 h-5 text-[#0284c7]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[#0f172a] dark:text-slate-100">{detail.label}</p>
                {detail.href ? (
                  <a
                    href={detail.href}
                    className="text-sm text-slate-600 dark:text-slate-300 hover:text-[#0284c7] dark:hover:text-sky-400 transition-colors"
                  >
                    {detail.value}
                  </a>
                ) : (
                  <p className="text-sm text-slate-600 dark:text-slate-300">{detail.value}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Channels */}
      <div>
        <h4 className="text-base font-semibold text-[#0f172a] dark:text-slate-100 mb-4">Alternative Channels</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-[#0284c7] hover:text-[#0284c7] transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </a>
          <a
            href="tel:+919876543210"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-[#0284c7] hover:text-[#0284c7] transition-colors"
          >
            <Phone className="w-4 h-4" />
            Call Now
          </a>
        </div>
      </div>
    </div>
  );
}
