import React from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import styles from './FAQ.module.css';

const faqs = [
  { q: "What is DirectorByte?", a: "DirectorByte is an AI-powered film production platform that streamlines the entire creative process from initial concept to final export." },
  { q: "Do I need my own API keys?", a: "On the Free plan, you bring your own API keys for providers like OpenAI or Runway. On paid plans, we provide managed access to these models." },
  { q: "What AI models does DirectorByte use?", a: "We integrate with industry leaders including OpenAI (GPT-4), Google (Gemini), RunwayML (Gen-3 Alpha), Kling, and Pika Labs." },
  { q: "Can I use my Google Drive to store projects?", a: "Yes! DirectorByte features deep integration with Google Drive, allowing you to sync all your project files and generated media automatically." },
  { q: "Is there a free plan?", a: "Yes! Our Free plan allows you to create up to 5 projects and explore the full pipeline using your own API keys." },
  { q: "Is my data secure?", a: "We take security seriously. Your scripts and media are stored securely, and we never use your creative content to train models without permission." },
];

export function FAQ() {
  return (
    <section id="faq" className={styles.faq}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Frequently Asked Questions</h2>
          <p className={styles.subtitle}>Everything you need to know about DirectorByte.</p>
        </div>

        <Accordion.Root type="single" collapsible className={styles.accordion}>
          {faqs.map((faq, i) => (
            <Accordion.Item key={i} value={`item-${i}`} className={styles.item}>
              <Accordion.Header>
                <Accordion.Trigger className={styles.trigger}>
                  <span>{faq.q}</span>
                  <ChevronDown className={styles.chevron} aria-hidden />
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className={styles.content}>
                <div className={styles.answer}>{faq.a}</div>
              </Accordion.Content>
            </Accordion.Item>
          ))}
        </Accordion.Root>
      </div>
    </section>
  );
}
