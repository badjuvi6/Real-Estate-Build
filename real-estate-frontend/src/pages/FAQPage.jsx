import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Layout from '../components/Layout.jsx';

const FAQS = [
  {
    question: 'How do I search for properties by location?',
    answer:
      'Use the search bar on the homepage or the Location field in the filter bar on the listings page. You can search by city, neighborhood, or a general keyword, and narrow results further with property type, price, and bedroom/bathroom filters.'
  },
  {
    question: 'What does the "Search near me" option do?',
    answer:
      'It uses your browser\'s location (with your permission) as the center point for the radius slider, so you can find listings within a chosen distance of where you currently are rather than typing a place name.'
  },
  {
    question: 'How do I save a property to view later?',
    answer:
      'Tap the heart icon on any property card or its detail page. You\'ll need to be logged in - if you\'re not, tapping the heart will prompt you to log in or create a free account first. Saved homes appear under "Saved Properties" in your dashboard.'
  },
  {
    question: 'How do I contact an agent about a listing?',
    answer:
      'Open the property\'s detail page and use the "Inquire About Property" form in the sidebar. You can send a message whether or not you\'re logged in; if you are logged in, the message will also appear in your dashboard\'s Inquiries tab.'
  },
  {
    question: 'I\'m an agent. How do I list a property?',
    answer:
      'Create an account and select "I\'m a real estate agent" during sign-up, or contact support to have an existing account upgraded. Agents can submit new listings, including coordinates and photos, from the "My Listings" tab in the dashboard.'
  },
  {
    question: 'Can I view a 3D tour of a property?',
    answer:
      'Yes - on a property\'s detail page, switch from the "Photos" tab to "3D Virtual Tour" above the image gallery to explore an interactive 3D view of the floor plan.'
  },
  {
    question: 'Are the prices shown in GHS or USD?',
    answer:
      'Each listing shows its price in the currency the agent set when creating it, noted alongside the price on the property\'s detail page. Check the listing itself if you\'re unsure.'
  }
];

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className="border-b border-slate-200 py-4">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="text-sm font-semibold text-slate-900 sm:text-base">{faq.question}</span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-slate-400" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
        )}
      </button>
      {isOpen && <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.answer}</p>}
    </div>
  );
}

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <Layout>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h1>
        <p className="mt-2 text-sm text-slate-500">
          Answers to common questions about searching, saving, and listing properties.
        </p>

        <div className="mt-6">
          {FAQS.map((faq, index) => (
            <FAQItem
              key={faq.question}
              faq={faq}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </div>
      </main>
    </Layout>
  );
}
