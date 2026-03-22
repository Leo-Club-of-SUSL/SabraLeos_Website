import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '../context/DataContext';
import { Mail, Phone, MapPin, Facebook, Instagram, MessageCircle, Linkedin, Send, Loader2, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';
import { messagesAPI } from '../lib/supabaseService';

const Contact = () => {
  const { siteContent } = useData();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'submitting') return;

    setStatus('submitting');
    setErrorMessage('');

    try {
      await messagesAPI.create(formData);
      setStatus('success');
      setFormData({ name: '', email: '', message: '' });
      
      // Reset success message after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error('Contact submission error:', error);
      setStatus('error');
      setErrorMessage('Failed to send message. Please try again later.');
    }
  };

  return (
    <section id="contact" className="py-20 bg-[var(--color-leo-maroon)] text-white">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl font-bold mb-6">Get in Touch</h2>
            <p className="text-red-100 mb-10 text-lg">
              Interested in joining or have a question? We'd love to hear from you.
            </p>

            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="bg-[var(--color-leo-gold)] p-3 rounded-full text-[var(--color-leo-maroon)]">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Email Us</h4>
                  <p className="text-red-100">{siteContent.contact_email}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-[var(--color-leo-gold)] p-3 rounded-full text-[var(--color-leo-maroon)]">
                  <Phone size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Call Us</h4>
                  <p className="text-red-100">{siteContent.contact_phone}</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                <div className="bg-[var(--color-leo-gold)] p-3 rounded-full text-[var(--color-leo-maroon)]">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-bold">Visit Us</h4>
                  <p className="text-red-100">{siteContent.contact_address}</p>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <h4 className="font-bold mb-4">Follow Us</h4>
              <div className="flex space-x-4">
                <a href={siteContent.contact_facebook} target="_blank" rel="noopener noreferrer" aria-label="Visit our Facebook page" className="bg-white/10 p-3 rounded-full hover:bg-[var(--color-leo-gold)] hover:text-[var(--color-leo-maroon)] transition-colors">
                  <Facebook size={24} />
                </a>
                <a href={siteContent.contact_instagram} target="_blank" rel="noopener noreferrer" aria-label="Visit our Instagram profile" className="bg-white/10 p-3 rounded-full hover:bg-[var(--color-leo-gold)] hover:text-[var(--color-leo-maroon)] transition-colors">
                  <Instagram size={24} />
                </a>
                <a href={siteContent.contact_whatsapp || '#'} target="_blank" rel="noopener noreferrer" aria-label="Contact us on WhatsApp" className="bg-white/10 p-3 rounded-full hover:bg-[var(--color-leo-gold)] hover:text-[var(--color-leo-maroon)] transition-colors">
                  <MessageCircle size={24} />
                </a>
                <a href={siteContent.contact_linkedin || '#'} target="_blank" rel="noopener noreferrer" aria-label="Connect with us on LinkedIn" className="bg-white/10 p-3 rounded-full hover:bg-[var(--color-leo-gold)] hover:text-[var(--color-leo-maroon)] transition-colors">
                  <Linkedin size={24} />
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
          >
            <AnimatePresence mode="wait">
              {status === 'success' ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full text-green-600 mb-6">
                    <CheckCircle2 size={64} />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Message Sent!</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Thank you for reaching out. We'll get back to you soon.
                  </p>
                </motion.div>
              ) : (
                <form key="form" onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-[var(--color-leo-maroon)] focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 outline-none transition-all placeholder:text-gray-400"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-[var(--color-leo-maroon)] focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 outline-none transition-all placeholder:text-gray-400"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 font-bold mb-2">Message</label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      value={formData.message}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-[var(--color-leo-maroon)] focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900 outline-none transition-all placeholder:text-gray-400"
                      placeholder="How can we help you?"
                    ></textarea>
                  </div>

                  {status === 'error' && (
                    <p className="text-red-500 text-sm font-semibold">{errorMessage}</p>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'submitting'}
                    className="w-full bg-[var(--color-leo-gold)] text-[var(--color-leo-maroon)] font-bold py-4 rounded-lg hover:bg-[#eec136] transition-colors shadow-lg cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {status === 'submitting' ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        <span>Send Message</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
};


export default Contact;
