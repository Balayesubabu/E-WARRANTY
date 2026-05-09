import React, { useState } from "react";
import { Search } from "lucide-react";
import { Container } from "../layout/Container";

export function HelpSearchSection() {
  const [query, setQuery] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const el = document.getElementById("faq");
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="help-search" className="py-2 lg:py-4 bg-sky-50/50 scroll-mt-16 lg:scroll-mt-20">
      <Container>
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-3">
            How can we help you today?
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mb-6">
            Search our comprehensive knowledge base for E-Warrantify solutions
          </p>
          <form
            onSubmit={handleSearch}
            className="flex max-w-2xl mx-auto rounded-xl border-2 border-[#0284c7] overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#0284c7] focus-within:ring-offset-2"
          >
            <div className="relative flex-1 flex items-center">
              <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for articles, guides, or questions..."
                className="w-full pl-12 pr-4 py-3 bg-transparent text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-[#0284c7] text-white font-semibold hover:bg-[#0369a1] transition-colors shrink-0"
            >
              Search
            </button>
          </form>
        </div>
      </Container>
    </section>
  );
}
